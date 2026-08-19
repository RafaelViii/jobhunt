import "server-only";

import { adminDb } from "@/lib/firebase/admin";
import type { ApplicationDoc, CompanyDoc, JobDoc } from "@/lib/types";

export type ApplicantApplicationView = {
  applicationId: string;
  jobId: string;
  status: ApplicationDoc["status"];
  appliedAt: number;
  job: JobDoc;
  companyName: string;
  companyLogoUrl: string | null;
};

// No orderBy in the query — sorted in JS instead, avoiding a dependency on a
// composite index CLAUDE.md §4 doesn't list for this exact combination.
// Trivial at demo scale.
export async function getApplicationsForApplicant(applicantUid: string): Promise<ApplicantApplicationView[]> {
  const snap = await adminDb().collection("applications").where("applicantUid", "==", applicantUid).get();

  const views = await Promise.all(
    snap.docs.map(async (doc): Promise<ApplicantApplicationView | null> => {
      const application = doc.data() as ApplicationDoc;

      const jobSnap = await adminDb().collection("jobs").doc(application.jobId).get();
      if (!jobSnap.exists) return null;
      const job = jobSnap.data() as JobDoc;

      const companySnap = await adminDb().collection("companies").doc(job.companyId).get();
      const company = companySnap.data() as CompanyDoc | undefined;

      return {
        applicationId: doc.id,
        jobId: application.jobId,
        status: application.status,
        appliedAt: application.appliedAt,
        job,
        companyName: company?.name ?? "Unknown company",
        companyLogoUrl: company?.logoUrl ?? null,
      };
    }),
  );

  return views
    .filter((view): view is ApplicantApplicationView => view !== null)
    .sort((a, b) => b.appliedAt - a.appliedAt);
}

export async function getApplicationsForJob(jobId: string): Promise<Map<string, ApplicationDoc & { id: string }>> {
  const snap = await adminDb().collection("applications").where("jobId", "==", jobId).get();

  const map = new Map<string, ApplicationDoc & { id: string }>();
  for (const doc of snap.docs) {
    const application = doc.data() as ApplicationDoc;
    map.set(application.applicantUid, { id: doc.id, ...application });
  }
  return map;
}

export async function hasApplied(applicantUid: string, jobId: string): Promise<boolean> {
  const snap = await adminDb().collection("applications").doc(`${applicantUid}_${jobId}`).get();
  return snap.exists;
}

export async function getApplicationCountForJob(jobId: string): Promise<number> {
  const snap = await adminDb().collection("applications").where("jobId", "==", jobId).count().get();
  return snap.data().count;
}
