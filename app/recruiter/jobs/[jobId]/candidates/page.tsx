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
import type { CompanyDoc, JobDoc } from "@/lib/types";

export default async function JobCandidatesPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
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

  return (
    <div className="mx-auto flex max-w-5xl gap-6 px-4 py-8">
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
              { label: "Candidates", value: String(candidates.length) },
            ]}
            links={[{ href: `/recruiter/jobs/${jobId}/edit`, label: "Edit job" }]}
          />
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-ink">{job.title}</h1>
          <p className="mt-1 text-sm text-muted">{candidates.length} matched candidates</p>
        </div>

        {candidatesWithExtras.length === 0 && (
          <EmptyState icon={<PeopleIcon className="h-12 w-12" />} title="No matching candidates yet" />
        )}

        <div className="flex flex-col gap-3">
          {candidatesWithExtras.map((candidate) => (
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
              {candidate.application ? (
                <div className="mt-3">
                  <p className="mb-1 text-xs text-muted">Application status</p>
                  <StatusControls
                    applicationId={candidate.application.id}
                    currentStatus={candidate.application.status}
                  />
                </div>
              ) : (
                <p className="mt-3 text-xs text-muted">Not applied yet</p>
              )}
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
