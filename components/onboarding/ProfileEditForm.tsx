"use client";

import { useState } from "react";
import { BasicInfoStep } from "@/components/onboarding/steps/BasicInfoStep";
import { ExperienceStep } from "@/components/onboarding/steps/ExperienceStep";
import { EducationStep } from "@/components/onboarding/steps/EducationStep";
import { SkillsStep } from "@/components/onboarding/steps/SkillsStep";
import { PreferencesStep } from "@/components/onboarding/steps/PreferencesStep";
import { updateApplicantProfile, type ProfileEditInput } from "@/app/applicant/profile/actions";

export function ProfileEditForm({ initialData }: { initialData: ProfileEditInput }) {
  const [data, setData] = useState<ProfileEditInput>(initialData);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await updateApplicantProfile(data);
    } catch (err) {
      // redirect() inside the action throws internally on success — only a
      // real failure reaches here.
      setError(err instanceof Error ? err.message : "Failed to save profile");
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col gap-8 p-8">
      <h1 className="text-2xl font-semibold tracking-tight">Edit profile</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-10">
        <BasicInfoStep value={data.basicInfo} onChange={(basicInfo) => setData({ ...data, basicInfo })} />
        <ExperienceStep value={data.experience} onChange={(experience) => setData({ ...data, experience })} />
        <EducationStep value={data.education} onChange={(education) => setData({ ...data, education })} />
        <SkillsStep value={data.skills} onChange={(skills) => setData({ ...data, skills })} />
        <PreferencesStep value={data.preferences} onChange={(preferences) => setData({ ...data, preferences })} />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {submitting ? "Saving…" : "Save changes"}
        </button>
      </form>
    </main>
  );
}
