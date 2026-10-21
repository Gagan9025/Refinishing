import { NextResponse, type NextRequest } from 'next/server';
import { AuthError, requireAction } from '@/lib/auth';
import { MODULE_ROLE, type Role } from '@/lib/constants';
import { isDateStr } from '@/lib/dates';
import { TIMEFRAMES, type Timeframe } from '@/lib/data/revenue';
import { attendanceTable, productionTable, revenueTable, toCsv, toExcelHtml } from '@/lib/export';

export const dynamic = 'force-dynamic';

const ROLES_FOR: Record<string, Role[]> = {
  scanning: [MODULE_ROLE.scanning, 'hod'],
  batch: [MODULE_ROLE.batch, 'hod'],
  attendance: ['dispatch_supervisor', 'hod'],
  revenue: ['hod'],
};

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const mod = q.get('module') ?? '';
  const format = q.get('format') === 'csv' ? 'csv' : 'excel';
  const start = isDateStr(q.get('startDate')) ? q.get('startDate')! : undefined;
  const end = isDateStr(q.get('endDate')) ? q.get('endDate')! : undefined;

  if (!(mod in ROLES_FOR)) return NextResponse.json({ error: 'Unknown export module.' }, { status: 400 });

  try {
    await requireAction(...ROLES_FOR[mod]);
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: 403 });
    throw err;
  }

  const timeframe = (TIMEFRAMES as readonly string[]).includes(q.get('timeframe') ?? '') ? (q.get('timeframe') as Timeframe) : 'monthly';
  const table =
    mod === 'attendance'
      ? await attendanceTable(start, end)
      : mod === 'revenue'
        ? await revenueTable(timeframe)
        : await productionTable(mod as 'scanning' | 'batch', start, end);

  const stamp = start || end ? `${start ?? 'start'}_to_${end ?? 'today'}` : 'all';
  const filename = `${mod}_report_${stamp}.${format === 'csv' ? 'csv' : 'xls'}`;
  return new NextResponse(format === 'csv' ? toCsv(table) : toExcelHtml(table), {
    headers: {
      'Content-Type': format === 'csv' ? 'text/csv; charset=utf-8' : 'application/vnd.ms-excel; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}
