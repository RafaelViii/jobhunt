export function tierColor(score: number): string {
  if (score >= 80) return "#059669"; // strong match
  if (score >= 50) return "#0a66c2"; // good match
  if (score >= 25) return "#d97706"; // fair match
  return "#94a3b8"; // weak match
}
