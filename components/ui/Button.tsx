import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-brand text-white hover:bg-brand-dark disabled:opacity-50",
  secondary: "border border-line bg-surface text-ink hover:bg-page disabled:opacity-40",
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      {...props}
      className={`rounded-md px-4 py-2 text-sm font-semibold transition-colors ${VARIANT_CLASSES[variant]} ${className}`}
    />
  );
}
