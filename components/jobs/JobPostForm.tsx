"use client";

import { useState } from "react";
import { TagInput } from "@/components/onboarding/TagInput";
import { EMPLOYMENT_TYPES, SENIORITIES } from "@/lib/constants";
import { createJob, type CreateJobInput } from "@/app/recruiter/jobs/new/actions";

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
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{heading}</h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Job title</label>
          <input
            type="text"
            required
            value={data.title}
            onChange={(e) => setData({ ...data, title: e.target.value })}
            className="w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Description</label>
          <textarea
            required
            rows={5}
            value={data.description}
            onChange={(e) => setData({ ...data, description: e.target.value })}
            className="w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>

        <TagInput
          label="Required skills"
          values={data.skills}
          onChange={(skills) => setData({ ...data, skills })}
          placeholder="Type a skill and press Enter"
        />

        <div>
          <label className="mb-1 block text-sm font-medium">Location</label>
          <input
            type="text"
            required
            placeholder="City, Country"
            value={data.location}
            onChange={(e) => setData({ ...data, location: e.target.value })}
            className="w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={data.remote}
            onChange={(e) => setData({ ...data, remote: e.target.checked })}
          />
          Remote-friendly
        </label>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Min salary</label>
            <input
              type="number"
              value={data.salaryMin ?? ""}
              onChange={(e) => setData({ ...data, salaryMin: e.target.value ? Number(e.target.value) : null })}
              className="w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Max salary</label>
            <input
              type="number"
              value={data.salaryMax ?? ""}
              onChange={(e) => setData({ ...data, salaryMax: e.target.value ? Number(e.target.value) : null })}
              className="w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Employment type</label>
            <select
              value={data.employmentType}
              onChange={(e) => setData({ ...data, employmentType: e.target.value as CreateJobInput["employmentType"] })}
              className="w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            >
              {EMPLOYMENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Seniority</label>
            <select
              value={data.seniority}
              onChange={(e) => setData({ ...data, seniority: e.target.value as CreateJobInput["seniority"] })}
              className="w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            >
              {SENIORITIES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {submitting ? submittingLabel : submitLabel}
        </button>
      </form>
    </main>
  );
}
