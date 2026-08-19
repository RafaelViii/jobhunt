// Deterministic per-job banner instead of a random stock photo. Picsum's
// random image-per-seed occasionally landed on something absurd next to the
// listing (an animal close-up on a healthcare iOS posting) with no way to
// steer it — a gradient keyed off the same id is stable, always tasteful,
// and never mismatches the content.
export function bannerGradient(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const hue = Math.abs(hash) % 360;
  const hue2 = (hue + 35) % 360;
  return `linear-gradient(135deg, hsl(${hue}, 52%, 42%), hsl(${hue2}, 58%, 28%))`;
}
