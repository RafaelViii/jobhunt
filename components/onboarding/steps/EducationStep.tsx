"use client";

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
      <h2 className="text-lg font-medium">Education</h2>

      {value.map((entry, index) => (
        <div key={index} className="flex flex-col gap-2 rounded border border-zinc-300 p-3 dark:border-zinc-700">
          <input
            type="text"
            placeholder="School"
            value={entry.school}
            onChange={(e) => updateEntry(index, { school: e.target.value })}
            className="rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="Degree"
              value={entry.degree}
              onChange={(e) => updateEntry(index, { degree: e.target.value })}
              className="rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
            <input
              type="text"
              placeholder="Field of study"
              value={entry.field}
              onChange={(e) => updateEntry(index, { field: e.target.value })}
              className="rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="month"
              value={entry.startDate}
              onChange={(e) => updateEntry(index, { startDate: e.target.value })}
              className="rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
            <input
              type="month"
              value={entry.endDate ?? ""}
              onChange={(e) => updateEntry(index, { endDate: e.target.value || null })}
              className="rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>
          <button
            type="button"
            onClick={() => removeEntry(index)}
            className="self-start text-xs text-red-600 hover:underline"
          >
            Remove
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={() => onChange([...value, { ...EMPTY_ENTRY }])}
        className="self-start rounded border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700"
      >
        + Add education
      </button>
    </div>
  );
}
