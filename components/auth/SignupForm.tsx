"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
  type User,
} from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { dashboardPathForRole, establishSession, onboardingPathForRole, registerAccount } from "@/lib/firebase/client-session";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { VerifyEmailNotice } from "@/components/auth/VerifyEmailNotice";
import type { Role } from "@/lib/types";

export function SignupForm({ role }: { role: Role }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  // The Firebase Auth user exists at this point, but the account isn't
  // "real" yet — users/{uid} + the role claim only get created once they
  // click the emailed link. Google sign-in skips this entirely (already provider-verified).
  const [pendingVerificationUser, setPendingVerificationUser] = useState<User | null>(null);

  // Firebase creates the Auth user immediately, before verification —
  // abandoning the flow (closing the tab, never checking email) leaves a
  // stranded, unverified account that blocks this email from signing up
  // again otherwise ("auth/email-already-in-use" forever). Signing in with
  // the password just entered tells us whether this is one of those, or a
  // genuinely different existing account, and resumes it instead of failing.
  // Returns the user to (re)send a verification link to, or null if resuming
  // already finished registration and redirected.
  async function createOrResumeAccount(): Promise<User | null> {
    try {
      const { user } = await createUserWithEmailAndPassword(getFirebaseAuth(), email, password);
      await updateProfile(user, { displayName: name });
      return user;
    } catch (err) {
      const code = err instanceof Error ? (err as Error & { code?: string }).code : undefined;
      if (code !== "auth/email-already-in-use") throw err;
    }

    let user: User;
    try {
      const cred = await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
      user = cred.user;
    } catch {
      throw new Error("This email is already registered. Try logging in instead.");
    }

    if (!user.emailVerified) {
      return user;
    }

    const existingRole = await establishSession(user);
    if (existingRole) {
      throw new Error("This email is already registered. Try logging in instead.");
    }

    // Verified but registration was interrupted before a role was chosen —
    // finish it now with the role for this signup page.
    await registerAccount(user, role);
    await establishSession(user);
    router.push(onboardingPathForRole(role));
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const user = await createOrResumeAccount();
      if (!user) return; // resumed an already-verified, now-registered account

      await sendEmailVerification(user);
      setPendingVerificationUser(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign up");
    } finally {
      setPending(false);
    }
  }

  async function completeRegistration() {
    if (!pendingVerificationUser) return;
    await registerAccount(pendingVerificationUser, role);
    await establishSession(pendingVerificationUser);
    router.push(onboardingPathForRole(role));
  }

  async function handleGoogleSignup() {
    setError(null);
    setPending(true);
    try {
      const { user } = await signInWithPopup(getFirebaseAuth(), new GoogleAuthProvider());
      // registerAccount is a no-op (returns false) if this Google account is
      // already registered — e.g. they land on the "wrong" signup page for
      // an account they already have. Either way, log them into their real role.
      const isNewAccount = await registerAccount(user, role);
      const resolvedRole = await establishSession(user);
      if (!resolvedRole) throw new Error("Failed to sign up with Google");
      router.push(isNewAccount ? onboardingPathForRole(resolvedRole) : dashboardPathForRole(resolvedRole));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign up with Google");
    } finally {
      setPending(false);
    }
  }

  if (pendingVerificationUser) {
    return <VerifyEmailNotice user={pendingVerificationUser} onVerified={completeRegistration} />;
  }

  return (
    <div className="flex flex-col gap-3">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Input type="text" required placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
        <Input type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input
          type="password"
          required
          minLength={6}
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button type="submit" disabled={pending}>
          {pending ? "Creating account…" : "Sign up"}
        </Button>
      </form>

      <div className="flex items-center gap-3 text-xs text-muted">
        <div className="h-px flex-1 bg-line" />
        or
        <div className="h-px flex-1 bg-line" />
      </div>

      <Button type="button" variant="secondary" onClick={handleGoogleSignup} disabled={pending}>
        Continue with Google
      </Button>

      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
