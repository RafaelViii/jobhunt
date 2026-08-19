import { tierColor } from "@/components/matches/tierColor";

export function ScoreRing({
  score,
  size = 56,
  showLabel = true,
}: {
  score: number;
  size?: number;
  // Off by default only where an adjacent heading (e.g. "Your match")
  // already says what the number means.
  showLabel?: boolean;
}) {
  const strokeWidth = size < 48 ? 3 : 4;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, score));
  const offset = circumference * (1 - clamped / 100);
  const color = tierColor(clamped);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e2e0db" strokeWidth={strokeWidth} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-bold" style={{ color, fontSize: size * 0.24 }}>
            {Math.round(clamped)}%
          </span>
        </div>
      </div>
      {showLabel && <span className="text-[10px] font-medium uppercase tracking-wide text-muted">Match</span>}
    </div>
  );
}
