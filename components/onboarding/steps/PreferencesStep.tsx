"use client";

import { TagInput } from "@/components/onboarding/TagInput";
import { EMPLOYMENT_TYPES, SENIORITIES } from "@/lib/constants";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Select } from "@/components/ui/Select";
import type { ApplicantPreferences, EmploymentType, Seniority } from "@/lib/types";

export function PreferencesStep({
  value,
  onChange,
}: {
  value: ApplicantPreferences;
  onChange: (value: ApplicantPreferences) => void;
}) {
  function toggleEmploymentType(type: EmploymentType) {
    const has = value.employmentTypes.includes(type);
    onChange({
      ...value,
      employmentTypes: has
        ? value.employmentTypes.filter((t) => t !== type)
        : [...value.employmentTypes, type],
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-ink">Job preferences</h2>

      <TagInput
        label="Desired titles"
        values={value.titles}
        onChange={(titles) => onChange({ ...value, titles })}
        placeholder="e.g. Frontend Engineer"
      />

      <TagInput
        label="Preferred locations"
        values={value.locations}
        onChange={(locations) => onChange({ ...value, locations })}
        placeholder="e.g. Manila, Remote"
      />

      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label>Min salary</Label>
          <Input
            type="number"
            value={value.salaryMin ?? ""}
            onChange={(e) => onChange({ ...value, salaryMin: e.target.value ? Number(e.target.value) : null })}
          />
        </div>
        <div>
          <Label>Max salary</Label>
          <Input
            type="number"
            value={value.salaryMax ?? ""}
            onChange={(e) => onChange({ ...value, salaryMax: e.target.value ? Number(e.target.value) : null })}
          />
        </div>
      </div>

      <div>
        <Label>Employment type</Label>
        <div className="flex flex-wrap gap-3">
          {EMPLOYMENT_TYPES.map((type) => (
            <label key={type} className="flex items-center gap-1.5 text-sm text-ink">
              <input
                type="checkbox"
                checked={value.employmentTypes.includes(type)}
                onChange={() => toggleEmploymentType(type)}
              />
              {type}
            </label>
          ))}
        </div>
      </div>

      <div>
        <Label>Seniority</Label>
        <Select
          value={value.seniority ?? ""}
          onChange={(e) => onChange({ ...value, seniority: (e.target.value || null) as Seniority | null })}
        >
          <option value="">Select…</option>
          {SENIORITIES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}
