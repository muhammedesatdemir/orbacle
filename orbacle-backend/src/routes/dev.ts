import { Hono, type Context } from 'hono';
import type { Env, RequestVars } from '../types/env';
import { authMiddleware } from '../middleware/auth';
import { getConfig } from '../services/configService';
import {
  loadState,
  buildEntitlementsResponse,
  grantPremium,
  revokePremium,
  resetUser,
} from '../services/entitlementService';

type DevContext = Context<{ Bindings: Env; Variables: RequestVars }>;

// Development-only endpoints for testing premium/entitlement flows WITHOUT real
// payments. These are gated to ENVIRONMENT==='development' and return 404
// everywhere else, so there is no free-premium hole in production. NOT a payment
// path — RevenueCat/Billing land in Phase 6.
export const devRoute = new Hono<{ Bindings: Env; Variables: RequestVars }>();

// Gate: in any non-development environment these routes simply don't exist.
devRoute.use('*', async (c, next) => {
  if (c.env.ENVIRONMENT !== 'development') {
    return c.json({ ok: false, error: { code: 'INVALID_INPUT', message: 'Not found.' } }, 404);
  }
  await next();
});

// Auth (X-Install-Id) applies to all dev routes.
devRoute.use('*', authMiddleware);

// Returns the fresh EntitlementsResponse after a mutation.
async function respond(c: DevContext): Promise<Response> {
  const userId = c.get('userId');
  const now = Date.now();
  const cfg = await getConfig(c.env);
  const state = await loadState(c.env, userId, now);
  return c.json(buildEntitlementsResponse(state, cfg, now));
}

devRoute.post('/grant-premium', async (c) => {
  await grantPremium(c.env, c.get('userId'), Date.now());
  return respond(c);
});

devRoute.post('/revoke-premium', async (c) => {
  await revokePremium(c.env, c.get('userId'), Date.now());
  return respond(c);
});

devRoute.post('/reset-user', async (c) => {
  await resetUser(c.env, c.get('userId'), Date.now());
  return respond(c);
});
