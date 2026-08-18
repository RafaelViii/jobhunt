import type { MatchBreakdown } from "@/lib/types";

const LABELS: Record<keyof MatchBreakdown, string> = {
  title: "Title",
  skills: "Skills",
  location: "Location",
  salary: "Salary",
  type: "Type",
  seniority: "Seniority",
};

const FACTORS = Object.keys(LABELS) as (keyof MatchBreakdown)[];

export function MatchBreakdownChips({ breakdown }: { breakdown: MatchBreakdown }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {FACTORS.map((factor) => (
        <span
          key={factor}
          className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
        >
          {LABELS[factor]} {Math.round(breakdown[factor] * 100)}%
        </span>
      ))}
    </div>
  );
}
