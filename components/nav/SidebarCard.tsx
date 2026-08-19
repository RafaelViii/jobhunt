import Link from "next/link";
import { Avatar } from "@/components/nav/Avatar";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { VerifiedBadgeIcon } from "@/components/ui/icons";

export type SidebarLink = { href: string; label: string; external?: boolean };

const EXPERIENCE_DISPLAY_LIMIT = 3;

export function SidebarCard({
  name,
  subtitle,
  photoUrl,
  verified,
  meta,
  experience,
  links = [],
}: {
  name: string;
  subtitle?: string | null;
  photoUrl?: string | null;
  verified?: boolean;
  meta?: { label: string; value: string }[];
  experience?: { title: string; company: string; period?: string; current?: boolean }[];
  links?: SidebarLink[];
}) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="h-14 bg-gradient-to-r from-brand to-brand-dark" />
      <div className="flex flex-col items-center px-4 pb-4 text-center">
        <div className="-mt-8 mb-2 rounded-full ring-4 ring-surface">
          <Avatar name={name} photoUrl={photoUrl} size={64} />
        </div>
        <p className="flex items-center gap-1.5 font-semibold text-ink">
          {name}
          {verified && (
            <span title="Email verified">
              <VerifiedBadgeIcon className="h-4 w-4 shrink-0 text-brand" />
            </span>
          )}
        </p>
        {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
      </div>

      {meta && meta.length > 0 && (
        <div className="flex flex-col gap-1.5 border-t border-line px-4 py-3">
          {meta.map((row) => (
            <div key={row.label} className="flex justify-between gap-2 text-xs">
              <span className="text-muted">{row.label}</span>
              <span className="truncate text-right font-medium text-ink">{row.value}</span>
            </div>
          ))}
        </div>
      )}

      {experience && experience.length > 0 && (
        <div className="border-t border-line px-4 py-3">
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted">Experience</p>
          <div className="flex flex-col gap-2">
            {experience.slice(0, EXPERIENCE_DISPLAY_LIMIT).map((entry, index) => (
              <div key={`${entry.title}-${index}`} className="rounded-md border border-line p-2.5">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-ink">{entry.title}</p>
                  {entry.current && (
                    <Chip tone="brand" className="shrink-0">
                      Current
                    </Chip>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-muted">
                  {entry.company}
                  {entry.period ? ` · ${entry.period}` : ""}
                </p>
              </div>
            ))}
            {experience.length > EXPERIENCE_DISPLAY_LIMIT && (
              <p className="text-xs text-muted">+{experience.length - EXPERIENCE_DISPLAY_LIMIT} more in profile</p>
            )}
          </div>
        </div>
      )}

      {links.length > 0 && (
        <div className="border-t border-line">
          {links.map((link) =>
            link.external ? (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="block px-4 py-2.5 text-sm font-medium text-ink hover:bg-page"
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                className="block px-4 py-2.5 text-sm font-medium text-ink hover:bg-page"
              >
                {link.label}
              </Link>
            ),
          )}
        </div>
      )}
    </Card>
  );
}
