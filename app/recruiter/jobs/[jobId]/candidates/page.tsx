import Link from "next/link";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/dal";
import { recruiterOwnsJob } from "@/lib/auth/company";
import { adminDb } from "@/lib/firebase/admin";
import { getMatchesForJob } from "@/lib/matching/queries";
import { getApplicationsForJob } from "@/lib/applications/queries";
import { getSignedResumeUrl } from "@/lib/resume/signedUrl";
import { MatchBreakdown } from "@/components/matches/MatchBreakdown";
import { ScoreRing } from "@/components/matches/ScoreRing";
import { StatusControls } from "@/components/applications/StatusControls";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/nav/Avatar";
import { SidebarCard } from "@/components/nav/SidebarCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { PeopleIcon } from "@/components/ui/icons";
import type { ApplicationStatus, CompanyDoc, JobDoc } from "@/lib/types";

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  submitted: "Submitted",
  shortlisted: "Shortlisted",
  interview: "Interview",
  rejected: "Rejected",
};
const STATUS_FILTERS: ApplicationStatus[] = ["submitted", "shortlisted", "interview", "rejected"];

export default async function JobCandidatesPage({
  params,
  searchParams,
}: {
  params: Promise<{ jobId: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const { jobId } = await params;
  const { status: statusParam } = await searchParams;
  const session = await requireSession("recruiter");

  const jobSnap = await adminDb().collection("jobs").doc(jobId).get();
  if (!jobSnap.exists) {
    redirect("/recruiter/dashboard");
  }
  const job = jobSnap.data() as JobDoc;

  if (!(await recruiterOwnsJob(job, session.uid))) {
    redirect("/recruiter/dashboard");
  }

  const [candidates, applicationsByApplicant, companySnap] = await Promise.all([
    getMatchesForJob(jobId),
    getApplicationsForJob(jobId),
    adminDb().collection("companies").doc(job.companyId).get(),
  ]);
  const company = companySnap.data() as CompanyDoc | undefined;

  const candidatesWithExtras = await Promise.all(
    candidates.map(async (candidate) => ({
      ...candidate,
      application: applicationsByApplicant.get(candidate.applicantUid) ?? null,
      resumeHref: candidate.applicant.resumeUrl
        ? await getSignedResumeUrl(candidate.applicant.resumeUrl)
        : null,
    })),
  );

  // A match just means the algorithm thinks they're a fit — the recruiter
  // only wants people who actually applied, per explicit request.
  const applicants = candidatesWithExtras.filter(
    (candidate): candidate is typeof candidate & { application: NonNullable<typeof candidate.application> } =>
      candidate.application !== null,
  );

  const activeStatus = STATUS_FILTERS.includes(statusParam as ApplicationStatus)
    ? (statusParam as ApplicationStatus)
    : null;
  const visibleApplicants = activeStatus
    ? applicants.filter((candidate) => candidate.application.status === activeStatus)
    : applicants;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:flex lg:gap-6">
      <aside className="hidden w-64 shrink-0 lg:block">
        <div className="sticky top-20">
          <SidebarCard
            name={job.title}
            subtitle={company?.name}
            photoUrl={company?.logoUrl}
            meta={[
              { label: "Status", value: job.status },
              { label: "Location", value: job.location },
              { label: "Type", value: job.employmentType },
              { label: "Seniority", value: job.seniority },
              { label: "Applicants", value: String(applicants.length) },
            ]}
            links={[{ href: `/recruiter/jobs/${jobId}/edit`, label: "Edit job" }]}
          />
        </div>
      </aside>

      <main className="mt-6 flex min-w-0 flex-1 flex-col gap-6 lg:mt-0">
        <div>
          <h1 className="text-2xl font-bold text-ink">{job.title}</h1>
          <p className="mt-1 text-sm text-muted">{applicants.length} applicant{applicants.length === 1 ? "" : "s"}</p>
        </div>

        {applicants.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            <Link
              href={`/recruiter/jobs/${jobId}/candidates`}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                activeStatus === null ? "bg-brand text-white" : "bg-page text-muted hover:bg-brand-soft hover:text-brand"
              }`}
            >
              All ({applicants.length})
            </Link>
            {STATUS_FILTERS.map((status) => {
              const count = applicants.filter((c) => c.application.status === status).length;
              return (
                <Link
                  key={status}
                  href={`/recruiter/jobs/${jobId}/candidates?status=${status}`}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                    activeStatus === status ? "bg-brand text-white" : "bg-page text-muted hover:bg-brand-soft hover:text-brand"
                  }`}
                >
                  {STATUS_LABELS[status]} ({count})
                </Link>
              );
            })}
          </div>
        )}

        {applicants.length === 0 && (
          <EmptyState
            icon={<PeopleIcon className="h-12 w-12" />}
            title="No one has applied yet"
            description="Once someone applies to this job, they'll show up here."
          />
        )}

        {applicants.length > 0 && visibleApplicants.length === 0 && (
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
                <StatusControls
                  applicationId={candidate.application.id}
                  currentStatus={candidate.application.status}
                />
              </div>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
