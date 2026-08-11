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
