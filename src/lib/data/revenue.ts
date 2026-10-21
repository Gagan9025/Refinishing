import 'server-only';
import {
  DAILY_OUTPUT_TARGET,
  MONTHLY_OUTPUT_TARGET,
  UNIT_PRICE,
  WEEKLY_OUTPUT_TARGET,
} from '@/lib/constants';
import { getDailyTotals } from './production';

export const TIMEFRAMES = ['monthly', 'weekly', 'daily'] as const;
export type Timeframe = (typeof TIMEFRAMES)[number];

export type RevenueRow = {
  label: string;
  workingDays: number;
  target: number;
  scanTotal: number;
  batchTotal: number;
  actualProduction: number;
  revenue: number;
  completionRate: number;
  achieved: boolean;
};

/** ISO-8601 week label, e.g. 2026-W07. */
function isoWeek(date: string) {
  const d = new Date(`${date}T00:00:00Z`);
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const year = d.getUTCFullYear();
  const week = Math.ceil(((d.getTime() - Date.UTC(year, 0, 1)) / 86400000 + 1) / 7);
  return `${year}-W${String(week).padStart(2, '0')}`;
}

export async function getRevenue(timeframe: Timeframe) {
  const rows = await getDailyTotals();

  const byDate = new Map<string, { scan: number; batch: number }>();
  for (const r of rows) {
    const d = byDate.get(r.date) ?? { scan: 0, batch: 0 };
    if (r.module === 'scanning') d.scan += r.achieved;
    else d.batch += r.achieved;
    byDate.set(r.date, d);
  }
  const dates = [...byDate.keys()].sort();

  const keyOf = (date: string) => (timeframe === 'daily' ? date : timeframe === 'weekly' ? isoWeek(date) : date.slice(0, 7));
  const groups = new Map<string, { days: number; scan: number; batch: number }>();
  for (const date of dates) {
    const k = keyOf(date);
    const g = groups.get(k) ?? { days: 0, scan: 0, batch: 0 };
    g.days += 1;
    g.scan += byDate.get(date)!.scan;
    g.batch += byDate.get(date)!.batch;
    groups.set(k, g);
  }

  const keep = timeframe === 'daily' ? 30 : timeframe === 'weekly' ? 16 : 12;
  const fixedTarget = timeframe === 'weekly' ? WEEKLY_OUTPUT_TARGET : MONTHLY_OUTPUT_TARGET;
  const data: RevenueRow[] = [...groups.keys()]
    .sort()
    .slice(-keep)
    .map((label) => {
      const g = groups.get(label)!;
      const actual = g.scan + g.batch;
      const target = timeframe === 'daily' ? DAILY_OUTPUT_TARGET : fixedTarget;
      return {
        label,
        workingDays: g.days,
        target,
        scanTotal: g.scan,
        batchTotal: g.batch,
        actualProduction: actual,
        revenue: actual * UNIT_PRICE,
        completionRate: Math.round((actual / target) * 1000) / 10,
        achieved: actual >= target,
      };
    });

  return { data };
}
