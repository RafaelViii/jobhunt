"use client";

import { useState } from "react";
import { unstable_rethrow } from "next/navigation";
import { ImageUploadField } from "@/components/uploads/ImageUploadField";
import { createCompany, type CreateCompanyInput } from "@/app/recruiter/onboarding/actions";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

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
      // redirect() inside the action throws a special error on success —
      // rethrow it so Next completes the navigation instead of us treating
      // it as a real failure. unstable_rethrow no-ops for genuine errors.
      unstable_rethrow(err);
      setError(err instanceof Error ? err.message : "Failed to save company");
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-2xl font-bold tracking-tight text-brand">JobHunt</h1>

      <Card className="w-full max-w-lg p-6">
        <h2 className="text-lg font-semibold text-ink">Set up your company</h2>
        <p className="mb-5 mt-1 text-sm text-muted">This is what candidates will see on your job posts.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <Label>Company name</Label>
            <Input type="text" required value={data.name} onChange={(e) => setData({ ...data, name: e.target.value })} />
          </div>

          <div>
            <Label>Website</Label>
            <Input
              type="url"
              placeholder="https://…"
              value={data.website}
              onChange={(e) => setData({ ...data, website: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div>
              <Label>Industry</Label>
              <Input type="text" value={data.industry} onChange={(e) => setData({ ...data, industry: e.target.value })} />
            </div>
            <div>
              <Label>Company size</Label>
              <Input
                type="text"
                placeholder="e.g. 11-50"
                value={data.size}
                onChange={(e) => setData({ ...data, size: e.target.value })}
              />
            </div>
          </div>

          <ImageUploadField
            label="Logo (optional)"
            value={data.logoUrl}
            onChange={(logoUrl) => setData({ ...data, logoUrl })}
            previewShape="square"
          />

          {error && <p className="text-sm text-danger">{error}</p>}

          <Button type="submit" disabled={submitting}>
            {submitting ? "Saving…" : "Continue"}
          </Button>
        </form>
      </Card>
    </main>
  );
}
