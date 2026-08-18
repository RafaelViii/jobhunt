import Link from "next/link";
import { requireSession } from "@/lib/auth/dal";
import { getMatchesForApplicant } from "@/lib/matching/queries";
import { MatchBreakdownChips } from "@/components/matches/MatchBreakdownChips";

export default async function ApplicantDashboardPage() {
  const session = await requireSession("applicant");
  const matches = await getMatchesForApplicant(session.uid);

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Matched jobs</h1>
        <Link href="/applicant/profile" className="text-sm underline">
          Edit profile
        </Link>
      </div>

      {matches.length === 0 && (
        <p className="text-sm text-zinc-500">
          No matches yet. Once jobs are posted that fit your profile, they&apos;ll show up here.
        </p>
      )}

      <div className="flex flex-col gap-3">
        {matches.map((match) => (
          <Link
            key={match.matchId}
            href={`/applicant/jobs/${match.jobId}`}
            className="rounded border border-zinc-300 p-4 hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-500"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium">{match.job.title}</p>
                <p className="text-sm text-zinc-500">
                  {match.companyName} · {match.job.location}
                  {match.job.remote ? " · Remote-friendly" : ""}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-zinc-900 px-2.5 py-1 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900">
                {Math.round(match.score)}%
              </span>
            </div>
            <div className="mt-3">
              <MatchBreakdownChips breakdown={match.breakdown} />
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
