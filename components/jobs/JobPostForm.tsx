"use client";

import { useState } from "react";
import { TagInput } from "@/components/onboarding/TagInput";
import { EMPLOYMENT_TYPES, SENIORITIES } from "@/lib/constants";
import { createJob, type CreateJobInput } from "@/app/recruiter/jobs/new/actions";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Label } from "@/components/ui/Label";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

const DEFAULT_STATE: CreateJobInput = {
  title: "",
  description: "",
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
      // redirect() inside the action throws internally on success — only a
      // real failure reaches here.
      setError(err instanceof Error ? err.message : "Failed to save job");
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex max-w-lg flex-col gap-6 px-4 py-8">
      <h1 className="text-2xl font-bold text-ink">{heading}</h1>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <Label>Job title</Label>
            <Input type="text" required value={data.title} onChange={(e) => setData({ ...data, title: e.target.value })} />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              required
              rows={5}
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

          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={data.remote}
              onChange={(e) => setData({ ...data, remote: e.target.checked })}
            />
            Remote-friendly
          </label>

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
    </main>
  );
}
