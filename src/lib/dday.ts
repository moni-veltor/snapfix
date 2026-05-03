// Helpers for the D-Day clock used during exercise runs.

export type DDayClock = {
  // Minutes since the run's D-Day anchor (00:00 = anchor moment).
  totalMinutes: number;
  // Formatted "HH:MM" — 24h, padded.
  hhmm: string;
};

/** Parse "HH:MM" into total minutes since 00:00. */
export function parseHHMM(value: string): number {
  const [h, m] = value.split(":").map((n) => parseInt(n, 10));
  if (Number.isNaN(h) || Number.isNaN(m)) return 0;
  return h * 60 + m;
}

/** Format total minutes as "HH:MM". */
export function toHHMM(totalMinutes: number): string {
  const wrapped = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const h = Math.floor(wrapped / 60);
  const m = wrapped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Compute the current D-Day clock given an anchor and speed multiplier. */
export function currentDDay(
  anchor: Date | null | undefined,
  speedMultiplier: number = 1,
  now: Date = new Date(),
): DDayClock {
  if (!anchor) return { totalMinutes: 0, hhmm: "00:00" };
  const elapsedMs = (now.getTime() - anchor.getTime()) * speedMultiplier;
  const totalMinutes = Math.max(0, Math.floor(elapsedMs / 60000));
  return { totalMinutes, hhmm: toHHMM(totalMinutes) };
}

/** Has the scheduled D-Day time been reached? */
export function isDue(scheduledHHMM: string, clock: DDayClock): boolean {
  return clock.totalMinutes >= parseHHMM(scheduledHHMM);
}
