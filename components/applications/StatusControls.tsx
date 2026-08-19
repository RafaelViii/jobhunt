"use client";

import { useOptimistic, useTransition } from "react";
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
  const [optimisticStatus, setOptimisticStatus] = useOptimistic(currentStatus);
  const [isPending, startTransition] = useTransition();

  function handleChange(status: ApplicationStatus) {
    if (status === optimisticStatus || isPending) return;
    // The clicked button highlights immediately (useOptimistic), instead of
    // waiting on router.refresh() — which re-runs the whole candidates page
    // (matches + applications + company + a signed resume URL per
    // applicant) just to reflect one status pill. That round trip still
    // happens, in the background, to keep the filter-tab counts correct.
    startTransition(async () => {
      setOptimisticStatus(status);
      await updateApplicationStatus(applicationId, status);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {STATUSES.map((status) => (
        <button
          key={status}
          type="button"
          onClick={() => handleChange(status)}
          disabled={isPending}
          className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize transition-colors disabled:opacity-50 ${
            status === optimisticStatus ? "bg-brand text-white" : "bg-page text-muted hover:bg-brand-soft hover:text-brand"
          }`}
        >
          {status}
        </button>
      ))}
    </div>
  );
}
