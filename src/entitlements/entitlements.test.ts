/**
 * Dependency-free self-test for the mock entitlement rules and daily reset.
 * Run via `npm test` (compiled with tsconfig.test.json, executed on Node).
 * Pure logic only — no React Native / AsyncStorage imports in the chain.
 */
import assert from 'assert';
import { EntitlementSnapshot, DEFAULT_SNAPSHOT, applyDailyReset } from './types';
import { computeAllowances, applyConsume, MOCK_LIMITS } from './mockEntitlements';

let passed = 0;
function check(name: string, fn: () => void): void {
  fn();
  passed += 1;
  // eslint-disable-next-line no-console
  console.log(`  ✓ ${name}`);
}

const base = (over: Partial<EntitlementSnapshot> = {}): EntitlementSnapshot => ({
  ...DEFAULT_SNAPSHOT,
  lastResetKey: '2026-05-24',
  ...over,
});

// --- Free user: 1 Kâhin per day ----------------------------------------------
check('free: kahin starts at 0/1, usable', () => {
  const a = computeAllowances(base()).kahin;
  assert.strictEqual(a.used, 0);
  assert.strictEqual(a.limit, 1);
  assert.strictEqual(a.canUse, true);
});
check('free: kahin after 1 use is 1/1, not usable', () => {
  const s = applyConsume(base(), 'kahin');
  const a = computeAllowances(s).kahin;
  assert.strictEqual(a.used, 1);
  assert.strictEqual(a.canUse, false);
});

// --- Free user: 1 lifetime Deep trial ---------------------------------------
check('free: deep trial available before first use', () => {
  const a = computeAllowances(base()).deep;
  assert.strictEqual(a.canUse, true);
  assert.strictEqual(a.limit, MOCK_LIMITS.deep.freeLifetimeTrial);
});
check('free: deep locked after the one lifetime trial', () => {
  const s = applyConsume(base(), 'deep');
  const a = computeAllowances(s).deep;
  assert.strictEqual(s.deepLifetimeUsed, 1);
  assert.strictEqual(a.canUse, false);
});
check('free: deep trial is lifetime — a daily reset does NOT restore it', () => {
  const used = applyConsume(base(), 'deep'); // deepLifetimeUsed = 1
  const nextDay = applyDailyReset(used, '2026-05-25');
  assert.strictEqual(nextDay.deepLifetimeUsed, 1, 'lifetime trial wrongly reset');
  assert.strictEqual(computeAllowances(nextDay).deep.canUse, false);
});

// --- Daily reset restores the per-day kahin counter --------------------------
check('daily reset: kahin counter returns to 0 on a new day', () => {
  const used = applyConsume(base(), 'kahin'); // kahinUsedToday = 1
  const sameDay = applyDailyReset(used, '2026-05-24');
  assert.strictEqual(sameDay.kahinUsedToday, 1, 'should not reset on same day');
  const nextDay = applyDailyReset(used, '2026-05-25');
  assert.strictEqual(nextDay.kahinUsedToday, 0, 'should reset on new day');
  assert.strictEqual(nextDay.lastResetKey, '2026-05-25');
  assert.strictEqual(computeAllowances(nextDay).kahin.canUse, true);
});

// --- Premium limits ----------------------------------------------------------
check('premium: kahin limit is 30/day', () => {
  const a = computeAllowances(base({ isPremium: true })).kahin;
  assert.strictEqual(a.limit, MOCK_LIMITS.kahin.premiumDaily);
  assert.strictEqual(a.canUse, true);
});
check('premium: deep limit is 3/day', () => {
  const a = computeAllowances(base({ isPremium: true })).deep;
  assert.strictEqual(a.limit, MOCK_LIMITS.deep.premiumDaily);
  assert.strictEqual(a.canUse, true);
});
check('premium: deep exhausts after 3 uses in a day', () => {
  let s = base({ isPremium: true });
  for (let i = 0; i < MOCK_LIMITS.deep.premiumDaily; i++) s = applyConsume(s, 'deep');
  assert.strictEqual(computeAllowances(s).deep.canUse, false);
});

// --- Premium daily reset gives back deep uses --------------------------------
check('premium: daily reset restores deep uses', () => {
  let s = base({ isPremium: true });
  for (let i = 0; i < MOCK_LIMITS.deep.premiumDaily; i++) s = applyConsume(s, 'deep');
  const nextDay = applyDailyReset(s, '2026-05-25');
  assert.strictEqual(computeAllowances(nextDay).deep.canUse, true);
});

// eslint-disable-next-line no-console
console.log(`\n${passed} entitlement checks passed.`);
