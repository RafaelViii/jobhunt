import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/dal";
import { adminDb } from "@/lib/firebase/admin";
import { getMatchForApplicantAndJob } from "@/lib/matching/queries";
import { hasApplied } from "@/lib/applications/queries";
import { MatchBreakdown } from "@/components/matches/MatchBreakdown";
import { ScoreRing } from "@/components/matches/ScoreRing";
import { ApplyButton } from "@/components/applications/ApplyButton";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { Avatar } from "@/components/nav/Avatar";
import { SidebarCard } from "@/components/nav/SidebarCard";
import { BackButton } from "@/components/ui/BackButton";
import { CategoryBanner } from "@/components/matches/CategoryBanner";
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
    <div className="mx-auto flex max-w-5xl gap-6 px-4 py-8">
      {/* pb-24 clears the fixed mobile apply bar so it never covers the last content */}
      <main className="flex min-w-0 max-w-2xl flex-1 flex-col gap-6 pb-24 lg:pb-0">
        <Card className="overflow-hidden p-0">
          <CategoryBanner jobId={jobId} title={job.title} skills={job.skills} className="h-36 w-full sm:h-48" />
          <div className="flex items-center gap-3 p-4">
            <Avatar name={company?.name ?? "?"} photoUrl={company?.logoUrl} size={48} />
            <div>
              <h1 className="text-xl font-bold text-ink">{job.title}</h1>
              <p className="text-sm text-muted">
                {company?.name ?? "Unknown company"} · {job.location}
                {job.remote ? " · Remote-friendly" : ""}
              </p>
            </div>
          </div>
        </Card>

        {match && (
          <Card>
            {/* w-full is load-bearing: items-center (needed to center the ring) makes a
                flex-col child shrink-wrap to its content instead of stretching, so without
                it the breakdown rows collapse to their minimum width and every bar renders
                as a sliver instead of spanning the card. */}
            <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
              <ScoreRing score={match.score} size={64} showLabel={false} />
              <div className="min-w-0 w-full flex-1 text-left">
                <p className="mb-2 text-center text-sm font-medium text-ink sm:text-left">Your match</p>
                <MatchBreakdown breakdown={match.breakdown} />
              </div>
            </div>
          </Card>
        )}

        <div className="flex flex-wrap gap-1.5">
          <Chip tone="brand">{job.employmentType}</Chip>
          <Chip tone="brand">{job.seniority}</Chip>
          {job.salaryMin !== null && job.salaryMax !== null && (
            <Chip tone="brand">
              {job.salaryMin.toLocaleString()}–{job.salaryMax.toLocaleString()}
            </Chip>
          )}
        </div>

        <div>
          <h2 className="mb-2 text-sm font-semibold text-ink">Skills</h2>
          <div className="flex flex-wrap gap-1.5">
            {job.skills.map((skill) => (
              <Chip key={skill} tone="brand">{skill}</Chip>
            ))}
          </div>
        </div>

        <div>
          <h2 className="mb-2 text-sm font-semibold text-ink">Description</h2>
          <p className="whitespace-pre-wrap text-sm text-ink">{job.description}</p>
        </div>

        {/* Desktop: inline apply at the end of the content. Mobile uses the
            fixed bottom bar instead (below) so it's reachable without
            scrolling through the whole description. */}
        <div className="hidden lg:block">
          {alreadyApplied ? (
            <p className="text-sm text-muted">You&apos;ve already applied to this job.</p>
          ) : (
            <ApplyButton jobId={jobId} />
          )}
        </div>
      </main>

      <aside className="hidden w-64 shrink-0 lg:block">
        <div className="sticky top-20">
          <SidebarCard
            name={company?.name ?? "Unknown company"}
            subtitle={company?.industry}
            photoUrl={company?.logoUrl}
            meta={[
              { label: "Size", value: company?.size || "—" },
              { label: "Location", value: job.location },
              ...(company?.website ? [{ label: "Website", value: company.website.replace(/^https?:\/\//, "") }] : []),
            ]}
          />
        </div>
      </aside>

      {/* Desktop: small floating back button, fixed at the bottom-right of
          the viewport so it's reachable at any scroll position without
          competing with the inline Apply button above. */}
      <div className="fixed bottom-6 right-6 z-20 hidden lg:block">
        <BackButton className="rounded-full border border-line bg-surface px-4 py-2.5 shadow-md hover:bg-page" />
      </div>

      {/* Mobile: back + apply share one fixed bottom bar. Back keeps its
          text label here too, sized like a real button rather than a
          cramped icon-only square, so it doesn't look tacked on. */}
      <div className="fixed inset-x-0 bottom-0 z-20 flex items-center gap-3 border-t border-line bg-surface p-4 lg:hidden">
        <BackButton className="shrink-0 rounded-md border border-line px-4 py-2.5 hover:bg-page" />
        <div className="min-w-0 flex-1">
          {alreadyApplied ? (
            <p className="text-center text-sm text-muted">You&apos;ve already applied to this job.</p>
          ) : (
            <ApplyButton jobId={jobId} className="w-full" />
          )}
        </div>
      </div>
    </div>
  );
}
