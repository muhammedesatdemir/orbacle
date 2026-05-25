import { Hono } from 'hono';
import type { Env, RequestVars } from '../types/env';
import { authMiddleware } from '../middleware/auth';
import { getConfig } from '../services/configService';
import { loadState, buildEntitlementsResponse } from '../services/entitlementService';

export const entitlementsRoute = new Hono<{ Bindings: Env; Variables: RequestVars }>();

entitlementsRoute.use('*', authMiddleware);

entitlementsRoute.get('/', async (c) => {
  const userId = c.get('userId');
  const now = Date.now();
  const cfg = await getConfig(c.env);
  const state = await loadState(c.env, userId, now);
  return c.json(buildEntitlementsResponse(state, cfg, now));
});
