import { Download } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import type { SearchParams } from '@/components/ProductionPages';
import { requirePage } from '@/lib/auth';
import { DAILY_OUTPUT_TARGET, MONTHLY_OUTPUT_TARGET, UNIT_PRICE, WEEKLY_OUTPUT_TARGET } from '@/lib/constants';
import { getRevenue, TIMEFRAMES, type Timeframe } from '@/lib/data/revenue';
import { inr } from '@/lib/ui';

export const metadata: Metadata = { title: 'Revenue & Analytics' };

const TF_LABEL: Record<Timeframe, string> = { monthly: 'Monthly Breakdown', weekly: 'Weekly Breakdown', daily: 'Daily Breakdown' };
const TF_TARGET: Record<Timeframe, [string, string]> = {
  daily: [`${DAILY_OUTPUT_TARGET.toLocaleString('en-IN')} / day`, 'Mon - Sat (excl. Sundays)'],
  weekly: [`${WEEKLY_OUTPUT_TARGET.toLocaleString('en-IN')} / week`, '6 working days / week'],
  monthly: [`${MONTHLY_OUTPUT_TARGET.toLocaleString('en-IN')} / month`, '26 working days / month'],
};

export default async function Page({ searchParams }: { searchParams: SearchParams }) {
  await requirePage('hod');
  const raw = (await searchParams).tf;
  const tfParam = Array.isArray(raw) ? raw[0] : raw;
  const timeframe = (TIMEFRAMES as readonly string[]).includes(tfParam ?? '') ? (tfParam as Timeframe) : 'monthly';
  const { data } = await getRevenue(timeframe);

  const units = data.reduce((a, r) => a + r.actualProduction, 0);
  const revenue = data.reduce((a, r) => a + r.revenue, 0);
  const target = data.reduce((a, r) => a + r.target, 0);
  const rate = target > 0 ? ((units / target) * 100).toFixed(1) : '0.0';
  const rows = [...data].reverse(); // newest first

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Revenue &amp; Production Analytics</h1>
          <p className="page-subtitle">
            Track financial performance against the {DAILY_OUTPUT_TARGET.toLocaleString('en-IN')} units/day target. Revenue is calculated at {inr(UNIT_PRICE)} per part.
          </p>
        </div>
        <a className="btn btn-success" href={`/api/export?module=revenue&timeframe=${timeframe}&format=excel`}>
          <Download size={16} /> Export Report
        </a>
      </div>

      <div className="card-grid">
        <div className="metric-card info">
          <span className="metric-label">Production Target</span>
          <span className="metric-value" style={{ fontSize: '1.5rem' }}>{TF_TARGET[timeframe][0]}</span>
          <span className="metric-sub">{TF_TARGET[timeframe][1]}</span>
        </div>
        <div className="metric-card info">
          <span className="metric-label">Total Production Output</span>
          <span className="metric-value">{units.toLocaleString('en-IN')}</span>
          <span className="metric-sub">Scan + Batch across {data.length} {timeframe} period(s)</span>
        </div>
        <div className="metric-card success">
          <span className="metric-label">Gross Revenue</span>
          <span className="metric-value">{inr(revenue)}</span>
          <span className="metric-sub">Calculated at {inr(UNIT_PRICE)} / part</span>
        </div>
        <div className="metric-card warning">
          <span className="metric-label">Achievement Rate</span>
          <span className="metric-value">{rate}%</span>
          <span className="metric-sub">Target vs actual output</span>
        </div>
      </div>

      <div className="panel">
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <span className="panel-title" style={{ margin: 0 }}>Timeframe View:</span>
          {TIMEFRAMES.map((tf) => (
            <Link key={tf} href={`/revenue?tf=${tf}`} className={`btn btn-sm ${tf === timeframe ? 'btn-primary' : 'btn-secondary'}`}>
              {TF_LABEL[tf]}
            </Link>
          ))}
        </div>
      </div>

      <div className="panel">
        <div className="panel-title">{TF_LABEL[timeframe].replace('Breakdown', 'Revenue & Target Performance')}</div>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Period / Date</th>
                <th>Working Days</th>
                <th>Target Output</th>
                <th>Scanning Output</th>
                <th>Batch Output</th>
                <th>Total Production</th>
                <th>Gross Revenue</th>
                <th>Completion Rate</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan={9} style={{ textAlign: 'center', padding: 25 }}>No production records found yet.</td></tr>}
              {rows.map((r) => (
                <tr key={r.label}>
                  <td style={{ fontWeight: 600 }}>{r.label}</td>
                  <td>{r.workingDays} day(s)</td>
                  <td><strong>{r.target.toLocaleString('en-IN')}</strong></td>
                  <td>{r.scanTotal.toLocaleString('en-IN')}</td>
                  <td>{r.batchTotal.toLocaleString('en-IN')}</td>
                  <td style={{ fontWeight: 700, color: 'var(--color-info)' }}>{r.actualProduction.toLocaleString('en-IN')}</td>
                  <td style={{ fontWeight: 700, color: 'var(--color-success)' }}>{inr(r.revenue)}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span>{r.completionRate}%</span>
                      <div style={{ flex: 1, height: 6, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden', minWidth: 60 }}>
                        <div style={{ width: `${Math.min(r.completionRate, 100)}%`, height: '100%', background: r.achieved ? 'var(--color-success)' : 'var(--color-info)' }} />
                      </div>
                    </div>
                  </td>
                  <td><span className={`badge ${r.achieved ? 'badge-success' : 'badge-warning'}`}>{r.achieved ? 'ACHIEVED' : 'NEAR TARGET'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
