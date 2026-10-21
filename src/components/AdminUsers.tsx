'use client';

import { Plus } from 'lucide-react';
import { useState, useTransition } from 'react';
import { createUser, resetPassword, setUserStatus } from '@/actions/admin';
import { ROLES, ROLE_LABELS, type Role } from '@/lib/constants';
import { Modal } from './Modal';
import { useReport } from './Toast';

type UserRow = { username: string; name: string; role: Role; status: 'active' | 'disabled' };

export function AdminUsers({ users, self }: { users: UserRow[]; self: string }) {
  const report = useReport();
  const [pending, start] = useTransition();
  const [creating, setCreating] = useState(false);
  const [resetting, setResetting] = useState<UserRow | null>(null);

  const create = (form: FormData) =>
    start(async () => {
      const result = await createUser({
        name: String(form.get('name')),
        username: String(form.get('username')),
        role: String(form.get('role')) as Role,
        password: String(form.get('password')),
      });
      if (report(result)) setCreating(false);
    });

  const reset = (form: FormData) =>
    start(async () => {
      if (resetting && report(await resetPassword(resetting.username, String(form.get('password'))))) setResetting(null);
    });

  const toggle = (u: UserRow) => start(async () => void report(await setUserStatus(u.username, u.status === 'active' ? 'disabled' : 'active')));

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">User &amp; Access Management</h1>
          <p className="page-subtitle">Manage user accounts, assign department roles, disable accounts, and reset credentials.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setCreating(true)}>
          <Plus size={16} /> Create New User
        </button>
      </div>

      <div className="panel">
        <div className="panel-title"><span>System Users Directory</span></div>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Full Name</th>
                <th>Username</th>
                <th>System Role</th>
                <th>Account Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const active = u.status === 'active';
                const locked = u.username === 'admin' || u.username === self;
                return (
                  <tr key={u.username}>
                    <td><strong>{u.name}</strong></td>
                    <td><code>{u.username}</code></td>
                    <td><span className="badge badge-info">{ROLE_LABELS[u.role]}</span></td>
                    <td><span className={`badge ${active ? 'badge-success' : 'badge-danger'}`}>{active ? 'Active' : 'Disabled'}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          className={`btn btn-sm ${active ? 'btn-danger' : 'btn-success'}`}
                          disabled={pending || (active && locked)}
                          title={active && locked ? 'This account cannot be disabled' : undefined}
                          onClick={() => toggle(u)}
                        >
                          {active ? 'Disable' : 'Enable'}
                        </button>
                        <button className="btn btn-sm btn-secondary" onClick={() => setResetting(u)}>Reset Password</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={creating} title="Create System User" onClose={() => setCreating(false)}>
        <form action={create}>
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="form-label" htmlFor="u-name">Full Name</label>
            <input id="u-name" name="name" className="form-input" placeholder="e.g. John Doe" required />
          </div>
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="form-label" htmlFor="u-username">Username</label>
            <input id="u-username" name="username" className="form-input" placeholder="e.g. john.doe" required autoComplete="off" />
          </div>
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="form-label" htmlFor="u-role">Role</label>
            <select id="u-role" name="role" className="form-select" defaultValue="scanning_supervisor">
              {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 24 }}>
            <label className="form-label" htmlFor="u-password">Password</label>
            <input id="u-password" name="password" type="password" minLength={6} className="form-input" placeholder="At least 6 characters" required autoComplete="new-password" />
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setCreating(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={pending}>Create User Account</button>
          </div>
        </form>
      </Modal>

      <Modal open={!!resetting} title="Reset User Password" onClose={() => setResetting(null)}>
        <form action={reset}>
          <p style={{ marginBottom: 16, color: '#64748b', fontSize: '0.9rem' }}>
            Resetting password for: <strong style={{ color: '#0f172a' }}>{resetting?.name} ({resetting?.username})</strong>
          </p>
          <div className="form-group" style={{ marginBottom: 24 }}>
            <label className="form-label" htmlFor="r-password">New Password</label>
            <input id="r-password" name="password" type="password" minLength={6} className="form-input" placeholder="At least 6 characters" required autoComplete="new-password" />
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setResetting(null)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={pending}>Update Password</button>
          </div>
        </form>
      </Modal>
    </>
  );
}
