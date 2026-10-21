import type { Role } from './constants';

export type NavItem = { href: string; label: string; icon: 'scanning' | 'batch' | 'history' | 'attendance' | 'hod' | 'revenue' | 'admin'; roles: Role[] };

const ALL: NavItem[] = [
  { href: '/scanning', label: 'Scanning Production', icon: 'scanning', roles: ['scanning_supervisor', 'hod'] },
  { href: '/scanning/history', label: 'Scanning History', icon: 'history', roles: ['scanning_supervisor', 'hod'] },
  { href: '/batch', label: 'Batch Production', icon: 'batch', roles: ['batch_supervisor', 'hod'] },
  { href: '/batch/history', label: 'Batch History', icon: 'history', roles: ['batch_supervisor', 'hod'] },
  { href: '/attendance', label: 'Employee Attendance', icon: 'attendance', roles: ['dispatch_supervisor', 'hod'] },
  { href: '/hod', label: 'HOD Overview', icon: 'hod', roles: ['hod'] },
  { href: '/revenue', label: 'Revenue & Analytics', icon: 'revenue', roles: ['hod'] },
  { href: '/admin', label: 'System Admin', icon: 'admin', roles: [] },
];

/** Admin sees everything; other roles see the items that list them. */
export function navFor(role: Role): NavItem[] {
  return ALL.filter((i) => role === 'admin' || i.roles.includes(role));
}
