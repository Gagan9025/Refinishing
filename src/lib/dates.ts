import { TIME_ZONE } from './constants';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isDateStr(s: unknown): s is string {
  return typeof s === 'string' && DATE_RE.test(s) && !Number.isNaN(Date.parse(`${s}T00:00:00Z`));
}

/** Current calendar date (YYYY-MM-DD) in the plant time zone. */
export function todayStr(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE }).format(new Date());
}

export function shiftDate(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Valid date from user input, else today. */
export function dateOrToday(s: unknown): string {
  return isDateStr(s) ? s : todayStr();
}

export function formatTime(d: Date | null): string {
  if (!d) return '—';
  return new Intl.DateTimeFormat('en-IN', { timeZone: TIME_ZONE, hour: '2-digit', minute: '2-digit', hour12: true }).format(d);
}

/** Minutes since midnight in the plant time zone. */
export function nowMinutes(now = new Date()): number {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: TIME_ZONE, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(now);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  return get('hour') * 60 + get('minute');
}
