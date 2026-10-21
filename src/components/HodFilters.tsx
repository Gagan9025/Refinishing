'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

/** URL-driven filters for the HOD page: every change is a navigation, so the server renders the result. */
export function HodFilters({ range, date, start, end, module }: { range: string; date: string; start: string; end: string; module: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const set = (patch: Record<string, string>) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) (v ? next.set(k, v) : next.delete(k));
    router.push(`${pathname}?${next}`);
  };

  return (
    <div className="panel">
      <div className="form-group-row">
        <div className="form-group">
          <label className="form-label" htmlFor="range">Date Range Type</label>
          <select id="range" className="form-select" value={range} onChange={(e) => set({ range: e.target.value })}>
            <option value="today">Single Date</option>
            <option value="yesterday">Yesterday</option>
            <option value="weekly">Last 7 Days (Weekly)</option>
            <option value="monthly">Last 30 Days (Monthly)</option>
            <option value="custom">Custom Date Range</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="date">Select Date</label>
          <input id="date" type="date" className="form-input" value={date} onChange={(e) => e.target.value && set({ date: e.target.value })} />
        </div>
        {range === 'custom' && (
          <>
            <div className="form-group">
              <label className="form-label" htmlFor="start">Start Date</label>
              <input id="start" type="date" className="form-input" value={start} onChange={(e) => set({ start: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="end">End Date</label>
              <input id="end" type="date" className="form-input" value={end} onChange={(e) => set({ end: e.target.value })} />
            </div>
          </>
        )}
        <div className="form-group">
          <label className="form-label" htmlFor="module">Supervisor Detail View</label>
          <select id="module" className="form-select" value={module} onChange={(e) => set({ module: e.target.value })}>
            <option value="scanning">Scanning Supervisor</option>
            <option value="batch">Batch Supervisor</option>
          </select>
        </div>
      </div>
    </div>
  );
}
