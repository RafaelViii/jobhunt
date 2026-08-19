// Every avatar without a real photo used the exact same flat brand-soft
// circle, so a list of seeded people/companies read as one template repeated
// over and over — the "feels like bots" impression. Deriving a distinct hue
// per name gives each entity a stable, individual color with zero external
// dependency (still just initials, just not all the same color).
export function entityColor(seed: string): { background: string; foreground: string } {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const hue = Math.abs(hash) % 360;
  return {
    background: `hsl(${hue}, 65%, 92%)`,
    foreground: `hsl(${hue}, 55%, 32%)`,
  };
}
