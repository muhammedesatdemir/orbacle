import { describe, it, expect } from 'vitest';
import { todayKey, resetsAt } from '../src/lib/dates';

describe('dates', () => {
  it('todayKey formats UTC as YYYY-MM-DD', () => {
    const t = Date.UTC(2026, 4, 24, 15, 30, 0); // 2026-05-24 15:30 UTC
    expect(todayKey(t)).toBe('2026-05-24');
  });

  it('todayKey uses UTC, not local time (late-UTC instant stays same day)', () => {
    const t = Date.UTC(2026, 0, 1, 23, 59, 59); // 2026-01-01 23:59:59 UTC
    expect(todayKey(t)).toBe('2026-01-01');
  });

  it('resetsAt returns the next UTC midnight', () => {
    const t = Date.UTC(2026, 4, 24, 15, 30, 0);
    expect(resetsAt(t)).toBe(Date.UTC(2026, 4, 25, 0, 0, 0, 0));
  });

  it('resetsAt at exactly midnight points to the following midnight', () => {
    const midnight = Date.UTC(2026, 4, 24, 0, 0, 0, 0);
    expect(resetsAt(midnight)).toBe(Date.UTC(2026, 4, 25, 0, 0, 0, 0));
  });
});
