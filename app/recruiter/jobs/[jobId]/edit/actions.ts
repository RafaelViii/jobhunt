"use server";

import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/dal";
import { recruiterOwnsJob } from "@/lib/auth/company";
import { adminDb } from "@/lib/firebase/admin";
import { recomputeMatchesForJob } from "@/lib/matching/recompute";
import type { JobDoc } from "@/lib/types";
import type { CreateJobInput } from "@/app/recruiter/jobs/new/actions";

// CLAUDE.md §7 call site #4.
export async function updateJob(jobId: string, input: CreateJobInput): Promise<void> {
  const session = await requireSession("recruiter");

  const jobRef = adminDb().collection("jobs").doc(jobId);
  const existing = await jobRef.get();
  if (!existing.exists) redirect("/recruiter/dashboard");

  const existingJob = existing.data() as JobDoc;
  // No Firestore security rules yet (Phase 5) — guard ownership explicitly
  // here rather than trusting the client.
  if (!(await recruiterOwnsJob(existingJob, session.uid))) {
    redirect("/recruiter/dashboard");
  }

  const jobDoc: JobDoc = { ...existingJob, ...input };
  await jobRef.set(jobDoc);
  await recomputeMatchesForJob(jobId);

  redirect("/recruiter/dashboard");
}
