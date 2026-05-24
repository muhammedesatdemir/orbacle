import { Hono } from 'hono';
import type { Env } from '../types/env';
import { timingSafeEqual } from '../lib/crypto';

// Phase 3 PLACEHOLDER. Real RevenueCat event processing (premium activation,
// expiration, deep-pack credits, idempotency) lands in Phase 6. For now we only:
//   - (optionally) verify the Authorization secret if one is configured,
//   - return 200 fast so RevenueCat doesn't retry.
// No D1 writes, no entitlement changes here yet.
export const revenuecatWebhookRoute = new Hono<{ Bindings: Env }>();

revenuecatWebhookRoute.post('/', async (c) => {
  const secret = c.env.REVENUECAT_WEBHOOK_SECRET;
  if (secret) {
    const provided = c.req.header('Authorization') ?? '';
    if (!timingSafeEqual(provided, secret)) {
      // Don't touch any data on an unverified call.
      return c.json({ ok: false, error: { code: 'UNAUTHORIZED', message: 'Bad signature.' } }, 401);
    }
  }
  // TODO(Phase 6): parse event, update entitlements in D1, idempotency on event.id.
  return c.json({ ok: true, received: true });
});
