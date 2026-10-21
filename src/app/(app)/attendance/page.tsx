import type { Metadata } from 'next';
import { AttendanceBoard } from '@/components/AttendanceBoard';
import type { SearchParams } from '@/components/ProductionPages';
import { requirePage } from '@/lib/auth';
import { getAttendance } from '@/lib/data/attendance';
import { dateOrToday, todayStr } from '@/lib/dates';

export const metadata: Metadata = { title: 'Attendance' };

export default async function Page({ searchParams }: { searchParams: SearchParams }) {
  const user = await requirePage('dispatch_supervisor', 'hod');
  const raw = (await searchParams).date;
  const date = dateOrToday(Array.isArray(raw) ? raw[0] : raw);
  const view = await getAttendance(date);
  return <AttendanceBoard view={view} today={todayStr()} canEdit={user.role === 'admin' || user.role === 'dispatch_supervisor'} />;
}
