'use server';

import { eq, sql } from 'drizzle-orm';
import { getDb } from '@/db';
import { attendance, employees } from '@/db/schema';
import { run, UserError, type ActionResult } from '@/lib/action';
import { requireAction } from '@/lib/auth';
import { isDateStr } from '@/lib/dates';

type Status = 'present' | 'absent';

async function mark(date: string, employeeId: string, status: Status, markedBy: string) {
  await getDb()
    .insert(attendance)
    .values({ date, employeeId, status, markedBy, checkedInAt: status === 'present' ? new Date() : null })
    .onConflictDoUpdate({
      target: [attendance.date, attendance.employeeId],
      set: {
        status,
        markedBy,
        // keep the original check-in time if they were already present
        checkedInAt: status === 'present' ? sql`coalesce(${attendance.checkedInAt}, now())` : null,
        updatedAt: sql`now()`,
      },
    });
}

export async function setStatus(date: string, employeeId: string, status: Status): Promise<ActionResult> {
  return run(async () => {
    const user = await requireAction('dispatch_supervisor');
    if (!isDateStr(date) || !employeeId) throw new UserError('Date and employee are required.');
    if (status !== 'present' && status !== 'absent') throw new UserError('Status must be Present or Absent.');
    const [emp] = await getDb().select({ id: employees.id }).from(employees).where(eq(employees.id, employeeId));
    if (!emp) throw new UserError('Employee not found.');
    await mark(date, employeeId, status, user.username);
    return `Employee ${employeeId} marked ${status}.`;
  });
}

export async function addEmployee(date: string, id: string, name: string, status: Status): Promise<ActionResult> {
  return run(async () => {
    const user = await requireAction('dispatch_supervisor');
    const empId = id.trim().toUpperCase();
    const empName = name.trim();
    if (!isDateStr(date)) throw new UserError('A valid date is required.');
    if (!empId || !empName) throw new UserError('Employee ID and name are required.');
    await getDb()
      .insert(employees)
      .values({ id: empId, name: empName })
      .onConflictDoUpdate({ target: employees.id, set: { name: empName } });
    await mark(date, empId, status === 'absent' ? 'absent' : 'present', user.username);
    return `Employee ${empName} saved to the roster.`;
  });
}

export async function resetAttendance(date: string): Promise<ActionResult> {
  return run(async () => {
    await requireAction('dispatch_supervisor');
    if (!isDateStr(date)) throw new UserError('A valid date is required.');
    await getDb().delete(attendance).where(eq(attendance.date, date));
    return `Attendance for ${date} has been cleared.`;
  });
}
