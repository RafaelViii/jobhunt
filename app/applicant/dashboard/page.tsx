import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/dal";
import { adminDb } from "@/lib/firebase/admin";
import { getMatchesForApplicant } from "@/lib/matching/queries";
import { getApplicationsForApplicant } from "@/lib/applications/queries";
import { JobSearchFilters } from "@/components/matches/JobSearchFilters";
import { EmptyState } from "@/components/ui/EmptyState";
import { BriefcaseIcon } from "@/components/ui/icons";
import { SidebarCard } from "@/components/nav/SidebarCard";
import { mostRecentExperience, formatExperiencePeriod } from "@/lib/utils/experience";
import type { ApplicantProfileDoc } from "@/lib/types";

export default async function ApplicantDashboardPage() {
  const session = await requireSession("applicant");
  const profileSnap = await adminDb().collection("applicantProfiles").doc(session.uid).get();
  const profile = profileSnap.exists ? (profileSnap.data() as ApplicantProfileDoc) : null;
  if (!profile?.onboardingComplete) {
    redirect("/applicant/onboarding");
  }

  const [matches, applications] = await Promise.all([
    getMatchesForApplicant(session.uid),
    getApplicationsForApplicant(session.uid),
  ]);
  const appliedJobIds = new Set(applications.map((application) => application.jobId));
  const recentExperience = mostRecentExperience(profile.experience);

  return (
    <div className="mx-auto flex max-w-5xl gap-6 px-4 py-8">
      <aside className="hidden w-64 shrink-0 lg:block">
        <div className="sticky top-20">
          <SidebarCard
            name={profile?.basicInfo.name || session.email || "Account"}
            subtitle={profile?.basicInfo.location}
            photoUrl={profile?.basicInfo.photoUrl}
            verified={session.emailVerified}
            meta={[
              { label: "Skills listed", value: String(profile?.skills.length ?? 0) },
              { label: "Matches", value: String(matches.length) },
              { label: "Applications", value: String(applications.length) },
            ]}
            experience={
              recentExperience
                ? {
                    title: recentExperience.title,
                    company: recentExperience.company,
                    period: formatExperiencePeriod(recentExperience),
                    current: recentExperience.current,
                  }
                : null
            }
            links={[{ href: "/applicant/profile", label: "Edit profile" }]}
          />
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col gap-6">
        <h1 className="text-2xl font-bold text-ink">Matched jobs</h1>

        {matches.length === 0 ? (
          <EmptyState
            icon={<BriefcaseIcon className="h-12 w-12" />}
            title="No matches yet"
            description="Once jobs are posted that fit your profile, they'll show up here."
          />
        ) : (
          <JobSearchFilters matches={matches} appliedJobIds={appliedJobIds} />
        )}
      </main>
    </div>
  );
}
