import type { HTMLAttributes } from "react";

type Tone = "neutral" | "brand" | "success" | "danger";

const TONE_CLASSES: Record<Tone, string> = {
  neutral: "bg-page text-muted",
  brand: "bg-brand-soft text-brand",
  success: "bg-emerald-50 text-emerald-700",
  danger: "bg-red-50 text-danger",
};

export function Chip({
  tone = "neutral",
  className = "",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return <span {...props} className={`rounded-full px-2.5 py-1 text-xs font-medium ${TONE_CLASSES[tone]} ${className}`} />;
}
