import "server-only";

import { adminDb } from "@/lib/firebase/admin";
import { computeMatchScore } from "@/lib/matching/score";
import type { ApplicantProfileDoc, JobDoc, MatchDoc } from "@/lib/types";

// CLAUDE.md §7: the only two places match scores get written. Every mutation
// that can change a score (§7's four call sites) must call one of these —
// never recompute inline elsewhere, and never score at dashboard render time
// (§3). Both score against *all* matching records on every call — O(N×M),
// fine at demo scale (10-20 seeded records); see §5.3 for the documented
// scale answer, deliberately not built now.

function matchDocId(applicantUid: string, jobId: string): string {
  return `${applicantUid}_${jobId}`;
}

export async function recomputeMatchesForApplicant(applicantUid: string): Promise<void> {
  const profileSnap = await adminDb().collection("applicantProfiles").doc(applicantUid).get();
  if (!profileSnap.exists) return;
  const profile = profileSnap.data() as ApplicantProfileDoc;

  const jobsSnap = await adminDb().collection("jobs").where("status", "==", "open").get();

  const batch = adminDb().batch();
  for (const jobDoc of jobsSnap.docs) {
    const job = jobDoc.data() as JobDoc;
    const { score, breakdown } = computeMatchScore(profile, job);
    const matchDoc: MatchDoc = {
      applicantUid,
      jobId: jobDoc.id,
      companyId: job.companyId,
      score,
      breakdown,
      computedAt: Date.now(),
    };
    batch.set(adminDb().collection("matches").doc(matchDocId(applicantUid, jobDoc.id)), matchDoc);
  }
  await batch.commit();
}

export async function recomputeMatchesForJob(jobId: string): Promise<void> {
  const jobSnap = await adminDb().collection("jobs").doc(jobId).get();
  if (!jobSnap.exists) return;
  const job = jobSnap.data() as JobDoc;

  const profilesSnap = await adminDb()
    .collection("applicantProfiles")
    .where("onboardingComplete", "==", true)
    .get();

  const batch = adminDb().batch();
  for (const profileDoc of profilesSnap.docs) {
    const profile = profileDoc.data() as ApplicantProfileDoc;
    const { score, breakdown } = computeMatchScore(profile, job);
    const matchDoc: MatchDoc = {
      applicantUid: profileDoc.id,
      jobId,
      companyId: job.companyId,
      score,
      breakdown,
      computedAt: Date.now(),
    };
    batch.set(adminDb().collection("matches").doc(matchDocId(profileDoc.id, jobId)), matchDoc);
  }
  await batch.commit();
}
