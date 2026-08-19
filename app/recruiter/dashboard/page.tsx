import Link from "next/link";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/dal";
import { getCompanyForRecruiter } from "@/lib/auth/company";
import { getJobsForCompany } from "@/lib/matching/queries";
import { getApplicationCountForJob } from "@/lib/applications/queries";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { EmptyState } from "@/components/ui/EmptyState";
import { BriefcaseIcon } from "@/components/ui/icons";
import { SidebarCard } from "@/components/nav/SidebarCard";

export default async function RecruiterDashboardPage() {
  const session = await requireSession("recruiter");

  const company = await getCompanyForRecruiter(session.uid);
  if (!company) {
    redirect("/recruiter/onboarding");
  }

  const jobs = await getJobsForCompany(company.id);
  const jobsWithCounts = await Promise.all(
    jobs.map(async (job) => ({ job, applicantCount: await getApplicationCountForJob(job.id) })),
  );
  const openJobs = jobsWithCounts.filter(({ job }) => job.status === "open").length;
  const totalApplicants = jobsWithCounts.reduce((sum, { applicantCount }) => sum + applicantCount, 0);

  return (
    <div className="mx-auto flex max-w-5xl gap-6 px-4 py-8">
      <aside className="hidden w-64 shrink-0 lg:block">
        <div className="sticky top-20">
          <SidebarCard
            name={company.name}
            subtitle={company.industry}
            photoUrl={company.logoUrl}
            meta={[
              { label: "Size", value: company.size || "—" },
              { label: "Open jobs", value: String(openJobs) },
              { label: "Total applicants", value: String(totalApplicants) },
            ]}
          />
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-ink">{company.name}</h1>
          <Link
            href="/recruiter/jobs/new"
            className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
          >
            Post a job
          </Link>
        </div>

        {company.verification?.status !== "verified" && (
          <div className="flex items-center justify-between gap-4 rounded-md border border-line bg-brand-soft px-4 py-3">
            <p className="text-sm text-ink">
              Verify your business to post jobs — takes about a minute.
            </p>
            <Link href="/recruiter/verify" className="shrink-0 text-sm font-semibold text-brand hover:underline">
              Verify now
            </Link>
          </div>
        )}

        {jobsWithCounts.length === 0 && (
          <EmptyState
            icon={<BriefcaseIcon className="h-12 w-12" />}
            title="No jobs posted yet"
            description="Post your first job and applicants will start showing up."
          />
        )}

        <div className="flex flex-col gap-3">
          {jobsWithCounts.map(({ job, applicantCount }) => (
            <Card key={job.id}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-ink">{job.title}</p>
                  <p className="text-sm text-muted">
                    {job.location}
                    {job.remote ? " · Remote-friendly" : ""} · {job.status}
                  </p>
                </div>
                <Chip tone="brand" className="shrink-0">
                  {applicantCount} {applicantCount === 1 ? "applicant" : "applicants"}
                </Chip>
              </div>
              <div className="mt-3 flex gap-4 text-sm font-medium">
                <Link href={`/recruiter/jobs/${job.id}/candidates`} className="text-brand hover:underline">
                  View applicants
                </Link>
                <Link href={`/recruiter/jobs/${job.id}/edit`} className="text-brand hover:underline">
                  Edit
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
