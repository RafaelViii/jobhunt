"use client";

import type { ExperienceEntry } from "@/lib/types";

const EMPTY_ENTRY: ExperienceEntry = {
  title: "",
  company: "",
  startDate: "",
  endDate: null,
  current: false,
  description: "",
};

export function ExperienceStep({
  value,
  onChange,
}: {
  value: ExperienceEntry[];
  onChange: (value: ExperienceEntry[]) => void;
}) {
  function updateEntry(index: number, patch: Partial<ExperienceEntry>) {
    onChange(value.map((entry, i) => (i === index ? { ...entry, ...patch } : entry)));
  }

  function removeEntry(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-medium">Work experience</h2>

      {value.map((entry, index) => (
        <div key={index} className="flex flex-col gap-2 rounded border border-zinc-300 p-3 dark:border-zinc-700">
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="Job title"
              value={entry.title}
              onChange={(e) => updateEntry(index, { title: e.target.value })}
              className="rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
            <input
              type="text"
              placeholder="Company"
              value={entry.company}
              onChange={(e) => updateEntry(index, { company: e.target.value })}
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
              disabled={entry.current}
              value={entry.endDate ?? ""}
              onChange={(e) => updateEntry(index, { endDate: e.target.value || null })}
              className="rounded border border-zinc-300 px-3 py-2 text-sm disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={entry.current}
              onChange={(e) => updateEntry(index, { current: e.target.checked, endDate: e.target.checked ? null : entry.endDate })}
            />
            I currently work here
          </label>
          <textarea
            placeholder="Description"
            value={entry.description}
            onChange={(e) => updateEntry(index, { description: e.target.value })}
            rows={2}
            className="rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
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
        + Add experience
      </button>
    </div>
  );
}
