import { describe, it, expect, beforeEach } from 'vitest';
import type { Env } from '../src/types/env';
import { DEFAULT_CONFIG } from '../src/services/configService';
import {
  ensureUser,
  loadState,
  consume,
  buildQuota,
} from '../src/services/entitlementService';
import { ApiError } from '../src/lib/errors';
import { newTables, makeFakeD1, type Tables } from './fakeDb';

const cfg = DEFAULT_CONFIG;
const USER = 'user-1';
const NOW = Date.UTC(2026, 4, 24, 10, 0, 0); // 2026-05-24
const NEXT_DAY = Date.UTC(2026, 4, 25, 10, 0, 0);

let tables: Tables;
let env: Env;

async function setup(premium = false, packBalance = 0): Promise<void> {
  tables = newTables();
  env = { DB: makeFakeD1(tables) } as Env;
  await ensureUser(env, USER, 'android', 'en', NOW);
  if (premium || packBalance) {
    const ent = tables.entitlements.get(USER)!;
    if (premium) {
      ent.premium_active = 1;
      ent.premium_expires_at = NOW + 86400000 * 30;
    }
    ent.deep_pack_balance = packBalance;
  }
}

describe('free user — kahin', () => {
  beforeEach(() => setup(false));

  it('allows 1 kahin, then the 2nd throws NEEDS_PAYWALL', async () => {
    await consume(env, USER, 'kahin', cfg, NOW);
    const after = await loadState(env, USER, NOW);
    expect(after.usage.kahin_count).toBe(1);

    await expect(consume(env, USER, 'kahin', cfg, NOW)).rejects.toMatchObject({
      code: 'NEEDS_PAYWALL',
    });
    try {
      await consume(env, USER, 'kahin', cfg, NOW);
    } catch (e) {
      expect((e as ApiError).paywallReason).toBe('free_kahin_exhausted');
    }
  });

  it('resets the kahin counter on a new UTC day', async () => {
    await consume(env, USER, 'kahin', cfg, NOW);
    // New day → different usage_date row → starts at 0 again.
    await consume(env, USER, 'kahin', cfg, NEXT_DAY);
    const after = await loadState(env, USER, NEXT_DAY);
    expect(after.usage.kahin_count).toBe(1);
  });
});

describe('free user — deep', () => {
  beforeEach(() => setup(false));

  it('allows the first lifetime trial, then throws on the second', async () => {
    await consume(env, USER, 'deep', cfg, NOW);
    expect(tables.entitlements.get(USER)!.first_deep_used).toBe(1);
    await expect(consume(env, USER, 'deep', cfg, NOW)).rejects.toBeInstanceOf(ApiError);
  });

  it('does NOT restore the deep trial after a daily reset', async () => {
    await consume(env, USER, 'deep', cfg, NOW);
    await expect(consume(env, USER, 'deep', cfg, NEXT_DAY)).rejects.toMatchObject({
      code: 'NEEDS_PAYWALL',
    });
  });

  it('uses the deep pack balance once the trial is spent', async () => {
    await setup(false, 2); // 2 pack credits
    await consume(env, USER, 'deep', cfg, NOW); // spends trial
    await consume(env, USER, 'deep', cfg, NOW); // spends pack -> 1
    expect(tables.entitlements.get(USER)!.deep_pack_balance).toBe(1);
  });
});

describe('premium user', () => {
  beforeEach(() => setup(true));

  it('allows 30 kahin per day, 31st throws NO_QUOTA', async () => {
    for (let i = 0; i < 30; i++) await consume(env, USER, 'kahin', cfg, NOW);
    const after = await loadState(env, USER, NOW);
    expect(after.usage.kahin_count).toBe(30);
    await expect(consume(env, USER, 'kahin', cfg, NOW)).rejects.toMatchObject({ code: 'NO_QUOTA' });
  });

  it('allows 3 deep per day, 4th throws NO_QUOTA', async () => {
    for (let i = 0; i < 3; i++) await consume(env, USER, 'deep', cfg, NOW);
    await expect(consume(env, USER, 'deep', cfg, NOW)).rejects.toMatchObject({ code: 'NO_QUOTA' });
  });

  it('resets daily counters on a new day', async () => {
    for (let i = 0; i < 3; i++) await consume(env, USER, 'deep', cfg, NOW);
    await consume(env, USER, 'deep', cfg, NEXT_DAY); // fresh day
    const after = await loadState(env, USER, NEXT_DAY);
    expect(after.usage.deep_count).toBe(1);
  });
});

describe('quota snapshot', () => {
  it('free user starts at kahin 0/1 and deep 0/1', async () => {
    await setup(false);
    const state = await loadState(env, USER, NOW);
    const q = buildQuota(state, cfg, NOW);
    expect(q.premium).toBe(false);
    expect(q.kahin).toMatchObject({ used: 0, limit: 1, remaining: 1 });
    expect(q.deep).toMatchObject({ used: 0, limit: 1, remaining: 1 });
    expect(q.resets_at).toBe(Date.UTC(2026, 4, 25, 0, 0, 0, 0));
  });
});
