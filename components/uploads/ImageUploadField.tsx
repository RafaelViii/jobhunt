"use client";

import { useState } from "react";
import { Label } from "@/components/ui/Label";

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
      <input
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={handleFileChange}
        className="block text-sm text-ink file:mr-3 file:rounded-md file:border-0 file:bg-brand-soft file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-brand hover:file:bg-brand/20"
      />
      {uploading && <p className="mt-1 text-xs text-muted">Uploading…</p>}
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
      {value && !uploading && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={value}
          alt=""
          className={`mt-2 h-16 w-16 border border-line object-cover ${previewShape === "circle" ? "rounded-full" : "rounded-md"}`}
        />
      )}
    </div>
  );
}
