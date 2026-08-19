"use client";

import { usePathname } from "next/navigation";
import { BackButton } from "@/components/ui/BackButton";

// Skip on pages that already manage their own "back": job detail (its own
// combined Back+Apply bar on mobile, floating Back on desktop) and the
// multi-step onboarding wizard (its own previous-step Back button — a
// second, differently-behaved "Back" here would just be confusing).
const SELF_MANAGED_PREFIXES = ["/applicant/jobs/", "/applicant/onboarding"];

export function GlobalBackButton({ dashboardHref }: { dashboardHref: string }) {
  const pathname = usePathname();

  if (pathname === dashboardHref) return null;
  if (SELF_MANAGED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return null;

  return (
    // Desktop only — mobile has a native back gesture/button already, and a
    // floating pill there just ends up overlapping page content (reported:
    // it sat on top of the "Post job" submit button).
    <div className="fixed bottom-6 right-6 z-20 hidden lg:block">
      <BackButton className="rounded-full border border-line bg-surface px-4 py-2.5 shadow-md hover:bg-page" />
    </div>
  );
}
