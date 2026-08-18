import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/dal";
import { adminDb } from "@/lib/firebase/admin";
import { getMatchForApplicantAndJob } from "@/lib/matching/queries";
import { hasApplied } from "@/lib/applications/queries";
import { MatchBreakdownChips } from "@/components/matches/MatchBreakdownChips";
import { ApplyButton } from "@/components/applications/ApplyButton";
import type { CompanyDoc, JobDoc } from "@/lib/types";

export default async function ApplicantJobDetailPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  const session = await requireSession("applicant");

  const jobSnap = await adminDb().collection("jobs").doc(jobId).get();
  if (!jobSnap.exists) {
    redirect("/applicant/dashboard");
  }
  const job = jobSnap.data() as JobDoc;

  const companySnap = await adminDb().collection("companies").doc(job.companyId).get();
  const company = companySnap.data() as CompanyDoc | undefined;

  const match = await getMatchForApplicantAndJob(session.uid, jobId);
  const alreadyApplied = await hasApplied(session.uid, jobId);

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{job.title}</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {company?.name ?? "Unknown company"} · {job.location}
          {job.remote ? " · Remote-friendly" : ""}
        </p>
      </div>

      {match && (
        <div className="rounded border border-zinc-300 p-4 dark:border-zinc-700">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium">Your match</p>
            <span className="rounded-full bg-zinc-900 px-2.5 py-1 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900">
              {Math.round(match.score)}%
            </span>
          </div>
          <MatchBreakdownChips breakdown={match.breakdown} />
        </div>
      )}

      <div className="flex flex-wrap gap-3 text-sm text-zinc-500">
        <span>{job.employmentType}</span>
        <span>·</span>
        <span>{job.seniority}</span>
        {job.salaryMin !== null && job.salaryMax !== null && (
          <>
            <span>·</span>
            <span>
              {job.salaryMin.toLocaleString()}–{job.salaryMax.toLocaleString()}
            </span>
          </>
        )}
      </div>

      <div>
        <h2 className="mb-2 text-sm font-medium">Skills</h2>
        <div className="flex flex-wrap gap-1.5">
          {job.skills.map((skill) => (
            <span
              key={skill}
              className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-medium">Description</h2>
        <p className="whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">{job.description}</p>
      </div>

      {alreadyApplied ? (
        <p className="text-sm text-zinc-500">You&apos;ve already applied to this job.</p>
      ) : (
        <ApplyButton jobId={jobId} />
      )}
    </main>
  );
}
