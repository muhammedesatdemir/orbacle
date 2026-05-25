import { describe, it, expect, beforeEach } from 'vitest';
import { Hono } from 'hono';
import type { Env, RequestVars } from '../src/types/env';
import { DEFAULT_CONFIG } from '../src/services/configService';
import {
  ensureUser,
  loadState,
  consume,
  grantPremium,
  revokePremium,
  resetUser,
  buildEntitlementsResponse,
} from '../src/services/entitlementService';
import { devRoute } from '../src/routes/dev';
import { errorHandler } from '../src/middleware/errorHandler';
import { newTables, makeFakeD1, type Tables } from './fakeDb';

const cfg = DEFAULT_CONFIG;
const USER = 'dev-user-1';
const IID = '11111111-1111-1111-1111-111111111111';
const NOW = Date.UTC(2026, 4, 25, 10, 0, 0);

let tables: Tables;
let env: Env;

beforeEach(async () => {
  tables = newTables();
  env = { DB: makeFakeD1(tables), ENVIRONMENT: 'development' } as Env;
  await ensureUser(env, USER, 'android', 'en', NOW);
});

// --- Service-level (fake D1) ------------------------------------------------
describe('grantPremium (service)', () => {
  it('sets premium active + 7-day expiry and reflects in entitlements response', async () => {
    await grantPremium(env, USER, NOW);
    const state = await loadState(env, USER, NOW);
    expect(state.premium).toBe(true);
    expect(tables.entitlements.get(USER)?.premium_product).toBe('dev_mock_premium');

    const res = buildEntitlementsResponse(state, cfg, NOW);
    expect(res.premium).toBe(true);
    expect(res.quota.premium).toBe(true);
    expect(res.quota.kahin.limit).toBe(30);
    expect(res.quota.deep.limit).toBe(3);
    expect(res.premium_expires_at).toBe(NOW + 7 * 24 * 60 * 60 * 1000);
  });

  it('preserves existing daily usage after upgrade (1/30, not 0/30)', async () => {
    await consume(env, USER, 'kahin', cfg, NOW); // used 1 as free
    await grantPremium(env, USER, NOW);
    const state = await loadState(env, USER, NOW);
    const res = buildEntitlementsResponse(state, cfg, NOW);
    expect(res.quota.kahin.used).toBe(1);
    expect(res.quota.kahin.limit).toBe(30);
  });
});

describe('revokePremium (service)', () => {
  it('clears premium', async () => {
    await grantPremium(env, USER, NOW);
    await revokePremium(env, USER, NOW);
    const state = await loadState(env, USER, NOW);
    expect(state.premium).toBe(false);
    expect(tables.entitlements.get(USER)?.premium_expires_at).toBeNull();
  });
});

describe('resetUser (service)', () => {
  it('clears daily usage and lifetime/premium/pack fields', async () => {
    await consume(env, USER, 'kahin', cfg, NOW);
    await consume(env, USER, 'deep', cfg, NOW); // first_deep_used -> 1
    await grantPremium(env, USER, NOW);
    await resetUser(env, USER, NOW);
    const state = await loadState(env, USER, NOW);
    expect(state.premium).toBe(false);
    expect(state.ent.first_deep_used).toBe(0);
    expect(state.ent.deep_pack_balance).toBe(0);
    expect(state.usage.kahin_count).toBe(0);
    expect(state.usage.deep_count).toBe(0);
  });
});

// --- Route-level (Hono app.request) ----------------------------------------
function mountDev(environment: string | undefined): Hono<{ Bindings: Env; Variables: RequestVars }> {
  const app = new Hono<{ Bindings: Env; Variables: RequestVars }>();
  app.onError(errorHandler); // maps ApiError (e.g. UNAUTHORIZED) to its status
  app.route('/v1/dev', devRoute);
  // bindings supplied per-request via app.request(..., env)
  void environment;
  return app;
}

function reqEnv(environment: string | undefined): Env {
  return { DB: makeFakeD1(tables), ENVIRONMENT: environment } as Env;
}

describe('/v1/dev/grant-premium route', () => {
  it('development: grants premium and returns EntitlementsResponse', async () => {
    const app = mountDev('development');
    const res = await app.request(
      '/v1/dev/grant-premium',
      { method: 'POST', headers: { 'X-Install-Id': IID } },
      reqEnv('development'),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; premium: boolean; quota: { kahin: { limit: number } } };
    expect(body.ok).toBe(true);
    expect(body.premium).toBe(true);
    expect(body.quota.kahin.limit).toBe(30);
  });

  it('production: returns 404 (no free-premium hole)', async () => {
    const app = mountDev('production');
    const res = await app.request(
      '/v1/dev/grant-premium',
      { method: 'POST', headers: { 'X-Install-Id': IID } },
      reqEnv('production'),
    );
    expect(res.status).toBe(404);
  });

  it('missing X-Install-Id (development) → UNAUTHORIZED', async () => {
    const app = mountDev('development');
    const res = await app.request(
      '/v1/dev/grant-premium',
      { method: 'POST' },
      reqEnv('development'),
    );
    expect(res.status).toBe(401);
  });
});
