import categories from "@/lib/matching/experience-titles.json";

export const EXPERIENCE_TITLE_CATEGORIES: Record<string, string[]> = categories;

// Flattened + deduped for a plain type-ahead list — titles overlap across
// categories on purpose (e.g. "CRM Assistant" is both sales and CRM work),
// but a suggestion dropdown only needs one entry per unique string.
export const ALL_EXPERIENCE_TITLES: string[] = Array.from(
  new Set(Object.values(EXPERIENCE_TITLE_CATEGORIES).flat()),
).sort((a, b) => a.localeCompare(b));
