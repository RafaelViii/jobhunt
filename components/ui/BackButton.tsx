"use client";

import { useRouter } from "next/navigation";

export function BackButton({
  className = "",
  showLabel = true,
}: {
  className?: string;
  showLabel?: boolean;
}) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.back()}
      aria-label="Go back"
      className={`inline-flex items-center justify-center gap-1.5 text-sm font-medium text-ink transition-colors hover:text-brand ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4 shrink-0"
      >
        <path d="m15 18-6-6 6-6" />
      </svg>
      {showLabel && "Back"}
    </button>
  );
}
