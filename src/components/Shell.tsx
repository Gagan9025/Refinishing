'use client';

import {
  BarChart3,
  Boxes,
  CalendarDays,
  Clock,
  History,
  IndianRupee,
  LogOut,
  Menu,
  ScanLine,
  Users,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { logout } from '@/actions/auth';
import { ROLE_LABELS } from '@/lib/constants';
import { navFor, type NavItem } from '@/lib/nav';
import type { SessionUser } from '@/lib/auth';
import { ToastProvider } from './Toast';

const ICONS: Record<NavItem['icon'], LucideIcon> = {
  scanning: ScanLine,
  batch: Boxes,
  history: History,
  attendance: Users,
  hod: BarChart3,
  revenue: IndianRupee,
  admin: Wrench,
};

function HeaderClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="header-clock">
      <CalendarDays size={14} style={{ verticalAlign: '-2px' }} /> {now ? now.toLocaleDateString('en-GB') : '--/--/----'} |{' '}
      <Clock size={14} style={{ verticalAlign: '-2px' }} /> {now ? now.toLocaleTimeString() : '--:--:--'}
    </div>
  );
}

export function Shell({ user, children }: { user: SessionUser; children: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const items = navFor(user.role);
  // longest matching href wins so /scanning/history doesn't highlight /scanning
  const active = [...items].sort((a, b) => b.href.length - a.href.length).find((i) => pathname === i.href || pathname.startsWith(`${i.href}/`));

  useEffect(() => setOpen(false), [pathname]);

  return (
    <ToastProvider>
      <div className="app-container">
        <aside className={`sidebar${open ? ' mobile-open' : ''}`}>
          <div className="sidebar-header">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Aditya Birla" className="sidebar-logo-img" />
            <div className="sidebar-brand">
              Aditya Birla
              <span>Refinishing System</span>
            </div>
          </div>
          <ul className="sidebar-menu">
            {items.map((item) => {
              const Icon = ICONS[item.icon];
              return (
                <li key={item.href}>
                  <Link href={item.href} className={active?.href === item.href ? 'active' : ''}>
                    <span className="nav-icon"><Icon size={18} /></span>
                    <span className="nav-text">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="sidebar-footer">© {new Date().getFullYear()} Refinishing Dept</div>
        </aside>
        <div className={`mobile-nav-overlay${open ? ' active' : ''}`} onClick={() => setOpen(false)} />

        <div className="main-wrapper">
          <header className="top-header">
            <div className="header-left">
              <button className={`mobile-nav-toggle${open ? ' is-active' : ''}`} aria-label="Toggle navigation menu" onClick={() => setOpen((o) => !o)}>
                <Menu size={20} />
                <span className="toggle-label">Menu</span>
              </button>
              <h2 className="header-title">{active?.label ?? 'Refinishing System'}</h2>
              <HeaderClock />
            </div>
            <div className="header-right">
              <div className="user-badge">
                <div className="user-avatar">{user.name.charAt(0).toUpperCase()}</div>
                <div className="user-info">
                  <span className="user-name">{user.name}</span>
                  <span className="user-role">{ROLE_LABELS[user.role]}</span>
                </div>
              </div>
              <form action={logout}>
                <button className="btn-logout" type="submit">
                  <LogOut size={14} style={{ verticalAlign: '-2px', marginRight: 6 }} />
                  Logout
                </button>
              </form>
            </div>
          </header>
          <main className="page-content">{children}</main>
        </div>
      </div>
    </ToastProvider>
  );
}
