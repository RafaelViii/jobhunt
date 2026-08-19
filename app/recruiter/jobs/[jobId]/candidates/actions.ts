"use server";

import { FieldValue } from "firebase-admin/firestore";
import { requireSession } from "@/lib/auth/dal";
import { recruiterOwnsJob } from "@/lib/auth/company";
import { adminDb } from "@/lib/firebase/admin";
import type { ApplicationDoc, ApplicationStatus, JobDoc } from "@/lib/types";

// CLAUDE.md §4's statusHistory[] — append-only audit trail of status changes.
export async function updateApplicationStatus(applicationId: string, status: ApplicationStatus): Promise<void> {
  const session = await requireSession("recruiter");

  const applicationRef = adminDb().collection("applications").doc(applicationId);
  const applicationSnap = await applicationRef.get();
  if (!applicationSnap.exists) return;
  const application = applicationSnap.data() as ApplicationDoc;

  const jobSnap = await adminDb().collection("jobs").doc(application.jobId).get();
  if (!jobSnap.exists) return;
  const job = jobSnap.data() as JobDoc;

  // No Firestore security rules yet (Phase 5) — guard ownership explicitly.
  if (!(await recruiterOwnsJob(job, session.uid))) return;

  const event = { status, changedAt: Date.now() };
  await applicationRef.update({
    status,
    statusHistory: FieldValue.arrayUnion(event),
  });
}
