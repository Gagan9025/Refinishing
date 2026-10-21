import 'server-only';
import { and, desc, eq, gte, inArray, lte, sql } from 'drizzle-orm';
import { getDb } from '@/db';
import { hourlyEntries, productionDays, users } from '@/db/schema';
import { WORK_HOURS, type ProdModule } from '@/lib/constants';

export type DayView = {
  module: ProdModule;
  date: string;
  dailyTarget: number;
  hourlyTarget: number;
  hourly: Record<string, number>;
  totalAchieved: number;
  pending: number;
  achievementPct: number;
  supervisorName: string | null;
  updatedAt: Date | null;
};

const round2 = (n: number) => Math.round(n * 100) / 100;

export function summarize(dailyTarget: number, totalAchieved: number) {
  return {
    hourlyTarget: round2(dailyTarget / WORK_HOURS),
    pending: Math.max(0, dailyTarget - totalAchieved),
    achievementPct: dailyTarget > 0 ? round2((totalAchieved / dailyTarget) * 100) : 0,
  };
}

export function emptyDay(module: ProdModule, date: string): DayView {
  return {
    module,
    date,
    dailyTarget: 0,
    hourlyTarget: 0,
    hourly: {},
    totalAchieved: 0,
    pending: 0,
    achievementPct: 0,
    supervisorName: null,
    updatedAt: null,
  };
}

/** Days in a range with their hourly entries, oldest first. */
export async function getDays(module: ProdModule, start?: string, end?: string): Promise<DayView[]> {
  const db = getDb();
  const days = await db
    .select({
      id: productionDays.id,
      date: productionDays.date,
      dailyTarget: productionDays.dailyTarget,
      supervisorName: users.name,
      updatedAt: productionDays.updatedAt,
    })
    .from(productionDays)
    .leftJoin(users, eq(users.username, productionDays.supervisor))
    .where(
      and(
        eq(productionDays.module, module),
        start ? gte(productionDays.date, start) : undefined,
        end ? lte(productionDays.date, end) : undefined,
      ),
    )
    .orderBy(productionDays.date);
  if (days.length === 0) return [];

  const entries = await db
    .select()
    .from(hourlyEntries)
    .where(inArray(hourlyEntries.dayId, days.map((d) => d.id)));
  const byDay = new Map<number, Record<string, number>>();
  for (const e of entries) {
    const rec = byDay.get(e.dayId) ?? {};
    rec[e.slotId] = e.achieved;
    byDay.set(e.dayId, rec);
  }

  return days.map((d) => {
    const hourly = byDay.get(d.id) ?? {};
    const totalAchieved = Object.values(hourly).reduce((a, b) => a + b, 0);
    return { module, date: d.date, dailyTarget: d.dailyTarget, hourly, totalAchieved, supervisorName: d.supervisorName, updatedAt: d.updatedAt, ...summarize(d.dailyTarget, totalAchieved) };
  });
}

export async function getDay(module: ProdModule, date: string): Promise<DayView> {
  const [day] = await getDays(module, date, date);
  return day ?? emptyDay(module, date);
}

/** Newest first, for the history pages. */
export async function getHistory(module: ProdModule, start?: string, end?: string): Promise<DayView[]> {
  return (await getDays(module, start, end)).reverse();
}

/** Per-date, per-module totals used by HOD and revenue views. */
export async function getDailyTotals(start?: string, end?: string) {
  const db = getDb();
  const achieved = sql<number>`coalesce(sum(${hourlyEntries.achieved}), 0)::int`;
  return db
    .select({ date: productionDays.date, module: productionDays.module, target: productionDays.dailyTarget, achieved })
    .from(productionDays)
    .leftJoin(hourlyEntries, eq(hourlyEntries.dayId, productionDays.id))
    .where(and(start ? gte(productionDays.date, start) : undefined, end ? lte(productionDays.date, end) : undefined))
    .groupBy(productionDays.id)
    .orderBy(desc(productionDays.date));
}
