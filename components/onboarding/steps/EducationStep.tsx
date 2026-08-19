"use client";

import { Input } from "@/components/ui/Input";
import type { EducationEntry } from "@/lib/types";

const EMPTY_ENTRY: EducationEntry = {
  school: "",
  degree: "",
  field: "",
  startDate: "",
  endDate: null,
};

export function EducationStep({
  value,
  onChange,
}: {
  value: EducationEntry[];
  onChange: (value: EducationEntry[]) => void;
}) {
  function updateEntry(index: number, patch: Partial<EducationEntry>) {
    onChange(value.map((entry, i) => (i === index ? { ...entry, ...patch } : entry)));
  }

  function removeEntry(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-ink">Education</h2>

      {value.map((entry, index) => (
        <div key={index} className="flex flex-col gap-2 rounded-md border border-line bg-page p-3">
          <Input
            type="text"
            placeholder="School"
            value={entry.school}
            onChange={(e) => updateEntry(index, { school: e.target.value })}
          />
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Input
              type="text"
              placeholder="Degree"
              value={entry.degree}
              onChange={(e) => updateEntry(index, { degree: e.target.value })}
            />
            <Input
              type="text"
              placeholder="Field of study"
              value={entry.field}
              onChange={(e) => updateEntry(index, { field: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {/* Month pair stays 2-up even on mobile — narrower fields, reads fine side by side */}
            <Input
              type="month"
              value={entry.startDate}
              onChange={(e) => updateEntry(index, { startDate: e.target.value })}
            />
            <Input
              type="month"
              value={entry.endDate ?? ""}
              onChange={(e) => updateEntry(index, { endDate: e.target.value || null })}
            />
          </div>
          <button
            type="button"
            onClick={() => removeEntry(index)}
            className="self-start text-xs font-medium text-danger hover:underline"
          >
            Remove
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={() => onChange([...value, { ...EMPTY_ENTRY }])}
        className="self-start rounded-md border border-line px-3 py-1.5 text-sm font-medium text-ink hover:bg-page"
      >
        + Add education
      </button>
    </div>
  );
}
