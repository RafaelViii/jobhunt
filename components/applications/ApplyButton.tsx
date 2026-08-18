"use client";

import { useState } from "react";
import { applyToJob } from "@/app/applicant/jobs/[jobId]/actions";

export function ApplyButton({ jobId }: { jobId: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleApply() {
    setError(null);
    setPending(true);
    try {
      await applyToJob(jobId);
    } catch (err) {
      // redirect() inside the action throws internally on success — only a
      // real failure reaches here.
      setError(err instanceof Error ? err.message : "Failed to apply");
      setPending(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleApply}
        disabled={pending}
        className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
      >
        {pending ? "Applying…" : "Apply"}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
