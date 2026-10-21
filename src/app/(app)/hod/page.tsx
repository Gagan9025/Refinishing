import { Download } from 'lucide-react';
import type { Metadata } from 'next';
import { HodFilters } from '@/components/HodFilters';
import type { SearchParams } from '@/components/ProductionPages';
import { requirePage } from '@/lib/auth';
import { SLOTS, type ProdModule } from '@/lib/constants';
import { getBounds, getComparison, getOverview, RANGE_TYPES, type RangeType } from '@/lib/data/hod';
import { getDay } from '@/lib/data/production';
import { dateOrToday, isDateStr } from '@/lib/dates';
import { barClass, barStyle } from '@/lib/ui';

export const metadata: Metadata = { title: 'HOD Overview' };

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

function Bar({ pct, high, mid }: { pct: number; high?: number; mid?: number }) {
  return (
    <div className="progress-bar-container">
      <div className={barClass(pct, high, mid)} style={barStyle(pct)} />
    </div>
  );
}

export default async function Page({ searchParams }: { searchParams: SearchParams }) {
  await requirePage('hod');
  const sp = await searchParams;
  const range = (RANGE_TYPES as readonly string[]).includes(one(sp.range) ?? '') ? (one(sp.range) as RangeType) : 'today';
  const date = dateOrToday(one(sp.date));
  const start = isDateStr(one(sp.start)) ? one(sp.start)! : '';
  const end = isDateStr(one(sp.end)) ? one(sp.end)! : '';
  const module: ProdModule = one(sp.module) === 'batch' ? 'batch' : 'scanning';

  const bounds = getBounds(range, date, start, end);
  const [overview, comparison, detail] = await Promise.all([getOverview(bounds), getComparison(date), getDay(module, date)]);
  const { scanning, batch, attendance } = overview;

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Refinishing Department Overview</h1>
          <p className="page-subtitle">
            Real-time monitoring across Scanning, Batch Production, and Staff Attendance
            {bounds.start === bounds.end ? ` for ${bounds.start}.` : ` from ${bounds.start} to ${bounds.end}.`}
          </p>
        </div>
        <a className="btn btn-success" href={`/api/export?module=${module}&startDate=${bounds.start}&endDate=${bounds.end}&format=excel`}>
          <Download size={16} /> Export {module === 'batch' ? 'Batch' : 'Scanning'} Excel
        </a>
      </div>

      <HodFilters range={range} date={date} start={start} end={end} module={module} />

      <div className="card-grid">
        {([['Scanning Production', scanning], ['Batch Production', batch]] as const).map(([title, m]) => (
          <div className="metric-card info" key={title}>
            <span className="metric-label">{title}</span>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 4 }}>
              <span className="metric-value">{m.achieved}</span>
              <span style={{ fontSize: '0.9rem', color: '#64748b' }}>Target: <strong>{m.target}</strong></span>
            </div>
            <div className="metric-sub">Achievement: <strong style={{ marginLeft: 4 }}>{m.pct}%</strong></div>
            <Bar pct={m.pct} />
          </div>
        ))}
        <div className="metric-card success">
          <span className="metric-label">Attendance Rate</span>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 4 }}>
            <span className="metric-value">{attendance.pct}%</span>
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
              P: <strong style={{ color: 'var(--color-success)' }}>{attendance.present}</strong> | A: <strong style={{ color: 'var(--color-danger)' }}>{attendance.absent}</strong>
            </span>
          </div>
          <div className="metric-sub">Department attendance for the range</div>
          <Bar pct={attendance.pct} />
        </div>
      </div>

      <div className="panel">
        <div className="panel-title">
          <span>Module Performance Comparison</span>
          <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#64748b' }}>Scanning vs Batch Production on {date}</span>
        </div>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Department Module</th>
                <th>Assigned Supervisor</th>
                <th>Daily Target</th>
                <th>Total Achieved</th>
                <th>Pending</th>
                <th>Achievement %</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {comparison.map(({ module: name, supervisor, day }) => (
                <tr key={name}>
                  <td><strong>{name}</strong></td>
                  <td>{supervisor}</td>
                  <td><strong>{day.dailyTarget}</strong></td>
                  <td><strong style={{ color: 'var(--color-primary)' }}>{day.totalAchieved}</strong></td>
                  <td>{day.pending}</td>
                  <td><strong>{day.achievementPct}%</strong></td>
                  <td>
                    {day.achievementPct >= 100 ? <span className="badge badge-success">Target Exceeded</span> : day.achievementPct >= 75 ? <span className="badge badge-warning">On Track</span> : <span className="badge badge-danger">Below Target</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="panel">
        <div className="panel-title"><span>Supervisor Hourly Detail: {module === 'batch' ? 'Batch' : 'Scanning'}</span></div>
        {detail.dailyTarget === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#64748b' }}>
            No production records logged for <strong>{module.toUpperCase()}</strong> on {date}.
          </div>
        ) : (
          <>
            <p style={{ marginBottom: 16 }}>
              <strong>Supervisor:</strong> {detail.supervisorName} | <strong>Daily Target:</strong> {detail.dailyTarget} | <strong>Total Achieved:</strong> {detail.totalAchieved} | <strong>Achievement:</strong> {detail.achievementPct}%
            </p>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Time Slot</th>
                    <th>Hourly Target</th>
                    <th>Achieved</th>
                    <th>Difference</th>
                    <th>Achievement %</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {SLOTS.map((s) => {
                    if (s.lunch) {
                      return (
                        <tr key={s.id} className="lunch-row">
                          <td><strong>{s.time}</strong></td>
                          <td colSpan={4}>LUNCH BREAK</td>
                          <td><span className="badge badge-lunch">LUNCH</span></td>
                        </tr>
                      );
                    }
                    const v = detail.hourly[s.id];
                    const entered = v !== undefined;
                    const diff = entered ? v - detail.hourlyTarget : 0;
                    return (
                      <tr key={s.id}>
                        <td><strong>{s.time}</strong></td>
                        <td>{detail.hourlyTarget}</td>
                        <td><strong>{entered ? v : '—'}</strong></td>
                        <td>{entered ? (diff >= 0 ? `+${diff}` : diff) : '—'}</td>
                        <td>{entered && detail.hourlyTarget > 0 ? `${((v / detail.hourlyTarget) * 100).toFixed(1)}%` : '—'}</td>
                        <td>{entered ? (diff >= 0 ? <span className="badge badge-success">Achieved</span> : <span className="badge badge-danger">Below</span>) : <span className="badge badge-secondary">Pending</span>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </>
  );
}
