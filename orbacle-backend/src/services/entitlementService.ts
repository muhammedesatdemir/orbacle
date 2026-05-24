import type { Env } from '../types/env';
import type { EntitlementRow, DailyUsageRow } from '../types/db';
import type { QuotaSnapshot, ReadingType, PaywallReason } from '../types/contract';
import type { AppConfig } from './configService';
import { todayKey, resetsAt } from '../lib/dates';
import { ApiError } from '../lib/errors';

// --- Pure rule helpers (mirror the Phase 2 mobile mock rules) ----------------
// Free: kahin = freeDaily + rewarded; deep = 1 lifetime trial, then pack balance.
// Premium: kahin = premiumDaily; deep = premiumDeepDaily.

export interface EffectiveState {
  premium: boolean;
  ent: EntitlementRow;
  usage: DailyUsageRow;
}

function premiumActive(ent: EntitlementRow, now: number): boolean {
  return ent.premium_active === 1 && (ent.premium_expires_at ?? 0) > now;
}

export function kahinLimit(s: EffectiveState, cfg: AppConfig): number {
  return s.premium ? cfg.premiumKahinDailyLimit : cfg.freeKahinDailyLimit + s.usage.rewarded_kahin;
}

// "limit" used for the deep counter display: premium daily, or the lifetime
// trial count for free users (so the UI reads 0/1 then 1/1).
export function deepDisplayLimit(s: EffectiveState, cfg: AppConfig): number {
  return s.premium ? cfg.premiumDeepDailyLimit : cfg.deepTrialLifetime;
}

// Whether a deep reading can be produced right now (premium daily, or free
// lifetime trial remaining, or a purchased pack balance).
export function canUseDeep(s: EffectiveState, cfg: AppConfig): boolean {
  if (s.premium) return s.usage.deep_count < cfg.premiumDeepDailyLimit;
  const trialLeft = Math.max(0, cfg.deepTrialLifetime - s.ent.first_deep_used);
  return trialLeft > 0 || s.ent.deep_pack_balance > 0;
}

export function canUseKahin(s: EffectiveState, cfg: AppConfig): boolean {
  return s.usage.kahin_count < kahinLimit(s, cfg);
}

export function buildQuota(s: EffectiveState, cfg: AppConfig, now: number): QuotaSnapshot {
  const kLimit = kahinLimit(s, cfg);
  const dLimit = deepDisplayLimit(s, cfg);
  const deepRemaining = s.premium
    ? Math.max(0, cfg.premiumDeepDailyLimit - s.usage.deep_count)
    : Math.max(0, cfg.deepTrialLifetime - s.ent.first_deep_used) + s.ent.deep_pack_balance;
  return {
    premium: s.premium,
    kahin: {
      used: s.usage.kahin_count,
      limit: kLimit,
      remaining: Math.max(0, kLimit - s.usage.kahin_count),
    },
    deep: {
      used: s.premium ? s.usage.deep_count : s.ent.first_deep_used,
      limit: dLimit,
      remaining: deepRemaining,
    },
    deep_pack_balance: s.ent.deep_pack_balance,
    resets_at: resetsAt(now),
  };
}

// Reason to show the paywall when a tier is unavailable for a non-premium user.
export function paywallReasonFor(tier: ReadingType, s: EffectiveState, cfg: AppConfig): PaywallReason {
  if (tier === 'kahin') return 'free_kahin_exhausted';
  const trialLeft = Math.max(0, cfg.deepTrialLifetime - s.ent.first_deep_used);
  if (trialLeft <= 0 && s.ent.deep_pack_balance <= 0) {
    return s.ent.first_deep_used > 0 ? 'free_deep_trial_used' : 'deep_pack_empty';
  }
  return 'free_deep_trial_used';
}

// --- D1 IO -------------------------------------------------------------------
function db(env: Env): D1Database {
  if (!env.DB) {
    // No D1 bound (e.g. local dev before binding IDs are set). Surface a clean
    // MAINTENANCE rather than a runtime crash.
    throw new ApiError('MAINTENANCE', { message: 'Database not configured.' });
  }
  return env.DB;
}

const EMPTY_USAGE = (userId: string, date: string): DailyUsageRow => ({
  user_id: userId,
  usage_date: date,
  kahin_count: 0,
  deep_count: 0,
  rewarded_kahin: 0,
});

// Ensures a users row and an entitlements row exist; updates last_seen/locale.
export async function ensureUser(
  env: Env,
  userId: string,
  platform: string,
  locale: string,
  now: number,
): Promise<void> {
  const d = db(env);
  await d
    .prepare(
      `INSERT INTO users (id, platform, locale, created_at, last_seen_at)
       VALUES (?1, ?2, ?3, ?4, ?4)
       ON CONFLICT(id) DO UPDATE SET last_seen_at = ?4, platform = ?2, locale = ?3`,
    )
    .bind(userId, platform, locale, now)
    .run();
  await d
    .prepare(
      `INSERT INTO entitlements (user_id, updated_at) VALUES (?1, ?2)
       ON CONFLICT(user_id) DO NOTHING`,
    )
    .bind(userId, now)
    .run();
}

