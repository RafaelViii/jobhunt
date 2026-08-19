"use client";

import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { TitleCombobox } from "@/components/ui/TitleCombobox";
import { ALL_EXPERIENCE_TITLES } from "@/lib/matching/experienceTitles";
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
      <h2 className="text-lg font-semibold text-ink">Work experience</h2>

      {value.map((entry, index) => (
        <div key={index} className="flex flex-col gap-2 rounded-md border border-line bg-page p-3">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <TitleCombobox
              placeholder="Job title"
              value={entry.title}
              onChange={(title) => updateEntry(index, { title })}
              suggestions={ALL_EXPERIENCE_TITLES}
            />
            <Input
              type="text"
              placeholder="Company"
              value={entry.company}
              onChange={(e) => updateEntry(index, { company: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="month"
              value={entry.startDate}
              onChange={(e) => updateEntry(index, { startDate: e.target.value })}
            />
            <Input
              type="month"
              disabled={entry.current}
              value={entry.endDate ?? ""}
              onChange={(e) => updateEntry(index, { endDate: e.target.value || null })}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={entry.current}
              onChange={(e) => updateEntry(index, { current: e.target.checked, endDate: e.target.checked ? null : entry.endDate })}
            />
            I currently work here
          </label>
          <Textarea
            placeholder="Description"
            value={entry.description}
            onChange={(e) => updateEntry(index, { description: e.target.value })}
            rows={2}
          />
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
        + Add experience
      </button>
    </div>
  );
}
