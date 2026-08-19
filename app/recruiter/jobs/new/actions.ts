"use server";

import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/dal";
import { getCompanyForRecruiter } from "@/lib/auth/company";
import { adminDb } from "@/lib/firebase/admin";
import { recomputeMatchesForJob } from "@/lib/matching/recompute";
import type { JobDoc } from "@/lib/types";

export type CreateJobInput = Omit<JobDoc, "companyId" | "status" | "postedAt" | "postedBy">;

// CLAUDE.md §7 call site #3.
export async function createJob(input: CreateJobInput): Promise<void> {
  const session = await requireSession("recruiter");

  const company = await getCompanyForRecruiter(session.uid);
  if (!company) redirect("/recruiter/onboarding");
  // Defense in depth — the /recruiter/jobs/new page already redirects
  // unverified recruiters, but a Server Action can be invoked directly, so
  // the actual write path enforces this too, not just the page.
  if (company.verification?.status !== "verified") redirect("/recruiter/verify");

  const jobDoc: JobDoc = {
    ...input,
    companyId: company.id,
    status: "open",
    postedAt: Date.now(),
    postedBy: session.uid,
  };

  const jobRef = adminDb().collection("jobs").doc();
  await jobRef.set(jobDoc);
  await recomputeMatchesForJob(jobRef.id);

  redirect("/recruiter/dashboard");
}
