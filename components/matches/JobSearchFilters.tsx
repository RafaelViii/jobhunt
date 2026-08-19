"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { JobPostCard } from "@/components/matches/JobPostCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { BriefcaseIcon, ChevronDownIcon, PinIcon, SearchIcon } from "@/components/ui/icons";
import { EMPLOYMENT_TYPES } from "@/lib/constants";
import type { ApplicantMatchView } from "@/lib/matching/queries";

const FIELD_CLASSES =
  "w-full rounded-full border border-line bg-page/70 text-sm text-ink placeholder:text-muted transition-colors focus:border-brand focus:bg-surface focus:outline-none focus:ring-1 focus:ring-brand";

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="flex items-center gap-1 rounded-full bg-brand-soft py-1 pl-3 pr-1.5 text-xs font-medium text-brand">
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${label} filter`}
        className="flex h-4 w-4 items-center justify-center rounded-full text-brand/70 hover:bg-brand/10 hover:text-brand"
      >
        ×
      </button>
    </span>
  );
}

export function JobSearchFilters({
  matches,
  appliedJobIds,
}: {
  matches: ApplicantMatchView[];
  appliedJobIds: Set<string>;
}) {
  const [query, setQuery] = useState("");
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [location, setLocation] = useState("");
  const [employmentType, setEmploymentType] = useState("");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");

  const searchBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) setSuggestionsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Suggestions come straight from the already-loaded matches — at demo
  // scale (a few dozen jobs) there's no reason to round-trip to the server
  // just to autocomplete a title.
  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const titles = new Set<string>();
    for (const { job } of matches) {
      if (job.title.toLowerCase().includes(q)) titles.add(job.title);
      if (titles.size >= 6) break;
    }
    return Array.from(titles);
  }, [query, matches]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const loc = location.trim().toLowerCase();
    const min = salaryMin ? Number(salaryMin) : null;
    const max = salaryMax ? Number(salaryMax) : null;

    return matches.filter(({ job }) => {
      if (q && !job.title.toLowerCase().includes(q) && !job.skills.some((skill) => skill.toLowerCase().includes(q))) {
        return false;
      }
      if (loc && !job.location.toLowerCase().includes(loc) && !(job.remote && loc.includes("remote"))) {
        return false;
      }
      if (employmentType && job.employmentType !== employmentType) return false;
      if (min !== null && (job.salaryMax === null || job.salaryMax < min)) return false;
      if (max !== null && (job.salaryMin === null || job.salaryMin > max)) return false;
      return true;
    });
  }, [matches, query, location, employmentType, salaryMin, salaryMax]);

  const hasActiveFilters = query || location || employmentType || salaryMin || salaryMax;

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm sm:p-5">
        <div ref={searchBoxRef} className="relative">
          <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="text"
            aria-label="Search by job title or skill"
            placeholder="Search by job title or skill"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSuggestionsOpen(true);
            }}
            onFocus={() => setSuggestionsOpen(true)}
            className={`${FIELD_CLASSES} py-3 pl-11 pr-4`}
          />
          {suggestionsOpen && suggestions.length > 0 && (
            <div className="absolute z-20 mt-1.5 w-full rounded-xl border border-line bg-surface py-1 shadow-lg">
              {suggestions.map((title) => (
                <button
                  key={title}
                  type="button"
                  onClick={() => {
                    setQuery(title);
                    setSuggestionsOpen(false);
                  }}
                  className="flex w-full items-center gap-2 truncate px-3.5 py-2 text-left text-sm text-ink hover:bg-page"
                >
                  <SearchIcon className="h-3.5 w-3.5 shrink-0 text-muted" />
                  {title}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mt-2.5 flex flex-wrap gap-2">
          <div className="relative min-w-[9rem] flex-1">
            <PinIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              type="text"
              aria-label="Location"
              placeholder="City or remote"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className={`${FIELD_CLASSES} py-2 pl-9 pr-3`}
            />
          </div>

          <div className="relative min-w-[8.5rem]">
            <select
              aria-label="Employment type"
              value={employmentType}
              onChange={(e) => setEmploymentType(e.target.value)}
              className={`${FIELD_CLASSES} appearance-none py-2 pl-3.5 pr-9`}
            >
              <option value="">Any type</option>
              {EMPLOYMENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
          </div>

          <div className="flex items-center gap-1.5 rounded-full border border-line bg-page/70 py-2 pl-3.5 pr-3 focus-within:border-brand focus-within:bg-surface focus-within:ring-1 focus-within:ring-brand">
            <span className="text-sm text-muted">$</span>
            <input
              type="number"
              aria-label="Minimum salary"
              placeholder="Min"
              value={salaryMin}
              onChange={(e) => setSalaryMin(e.target.value)}
              className="w-16 bg-transparent text-sm text-ink outline-none placeholder:text-muted"
            />
            <span className="text-muted">–</span>
            <input
              type="number"
              aria-label="Maximum salary"
              placeholder="Max"
              value={salaryMax}
              onChange={(e) => setSalaryMax(e.target.value)}
              className="w-16 bg-transparent text-sm text-ink outline-none placeholder:text-muted"
            />
          </div>
        </div>

        {hasActiveFilters && (
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3">
            <span className="text-xs text-muted">
              {filtered.length} of {matches.length} matched jobs
            </span>
            {query && <FilterChip label={`"${query}"`} onRemove={() => setQuery("")} />}
            {location && <FilterChip label={location} onRemove={() => setLocation("")} />}
            {employmentType && <FilterChip label={employmentType} onRemove={() => setEmploymentType("")} />}
            {(salaryMin || salaryMax) && (
              <FilterChip
                label={`$${salaryMin || "0"} – ${salaryMax || "any"}`}
                onRemove={() => {
                  setSalaryMin("");
                  setSalaryMax("");
                }}
              />
            )}
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setLocation("");
                setEmploymentType("");
                setSalaryMin("");
                setSalaryMax("");
              }}
              className="ml-auto text-xs font-medium text-brand hover:underline"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<BriefcaseIcon className="h-12 w-12" />}
          title="No jobs match your filters"
          description="Try widening your search — clear a filter or two and matched jobs will reappear."
        />
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map((match) => (
            <JobPostCard
              key={match.matchId}
              jobId={match.jobId}
              title={match.job.title}
              companyName={match.companyName}
              companyLogoUrl={match.companyLogoUrl}
              location={match.job.location}
              remote={match.job.remote}
              score={match.score}
              skills={match.job.skills}
              description={match.job.description}
              alreadyApplied={appliedJobIds.has(match.jobId)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
