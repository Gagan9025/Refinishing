import 'server-only';
import { SLOTS, type ProdModule } from './constants';
import { formatTime } from './dates';
import { getAttendanceRecords } from './data/attendance';
import { getDays } from './data/production';
import { getRevenue, type Timeframe } from './data/revenue';

export type Table = { title: string; headers: string[]; rows: (string | number)[][] };

export async function productionTable(module: ProdModule, start?: string, end?: string): Promise<Table> {
  const days = await getDays(module, start, end);
  const rows: Table['rows'] = [];
  for (const day of days) {
    for (const slot of SLOTS) {
      if (slot.lunch) {
        rows.push([day.date, day.supervisorName ?? '', day.dailyTarget, slot.time, '—', '—', '—', '—', 'Lunch break']);
        continue;
      }
      const achieved = day.hourly[slot.id];
      if (achieved === undefined) {
        rows.push([day.date, day.supervisorName ?? '', day.dailyTarget, slot.time, day.hourlyTarget, '—', '—', '—', 'Pending']);
        continue;
      }
      const diff = achieved - day.hourlyTarget;
      const pct = day.hourlyTarget > 0 ? `${((achieved / day.hourlyTarget) * 100).toFixed(1)}%` : '0%';
      const status = diff < 0 ? 'Below target' : diff === 0 ? 'Achieved target' : 'Exceeded target';
      rows.push([day.date, day.supervisorName ?? '', day.dailyTarget, slot.time, day.hourlyTarget, achieved, diff >= 0 ? `+${diff}` : diff, pct, status]);
    }
  }
  return {
    title: `${module === 'batch' ? 'Batch' : 'Scanning'} Production`,
    headers: ['Date', 'Supervisor', 'Daily Target', 'Time Slot', 'Hourly Target', 'Achieved', 'Difference', 'Achievement %', 'Status'],
    rows,
  };
}

export async function attendanceTable(start?: string, end?: string): Promise<Table> {
  const records = await getAttendanceRecords(start, end);
  return {
    title: 'Employee Attendance',
    headers: ['Date', 'Employee ID', 'Employee Name', 'Status', 'Check-in Time', 'Marked By'],
    rows: records.map((r) => [r.date, r.employeeId, r.name, r.status === 'present' ? 'Present' : 'Absent', formatTime(r.checkedInAt), r.markedBy]),
  };
}

export async function revenueTable(timeframe: Timeframe): Promise<Table> {
  const { data } = await getRevenue(timeframe);
  return {
    title: `Revenue (${timeframe})`,
    headers: ['Period', 'Working Days', 'Target', 'Scanning', 'Batch', 'Total Production', 'Revenue (INR)', 'Completion %', 'Status'],
    rows: data.map((r) => [r.label, r.workingDays, r.target, r.scanTotal, r.batchTotal, r.actualProduction, r.revenue, r.completionRate, r.achieved ? 'ACHIEVED' : 'NEAR TARGET']),
  };
}

const csvCell = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;

export function toCsv(t: Table): string {
  return '﻿' + [t.headers, ...t.rows].map((r) => r.map(csvCell).join(',')).join('\r\n');
}

const esc = (v: string | number) => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** HTML table with Excel namespaces: opens directly in Excel as a worksheet. */
export function toExcelHtml(t: Table): string {
  const head = t.headers.map((h) => `<th style="background:#1e3a8a;color:#fff;border:1px solid #cbd5e1">${esc(h)}</th>`).join('');
  const body = t.rows.length
    ? t.rows.map((r) => `<tr>${r.map((c) => `<td style="border:1px solid #cbd5e1">${esc(c)}</td>`).join('')}</tr>`).join('')
    : `<tr><td colspan="${t.headers.length}">No records found for the selected range.</td></tr>`;
  return `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><meta http-equiv="Content-Type" content="text/html; charset=utf-8"><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>${esc(t.title)}</x:Name></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head><body><table border="1"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></body></html>`;
}
