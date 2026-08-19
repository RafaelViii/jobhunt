import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/dal";
import { recruiterOwnsJob } from "@/lib/auth/company";
import { adminDb } from "@/lib/firebase/admin";
import { getMatchesForJob } from "@/lib/matching/queries";
import { getApplicationsForJob } from "@/lib/applications/queries";
import { getSignedResumeUrl } from "@/lib/resume/signedUrl";
import { CandidateList } from "@/components/candidates/CandidateList";
import { SidebarCard } from "@/components/nav/SidebarCard";
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

  // A match just means the algorithm thinks they're a fit — the recruiter
  // only wants people who actually applied, per explicit request.
  const applicants = candidatesWithExtras.filter(
    (candidate): candidate is typeof candidate & { application: NonNullable<typeof candidate.application> } =>
      candidate.application !== null,
  );

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

        <CandidateList applicants={applicants} />
      </main>
    </div>
  );
}
