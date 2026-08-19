"use client";

import { useState } from "react";
import { BasicInfoStep } from "@/components/onboarding/steps/BasicInfoStep";
import { ExperienceStep } from "@/components/onboarding/steps/ExperienceStep";
import { EducationStep } from "@/components/onboarding/steps/EducationStep";
import { SkillsStep } from "@/components/onboarding/steps/SkillsStep";
import { PreferencesStep } from "@/components/onboarding/steps/PreferencesStep";
import { updateApplicantProfile, type ProfileEditInput } from "@/app/applicant/profile/actions";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SidebarCard } from "@/components/nav/SidebarCard";

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
    <div className="mx-auto flex max-w-5xl gap-6 px-4 py-8">
      <aside className="hidden w-64 shrink-0 lg:block">
        <div className="sticky top-20">
          {/* Reflects edits live — the sidebar is built from `data`, not the
              original `initialData`, so a name/photo change previews immediately. */}
          <SidebarCard
            name={data.basicInfo.name || "Your name"}
            subtitle={data.basicInfo.location}
            photoUrl={data.basicInfo.photoUrl}
            meta={[
              { label: "Skills listed", value: String(data.skills.length) },
              { label: "Experience entries", value: String(data.experience.length) },
            ]}
            links={[{ href: "/applicant/dashboard", label: "Back to dashboard" }]}
          />
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col gap-6">
        <h1 className="text-2xl font-bold text-ink">Edit profile</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <Card className="p-6">
            <BasicInfoStep value={data.basicInfo} onChange={(basicInfo) => setData({ ...data, basicInfo })} />
          </Card>
          <Card className="p-6">
            <ExperienceStep value={data.experience} onChange={(experience) => setData({ ...data, experience })} />
          </Card>
          <Card className="p-6">
            <EducationStep value={data.education} onChange={(education) => setData({ ...data, education })} />
          </Card>
          <Card className="p-6">
            <SkillsStep value={data.skills} onChange={(skills) => setData({ ...data, skills })} />
          </Card>
          <Card className="p-6">
            <PreferencesStep value={data.preferences} onChange={(preferences) => setData({ ...data, preferences })} />
          </Card>

          {error && <p className="text-sm text-danger">{error}</p>}

          <Button type="submit" disabled={submitting} className="self-start">
            {submitting ? "Saving…" : "Save changes"}
          </Button>
        </form>
      </main>
    </div>
  );
}
