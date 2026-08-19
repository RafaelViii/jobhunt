import type { MatchBreakdown as MatchBreakdownData } from "@/lib/types";
import { tierColor } from "@/components/matches/tierColor";

const LABELS: Record<keyof MatchBreakdownData, string> = {
  title: "Title",
  skills: "Skills",
  location: "Location",
  salary: "Salary",
  type: "Type",
  seniority: "Seniority",
};

const FACTORS = Object.keys(LABELS) as (keyof MatchBreakdownData)[];

// Bars, not chips — a wall of "Title 100% Skills 0%..." pills makes people
// parse six separate numbers to understand one score. Bar length carries the
// magnitude at a glance; the number is there for precision, not as the only signal.
// The track needs its own border: bg-page (#f4f2ee) sits on a white card at
// almost no contrast, so an unfilled/low bar used to read as blank whitespace
// rather than "0% match" — the border makes the empty track a visible, legible shape.
export function MatchBreakdown({ breakdown }: { breakdown: MatchBreakdownData }) {
  return (
    <div className="flex flex-col gap-2">
      {FACTORS.map((factor) => {
        const pct = Math.round(breakdown[factor] * 100);
        const color = tierColor(pct);
        return (
          <div key={factor} className="flex items-center gap-2">
            <span className="w-20 shrink-0 text-xs text-muted">{LABELS[factor]}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full border border-line bg-page">
              <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
            </div>
            <span className="w-9 shrink-0 text-right text-xs font-semibold" style={{ color }}>
              {pct}%
            </span>
          </div>
        );
      })}
    </div>
  );
}
