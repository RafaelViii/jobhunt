"use server";

import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/dal";
import { adminDb } from "@/lib/firebase/admin";
import { recomputeMatchesForApplicant } from "@/lib/matching/recompute";
import { generateAndStoreResume } from "@/lib/resume/generateResumePdf";
import type { ApplicantProfileDoc } from "@/lib/types";

export type ProfileEditInput = Pick<
  ApplicantProfileDoc,
  "basicInfo" | "experience" | "education" | "skills" | "preferences"
>;

// CLAUDE.md §7 call site #2 + §6 (resume regenerates on explicit profile
// save — not on every keystroke, since this only runs when the form submits).
export async function updateApplicantProfile(input: ProfileEditInput): Promise<void> {
  const session = await requireSession("applicant");

  const profileRef = adminDb().collection("applicantProfiles").doc(session.uid);
  const existing = await profileRef.get();
  if (!existing.exists) redirect("/applicant/onboarding");

  const profile: ApplicantProfileDoc = {
    ...(existing.data() as ApplicantProfileDoc),
    basicInfo: input.basicInfo,
    experience: input.experience,
    education: input.education,
    skills: input.skills,
    preferences: input.preferences,
  };

  await profileRef.set(profile);
  await recomputeMatchesForApplicant(session.uid);
  await generateAndStoreResume(session.uid, profile, session.email ?? "");

  redirect("/applicant/dashboard");
}
