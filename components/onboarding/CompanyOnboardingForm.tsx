"use client";

import { useState } from "react";
import { ImageUploadField } from "@/components/uploads/ImageUploadField";
import { createCompany, type CreateCompanyInput } from "@/app/recruiter/onboarding/actions";

const INITIAL_STATE: CreateCompanyInput = {
  name: "",
  logoUrl: null,
  website: "",
  industry: "",
  size: "",
};

export function CompanyOnboardingForm() {
  const [data, setData] = useState<CreateCompanyInput>(INITIAL_STATE);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await createCompany(data);
    } catch (err) {
      // redirect() inside the action throws internally on success — only a
      // real failure reaches here.
      setError(err instanceof Error ? err.message : "Failed to save company");
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Set up your company</h1>
        <p className="mt-1 text-sm text-zinc-500">This is what candidates will see on your job posts.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Company name</label>
          <input
            type="text"
            required
            value={data.name}
            onChange={(e) => setData({ ...data, name: e.target.value })}
            className="w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Website</label>
          <input
            type="url"
            placeholder="https://…"
            value={data.website}
            onChange={(e) => setData({ ...data, website: e.target.value })}
            className="w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Industry</label>
            <input
              type="text"
              value={data.industry}
              onChange={(e) => setData({ ...data, industry: e.target.value })}
              className="w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Company size</label>
            <input
              type="text"
              placeholder="e.g. 11-50"
              value={data.size}
              onChange={(e) => setData({ ...data, size: e.target.value })}
              className="w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>
        </div>

        <ImageUploadField
          label="Logo (optional)"
          value={data.logoUrl}
          onChange={(logoUrl) => setData({ ...data, logoUrl })}
          previewShape="square"
        />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {submitting ? "Saving…" : "Continue"}
        </button>
      </form>
    </main>
  );
}
