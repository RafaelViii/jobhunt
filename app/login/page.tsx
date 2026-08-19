"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup, type User } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { dashboardPathForRole, establishSession, onboardingPathForRole, registerAccount } from "@/lib/firebase/client-session";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { VerifyEmailNotice } from "@/components/auth/VerifyEmailNotice";
import type { Role } from "@/lib/types";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  // Set only when a Google sign-in belongs to no existing account, or an
  // email/password account verified but never finished choosing a role — we
  // keep the user authenticated and ask once instead of failing outright.
  const [pendingGoogleUser, setPendingGoogleUser] = useState<User | null>(null);
  // Set when an email/password account exists but hasn't clicked the emailed
  // link yet — registration never completed for these (see SignupForm +
  // /api/auth/register's server-side email_verified check).
  const [unverifiedUser, setUnverifiedUser] = useState<User | null>(null);

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const { user } = await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
      if (!user.emailVerified) {
        setUnverifiedUser(user);
        return;
      }
      const role = await establishSession(user);
      if (!role) {
        // Verified but registration was interrupted before a role was
        // chosen — let them finish now instead of failing.
        setPendingGoogleUser(user);
        return;
      }
      router.push(dashboardPathForRole(role));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign in");
    } finally {
      setPending(false);
    }
  }

  async function handleGoogleLogin() {
    setError(null);
    setPending(true);
    try {
      const { user } = await signInWithPopup(getFirebaseAuth(), new GoogleAuthProvider());
      const role = await establishSession(user);
      if (!role) {
        setPendingGoogleUser(user);
        return;
      }
      router.push(dashboardPathForRole(role));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign in");
    } finally {
      setPending(false);
    }
  }

  async function handleChooseRole(role: Role) {
    if (!pendingGoogleUser) return;
    setError(null);
    setPending(true);
    try {
      await registerAccount(pendingGoogleUser, role);
      await establishSession(pendingGoogleUser);
      router.push(onboardingPathForRole(role));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create account");
      setPending(false);
    }
  }

  async function handleVerifiedContinue() {
    if (!unverifiedUser) return;
    const role = await establishSession(unverifiedUser);
    if (!role) {
      const verifiedUser = unverifiedUser;
      setUnverifiedUser(null);
      setPendingGoogleUser(verifiedUser);
      return;
    }
    router.push(dashboardPathForRole(role));
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="flex w-full max-w-4xl overflow-hidden rounded-xl border border-line bg-surface shadow-sm">
        <div
          className="relative hidden w-1/2 shrink-0 md:block"
          style={{
            backgroundImage: "url(https://picsum.photos/seed/jobhunt-auth/800/1000)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/90 via-brand-dark/40 to-transparent" />
          <div className="absolute bottom-0 left-0 p-8 text-white">
            <p className="text-2xl font-bold leading-snug">Find your next role.</p>
            <p className="text-2xl font-bold leading-snug">Find your next hire.</p>
            <p className="mt-2 text-sm text-white/80">
              One transparent match score, no black-box algorithm.
            </p>
          </div>
        </div>

        <div className="flex w-full flex-col justify-center p-8 md:w-1/2">
          <h1 className="mb-1 text-2xl font-bold tracking-tight text-brand">JobHunt</h1>

          {unverifiedUser ? (
            <>
              <h2 className="mt-4 text-lg font-semibold text-ink">Verify your email</h2>
              <p className="mb-3 mt-1 text-sm text-muted">One more step before you can log in.</p>
              <VerifyEmailNotice user={unverifiedUser} onVerified={handleVerifiedContinue} />
            </>
          ) : pendingGoogleUser ? (
            <>
              <h2 className="mt-4 text-lg font-semibold text-ink">
                Welcome, {pendingGoogleUser.displayName ?? pendingGoogleUser.email}
              </h2>
              <p className="mb-5 mt-1 text-sm text-muted">
                One last thing — are you looking for a job, or hiring for one?
              </p>
              <div className="flex flex-col gap-3">
                <Button type="button" disabled={pending} onClick={() => handleChooseRole("applicant")}>
                  I&apos;m job hunting
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={pending}
                  onClick={() => handleChooseRole("recruiter")}
                >
                  I&apos;m hiring
                </Button>
              </div>
              {error && <p className="mt-4 text-sm text-danger">{error}</p>}
            </>
          ) : (
            <>
              <h2 className="mb-5 mt-4 text-lg font-semibold text-ink">Log in</h2>

              <form onSubmit={handleEmailLogin} className="flex flex-col gap-3">
                <Input
                  type="email"
                  required
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Input
                  type="password"
                  required
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <Button type="submit" disabled={pending}>
                  {pending ? "Signing in…" : "Log in"}
                </Button>
              </form>

              <div className="my-4 flex items-center gap-3 text-xs text-muted">
                <div className="h-px flex-1 bg-line" />
                or
                <div className="h-px flex-1 bg-line" />
              </div>

              <Button type="button" variant="secondary" onClick={handleGoogleLogin} disabled={pending}>
                Continue with Google
              </Button>

              {error && <p className="mt-4 text-sm text-danger">{error}</p>}

              <p className="mt-5 text-center text-sm text-muted">
                No account?{" "}
                <a href="/signup/applicant" className="font-medium text-brand hover:underline">
                  Sign up as applicant
                </a>{" "}
                or{" "}
                <a href="/signup/recruiter" className="font-medium text-brand hover:underline">
                  recruiter
                </a>
                .
              </p>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
