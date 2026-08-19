import type { ExperienceEntry } from "@/lib/types";

export function mostRecentExperience(experience: ExperienceEntry[]): ExperienceEntry | null {
  if (experience.length === 0) return null;
  return [...experience].sort((a, b) => {
    if (a.current !== b.current) return a.current ? -1 : 1;
    return b.startDate.localeCompare(a.startDate);
  })[0];
}

function formatMonthYear(value: string): string {
  const date = new Date(`${value}-01`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export function formatExperiencePeriod(entry: ExperienceEntry): string {
  const start = formatMonthYear(entry.startDate);
  const end = entry.current ? "Present" : entry.endDate ? formatMonthYear(entry.endDate) : "";
  return end ? `${start} – ${end}` : start;
}
