"use server";

import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/dal";
import { adminDb } from "@/lib/firebase/admin";
import { recomputeMatchesForApplicant } from "@/lib/matching/recompute";
import { generateAndStoreResume } from "@/lib/resume/generateResumePdf";
import type { ApplicantProfileDoc } from "@/lib/types";

export type OnboardingInput = Pick<
  ApplicantProfileDoc,
  "basicInfo" | "experience" | "education" | "skills" | "preferences"
>;

// CLAUDE.md §7 call site #1 + §6 (resume generation on onboarding completion).
export async function saveApplicantProfile(input: OnboardingInput): Promise<void> {
  const session = await requireSession("applicant");

  const profile: ApplicantProfileDoc = {
    basicInfo: input.basicInfo,
    experience: input.experience,
    education: input.education,
    skills: input.skills,
    preferences: input.preferences,
    resumeUrl: null,
    onboardingComplete: true,
  };

  await adminDb().collection("applicantProfiles").doc(session.uid).set(profile);
  await recomputeMatchesForApplicant(session.uid);
  await generateAndStoreResume(session.uid, profile, session.email ?? "");

  redirect("/applicant/dashboard");
}
