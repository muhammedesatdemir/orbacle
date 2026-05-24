// The two paid-tier readings. Layer 1 (Küre Fısıltısı) is free/unlimited and
// has no entitlement, so it is not a TierKey.
export type TierKey = 'kahin' | 'deep';

// Everything we persist about a user's allowances. Single AsyncStorage record
// under StorageKeys.entitlements. Daily counters reset lazily when the local
// calendar day (lastResetKey) changes; lifetime/premium fields persist across
// days. Mock-only in Phase 2 — no purchases, no backend.
export interface EntitlementSnapshot {
  // Mock premium flag. In Phase 2 it is flipped locally by the placeholder
  // paywall; later it will be driven by the backend / RevenueCat.
  isPremium: boolean;
  // 'YYYY-MM-DD' local day of the last reset (see dailyRepository.todayKey()).
  lastResetKey: string;
  kahinUsedToday: number;
  // Reklam (rewarded) bonus granted today. Wired for later; stays 0 in Phase 2.
  kahinBonusToday: number;
  deepUsedToday: number;
  // Lifetime free Deep trials consumed (the "first 1 free" rule).
  deepLifetimeUsed: number;
  // Purchasable Deep pack balance. Stays 0 in Phase 2 (no purchases).
  deepPackRemaining: number;
}

// Computed view of one tier's allowance for the current day.
export interface TierAllowance {
  used: number;
  limit: number;
  remaining: number;
  canUse: boolean;
}

// Result of attempting to consume one use of a tier.
export interface ConsumeResult {
  ok: boolean;
  // Why it failed, so the UI can decide between "out for today" and "paywall".
  reason?: 'limit' | 'needsPremium';
}

export const DEFAULT_SNAPSHOT: EntitlementSnapshot = {
  isPremium: false,
  lastResetKey: '',
  kahinUsedToday: 0,
  kahinBonusToday: 0,
  deepUsedToday: 0,
  deepLifetimeUsed: 0,
  deepPackRemaining: 0,
};

// Applies the daily reset rule: when the local day changed, zero the per-day
// counters while preserving premium, lifetime, and pack fields. Pure — kept
// here (not in entitlementStorage) so it has no AsyncStorage dependency and can
// be unit-tested on plain Node.
export function applyDailyReset(snapshot: EntitlementSnapshot, today: string): EntitlementSnapshot {
  if (snapshot.lastResetKey === today) return snapshot;
  return {
    ...snapshot,
    lastResetKey: today,
    kahinUsedToday: 0,
    kahinBonusToday: 0,
    deepUsedToday: 0,
  };
}

// Shape of the backend quota snapshot, mirrored minimally here to keep this file
// dependency-free (the full type lives in api/contract.ts).
export interface QuotaLike {
  premium: boolean;
  kahin: { used: number };
  deep: { used: number };
  deep_pack_balance: number;
}

// Mirrors a backend quota snapshot onto the local snapshot's counters (backend
// is the source of truth in Phase 4). `today` is passed in so this stays pure.
export function applyQuota(
  prev: EntitlementSnapshot,
  quota: QuotaLike,
  today: string,
): EntitlementSnapshot {
  return {
    ...prev,
    lastResetKey: today,
    isPremium: quota.premium,
    kahinUsedToday: quota.kahin.used,
    // Premium: deep.used is the daily count. Free: it's the lifetime trial use.
    deepUsedToday: quota.premium ? quota.deep.used : prev.deepUsedToday,
    deepLifetimeUsed: quota.premium ? prev.deepLifetimeUsed : quota.deep.used,
    deepPackRemaining: quota.deep_pack_balance,
  };
}
