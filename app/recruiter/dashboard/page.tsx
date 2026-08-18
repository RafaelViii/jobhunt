import Link from "next/link";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/dal";
import { getCompanyForRecruiter } from "@/lib/auth/company";
import { getCandidateCountForJob, getJobsForCompany } from "@/lib/matching/queries";

export default async function RecruiterDashboardPage() {
  const session = await requireSession("recruiter");

  const company = await getCompanyForRecruiter(session.uid);
  if (!company) {
    redirect("/recruiter/onboarding");
  }

  const jobs = await getJobsForCompany(company.id);
  const jobsWithCounts = await Promise.all(
    jobs.map(async (job) => ({ job, candidateCount: await getCandidateCountForJob(job.id) })),
  );

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">{company.name}</h1>
        <Link
          href="/recruiter/jobs/new"
          className="rounded bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          Post a job
        </Link>
      </div>

      {jobsWithCounts.length === 0 && (
        <p className="text-sm text-zinc-500">No jobs posted yet.</p>
      )}

      <div className="flex flex-col gap-3">
        {jobsWithCounts.map(({ job, candidateCount }) => (
          <div key={job.id} className="rounded border border-zinc-300 p-4 dark:border-zinc-700">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium">{job.title}</p>
                <p className="text-sm text-zinc-500">
                  {job.location}
                  {job.remote ? " · Remote-friendly" : ""} · {job.status}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-zinc-100 px-2.5 py-1 text-sm dark:bg-zinc-800">
                {candidateCount} {candidateCount === 1 ? "candidate" : "candidates"}
              </span>
            </div>
            <div className="mt-3 flex gap-4 text-sm">
              <Link href={`/recruiter/jobs/${job.id}/candidates`} className="underline">
                View candidates
              </Link>
              <Link href={`/recruiter/jobs/${job.id}/edit`} className="underline">
                Edit
              </Link>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
