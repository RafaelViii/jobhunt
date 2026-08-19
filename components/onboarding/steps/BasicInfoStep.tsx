"use client";

import { ImageUploadField } from "@/components/uploads/ImageUploadField";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Label } from "@/components/ui/Label";
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
      <h2 className="text-lg font-semibold text-ink">Basic info</h2>

      <ImageUploadField
        label="Photo (optional)"
        value={value.photoUrl}
        onChange={(photoUrl) => onChange({ ...value, photoUrl })}
      />

      <div>
        <Label>Full name</Label>
        <Input type="text" required value={value.name} onChange={(e) => onChange({ ...value, name: e.target.value })} />
      </div>

      <div>
        <Label>Location</Label>
        <Input
          type="text"
          required
          placeholder="City, Country"
          value={value.location}
          onChange={(e) => onChange({ ...value, location: e.target.value })}
        />
      </div>

      <div>
        <Label>Address (optional)</Label>
        <Input
          type="text"
          placeholder="Street, Barangay, City"
          value={value.address}
          onChange={(e) => onChange({ ...value, address: e.target.value })}
        />
      </div>

      <div>
        <Label>Phone</Label>
        <Input type="tel" value={value.phone} onChange={(e) => onChange({ ...value, phone: e.target.value })} />
      </div>

      <div>
        <Label>About me (optional)</Label>
        <Textarea
          rows={4}
          placeholder="A couple sentences about your background and what you're looking for — shown on your resume."
          value={value.about}
          onChange={(e) => onChange({ ...value, about: e.target.value })}
        />
      </div>
    </div>
  );
}
