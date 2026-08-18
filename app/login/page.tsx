"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { dashboardPathForRole, establishSession } from "@/lib/firebase/client-session";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function afterSignIn(user: Parameters<typeof establishSession>[0]) {
    const role = await establishSession(user);
    if (!role) {
      // Signed in to Firebase Auth but no users/{uid} doc / role claim yet —
      // most likely a first-time Google sign-in with no prior signup.
      await signOut(getFirebaseAuth());
      throw new Error("No account found for this sign-in. Please sign up first.");
    }
    router.push(dashboardPathForRole(role));
  }

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const { user } = await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
      await afterSignIn(user);
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
      await afterSignIn(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign in");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 p-8">
      <h1 className="text-2xl font-semibold tracking-tight">Log in</h1>

      <form onSubmit={handleEmailLogin} className="flex flex-col gap-3">
        <input
          type="email"
          required
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        <input
          type="password"
          required
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-zinc-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {pending ? "Signing in…" : "Log in"}
        </button>
      </form>

      <div className="flex items-center gap-3 text-xs text-zinc-500">
        <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
        or
        <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
      </div>

      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={pending}
        className="rounded border border-zinc-300 px-3 py-2 text-sm font-medium disabled:opacity-50 dark:border-zinc-700"
      >
        Continue with Google
      </button>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <p className="text-center text-sm text-zinc-500">
        No account?{" "}
        <a href="/signup/applicant" className="underline">
          Sign up as applicant
        </a>{" "}
        or{" "}
        <a href="/signup/recruiter" className="underline">
          recruiter
        </a>
        .
      </p>
    </main>
  );
}
