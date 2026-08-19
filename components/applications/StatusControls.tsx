"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateApplicationStatus } from "@/app/recruiter/jobs/[jobId]/candidates/actions";
import type { ApplicationStatus } from "@/lib/types";

const STATUSES: ApplicationStatus[] = ["submitted", "shortlisted", "interview", "rejected"];

export function StatusControls({
  applicationId,
  currentStatus,
}: {
  applicationId: string;
  currentStatus: ApplicationStatus;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<ApplicationStatus | null>(null);

  async function handleChange(status: ApplicationStatus) {
    if (status === currentStatus || pending) return;
    setPending(status);
    try {
      await updateApplicationStatus(applicationId, status);
      router.refresh();
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {STATUSES.map((status) => (
        <button
          key={status}
          type="button"
          onClick={() => handleChange(status)}
          disabled={pending !== null}
          className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize transition-colors disabled:opacity-50 ${
            status === currentStatus ? "bg-brand text-white" : "bg-page text-muted hover:bg-brand-soft hover:text-brand"
          }`}
        >
          {status}
        </button>
      ))}
    </div>
  );
}