// Loads the effective state (entitlement + today's usage), creating defaults in
// memory when rows are missing. Assumes ensureUser has run.
export async function loadState(env: Env, userId: string, now: number): Promise<EffectiveState> {
  const d = db(env);
  const date = todayKey(now);
  const ent = await d
    .prepare(`SELECT * FROM entitlements WHERE user_id = ?1`)
    .bind(userId)
    .first<EntitlementRow>();
  const entitlement: EntitlementRow = ent ?? {
    user_id: userId,
    premium_active: 0,
    premium_expires_at: null,
    premium_product: null,
    deep_pack_balance: 0,
    first_deep_used: 0,
    updated_at: now,
  };
  const usageRow = await d
    .prepare(`SELECT * FROM daily_usage WHERE user_id = ?1 AND usage_date = ?2`)
    .bind(userId, date)
    .first<DailyUsageRow>();
  const usage = usageRow ?? EMPTY_USAGE(userId, date);
  return { premium: premiumActive(entitlement, now), ent: entitlement, usage };
}

// Atomically consumes one use of a tier AFTER a successful reading. Throws
// NEEDS_PAYWALL / NO_QUOTA if the (re-checked) limit is already reached — the
// conditional UPDATE makes the decrement race-safe. Returns the fresh state.
export async function consume(
  env: Env,
  userId: string,
  tier: ReadingType,
  cfg: AppConfig,
  now: number,
): Promise<EffectiveState> {
  const d = db(env);
  const date = todayKey(now);
  const state = await loadState(env, userId, now);

  if (tier === 'kahin') {
    if (!canUseKahin(state, cfg)) throw quotaError('kahin', state, cfg);
    const limit = kahinLimit(state, cfg);
    // Upsert today's row, incrementing only while under the limit.
    const res = await d
      .prepare(
        `INSERT INTO daily_usage (user_id, usage_date, kahin_count) VALUES (?1, ?2, 1)
         ON CONFLICT(user_id, usage_date)
         DO UPDATE SET kahin_count = kahin_count + 1 WHERE kahin_count < ?3`,
      )
      .bind(userId, date, limit)
      .run();
    // changes()==0 on conflict means we lost a race against the limit.
    if (!didChange(res)) throw quotaError('kahin', state, cfg);
    return loadState(env, userId, now);
  }

  // deep
  if (!canUseDeep(state, cfg)) throw quotaError('deep', state, cfg);

  if (state.premium) {
    const res = await d
      .prepare(
        `INSERT INTO daily_usage (user_id, usage_date, deep_count) VALUES (?1, ?2, 1)
         ON CONFLICT(user_id, usage_date)
         DO UPDATE SET deep_count = deep_count + 1 WHERE deep_count < ?3`,
      )
      .bind(userId, date, cfg.premiumDeepDailyLimit)
      .run();
    if (!didChange(res)) throw quotaError('deep', state, cfg);
    return loadState(env, userId, now);
  }

  // Free: spend the lifetime trial first, then the pack balance.
  const trialLeft = Math.max(0, cfg.deepTrialLifetime - state.ent.first_deep_used);
  if (trialLeft > 0) {
    const res = await d
      .prepare(
        `UPDATE entitlements SET first_deep_used = first_deep_used + 1, updated_at = ?2
         WHERE user_id = ?1 AND first_deep_used < ?3`,
      )
      .bind(userId, now, cfg.deepTrialLifetime)
      .run();
    if (!didChange(res)) throw quotaError('deep', state, cfg);
  } else {
    const res = await d
      .prepare(
        `UPDATE entitlements SET deep_pack_balance = deep_pack_balance - 1, updated_at = ?2
         WHERE user_id = ?1 AND deep_pack_balance > 0`,
      )
      .bind(userId, now)
      .run();
    if (!didChange(res)) throw quotaError('deep', state, cfg);
  }
  // Track deep usage for the day too (analytics / display).
  await d
    .prepare(
      `INSERT INTO daily_usage (user_id, usage_date, deep_count) VALUES (?1, ?2, 1)
       ON CONFLICT(user_id, usage_date) DO UPDATE SET deep_count = deep_count + 1`,
    )
    .bind(userId, date)
    .run();
  return loadState(env, userId, now);
}

function didChange(res: D1Result): boolean {
  // meta.changes reflects affected rows; on a no-op conditional update it's 0.
  return (res.meta?.changes ?? 0) > 0;
}

function quotaError(tier: ReadingType, state: EffectiveState, cfg: AppConfig): ApiError {
  if (state.premium) {
    return new ApiError('NO_QUOTA', { message: 'Daily limit reached.' });
  }
  return new ApiError('NEEDS_PAYWALL', {
    message: 'Additional access is needed for this reading.',
    paywallReason: paywallReasonFor(tier, state, cfg),
  });
}
