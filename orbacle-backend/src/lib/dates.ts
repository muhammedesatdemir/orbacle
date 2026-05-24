// Date helpers for daily quota accounting. The backend uses UTC days so the
// reset boundary is consistent across regions (the mobile Layer-1 daily answer
// uses the device's local day, but that path never touches the backend).

// Returns the UTC calendar day as 'YYYY-MM-DD' for the given instant (default now).
export function todayKey(now: number = Date.now()): string {
  const d = new Date(now);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Unix ms of the next UTC midnight after `now` — when daily counters reset.
export function resetsAt(now: number = Date.now()): number {
  const d = new Date(now);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1, 0, 0, 0, 0);
}
