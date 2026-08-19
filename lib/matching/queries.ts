import "server-only";

import { adminDb } from "@/lib/firebase/admin";
import type { ApplicantProfileDoc, CompanyDoc, JobDoc, MatchBreakdown, MatchDoc } from "@/lib/types";

// Dashboards only ever read precomputed `matches` — never recompute at
// render time (CLAUDE.md §3). These are read/join helpers only.

export type ApplicantMatchView = {
  matchId: string;
  jobId: string;
  score: number;
  breakdown: MatchBreakdown;
  job: JobDoc;
  companyName: string;
  companyLogoUrl: string | null;
  companyVerified: boolean;
};

export async function getMatchesForApplicant(applicantUid: string): Promise<ApplicantMatchView[]> {
  const matchesSnap = await adminDb()
    .collection("matches")
    .where("applicantUid", "==", applicantUid)
    .orderBy("score", "desc")
    .get();

  const views = await Promise.all(
    matchesSnap.docs.map(async (matchDoc): Promise<ApplicantMatchView | null> => {
      const match = matchDoc.data() as MatchDoc;

      const jobSnap = await adminDb().collection("jobs").doc(match.jobId).get();
      if (!jobSnap.exists) return null;
      const job = jobSnap.data() as JobDoc;

      const companySnap = await adminDb().collection("companies").doc(job.companyId).get();
      const company = companySnap.data() as CompanyDoc | undefined;

      return {
        matchId: matchDoc.id,
        jobId: match.jobId,
        score: match.score,
        breakdown: match.breakdown,
        job,
        companyName: company?.name ?? "Unknown company",
        companyLogoUrl: company?.logoUrl ?? null,
        companyVerified: company?.verification?.status === "verified",
      };
    }),
  );

  return views.filter((view): view is ApplicantMatchView => view !== null);
}

export async function getMatchForApplicantAndJob(
  applicantUid: string,
  jobId: string,
): Promise<Pick<MatchDoc, "score" | "breakdown"> | null> {
  const snap = await adminDb().collection("matches").doc(`${applicantUid}_${jobId}`).get();
  if (!snap.exists) return null;
  const match = snap.data() as MatchDoc;
  return { score: match.score, breakdown: match.breakdown };
}

export type JobCandidateView = {
  matchId: string;
  applicantUid: string;
  score: number;
  breakdown: MatchBreakdown;
  applicant: ApplicantProfileDoc;
};

export async function getMatchesForJob(jobId: string): Promise<JobCandidateView[]> {
  const matchesSnap = await adminDb()
    .collection("matches")
    .where("jobId", "==", jobId)
    .orderBy("score", "desc")
    .get();

  const views = await Promise.all(
    matchesSnap.docs.map(async (matchDoc): Promise<JobCandidateView | null> => {
      const match = matchDoc.data() as MatchDoc;

      const profileSnap = await adminDb().collection("applicantProfiles").doc(match.applicantUid).get();
      if (!profileSnap.exists) return null;

      return {
        matchId: matchDoc.id,
        applicantUid: match.applicantUid,
        score: match.score,
        breakdown: match.breakdown,
        applicant: profileSnap.data() as ApplicantProfileDoc,
      };
    }),
  );

  return views.filter((view): view is JobCandidateView => view !== null);
}

export async function getJobsForCompany(companyId: string): Promise<(JobDoc & { id: string })[]> {
  const snap = await adminDb().collection("jobs").where("companyId", "==", companyId).get();
  return snap.docs
    .map((doc) => ({ id: doc.id, ...(doc.data() as JobDoc) }))
    .sort((a, b) => b.postedAt - a.postedAt);
}
