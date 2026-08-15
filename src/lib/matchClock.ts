import { useEffect, useState } from "react";

export const DEFAULT_PERIOD_MINUTES = 15;
export const PERIOD_PRESETS = [10, 12, 15, 18, 20];

export type ClockMatch = {
  clock_enabled?: boolean | null;
  clock_started_at?: string | null;
  clock_offset_ms?: number | null;
  current_period?: number | null;
  period_minutes?: number | null;
} | null | undefined;

export function periodLabel(period?: number | null): string {
  switch (period ?? 1) {
    case 1:
      return "1er Período";
    case 2:
      return "2do Período";
    default:
      return "Tiempo Extra";
  }
}

export function periodShort(period?: number | null): string {
  switch (period ?? 1) {
    case 1:
      return "P1";
    case 2:
      return "P2";
    default:
      return "OT";
  }
}

export function periodMs(match: ClockMatch): number {
  return (match?.period_minutes ?? DEFAULT_PERIOD_MINUTES) * 60000;
}

export function elapsedMs(match: ClockMatch, now: number = Date.now()): number {
  const offset = Number(match?.clock_offset_ms ?? 0);
  const started = match?.clock_started_at ? new Date(match.clock_started_at).getTime() : null;
  return offset + (started ? Math.max(0, now - started) : 0);
}

export function remainingMs(match: ClockMatch, now: number = Date.now()): number {
  return Math.max(0, periodMs(match) - elapsedMs(match, now));
}

export function isPeriodOver(match: ClockMatch, now: number = Date.now()): boolean {
  return elapsedMs(match, now) >= periodMs(match);
}

export function formatClock(ms: number): string {
  const total = Math.ceil(Math.max(0, ms) / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function isClockRunning(match: ClockMatch): boolean {
  return match?.clock_enabled !== false && !!match?.clock_started_at;
}

export function hasClockData(match: ClockMatch): boolean {
  return (
    match?.clock_enabled !== false &&
    (!!match?.clock_started_at || Number(match?.clock_offset_ms ?? 0) > 0)
  );
}

export function isValidMmSs(value: string): boolean {
  return /^\d{1,2}:[0-5]\d$/.test(value.trim());
}

export function parseMmSsToMs(value: string | null | undefined): number {
  if (!value) return 0;
  const parts = value.trim().split(":");
  if (parts.length !== 2) return 0;
  const m = parseInt(parts[0], 10);
  const s = parseInt(parts[1], 10);
  if (!Number.isFinite(m) || !Number.isFinite(s)) return 0;
  return m * 60000 + s * 1000;
}

export interface PenaltyClockFields {
  time_mmss: string | null;
  duration_mmss: string;
  period: string;
  ended_early?: boolean | null;
}

/**
 * Remaining penalty time in ms, or null when the penalty is over / ended early.
 * `time_mmss` is the remaining period time when the penalty was registered.
 */
export function penaltyRemainingMs(
  match: ClockMatch,
  penalty: PenaltyClockFields | null | undefined,
  now: number = Date.now()
): number | null {
  if (!penalty || penalty.ended_early) return null;
  const durationMs = parseMmSsToMs(penalty.duration_mmss);
  if (durationMs <= 0) return null;
  const registeredRemaining = parseMmSsToMs(penalty.time_mmss);
  const currentPeriod = String(match?.current_period ?? 1);
  const elapsed = elapsedMs(match, now);

  let remaining: number;
  if (String(penalty.period) === currentPeriod) {
    const elapsedAtRegistration = Math.max(0, periodMs(match) - registeredRemaining);
    remaining = durationMs - Math.max(0, elapsed - elapsedAtRegistration);
  } else {
    // Penalty came from an earlier period: it burned `registeredRemaining` there,
    // then keeps counting down against the new period's elapsed time.
    remaining = durationMs - registeredRemaining - elapsed;
  }

  if (remaining <= 0) return null;
  return remaining;
}

/** Countdown "mm:ss" for a penalty, ticking every second; null when over or ended early. */
export function usePenaltyClock(
  match: ClockMatch,
  penalty: PenaltyClockFields | null | undefined
): string | null {
  const running = isClockRunning(match);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [running, match?.clock_started_at]);

  const remaining = penaltyRemainingMs(match, penalty, running ? now : Date.now());
  if (remaining === null) return null;
  return formatClock(remaining);
}

/** Countdown "mm:ss" ticking every second, or null when there is nothing live to show. */
export function useMatchClock(match: ClockMatch): string | null {
  const running = isClockRunning(match);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [running, match?.clock_started_at]);

  if (!hasClockData(match)) return null;
  return formatClock(remainingMs(match, running ? now : Date.now()));
}
