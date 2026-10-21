/** Progress-bar colour class for a percentage. `high`/`mid` are the green/amber cut-offs. */
export function barClass(pct: number, high = 90, mid = 75) {
  return `progress-bar-fill ${pct >= high ? 'success' : pct >= mid ? 'warning' : 'danger'}`;
}

export const clampPct = (pct: number) => Math.min(100, Math.max(0, pct));

export const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;

/** Inline style for a progress-bar fill (scaleX avoids animating layout). */
export const barStyle = (pct: number) => ({ transform: `scaleX(${clampPct(pct) / 100})` });
