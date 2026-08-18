"use server";

import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/dal";
import { adminDb } from "@/lib/firebase/admin";
import type { ApplicantProfileDoc, ApplicationDoc, JobDoc } from "@/lib/types";

// CLAUDE.md §4/§6: snapshots resumeUrl at apply time so a later profile edit
// doesn't retroactively change what a recruiter already reviewed. Deterministic
// doc ID ({uid}_{jobId}, matching the `matches` collection's pattern) makes
// duplicate-apply prevention a single get() instead of a query.
export async function applyToJob(jobId: string): Promise<void> {
  const session = await requireSession("applicant");

  const applicationRef = adminDb().collection("applications").doc(`${session.uid}_${jobId}`);
  const existing = await applicationRef.get();
  if (existing.exists) {
    redirect("/applicant/applications");
  }

  const jobSnap = await adminDb().collection("jobs").doc(jobId).get();
  if (!jobSnap.exists) redirect("/applicant/dashboard");
  const job = jobSnap.data() as JobDoc;

  const profileSnap = await adminDb().collection("applicantProfiles").doc(session.uid).get();
  const profile = profileSnap.exists ? (profileSnap.data() as ApplicantProfileDoc) : null;

  const now = Date.now();
  const applicationDoc: ApplicationDoc = {
    jobId,
    applicantUid: session.uid,
    companyId: job.companyId,
    resumeUrl: profile?.resumeUrl ?? null,
    status: "submitted",
    appliedAt: now,
    statusHistory: [{ status: "submitted", changedAt: now }],
  };

  await applicationRef.set(applicationDoc);

  redirect("/applicant/applications");
}
