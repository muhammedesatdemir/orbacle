import { Language } from '../types/language';
import { getDeterministicAnswer } from '../utils/getRandomAnswer';

// Local calendar day, not UTC — the "day" should match the user's clock.
// Exported so daily-reset consumers (e.g. entitlements) share one definition.
export function todayKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// The answer of the day is fully derived from the date + language, so there
// is nothing to persist — it is stable across re-opens by construction and
// changes automatically when the local day rolls over.
export function getDailyAnswer(language: Language): string {
  return getDeterministicAnswer(language, todayKey());
}
