"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { JobPostCard } from "@/components/matches/JobPostCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { BriefcaseIcon } from "@/components/ui/icons";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Label } from "@/components/ui/Label";
import { Card } from "@/components/ui/Card";
import { EMPLOYMENT_TYPES } from "@/lib/constants";
import type { ApplicantMatchView } from "@/lib/matching/queries";

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
      <Card>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div ref={searchBoxRef} className="relative sm:col-span-2 lg:col-span-1">
            <Label>Search</Label>
            <Input
              type="text"
              placeholder="Job title or skill"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSuggestionsOpen(true);
              }}
              onFocus={() => setSuggestionsOpen(true)}
            />
            {suggestionsOpen && suggestions.length > 0 && (
              <div className="absolute z-20 mt-1 w-full rounded-md border border-line bg-surface py-1 shadow-lg">
                {suggestions.map((title) => (
                  <button
                    key={title}
                    type="button"
                    onClick={() => {
                      setQuery(title);
                      setSuggestionsOpen(false);
                    }}
                    className="block w-full truncate px-3 py-1.5 text-left text-sm text-ink hover:bg-page"
                  >
                    {title}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <Label>Location</Label>
            <Input type="text" placeholder="City or remote" value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>

          <div>
            <Label>Employment type</Label>
            <Select value={employmentType} onChange={(e) => setEmploymentType(e.target.value)}>
              <option value="">Any</option>
              {EMPLOYMENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Min salary</Label>
              <Input type="number" placeholder="0" value={salaryMin} onChange={(e) => setSalaryMin(e.target.value)} />
            </div>
            <div>
              <Label>Max salary</Label>
              <Input type="number" placeholder="Any" value={salaryMax} onChange={(e) => setSalaryMax(e.target.value)} />
            </div>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="mt-3 flex items-center justify-between border-t border-line pt-3 text-xs text-muted">
            <span>
              {filtered.length} of {matches.length} matched jobs
            </span>
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setLocation("");
                setEmploymentType("");
                setSalaryMin("");
                setSalaryMax("");
              }}
              className="font-medium text-brand hover:underline"
            >
              Clear filters
            </button>
          </div>
        )}
      </Card>

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
