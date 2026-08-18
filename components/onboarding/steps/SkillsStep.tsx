"use client";

import { TagInput } from "@/components/onboarding/TagInput";

export function SkillsStep({
  value,
  onChange,
}: {
  value: string[];
  onChange: (value: string[]) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-medium">Skills</h2>
      <TagInput
        label="Skills"
        values={value}
        onChange={onChange}
        placeholder="Type a skill and press Enter"
      />
    </div>
  );
}
