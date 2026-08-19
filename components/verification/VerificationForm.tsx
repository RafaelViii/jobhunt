"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { submitVerification } from "@/app/recruiter/verify/actions";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { VerificationDocumentType } from "@/lib/types";

// Purely cosmetic pacing for the "processing" feel described in
// CLAUDE.md §11 — nothing here is a real check, it always succeeds.
const STAGES = ["Processing…", "Verifying documents…", "Confirming…"];
const STAGE_DURATION_MS = 900;

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function VerificationForm() {
  const router = useRouter();
  const [documentType, setDocumentType] = useState<VerificationDocumentType>("business_permit");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stageIndex, setStageIndex] = useState<number | null>(null);
  const [verified, setVerified] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Please attach a file first.");
      return;
    }
    setError(null);
    setStageIndex(0);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const uploadRes = await fetch("/api/uploads/verification-doc", { method: "POST", body: formData });
      if (!uploadRes.ok) {
        const body = await uploadRes.json().catch(() => ({ error: null }));
        throw new Error(body.error ?? "Upload failed");
      }
      const { path } = (await uploadRes.json()) as { path: string };

      for (let i = 1; i < STAGES.length; i++) {
        await wait(STAGE_DURATION_MS);
        setStageIndex(i);
      }

      await submitVerification(documentType, path);
      await wait(STAGE_DURATION_MS);
      setVerified(true);
      await wait(1200);
      router.push("/recruiter/jobs/new");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong — please try again.");
      setStageIndex(null);
    }
  }

  const isRunning = stageIndex !== null && !verified;

  return (
    <main className="mx-auto flex max-w-lg flex-col gap-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold text-ink">Verify your business</h1>
        <p className="mt-1 text-sm text-muted">
          To keep JobHunt trustworthy for applicants, recruiters verify their business before posting a job.
        </p>
      </div>

      <Card className="p-6">
        {verified ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6"
              >
                <path d="m5 13 4 4L19 7" />
              </svg>
            </div>
            <p className="font-semibold text-ink">Verified</p>
            <p className="text-sm text-muted">Redirecting you to post your job…</p>

            <div className="mt-4 w-full rounded-md border border-line bg-page px-3 py-2.5 text-left">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Demo mode</p>
              <p className="mt-1 text-xs text-muted">
                This check is simulated for demonstration purposes. A production deployment would connect this step
                to a live government verification gateway — for example the DTI Business Name Registration System
                for business permits, or the PhilSys National ID Verification Service for government IDs — to
                confirm document authenticity before approval instead of auto-approving.
              </p>
            </div>
          </div>
        ) : isRunning ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-brand" />
            <p className="text-sm font-medium text-ink">{STAGES[stageIndex ?? 0]}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <p className="mb-2 text-sm font-medium text-ink">Document type</p>
              <div className="flex flex-col gap-2">
                <label className="flex items-start gap-2 text-sm text-ink">
                  <input
                    type="radio"
                    name="documentType"
                    className="mt-0.5"
                    checked={documentType === "business_permit"}
                    onChange={() => setDocumentType("business_permit")}
                  />
                  Business permit
                </label>
                <label className="flex items-start gap-2 text-sm text-ink">
                  <input
                    type="radio"
                    name="documentType"
                    className="mt-0.5"
                    checked={documentType === "government_id"}
                    onChange={() => setDocumentType("government_id")}
                  />
                  Government-issued ID (if you don&apos;t have a business permit yet)
                </label>
              </div>
            </div>

            <div>
              <p className="mb-1 text-sm font-medium text-ink">Upload document</p>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="block text-sm text-ink file:mr-3 file:rounded-md file:border-0 file:bg-brand-soft file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-brand hover:file:bg-brand/20"
              />
              <p className="mt-1 text-xs text-muted">PNG, JPG, WEBP, or PDF, up to 5MB.</p>
            </div>

            {error && <p className="text-sm text-danger">{error}</p>}

            <Button type="submit">Submit for verification</Button>

            <p className="text-xs text-muted">
              Demo mode: no document is reviewed by a human or a real verification API here — this shows the process
              a production deployment would enforce, ready to connect to a real government verification gateway
              (e.g. DTI or PhilSys). Your document is still stored privately, never public.
            </p>
          </form>
        )}
      </Card>
    </main>
  );
}
