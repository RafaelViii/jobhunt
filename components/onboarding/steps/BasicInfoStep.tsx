"use client";

import { ImageUploadField } from "@/components/uploads/ImageUploadField";
import type { ApplicantBasicInfo } from "@/lib/types";

export function BasicInfoStep({
  value,
  onChange,
}: {
  value: ApplicantBasicInfo;
  onChange: (value: ApplicantBasicInfo) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-medium">Basic info</h2>

      <div>
        <label className="mb-1 block text-sm font-medium">Full name</label>
        <input
          type="text"
          required
          value={value.name}
          onChange={(e) => onChange({ ...value, name: e.target.value })}
          className="w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Location</label>
        <input
          type="text"
          required
          placeholder="City, Country"
          value={value.location}
          onChange={(e) => onChange({ ...value, location: e.target.value })}
          className="w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Phone</label>
        <input
          type="tel"
          value={value.phone}
          onChange={(e) => onChange({ ...value, phone: e.target.value })}
          className="w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>

      <ImageUploadField
        label="Photo (optional)"
        value={value.photoUrl}
        onChange={(photoUrl) => onChange({ ...value, photoUrl })}
      />
    </div>
  );
}
