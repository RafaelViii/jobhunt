import Link from "next/link";
import { requireSession } from "@/lib/auth/dal";
import { adminDb } from "@/lib/firebase/admin";
import { getApplicationsForApplicant } from "@/lib/applications/queries";
import { Avatar } from "@/components/nav/Avatar";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { EmptyState } from "@/components/ui/EmptyState";
import { InboxIcon } from "@/components/ui/icons";
import { SidebarCard } from "@/components/nav/SidebarCard";
import type { ApplicantProfileDoc, ApplicationStatus } from "@/lib/types";

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  submitted: "Submitted",
  shortlisted: "Shortlisted",
  interview: "Interview",
  offer: "Offer",
  rejected: "Rejected",
};

const STATUS_TONES: Record<ApplicationStatus, "neutral" | "brand" | "success" | "danger"> = {
  submitted: "neutral",
  shortlisted: "brand",
  interview: "brand",
  offer: "success",
  rejected: "danger",
};

export default async function ApplicantApplicationsPage() {
  const session = await requireSession("applicant");
  const [applications, profileSnap] = await Promise.all([
    getApplicationsForApplicant(session.uid),
    adminDb().collection("applicantProfiles").doc(session.uid).get(),
  ]);
  const profile = profileSnap.exists ? (profileSnap.data() as ApplicantProfileDoc) : null;

  return (
    <div className="mx-auto flex max-w-5xl gap-6 px-4 py-8">
      <aside className="hidden w-64 shrink-0 lg:block">
        <div className="sticky top-20">
          <SidebarCard
            name={profile?.basicInfo.name || session.email || "Account"}
            subtitle={profile?.basicInfo.location}
            photoUrl={profile?.basicInfo.photoUrl}
            meta={[{ label: "Applications", value: String(applications.length) }]}
            links={[{ href: "/applicant/profile", label: "Edit profile" }]}
          />
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col gap-6">
        <h1 className="text-2xl font-bold text-ink">My applications</h1>

        {applications.length === 0 && (
          <EmptyState
            icon={<InboxIcon className="h-12 w-12" />}
            title="No applications yet"
            description="Apply to a matched job and it'll show up here with its status."
          />
        )}

        <div className="flex flex-col gap-3">
          {applications.map((application) => (
            <Link key={application.applicationId} href={`/applicant/jobs/${application.jobId}`}>
              <Card className="transition-colors hover:border-brand hover:shadow-md">
                <div className="flex items-start gap-3">
                  <Avatar name={application.companyName} photoUrl={application.companyLogoUrl} size={40} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <p className="font-semibold text-ink">{application.job.title}</p>
                      <Chip tone={STATUS_TONES[application.status]} className="shrink-0">
                        {STATUS_LABELS[application.status] ?? application.status}
                      </Chip>
                    </div>
                    <p className="text-sm text-muted">
                      {application.companyName} · {application.job.location}
                      {application.job.remote ? " · Remote-friendly" : ""}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">
                      Applied {new Date(application.appliedAt).toLocaleDateString()}
                    </p>

                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      <Chip tone="brand">{application.job.employmentType}</Chip>
                      <Chip tone="brand">{application.job.seniority}</Chip>
                      {application.job.salaryMin !== null && application.job.salaryMax !== null && (
                        <Chip tone="brand">
                          {application.job.salaryMin.toLocaleString()}–{application.job.salaryMax.toLocaleString()}
                        </Chip>
                      )}
                    </div>

                    {application.job.skills.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {application.job.skills.slice(0, 6).map((skill) => (
                          <Chip key={skill}>{skill}</Chip>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
