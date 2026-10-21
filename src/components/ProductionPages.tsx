import { Download } from 'lucide-react';
import { ProductionBoard } from '@/components/ProductionBoard';
import { requirePage } from '@/lib/auth';
import { MODULE_LABELS, MODULE_ROLE, type ProdModule } from '@/lib/constants';
import { getDay, getHistory } from '@/lib/data/production';
import { dateOrToday, isDateStr, todayStr } from '@/lib/dates';

export type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export async function ProductionPage({ module, searchParams }: { module: ProdModule; searchParams: SearchParams }) {
  const user = await requirePage(MODULE_ROLE[module], 'hod');
  const date = dateOrToday(first((await searchParams).date));
  const data = await getDay(module, date);
  return <ProductionBoard module={module} data={data} today={todayStr()} canEdit={user.role === 'admin' || user.role === MODULE_ROLE[module]} />;
}

export async function HistoryPage({ module, searchParams }: { module: ProdModule; searchParams: SearchParams }) {
  await requirePage(MODULE_ROLE[module], 'hod');
  const sp = await searchParams;
  const start = isDateStr(first(sp.start)) ? first(sp.start) : undefined;
  const end = isDateStr(first(sp.end)) ? first(sp.end) : undefined;
  const records = await getHistory(module, start, end);
  const label = MODULE_LABELS[module];
  const exportQuery = `module=${module}&format=excel${start ? `&startDate=${start}` : ''}${end ? `&endDate=${end}` : ''}`;

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">{label} Production History</h1>
          <p className="page-subtitle">View historical daily production records and performance metrics.</p>
        </div>
        <a className="btn btn-success" href={`/api/export?${exportQuery}`}>
          <Download size={16} /> Export Excel Report
        </a>
      </div>

      <div className="panel">
        <form method="get" className="form-group-row">
          <div className="form-group">
            <label className="form-label" htmlFor="start">Start Date</label>
            <input id="start" name="start" type="date" className="form-input" defaultValue={start} />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="end">End Date</label>
            <input id="end" name="end" type="date" className="form-input" defaultValue={end} />
          </div>
          <div className="form-group" style={{ justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary">Filter History</button>
          </div>
        </form>
      </div>

      <div className="panel">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Supervisor</th>
                <th>Daily Target</th>
                <th>Total Achieved</th>
                <th>Pending</th>
                <th>Achievement %</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center' }}>No records found for the selected date range.</td></tr>
              )}
              {records.map((r) => (
                <tr key={r.date}>
                  <td><strong>{r.date}</strong></td>
                  <td>{r.supervisorName ?? '—'}</td>
                  <td><strong>{r.dailyTarget}</strong></td>
                  <td><strong style={{ color: 'var(--color-primary)' }}>{r.totalAchieved}</strong></td>
                  <td>{r.pending}</td>
                  <td><strong>{r.achievementPct}%</strong></td>
                  <td>
                    {r.achievementPct >= 100 ? <span className="badge badge-success">Target Exceeded</span> : r.achievementPct >= 80 ? <span className="badge badge-warning">On Track</span> : <span className="badge badge-danger">Below Target</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
