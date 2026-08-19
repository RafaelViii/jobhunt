"use client";

import { useRef, useState } from "react";
import { Label } from "@/components/ui/Label";
import { BriefcaseIcon, CameraIcon, UserPlaceholderIcon } from "@/components/ui/icons";

export function ImageUploadField({
  label,
  value,
  onChange,
  previewShape = "circle",
}: {
  label: string;
  value: string | null;
  onChange: (url: string | null) => void;
  previewShape?: "circle" | "square";
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const PlaceholderIcon = previewShape === "circle" ? UserPlaceholderIcon : BriefcaseIcon;

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/uploads/public-asset", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const { url } = (await res.json()) as { url: string };
      onChange(url);
    } catch {
      setError("Couldn't upload image. You can skip this and add it later.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <Label>{label}</Label>
      <div className="flex items-center gap-4">
        <div className="relative h-20 w-20 shrink-0">
          <div
            className={`flex h-20 w-20 items-center justify-center overflow-hidden border border-line bg-page ${
              previewShape === "circle" ? "rounded-full" : "rounded-md"
            }`}
          >
            {value ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={value} alt="" className="h-full w-full object-cover" />
            ) : (
              <PlaceholderIcon className="h-9 w-9 text-muted" />
            )}
          </div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            aria-label={value ? "Change photo" : "Upload photo"}
            className="absolute -bottom-0.5 -right-0.5 flex h-7 w-7 items-center justify-center rounded-full border-2 border-surface bg-brand text-white shadow-sm hover:bg-brand-dark"
          >
            <CameraIcon className="h-3.5 w-3.5" />
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
        <div className="text-sm">
          {uploading ? (
            <p className="text-muted">Uploading…</p>
          ) : (
            <>
              <button type="button" onClick={() => inputRef.current?.click()} className="font-medium text-brand hover:underline">
                {value ? "Change photo" : "Upload photo"}
              </button>
              <p className="mt-0.5 text-xs text-muted">PNG, JPG, or WEBP</p>
            </>
          )}
          {error && <p className="mt-1 text-xs text-danger">{error}</p>}
        </div>
      </div>
    </div>
  );
}
