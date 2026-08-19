"use client";

import { useEffect, useRef, useState, type ComponentType, type SVGProps } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Avatar } from "@/components/nav/Avatar";
import { clearSession } from "@/lib/firebase/client-session";

export type NavLink = { href: string; label: string; icon: ComponentType<SVGProps<SVGSVGElement>> };

export function AppNav({
  homeHref,
  navLinks,
  name,
  photoUrl,
  profileHref,
}: {
  homeHref: string;
  navLinks: NavLink[];
  name: string;
  photoUrl?: string | null;
  profileHref?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleSignOut() {
    setOpen(false);
    await clearSession();
    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-10 border-b border-line bg-surface">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <div className="flex items-center gap-3 sm:gap-6">
          <Link href={homeHref} className="shrink-0 text-lg font-bold tracking-tight text-brand">
            JobHunt
          </Link>
          {/* Icon-only on mobile (fits next to the logo + avatar without a
              dropdown detour), full label alongside on md+ — either way
              Dashboard/Applications are always one tap away, never buried
              behind the account menu. */}
          <nav className="flex items-center gap-1">
            {navLinks.map((link) => {
              const active = pathname === link.href;
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-label={link.label}
                  className={`flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-sm font-medium transition-colors sm:rounded-md ${
                    active ? "bg-brand-soft text-brand" : "text-muted hover:bg-page hover:text-ink"
                  }`}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span className="hidden sm:inline">{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="flex items-center gap-1 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
            aria-label="Account menu"
            aria-expanded={open}
          >
            <Avatar name={name} photoUrl={photoUrl} size={36} />
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`h-4 w-4 text-muted transition-transform ${open ? "rotate-180" : ""}`}
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>

          {open && (
            <div className="absolute right-0 z-20 mt-2 w-52 rounded-lg border border-line bg-surface py-1 shadow-lg">
              <div className="truncate border-b border-line px-3 py-2 text-sm font-medium text-ink">{name}</div>
              {profileHref && (
                <Link
                  href={profileHref}
                  onClick={() => setOpen(false)}
                  className="block px-3 py-2 text-sm text-ink hover:bg-page"
                >
                  Edit profile
                </Link>
              )}
              <button
                type="button"
                onClick={handleSignOut}
                className="block w-full px-3 py-2 text-left text-sm text-danger hover:bg-page"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
