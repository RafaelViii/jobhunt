"use client";

import { useState } from "react";
import { unstable_rethrow } from "next/navigation";
import { TagInput } from "@/components/onboarding/TagInput";
import { EMPLOYMENT_TYPES, SENIORITIES } from "@/lib/constants";
import { createJob, type CreateJobInput } from "@/app/recruiter/jobs/new/actions";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Label } from "@/components/ui/Label";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { TitleCombobox } from "@/components/ui/TitleCombobox";
import { ImageUploadField } from "@/components/uploads/ImageUploadField";
import { CategoryBanner } from "@/components/matches/CategoryBanner";
import { ALL_EXPERIENCE_TITLES } from "@/lib/matching/experienceTitles";
import { suggestedSkillsForTitle } from "@/lib/matching/jobSkillPresets";

const DEFAULT_STATE: CreateJobInput = {
  title: "",
  description: "",
  bannerUrl: null,
  skills: [],
  location: "",
  remote: false,
  salaryMin: null,
  salaryMax: null,
  employmentType: "full-time",
  seniority: "mid",
};

export function JobPostForm({
  initialData = DEFAULT_STATE,
  heading = "Post a job",
  submitLabel = "Post job",
  submittingLabel = "Posting…",
  onSubmit = createJob,
}: {
  initialData?: CreateJobInput;
  heading?: string;
  submitLabel?: string;
  submittingLabel?: string;
  onSubmit?: (data: CreateJobInput) => Promise<void>;
}) {
  const [data, setData] = useState<CreateJobInput>(initialData);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit(data);
    } catch (err) {
      // redirect() inside the action throws a special error on success —
      // rethrow it so Next completes the navigation instead of us treating
      // it as a real failure. unstable_rethrow no-ops for genuine errors.
      unstable_rethrow(err);
      setError(err instanceof Error ? err.message : "Failed to save job");
      setSubmitting(false);
    }
  }

  function handleTitleSelect(title: string) {
    const preset = suggestedSkillsForTitle(title);
    if (preset.length === 0) return;
    // Merge, don't replace — anything already typed manually stays, and
    // nothing gets duplicated. Recruiter can still remove any of these.
    setData((prev) => ({
      ...prev,
      skills: Array.from(new Set([...prev.skills, ...preset])),
    }));
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold text-ink">{heading}</h1>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <Label>Job title</Label>
              <TitleCombobox
                required
                value={data.title}
                onChange={(title) => setData({ ...data, title })}
                onSelect={handleTitleSelect}
                suggestions={ALL_EXPERIENCE_TITLES}
              />
              <p className="mt-1 text-xs text-muted">
                Picking a suggested title auto-fills common skills below — add or remove as needed.
              </p>
            </div>

            <ImageUploadField
              label="Banner image (optional)"
              value={data.bannerUrl}
              onChange={(bannerUrl) => setData({ ...data, bannerUrl })}
              previewShape="banner"
            />

            <div>
              <Label>Description</Label>
              <Textarea
                required
                rows={8}
                value={data.description}
                onChange={(e) => setData({ ...data, description: e.target.value })}
              />
            </div>

            <TagInput
              label="Required skills"
              values={data.skills}
              onChange={(skills) => setData({ ...data, skills })}
              placeholder="Type a skill and press Enter"
            />

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div>
                <Label>Location</Label>
                <Input
                  type="text"
                  required
                  placeholder="City, Country"
                  value={data.location}
                  onChange={(e) => setData({ ...data, location: e.target.value })}
                />
              </div>
              <div className="flex items-end pb-2.5">
                <label className="flex items-center gap-2 text-sm text-ink">
                  <input
                    type="checkbox"
                    checked={data.remote}
                    onChange={(e) => setData({ ...data, remote: e.target.checked })}
                  />
                  Remote-friendly
                </label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Min salary</Label>
                <Input
                  type="number"
                  value={data.salaryMin ?? ""}
                  onChange={(e) => setData({ ...data, salaryMin: e.target.value ? Number(e.target.value) : null })}
                />
              </div>
              <div>
                <Label>Max salary</Label>
                <Input
                  type="number"
                  value={data.salaryMax ?? ""}
                  onChange={(e) => setData({ ...data, salaryMax: e.target.value ? Number(e.target.value) : null })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Employment type</Label>
                <Select
                  value={data.employmentType}
                  onChange={(e) => setData({ ...data, employmentType: e.target.value as CreateJobInput["employmentType"] })}
                >
                  {EMPLOYMENT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>Seniority</Label>
                <Select
                  value={data.seniority}
                  onChange={(e) => setData({ ...data, seniority: e.target.value as CreateJobInput["seniority"] })}
                >
                  {SENIORITIES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            {error && <p className="text-sm text-danger">{error}</p>}

            <Button type="submit" disabled={submitting}>
              {submitting ? submittingLabel : submitLabel}
            </Button>
          </form>
        </Card>

        <div className="hidden lg:block">
          <div className="sticky top-20">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Preview</p>
            <Card className="overflow-hidden p-0">
              <CategoryBanner
                jobId={data.title || "preview"}
                title={data.title}
                skills={data.skills}
                bannerUrl={data.bannerUrl}
                className="h-32 w-full"
              />
              <div className="p-4">
                <p className="font-semibold text-ink">{data.title || "Job title"}</p>
                <p className="text-sm text-muted">
                  {data.location || "Location"}
                  {data.remote ? " · Remote-friendly" : ""}
                </p>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  <Chip tone="brand">{data.employmentType}</Chip>
                  <Chip tone="brand">{data.seniority}</Chip>
                  {data.salaryMin !== null && data.salaryMax !== null && (
                    <Chip tone="brand">
                      {data.salaryMin.toLocaleString()}–{data.salaryMax.toLocaleString()}
                    </Chip>
                  )}
                </div>

                {data.skills.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {data.skills.map((skill) => (
                      <Chip key={skill}>{skill}</Chip>
                    ))}
                  </div>
                )}

                {data.description && (
                  <p className="mt-3 line-clamp-4 whitespace-pre-wrap text-xs text-muted">{data.description}</p>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
