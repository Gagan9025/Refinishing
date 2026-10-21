'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { shiftDate } from '@/lib/dates';

/** Date input with Today/Yesterday shortcuts. Writes `?date=` and keeps the other query params. */
export function DatePicker({ date, today, label = 'Select Date' }: { date: string; today: string; label?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const go = (value: string) => {
    if (!value) return;
    const next = new URLSearchParams(params.toString());
    next.set('date', value);
    router.push(`${pathname}?${next}`);
  };

  return (
    <div className="form-group">
      <label className="form-label" htmlFor="page-date">{label}</label>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <input id="page-date" type="date" className="form-input" value={date} onChange={(e) => go(e.target.value)} />
        <button type="button" className="btn btn-sm btn-secondary" onClick={() => go(today)}>Today</button>
        <button type="button" className="btn btn-sm btn-secondary" onClick={() => go(shiftDate(today, -1))}>Yesterday</button>
      </div>
    </div>
  );
}
