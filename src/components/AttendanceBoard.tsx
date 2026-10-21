'use client';

import { Download, Plus, RotateCcw } from 'lucide-react';
import { useState, useTransition } from 'react';
import { addEmployee, resetAttendance, setStatus } from '@/actions/attendance';
import type { AttendanceView } from '@/lib/data/attendance';
import { formatTime } from '@/lib/dates';
import { barClass, barStyle } from '@/lib/ui';
import { DatePicker } from './DatePicker';
import { Modal } from './Modal';
import { useReport, useToast } from './Toast';

export function AttendanceBoard({ view, today, canEdit }: { view: AttendanceView; today: string; canEdit: boolean }) {
  const report = useReport();
  const notify = useToast();
  const [pending, start] = useTransition();
  const [adding, setAdding] = useState(false);

  const toggle = (employeeId: string, to: 'present' | 'absent') => start(async () => void report(await setStatus(view.date, employeeId, to)));

  const reset = () => {
    if (!confirm(`Clear all attendance marks for ${view.date}?`)) return;
    start(async () => void report(await resetAttendance(view.date)));
  };

  const submitAdd = (form: FormData) => {
    const id = String(form.get('id') ?? '');
    const name = String(form.get('name') ?? '');
    if (!id.trim() || !name.trim()) return notify('Employee ID and name are required.', 'warning');
    start(async () => {
      if (report(await addEmployee(view.date, id, name, form.get('status') === 'absent' ? 'absent' : 'present'))) setAdding(false);
    });
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Refinishing Department Attendance</h1>
          <p className="page-subtitle">Track daily worker attendance, present/absent counts, and arrival times.</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {canEdit && (
            <button className="btn btn-primary" onClick={() => setAdding(true)}>
              <Plus size={16} /> Add Employee
            </button>
          )}
          <a className="btn btn-success" href={`/api/export?module=attendance&startDate=${view.date}&endDate=${view.date}&format=excel`}>
            <Download size={16} /> Export Excel
          </a>
        </div>
      </div>

      <div className="panel">
        <div className="form-group-row" style={{ alignItems: 'flex-end' }}>
          <DatePicker date={view.date} today={today} label="Select Attendance Date" />
          {canEdit && (
            <div className="form-group">
              <button className="btn btn-secondary" disabled={pending} onClick={reset}>
                <RotateCcw size={14} /> Clear Day
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="card-grid">
        <div className="metric-card info">
          <span className="metric-label">Total Staff</span>
          <span className="metric-value">{view.total}</span>
          <span className="metric-sub">Total registered employees</span>
        </div>
        <div className="metric-card success">
          <span className="metric-label">Present</span>
          <span className="metric-value">{view.present}</span>
          <span className="metric-sub">Workers present</span>
        </div>
        <div className="metric-card danger">
          <span className="metric-label">Absent</span>
          <span className="metric-value">{view.absent}</span>
          <span className="metric-sub">Workers absent</span>
        </div>
        <div className="metric-card info">
          <span className="metric-label">Attendance Rate</span>
          <span className="metric-value">{view.pct}%</span>
          <div className="progress-bar-container">
            <div className={barClass(view.pct)} style={barStyle(view.pct)} />
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-title"><span>Employee Attendance Roster</span></div>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Employee Name</th>
                <th>Status</th>
                <th>Check-In Time</th>
                {canEdit && <th>Action</th>}
              </tr>
            </thead>
            <tbody>
              {view.rows.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: 'center' }}>No employees on the roster yet.{canEdit ? ' Click "Add Employee" to start.' : ''}</td></tr>
              )}
              {view.rows.map((r) => (
                <tr key={r.employeeId}>
                  <td><strong>{r.employeeId}</strong></td>
                  <td>{r.name}</td>
                  <td>
                    <span className={`badge ${r.status === 'present' ? 'badge-success' : r.status === 'absent' ? 'badge-danger' : 'badge-secondary'}`}>
                      {r.status === 'unmarked' ? 'Unmarked' : r.status === 'present' ? 'Present' : 'Absent'}
                    </span>
                  </td>
                  <td><strong>{formatTime(r.checkedInAt)}</strong></td>
                  {canEdit && (
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {r.status !== 'present' && <button className="btn btn-sm btn-success" disabled={pending} onClick={() => toggle(r.employeeId, 'present')}>Mark Present</button>}
                        {r.status !== 'absent' && <button className="btn btn-sm btn-secondary" disabled={pending} onClick={() => toggle(r.employeeId, 'absent')}>Mark Absent</button>}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={adding} title="Add Employee to Roster" onClose={() => setAdding(false)}>
        <form action={submitAdd}>
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="form-label" htmlFor="emp-id">Employee ID</label>
            <input id="emp-id" name="id" className="form-input" placeholder="e.g. EMP051" required />
          </div>
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="form-label" htmlFor="emp-name">Employee Full Name</label>
            <input id="emp-name" name="name" className="form-input" placeholder="e.g. Sarah Jenkins" required />
          </div>
          <div className="form-group" style={{ marginBottom: 24 }}>
            <label className="form-label" htmlFor="emp-status">Initial Status ({view.date})</label>
            <select id="emp-status" name="status" className="form-select" defaultValue="present">
              <option value="present">Present</option>
              <option value="absent">Absent</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setAdding(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={pending}>Save Employee</button>
          </div>
        </form>
      </Modal>
    </>
  );
}
