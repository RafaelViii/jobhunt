import type { SVGProps } from "react";

export function BriefcaseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="6" y="16" width="36" height="24" rx="3" />
      <path d="M17 16v-4a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v4" />
      <path d="M6 26h36" />
      <path d="M20 26v4h8v-4" />
    </svg>
  );
}

export function VerifiedBadgeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 1.5 14.7 4l3.6-.6 1 3.5 3.2 1.8-1.3 3.4 1.3 3.4-3.2 1.8-1 3.5-3.6-.6L12 22.5 9.3 20l-3.6.6-1-3.5-3.2-1.8 1.3-3.4-1.3-3.4 3.2-1.8 1-3.5L9.3 4Z" />
      <path
        d="m8.5 12.3 2.4 2.4 4.6-4.9"
        fill="none"
        stroke="var(--color-surface, #fff)"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SearchIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="21" cy="21" r="13" />
      <path d="M30.5 30.5 42 42" />
    </svg>
  );
}

export function PinIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M24 44s14-12.5 14-24a14 14 0 0 0-28 0c0 11.5 14 24 14 24Z" />
      <circle cx="24" cy="20" r="5" />
    </svg>
  );
}

export function ChevronDownIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 18l12 12 12-12" />
    </svg>
  );
}

export function InboxIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M8 24 14 10h20l6 14" />
      <path d="M8 24v10a4 4 0 0 0 4 4h24a4 4 0 0 0 4-4V24" />
      <path d="M8 24h10a1 1 0 0 1 1 1 5 5 0 0 0 10 0 1 1 0 0 1 1-1h10" />
    </svg>
  );
}

export function PeopleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="18" cy="16" r="6" />
      <path d="M6 40v-4a10 10 0 0 1 10-10h4a10 10 0 0 1 10 10v4" />
      <circle cx="35" cy="14" r="5" />
      <path d="M31 22.5A8 8 0 0 1 43 29v3" />
    </svg>
  );
}

export function CodeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M18 14 6 24l12 10" />
      <path d="M30 14l12 10-12 10" />
    </svg>
  );
}

export function ServerIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="8" y="8" width="32" height="12" rx="2" />
      <rect x="8" y="28" width="32" height="12" rx="2" />
      <path d="M15 14h.01M15 34h.01" />
    </svg>
  );
}

export function DeviceIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="14" y="6" width="20" height="36" rx="4" />
      <path d="M22 36h4" />
    </svg>
  );
}

export function ChartIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M8 40V22M20 40V8M32 40v14M40 40V16" />
      <path d="M4 40h40" />
    </svg>
  );
}

export function PaletteIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M24 6a18 16 0 1 0 0 32c3 0 4-2 4-4s-1-3-1-5 2-3 4-3h4a8 8 0 0 0 8-8C43 11 35 6 24 6Z" />
      <circle cx="16" cy="20" r="2" fill="currentColor" stroke="none" />
      <circle cx="24" cy="15" r="2" fill="currentColor" stroke="none" />
      <circle cx="32" cy="20" r="2" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function GearIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="24" cy="24" r="7" />
      <path d="M24 4v6M24 38v6M4 24h6M38 24h6M9 9l4.2 4.2M34.8 34.8 39 39M39 9l-4.2 4.2M13.2 34.8 9 39" />
    </svg>
  );
}

export function MegaphoneIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M6 20v8a3 3 0 0 0 3 3h3l20 9V8L12 17H9a3 3 0 0 0-3 3Z" />
      <path d="M20 32v6a4 4 0 0 1-8 0v-7" />
    </svg>
  );
}

export function HeadsetIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M8 26v-4a16 16 0 0 1 32 0v4" />
      <rect x="4" y="24" width="8" height="12" rx="3" />
      <rect x="36" y="24" width="8" height="12" rx="3" />
      <path d="M40 36v2a6 6 0 0 1-6 6h-6" />
    </svg>
  );
}

export function CompassIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="24" cy="24" r="18" />
      <path d="M29 19l-3 10-8 3 3-10 8-3Z" />
    </svg>
  );
}
