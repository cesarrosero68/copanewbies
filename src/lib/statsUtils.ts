export function mmssFromSeconds(total: number) {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function secondsFromMmss(mmss: string | null | undefined) {
  if (!mmss) return 0;
  const [m, s] = mmss.split(":").map((n) => parseInt(n) || 0);
  return (m || 0) * 60 + (s || 0);
}
