import Link from "next/link";
import { requireSession } from "@/lib/auth/dal";
import { getApplicationsForApplicant } from "@/lib/applications/queries";

const STATUS_LABELS: Record<string, string> = {
  submitted: "Submitted",
  shortlisted: "Shortlisted",
  interview: "Interview",
  offer: "Offer",
  rejected: "Rejected",
};

export default async function ApplicantApplicationsPage() {
  const session = await requireSession("applicant");
  const applications = await getApplicationsForApplicant(session.uid);

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 p-8">
      <h1 className="text-2xl font-semibold tracking-tight">My applications</h1>

      {applications.length === 0 && (
        <p className="text-sm text-zinc-500">You haven&apos;t applied to any jobs yet.</p>
      )}

      <div className="flex flex-col gap-3">
        {applications.map((application) => (
          <Link
            key={application.applicationId}
            href={`/applicant/jobs/${application.jobId}`}
            className="rounded border border-zinc-300 p-4 hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-500"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium">{application.job.title}</p>
                <p className="text-sm text-zinc-500">
                  {application.companyName} · Applied {new Date(application.appliedAt).toLocaleDateString()}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-zinc-100 px-2.5 py-1 text-sm dark:bg-zinc-800">
                {STATUS_LABELS[application.status] ?? application.status}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
