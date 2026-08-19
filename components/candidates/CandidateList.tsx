"use client";

import { useState } from "react";
import { MatchBreakdown } from "@/components/matches/MatchBreakdown";
import { ScoreRing } from "@/components/matches/ScoreRing";
import { StatusControls } from "@/components/applications/StatusControls";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/nav/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { PeopleIcon } from "@/components/ui/icons";
import type { ApplicantProfileDoc, ApplicationStatus, MatchBreakdown as MatchBreakdownData } from "@/lib/types";

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  submitted: "Submitted",
  shortlisted: "Shortlisted",
  interview: "Interview",
  rejected: "Rejected",
};
const STATUS_FILTERS: ApplicationStatus[] = ["submitted", "shortlisted", "interview", "rejected"];

export type CandidateWithApplication = {
  matchId: string;
  score: number;
  breakdown: MatchBreakdownData;
  applicant: ApplicantProfileDoc;
  resumeHref: string | null;
  application: { id: string; status: ApplicationStatus };
};

// Filtering is pure client-side state over data the server already sent —
// the previous ?status= Link-based version re-ran the whole page's data
// fetching (matches, applications, a signed resume URL per applicant) just
// to change which of the already-loaded cards were visible. Same class of
// unnecessary-round-trip lag as the status buttons, just one level up.
export function CandidateList({ applicants }: { applicants: CandidateWithApplication[] }) {
  const [activeStatus, setActiveStatus] = useState<ApplicationStatus | null>(null);

  if (applicants.length === 0) {
    return (
      <EmptyState
        icon={<PeopleIcon className="h-12 w-12" />}
        title="No one has applied yet"
        description="Once someone applies to this job, they'll show up here."
      />
    );
  }

  const visibleApplicants = activeStatus
    ? applicants.filter((candidate) => candidate.application.status === activeStatus)
    : applicants;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => setActiveStatus(null)}
          className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
            activeStatus === null ? "bg-brand text-white" : "bg-page text-muted hover:bg-brand-soft hover:text-brand"
          }`}
        >
          All ({applicants.length})
        </button>
        {STATUS_FILTERS.map((status) => {
          const count = applicants.filter((candidate) => candidate.application.status === status).length;
          return (
            <button
              key={status}
              type="button"
              onClick={() => setActiveStatus(status)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                activeStatus === status ? "bg-brand text-white" : "bg-page text-muted hover:bg-brand-soft hover:text-brand"
              }`}
            >
              {STATUS_LABELS[status]} ({count})
            </button>
          );
        })}
      </div>

      {visibleApplicants.length === 0 && (
        <EmptyState
          icon={<PeopleIcon className="h-12 w-12" />}
          title={`No ${STATUS_LABELS[activeStatus as ApplicationStatus].toLowerCase()} applicants`}
          description="Try a different filter above."
        />
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {visibleApplicants.map((candidate) => (
          <Card key={candidate.matchId}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <Avatar name={candidate.applicant.basicInfo.name} photoUrl={candidate.applicant.basicInfo.photoUrl} />
                <div>
                  <p className="font-semibold text-ink">{candidate.applicant.basicInfo.name}</p>
                  <p className="text-sm text-muted">{candidate.applicant.basicInfo.location}</p>
                </div>
              </div>
              <ScoreRing score={candidate.score} />
            </div>
            <div className="mt-3">
              <MatchBreakdown breakdown={candidate.breakdown} />
            </div>
            {candidate.resumeHref && (
              <a
                href={candidate.resumeHref}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block text-sm font-medium text-brand hover:underline"
              >
                View resume
              </a>
            )}
            <div className="mt-3">
              <p className="mb-1 text-xs text-muted">Application status</p>
              <StatusControls applicationId={candidate.application.id} currentStatus={candidate.application.status} />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
