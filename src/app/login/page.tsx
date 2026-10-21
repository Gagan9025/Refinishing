import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { ROLE_HOME } from '@/lib/constants';
import { LoginForm } from './LoginForm';

export const metadata: Metadata = { title: 'Login' };

export default async function LoginPage() {
  const user = await getSession();
  if (user) redirect(ROLE_HOME[user.role]);

  return (
    <div className="login-body">
      <div className="login-card">
        <div className="login-header">
          <div className="login-brand-logo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Aditya Birla" className="login-logo-img" />
          </div>
          <h1 className="login-title">Refinishing Department Production Management System</h1>
          <p className="login-subtitle">Aditya Birla Lifestyle Brands • Production &amp; Attendance</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
