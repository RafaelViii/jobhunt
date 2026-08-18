"use client";

import { useState } from "react";
import { BasicInfoStep } from "@/components/onboarding/steps/BasicInfoStep";
import { ExperienceStep } from "@/components/onboarding/steps/ExperienceStep";
import { EducationStep } from "@/components/onboarding/steps/EducationStep";
import { SkillsStep } from "@/components/onboarding/steps/SkillsStep";
import { PreferencesStep } from "@/components/onboarding/steps/PreferencesStep";
import { saveApplicantProfile, type OnboardingInput } from "@/app/applicant/onboarding/actions";

const STEP_LABELS = ["Basic info", "Experience", "Education", "Skills", "Preferences"];

const INITIAL_STATE: OnboardingInput = {
  basicInfo: { name: "", location: "", phone: "", photoUrl: null },
  experience: [],
  education: [],
  skills: [],
  preferences: {
    titles: [],
    locations: [],
    salaryMin: null,
    salaryMax: null,
    employmentTypes: [],
    seniority: null,
  },
};

export function OnboardingWizard() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<OnboardingInput>(INITIAL_STATE);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLastStep = step === STEP_LABELS.length - 1;
  const canGoNext = step !== 0 || (data.basicInfo.name.trim() !== "" && data.basicInfo.location.trim() !== "");

  async function handleFinish() {
    setError(null);
    setSubmitting(true);
    try {
      await saveApplicantProfile(data);
    } catch (err) {
      // redirect() inside the action throws internally on success — only a
      // real failure reaches here.
      setError(err instanceof Error ? err.message : "Failed to save profile");
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col gap-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Build your profile</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Step {step + 1} of {STEP_LABELS.length}: {STEP_LABELS[step]}
        </p>
        <div className="mt-3 flex gap-1">
          {STEP_LABELS.map((label, i) => (
            <div
              key={label}
              className={`h-1 flex-1 rounded ${i <= step ? "bg-zinc-900 dark:bg-zinc-100" : "bg-zinc-200 dark:bg-zinc-800"}`}
            />
          ))}
        </div>
      </div>

      {step === 0 && (
        <BasicInfoStep value={data.basicInfo} onChange={(basicInfo) => setData({ ...data, basicInfo })} />
      )}
      {step === 1 && (
        <ExperienceStep value={data.experience} onChange={(experience) => setData({ ...data, experience })} />
      )}
      {step === 2 && (
        <EducationStep value={data.education} onChange={(education) => setData({ ...data, education })} />
      )}
      {step === 3 && <SkillsStep value={data.skills} onChange={(skills) => setData({ ...data, skills })} />}
      {step === 4 && (
        <PreferencesStep value={data.preferences} onChange={(preferences) => setData({ ...data, preferences })} />
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-between">
        <button
          type="button"
          disabled={step === 0 || submitting}
          onClick={() => setStep((s) => s - 1)}
          className="rounded border border-zinc-300 px-4 py-2 text-sm disabled:opacity-40 dark:border-zinc-700"
        >
          Back
        </button>

        {isLastStep ? (
          <button
            type="button"
            disabled={submitting}
            onClick={handleFinish}
            className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
          >
            {submitting ? "Saving…" : "Finish"}
          </button>
        ) : (
          <button
            type="button"
            disabled={!canGoNext}
            onClick={() => setStep((s) => s + 1)}
            className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900"
          >
            Next
          </button>
        )}
      </div>
    </main>
  );
}
