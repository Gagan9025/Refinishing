'use client';

import { Download, Pencil, RotateCcw } from 'lucide-react';
import { useEffect, useState, useTransition } from 'react';
import { resetDay, saveHourly, setTarget } from '@/actions/production';
import { SLOTS, type ProdModule, type Slot } from '@/lib/constants';
import type { DayView } from '@/lib/data/production';
import { nowMinutes } from '@/lib/dates';
import { barClass, barStyle } from '@/lib/ui';
import { DatePicker } from './DatePicker';
import { useReport, useToast } from './Toast';

type SlotState = 'COMPLETED' | 'UPCOMING' | 'PASSED' | 'CURRENT HOUR' | 'LUNCH BREAK';

function slotState(slot: Slot, date: string, today: string, now: number | null): SlotState {
  if (date < today) return 'COMPLETED';
  if (date > today || now === null) return 'UPCOMING';
  if (now >= slot.start && now < slot.end) return slot.lunch ? 'LUNCH BREAK' : 'CURRENT HOUR';
  return now >= slot.end ? 'PASSED' : 'UPCOMING';
}

function dayMessage(date: string, today: string, now: number | null) {
  if (date < today) return 'HISTORICAL DATE';
  if (date > today) return 'UPCOMING DATE';
  if (now === null) return 'PRODUCTION IN PROGRESS';
  if (now < 510) return 'WORKING HOURS START AT 8:30 AM';
  if (now >= 750 && now < 780) return 'LUNCH BREAK (12:30 PM – 1:00 PM)';
  if (now >= 1020) return 'WORKING HOURS COMPLETED FOR TODAY';
  return 'PRODUCTION IN PROGRESS';
}

