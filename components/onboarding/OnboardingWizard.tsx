"use client";

import { useState } from "react";
import { unstable_rethrow } from "next/navigation";
import { BasicInfoStep } from "@/components/onboarding/steps/BasicInfoStep";
import { ExperienceStep } from "@/components/onboarding/steps/ExperienceStep";
import { EducationStep } from "@/components/onboarding/steps/EducationStep";
import { SkillsStep } from "@/components/onboarding/steps/SkillsStep";
import { PreferencesStep } from "@/components/onboarding/steps/PreferencesStep";
import { saveApplicantProfile, type OnboardingInput } from "@/app/applicant/onboarding/actions";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

const STEP_LABELS = ["Basic info", "Experience", "Education", "Skills", "Preferences"];

const INITIAL_STATE: OnboardingInput = {
  basicInfo: { name: "", location: "", address: "", phone: "", photoUrl: null, about: "" },
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
      // redirect() inside the action throws a special error on success —
      // rethrow it so Next completes the navigation instead of us treating
      // it as a real failure. unstable_rethrow no-ops for genuine errors.
      unstable_rethrow(err);
      setError(err instanceof Error ? err.message : "Failed to save profile");
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex max-w-lg flex-col gap-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold text-ink">Build your profile</h1>
        <p className="mt-1 text-sm text-muted">
          Step {step + 1} of {STEP_LABELS.length}: {STEP_LABELS[step]}
        </p>
        <div className="mt-3 flex gap-1">
          {STEP_LABELS.map((label, i) => (
            <div key={label} className={`h-1 flex-1 rounded ${i <= step ? "bg-brand" : "bg-line"}`} />
          ))}
        </div>
      </div>

      <Card className="p-6">
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
      </Card>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex justify-between">
        <Button type="button" variant="secondary" disabled={step === 0 || submitting} onClick={() => setStep((s) => s - 1)}>
          Back
        </Button>

        {isLastStep ? (
          <Button type="button" disabled={submitting} onClick={handleFinish}>
            {submitting ? "Saving…" : "Finish"}
          </Button>
        ) : (
          <Button type="button" disabled={!canGoNext} onClick={() => setStep((s) => s + 1)}>
            Next
          </Button>
        )}
      </div>
    </main>
  );
}
