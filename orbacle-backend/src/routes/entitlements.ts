import { Hono } from 'hono';
import type { Env, RequestVars } from '../types/env';
import type { EntitlementsResponse } from '../types/contract';
import { authMiddleware } from '../middleware/auth';
import { getConfig } from '../services/configService';
import { loadState, buildQuota } from '../services/entitlementService';

export const entitlementsRoute = new Hono<{ Bindings: Env; Variables: RequestVars }>();

entitlementsRoute.use('*', authMiddleware);

entitlementsRoute.get('/', async (c) => {
  const userId = c.get('userId');
  const now = Date.now();
  const cfg = await getConfig(c.env);
  const state = await loadState(c.env, userId, now);
  const quota = buildQuota(state, cfg, now);

  const body: EntitlementsResponse = {
    ok: true,
    premium: state.premium,
    premium_expires_at: state.ent.premium_expires_at,
    deep_pack_balance: state.ent.deep_pack_balance,
    first_deep_used: state.ent.first_deep_used > 0,
    quota,
  };
  return c.json(body);
});
