"use client";

import { useState } from "react";
import { unstable_rethrow } from "next/navigation";
import { applyToJob } from "@/app/applicant/jobs/[jobId]/actions";
import { Button } from "@/components/ui/Button";

export function ApplyButton({ jobId, className = "" }: { jobId: string; className?: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleApply() {
    setError(null);
    setPending(true);
    try {
      await applyToJob(jobId);
    } catch (err) {
      // redirect() inside the action throws a special error on success —
      // rethrow it so Next completes the navigation instead of us treating
      // it as a real failure. unstable_rethrow no-ops for genuine errors.
      unstable_rethrow(err);
      setError(err instanceof Error ? err.message : "Failed to apply");
      setPending(false);
    }
  }

  return (
    <div>
      <Button type="button" onClick={handleApply} disabled={pending} className={className}>
        {pending ? "Applying…" : "Apply"}
      </Button>
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
    </div>
  );
}
