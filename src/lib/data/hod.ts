import 'server-only';
import { shiftDate, todayStr } from '@/lib/dates';
import { getAttendanceSummary } from './attendance';
import { getDailyTotals, getDay, summarize } from './production';

export const RANGE_TYPES = ['today', 'yesterday', 'weekly', 'monthly', 'custom'] as const;
export type RangeType = (typeof RANGE_TYPES)[number];

export type Bounds = { start: string; end: string };

/** "today" means the single selected date; the others are relative to the real current date. */
export function getBounds(range: RangeType, date: string, customStart?: string, customEnd?: string): Bounds {
  const today = todayStr();
  switch (range) {
    case 'yesterday':
      return { start: shiftDate(today, -1), end: shiftDate(today, -1) };
    case 'weekly':
      return { start: shiftDate(today, -7), end: today };
    case 'monthly':
      return { start: shiftDate(today, -30), end: today };
    case 'custom':
      if (customStart && customEnd) return customStart <= customEnd ? { start: customStart, end: customEnd } : { start: customEnd, end: customStart };
      return { start: date, end: date };
    default:
      return { start: date, end: date };
  }
}

export async function getOverview({ start, end }: Bounds) {
  const [totals, att] = await Promise.all([getDailyTotals(start, end), getAttendanceSummary(start, end)]);
  const sum = (module: 'scanning' | 'batch') => {
    const rows = totals.filter((t) => t.module === module);
    const target = rows.reduce((a, r) => a + r.target, 0);
    const achieved = rows.reduce((a, r) => a + r.achieved, 0);
    return { target, achieved, pct: summarize(target, achieved).achievementPct };
  };
  return { scanning: sum('scanning'), batch: sum('batch'), attendance: att };
}

export async function getComparison(date: string) {
  const [scan, batch] = await Promise.all([getDay('scanning', date), getDay('batch', date)]);
  return [
    { module: 'Scanning Production', supervisor: scan.supervisorName ?? 'Scanning Supervisor', day: scan },
    { module: 'Batch Production', supervisor: batch.supervisorName ?? 'Batch Supervisor', day: batch },
  ];
}