export function ProductionBoard({ module, data, today, canEdit }: { module: ProdModule; data: DayView; today: string; canEdit: boolean }) {
  const report = useReport();
  const notify = useToast();
  const [pending, start] = useTransition();
  const [editing, setEditing] = useState(false);
  const [targetInput, setTargetInput] = useState('');
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(nowMinutes());
    const t = setInterval(() => setNow(nowMinutes()), 30_000);
    return () => clearInterval(t);
  }, []);

  // a different date means a different set of drafts
  useEffect(() => {
    setDrafts({});
    setEditing(false);
  }, [data.date]);

  const hasTarget = data.dailyTarget > 0;
  const showForm = canEdit && (!hasTarget || editing);
  const exceeded = hasTarget && data.totalAchieved > data.dailyTarget;
  const label = module === 'batch' ? 'Batch' : 'Scanning';

  const submitTarget = () => {
    const n = Number(targetInput);
    if (!Number.isInteger(n) || n <= 0) return notify('Please enter a whole number greater than 0.', 'warning');
    start(async () => {
      if (report(await setTarget(module, data.date, n))) {
        setEditing(false);
        setTargetInput('');
      }
    });
  };

  const submitHour = (slotId: string) => {
    const raw = drafts[slotId] ?? String(data.hourly[slotId] ?? '');
    const n = Number(raw);
    if (raw === '' || !Number.isInteger(n) || n < 0) return notify('Please enter a valid quantity (0 or greater).', 'warning');
    start(async () => {
      if (report(await saveHourly(module, data.date, slotId, n))) {
        setDrafts((d) => {
          const { [slotId]: _drop, ...rest } = d;
          return rest;
        });
      }
    });
  };

  const reset = () => {
    if (!confirm(`Reset all ${label} production data for ${data.date}? This cannot be undone.`)) return;
    start(async () => {
      report(await resetDay(module, data.date));
    });
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">{label} Production</h1>
          <p className="page-subtitle">Set daily targets, record hourly piece counts, and track achievement in real-time.</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <span className={`badge ${hasTarget ? 'badge-info' : 'badge-danger'}`} style={{ padding: '8px 14px', fontSize: '0.85rem' }}>
            {hasTarget ? dayMessage(data.date, today, now) : 'TARGET NOT SET (0)'}
          </span>
          <a className="btn btn-success" href={`/api/export?module=${module}&startDate=${data.date}&endDate=${data.date}&format=excel`}>
            <Download size={16} /> Export Excel
          </a>
        </div>
      </div>

      <div className="panel">
        {showForm ? (
          <>
            <div className="panel-title">Set Daily Production Target</div>
            <div className="form-group-row">
              <DatePicker date={data.date} today={today} />
              <div className="form-group">
                <label className="form-label" htmlFor="daily-target">Daily Production Target (Pieces)</label>
                <input
                  id="daily-target"
                  type="number"
                  min={1}
                  className="form-input form-input-lg"
                  placeholder="e.g. 800"
                  value={targetInput}
                  onChange={(e) => setTargetInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && submitTarget()}
                />
              </div>
              <div className="form-group" style={{ justifyContent: 'flex-end', flexDirection: 'row', gap: 8 }}>
                <button className="btn btn-primary" disabled={pending} onClick={submitTarget}>Save Daily Target</button>
                {editing && <button className="btn btn-secondary" onClick={() => setEditing(false)}>Cancel</button>}
              </div>
            </div>
          </>
        ) : (
          <div className="form-group-row" style={{ alignItems: 'flex-end' }}>
            <DatePicker date={data.date} today={today} />
            <div className="form-group">
              <span className="form-label" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b' }}>Set Target</span>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a' }}>{hasTarget ? `${data.dailyTarget} Pieces` : 'Not set'}</div>
            </div>
            {canEdit && hasTarget && (
              <div className="form-group" style={{ flexDirection: 'row', gap: 8 }}>
                <button className="btn btn-secondary" onClick={() => { setEditing(true); setTargetInput(String(data.dailyTarget)); }}>
                  <Pencil size={14} /> Edit Target
                </button>
                <button className="btn btn-danger" disabled={pending} onClick={reset}>
                  <RotateCcw size={14} /> Reset Day
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="card-grid">
        <div className="metric-card info">
          <span className="metric-label">Daily Target</span>
          <span className="metric-value">{data.dailyTarget}</span>
          <span className="metric-sub">Pieces target for this day</span>
        </div>
        <div className="metric-card success">
          <span className="metric-label">Total Achieved</span>
          <span className="metric-value">{data.totalAchieved}</span>
          <span className="metric-sub">Sum of hourly production</span>
        </div>
        <div className="metric-card warning">
          <span className="metric-label">Pending Target</span>
          <span className="metric-value">{data.pending}</span>
          <span className={`metric-sub${exceeded ? ' text-diff-positive' : ''}`}>
            {exceeded ? `Target exceeded by ${data.totalAchieved - data.dailyTarget} pieces` : 'Remaining to reach daily target'}
          </span>
        </div>
        <div className="metric-card info">
          <span className="metric-label">Overall Achievement %</span>
          <span className="metric-value">{data.achievementPct}%</span>
          <div className="progress-bar-container">
            <div className={barClass(data.achievementPct, 100, 80)} style={barStyle(data.achievementPct)} />
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-title">
          <span>Hourly Production Entry</span>
          <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#64748b' }}>Schedule: 8:30 AM – 5:00 PM (8 Working Hours)</span>
        </div>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Time Slot</th>
                <th>Hourly Target</th>
                <th>Achieved Quantity</th>
                <th>Difference</th>
                <th>Achievement %</th>
                <th>Status</th>
                {canEdit && <th>Action</th>}
              </tr>
            </thead>
            <tbody>
              {SLOTS.map((slot) => {
                if (slot.lunch) {
                  return (
                    <tr key={slot.id} className="lunch-row">
                      <td><strong>{slot.time}</strong></td>
                      <td colSpan={4}>—</td>
                      <td><span className="badge badge-lunch">LUNCH BREAK</span></td>
                      {canEdit && <td><span className="badge badge-secondary">DISABLED</span></td>}
                    </tr>
                  );
                }
                const state = slotState(slot, data.date, today, now);
                const saved = data.hourly[slot.id];
                const entered = saved !== undefined;
                const diff = entered ? saved - data.hourlyTarget : 0;
                const pct = entered && data.hourlyTarget > 0 ? `${((saved / data.hourlyTarget) * 100).toFixed(1)}%` : '—';
                let badge = <span className={`badge ${state === 'CURRENT HOUR' ? 'badge-info' : 'badge-secondary'}`}>{state}</span>;
                if (entered && data.hourlyTarget > 0) {
                  badge = diff < 0 ? <span className="badge badge-danger">Below Target</span> : diff === 0 ? <span className="badge badge-success">Achieved Target</span> : <span className="badge badge-success">Exceeded</span>;
                }
                return (
                  <tr key={slot.id} className={state === 'CURRENT HOUR' ? 'current-hour-row' : ''}>
                    <td><strong>{slot.time}</strong></td>
                    <td><strong>{data.hourlyTarget}</strong></td>
                    <td>
                      <input
                        type="number"
                        min={0}
                        className="form-input"
                        style={{ width: 100, textAlign: 'center' }}
                        aria-label={`Achieved quantity for ${slot.time}`}
                        placeholder="0"
                        disabled={!canEdit || !hasTarget}
                        value={drafts[slot.id] ?? (entered ? String(saved) : '')}
                        onChange={(e) => setDrafts((d) => ({ ...d, [slot.id]: e.target.value }))}
                        onKeyDown={(e) => e.key === 'Enter' && submitHour(slot.id)}
                      />
                    </td>
                    <td>
                      {entered && data.hourlyTarget > 0 ? (
                        <span className={diff >= 0 ? 'text-diff-positive' : 'text-diff-negative'}>{diff >= 0 ? `+${diff}` : diff}</span>
                      ) : '—'}
                    </td>
                    <td><strong>{pct}</strong></td>
                    <td>{badge}</td>
                    {canEdit && (
                      <td>
                        <button className="btn btn-sm btn-primary" disabled={!hasTarget || pending} onClick={() => submitHour(slot.id)}>Save</button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
