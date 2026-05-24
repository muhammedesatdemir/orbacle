import { EntitlementSnapshot, TierAllowance, TierKey } from './types';

// Mock limit rules. Single source of truth for Phase 2. When the backend lands
// (Phase 4) these numbers move server-side and this file becomes a thin parser
// of the server response — the provider/hook API stays the same.
export const MOCK_LIMITS = {
  kahin: { freeDaily: 1, premiumDaily: 30 },
  deep: { freeLifetimeTrial: 1, premiumDaily: 3 },
} as const;

// Kâhin Yorumu allowance for the current day.
function kahinAllowance(s: EntitlementSnapshot): TierAllowance {
  const limit = s.isPremium
    ? MOCK_LIMITS.kahin.premiumDaily
    : MOCK_LIMITS.kahin.freeDaily + s.kahinBonusToday;
  const used = s.kahinUsedToday;
  const remaining = Math.max(0, limit - used);
  return { used, limit, remaining, canUse: remaining > 0 };
}

// Derin Kehanet allowance. Premium → daily limit. Free → one lifetime trial,
// then the purchasable pack balance (always 0 in Phase 2). The "limit" shown to
// free users is the trial (1) so the counter reads "0/1" before / "1/1" after.
function deepAllowance(s: EntitlementSnapshot): TierAllowance {
  if (s.isPremium) {
    const limit = MOCK_LIMITS.deep.premiumDaily;
    const used = s.deepUsedToday;
    const remaining = Math.max(0, limit - used);
    return { used, limit, remaining, canUse: remaining > 0 };
  }
  const trialLeft = Math.max(0, MOCK_LIMITS.deep.freeLifetimeTrial - s.deepLifetimeUsed);
  const remaining = trialLeft + s.deepPackRemaining;
  return {
    used: s.deepLifetimeUsed,
    limit: MOCK_LIMITS.deep.freeLifetimeTrial,
    remaining,
    canUse: remaining > 0,
  };
}

export function computeAllowances(s: EntitlementSnapshot): Record<TierKey, TierAllowance> {
  return { kahin: kahinAllowance(s), deep: deepAllowance(s) };
}

// Returns the snapshot after consuming one use of a tier. Caller must check
// canUse first; this assumes the use is allowed and just decrements/increments.
export function applyConsume(s: EntitlementSnapshot, tier: TierKey): EntitlementSnapshot {
  if (tier === 'kahin') {
    return { ...s, kahinUsedToday: s.kahinUsedToday + 1 };
  }
  // deep
  if (s.isPremium) {
    return { ...s, deepUsedToday: s.deepUsedToday + 1 };
  }
  // Free: spend the lifetime trial first, then the pack balance.
  const trialLeft = Math.max(0, MOCK_LIMITS.deep.freeLifetimeTrial - s.deepLifetimeUsed);
  if (trialLeft > 0) {
    return { ...s, deepLifetimeUsed: s.deepLifetimeUsed + 1, deepUsedToday: s.deepUsedToday + 1 };
  }
  return { ...s, deepPackRemaining: Math.max(0, s.deepPackRemaining - 1), deepUsedToday: s.deepUsedToday + 1 };
}
