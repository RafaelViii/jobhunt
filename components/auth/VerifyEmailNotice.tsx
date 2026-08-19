"use client";

import { useEffect, useRef, useState } from "react";
import { reload, sendEmailVerification, type User } from "firebase/auth";

const POLL_INTERVAL_MS = 3000;

// Polls Firebase for the emailVerified flag rather than requiring a manual
// "I've verified" click — the link is typically opened in a different tab
// (the email client), so this tab has no other way to find out it happened.
export function VerifyEmailNotice({
  user,
  onVerified,
}: {
  user: User;
  onVerified: () => Promise<void>;
}) {
  const [resent, setResent] = useState(false);
  const [resendPending, setResendPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detected, setDetected] = useState(false);
  const handledRef = useRef(false);

  useEffect(() => {
    const interval = setInterval(async () => {
      if (handledRef.current) return;
      try {
        await reload(user);
        if (user.emailVerified) {
          handledRef.current = true;
          clearInterval(interval);
          setDetected(true);
          // Cached ID token predates the verification — force a fresh one
          // before anything downstream checks decoded.email_verified.
          await user.getIdToken(true);
          await onVerified();
        }
      } catch {
        // Transient error — the next poll will retry.
      }
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleResend() {
    setError(null);
    setResent(false);
    setResendPending(true);
    try {
      await sendEmailVerification(user);
      setResent(true);
    } catch {
      setError("Couldn't resend right now — try again in a bit.");
    } finally {
      setResendPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-ink">
        We sent a verification link to <span className="font-medium">{user.email}</span>. Click it — this page
        continues automatically once you do, no need to come back and click anything here.
      </p>
      <div className="flex items-center gap-2 text-sm text-muted">
        <span className={`h-2 w-2 rounded-full ${detected ? "bg-emerald-600" : "animate-pulse bg-brand"}`} />
        {detected ? "Verified! Continuing…" : "Waiting for verification…"}
      </div>
      <button
        type="button"
        onClick={handleResend}
        disabled={resendPending}
        className="self-start text-sm font-medium text-brand hover:underline disabled:opacity-50"
      >
        {resendPending ? "Sending…" : "Resend email"}
      </button>
      {resent && <p className="text-sm text-muted">Sent! Check your inbox (and spam folder).</p>}
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
