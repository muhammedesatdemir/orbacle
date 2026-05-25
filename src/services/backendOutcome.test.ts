/**
 * Dependency-free self-test for the Phase 4 backend-outcome logic:
 *  - classifyBackendError (paywall vs graceful fallback)
 *  - applyQuota (mirroring the server quota into the local snapshot)
 * Run via `npm test`. Pure logic only — no react-native / AsyncStorage in the
 * import chain (apiError + entitlements/types are RN-free).
 */
import assert from 'assert';
import { ApiClientError, classifyBackendError } from './apiError';
import { applyQuota, DEFAULT_SNAPSHOT, type QuotaLike } from '../entitlements/types';
import type { ApiErrorResponse } from '../api/contract';

let passed = 0;
function check(name: string, fn: () => void): void {
  fn();
  passed += 1;
  // eslint-disable-next-line no-console
  console.log(`  ✓ ${name}`);
}

function errBody(code: ApiErrorResponse['error']['code'], reason?: ApiErrorResponse['error']['paywall_reason']): ApiErrorResponse {
  return { ok: false, error: { code, message: 'x', ...(reason ? { paywall_reason: reason } : {}) } };
}

// --- classifyBackendError ----------------------------------------------------
check('NEEDS_PAYWALL → paywall with reason', () => {
  const e = new ApiClientError(402, 'x', errBody('NEEDS_PAYWALL', 'free_kahin_exhausted'));
  const r = classifyBackendError(e);
  assert.strictEqual(r.paywall, true);
  if (r.paywall) assert.strictEqual(r.reason, 'free_kahin_exhausted');
});

check('NO_QUOTA → paywall', () => {
  const e = new ApiClientError(403, 'x', errBody('NO_QUOTA'));
  assert.strictEqual(classifyBackendError(e).paywall, true);
});

check('UPSTREAM_ERROR → not paywall (graceful fallback)', () => {
  const e = new ApiClientError(502, 'x', errBody('UPSTREAM_ERROR'));
  assert.strictEqual(classifyBackendError(e).paywall, false);
});

check('RATE_LIMITED → not paywall (fallback)', () => {
  const e = new ApiClientError(429, 'x', errBody('RATE_LIMITED'));
  assert.strictEqual(classifyBackendError(e).paywall, false);
});

check('plain network Error → not paywall (fallback)', () => {
  assert.strictEqual(classifyBackendError(new Error('Network request failed')).paywall, false);
});

check('deep trial exhausted → paywall with free_deep_trial_used reason', () => {
  const e = new ApiClientError(402, 'x', errBody('NEEDS_PAYWALL', 'free_deep_trial_used'));
  const r = classifyBackendError(e);
  assert.strictEqual(r.paywall, true);
  if (r.paywall) assert.strictEqual(r.reason, 'free_deep_trial_used');
});

check('deep upstream error → not paywall (graceful fallback, no quota spend)', () => {
  const e = new ApiClientError(502, 'x', errBody('UPSTREAM_ERROR'));
  assert.strictEqual(classifyBackendError(e).paywall, false);
});

check('ApiClientError without body → not paywall (fallback)', () => {
  assert.strictEqual(classifyBackendError(new ApiClientError(0, 'timeout')).paywall, false);
});

// --- applyQuota (backend → local snapshot) ----------------------------------
const TODAY = '2026-05-24';

check('free user: kahin used + deep trial mirrored from quota', () => {
  const quota: QuotaLike = {
    premium: false,
    kahin: { used: 1 },
    deep: { used: 1 }, // free: deep.used represents the lifetime trial use
    deep_pack_balance: 0,
  };
  const next = applyQuota(DEFAULT_SNAPSHOT, quota, TODAY);
  assert.strictEqual(next.isPremium, false);
  assert.strictEqual(next.kahinUsedToday, 1);
  assert.strictEqual(next.deepLifetimeUsed, 1);
  assert.strictEqual(next.deepPackRemaining, 0);
  assert.strictEqual(next.lastResetKey, TODAY);
});

check('premium user: daily deep count mirrored, premium flag set', () => {
  const quota: QuotaLike = {
    premium: true,
    kahin: { used: 5 },
    deep: { used: 2 },
    deep_pack_balance: 0,
  };
  const next = applyQuota(DEFAULT_SNAPSHOT, quota, TODAY);
  assert.strictEqual(next.isPremium, true);
  assert.strictEqual(next.kahinUsedToday, 5);
  assert.strictEqual(next.deepUsedToday, 2);
});

check('deep pack balance mirrored', () => {
  const quota: QuotaLike = {
    premium: false,
    kahin: { used: 0 },
    deep: { used: 1 },
    deep_pack_balance: 9,
  };
  assert.strictEqual(applyQuota(DEFAULT_SNAPSHOT, quota, TODAY).deepPackRemaining, 9);
});

// eslint-disable-next-line no-console
console.log(`\n${passed} backend-outcome checks passed.`);
