import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/dal";
import { recruiterOwnsJob } from "@/lib/auth/company";
import { adminDb } from "@/lib/firebase/admin";
import { getMatchesForJob } from "@/lib/matching/queries";
import { getApplicationsForJob } from "@/lib/applications/queries";
import { getSignedResumeUrl } from "@/lib/resume/signedUrl";
import { MatchBreakdownChips } from "@/components/matches/MatchBreakdownChips";
import { StatusControls } from "@/components/applications/StatusControls";
import type { JobDoc } from "@/lib/types";

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

  const [candidates, applicationsByApplicant] = await Promise.all([
    getMatchesForJob(jobId),
    getApplicationsForJob(jobId),
  ]);

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
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{job.title}</h1>
        <p className="mt-1 text-sm text-zinc-500">{candidates.length} matched candidates</p>
      </div>

      {candidatesWithExtras.length === 0 && (
        <p className="text-sm text-zinc-500">No matching candidates yet.</p>
      )}

      <div className="flex flex-col gap-3">
        {candidatesWithExtras.map((candidate) => (
          <div key={candidate.matchId} className="rounded border border-zinc-300 p-4 dark:border-zinc-700">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium">{candidate.applicant.basicInfo.name}</p>
                <p className="text-sm text-zinc-500">{candidate.applicant.basicInfo.location}</p>
              </div>
              <span className="shrink-0 rounded-full bg-zinc-900 px-2.5 py-1 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900">
                {Math.round(candidate.score)}%
              </span>
            </div>
            <div className="mt-3">
              <MatchBreakdownChips breakdown={candidate.breakdown} />
            </div>
            {candidate.resumeHref && (
              <a
                href={candidate.resumeHref}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block text-sm underline"
              >
                View resume
              </a>
            )}
            {candidate.application ? (
              <div className="mt-3">
                <p className="mb-1 text-xs text-zinc-500">Application status</p>
                <StatusControls
                  applicationId={candidate.application.id}
                  currentStatus={candidate.application.status}
                />
              </div>
            ) : (
              <p className="mt-3 text-xs text-zinc-500">Not applied yet</p>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
