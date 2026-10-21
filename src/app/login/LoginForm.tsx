'use client';

import { useActionState } from 'react';
import { login, type LoginState } from '@/actions/auth';

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});

  return (
    <form action={action}>
      {state.error && (
        <div
          className="panel"
          role="alert"
          style={{ padding: 12, marginBottom: 20, backgroundColor: 'var(--color-danger-bg)', borderColor: 'var(--color-danger-border)', color: 'var(--color-danger)' }}
        >
          {state.error}
        </div>
      )}
      <div className="form-group" style={{ marginBottom: 18 }}>
        <label className="form-label" htmlFor="username">Username</label>
        <input id="username" name="username" className="form-input form-input-lg" placeholder="e.g. scan.supervisor" required autoComplete="username" autoFocus />
      </div>
      <div className="form-group" style={{ marginBottom: 24 }}>
        <label className="form-label" htmlFor="password">Password</label>
        <input id="password" name="password" type="password" className="form-input form-input-lg" placeholder="••••••••" required autoComplete="current-password" />
      </div>
      <button type="submit" className="btn btn-primary" disabled={pending} style={{ width: '100%', padding: 14, fontSize: '1rem' }}>
        {pending ? 'Signing in…' : 'Sign In'}
      </button>
    </form>
  );
}
