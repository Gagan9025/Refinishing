'use server';

import { and, eq, sql } from 'drizzle-orm';
import { getDb } from '@/db';
import { hourlyEntries, productionDays } from '@/db/schema';
import { run, UserError, type ActionResult } from '@/lib/action';
import { requireAction } from '@/lib/auth';
import { MODULE_ROLE, MODULES, WORK_SLOT_IDS, type ProdModule } from '@/lib/constants';
import { isDateStr } from '@/lib/dates';

async function authorize(module: ProdModule, date: string) {
  if (!MODULES.includes(module)) throw new UserError('Unknown module.');
  if (!isDateStr(date)) throw new UserError('A valid date is required.');
  return requireAction(MODULE_ROLE[module]);
}

export async function setTarget(module: ProdModule, date: string, target: number): Promise<ActionResult> {
  return run(async () => {
    const user = await authorize(module, date);
    if (!Number.isInteger(target) || target <= 0) throw new UserError('Daily target must be a whole number greater than 0.');
    await getDb()
      .insert(productionDays)
      .values({ module, date, dailyTarget: target, supervisor: user.username })
      .onConflictDoUpdate({
        target: [productionDays.module, productionDays.date],
        set: { dailyTarget: target, supervisor: user.username, updatedAt: sql`now()` },
      });
    return 'Daily target saved.';
  });
}

export async function saveHourly(module: ProdModule, date: string, slotId: string, achieved: number): Promise<ActionResult> {
  return run(async () => {
    const user = await authorize(module, date);
    if (slotId === 'slot_lunch') throw new UserError('Production entry is not allowed during lunch break.');
    if (!WORK_SLOT_IDS.includes(slotId)) throw new UserError('Unknown time slot.');
    if (!Number.isInteger(achieved) || achieved < 0) throw new UserError('Achieved quantity must be 0 or a positive whole number.');

    const db = getDb();
    const [day] = await db
      .select({ id: productionDays.id })
      .from(productionDays)
      .where(and(eq(productionDays.module, module), eq(productionDays.date, date)));
    if (!day) throw new UserError('Please set a daily target before entering hourly production.');

    await db
      .insert(hourlyEntries)
      .values({ dayId: day.id, slotId, achieved })
      .onConflictDoUpdate({ target: [hourlyEntries.dayId, hourlyEntries.slotId], set: { achieved, updatedAt: sql`now()` } });
    await db.update(productionDays).set({ supervisor: user.username, updatedAt: sql`now()` }).where(eq(productionDays.id, day.id));
    return 'Hourly production saved.';
  });
}

export async function resetDay(module: ProdModule, date: string): Promise<ActionResult> {
  return run(async () => {
    await authorize(module, date);
    await getDb().delete(productionDays).where(and(eq(productionDays.module, module), eq(productionDays.date, date)));
    return `Production data for ${date} has been reset.`;
  });
}
