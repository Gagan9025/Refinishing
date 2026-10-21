import 'server-only';
import { and, asc, count, eq, gte, lte, sql } from 'drizzle-orm';
import { getDb } from '@/db';
import { attendance, employees } from '@/db/schema';

export type AttendanceStatus = 'present' | 'absent' | 'unmarked';

export type AttendanceRow = {
  employeeId: string;
  name: string;
  status: AttendanceStatus;
  checkedInAt: Date | null;
};

export type AttendanceView = {
  date: string;
  total: number;
  present: number;
  absent: number;
  pct: number;
  rows: AttendanceRow[];
};

export const attendancePct = (present: number, total: number) =>
  total > 0 ? Math.round((present / total) * 10000) / 100 : 0;

/** Full roster for a date; employees without a row are "unmarked". */
export async function getAttendance(date: string): Promise<AttendanceView> {
  const rows = await getDb()
    .select({
      employeeId: employees.id,
      name: employees.name,
      status: attendance.status,
      checkedInAt: attendance.checkedInAt,
    })
    .from(employees)
    .leftJoin(attendance, and(eq(attendance.employeeId, employees.id), eq(attendance.date, date)))
    .orderBy(asc(employees.id));

  const view: AttendanceRow[] = rows.map((r) => ({ ...r, status: r.status ?? 'unmarked' }));
  const present = view.filter((r) => r.status === 'present').length;
  const absent = view.filter((r) => r.status === 'absent').length;
  return { date, total: view.length, present, absent, pct: attendancePct(present, view.length), rows: view };
}

/** Attendance totals across a date range, counting only dates where someone was marked. */
export async function getAttendanceSummary(start: string, end: string) {
  const db = getDb();
  const range = and(gte(attendance.date, start), lte(attendance.date, end));
  const [{ roster }] = await db.select({ roster: count() }).from(employees);
  const [agg] = await db
    .select({
      days: sql<number>`count(distinct ${attendance.date})::int`,
      present: sql<number>`count(*) filter (where ${attendance.status} = 'present')::int`,
      absent: sql<number>`count(*) filter (where ${attendance.status} = 'absent')::int`,
    })
    .from(attendance)
    .where(range);
  const total = agg.days * roster;
  return { total, present: agg.present, absent: agg.absent, pct: attendancePct(agg.present, total) };
}

/** Every marked row in a range, for export. */
export async function getAttendanceRecords(start?: string, end?: string) {
  return getDb()
    .select({
      date: attendance.date,
      employeeId: employees.id,
      name: employees.name,
      status: attendance.status,
      checkedInAt: attendance.checkedInAt,
      markedBy: attendance.markedBy,
    })
    .from(attendance)
    .innerJoin(employees, eq(employees.id, attendance.employeeId))
    .where(and(start ? gte(attendance.date, start) : undefined, end ? lte(attendance.date, end) : undefined))
    .orderBy(asc(attendance.date), asc(employees.id));
}
