import type { MiddlewareHandler } from 'hono';
import type { Env, RequestVars } from '../types/env';
import { validateInstallId } from '../lib/validate';
import { ensureUser } from '../services/entitlementService';

// Anonymous auth: the client sends a generated install id in X-Install-Id.
// We validate it, upsert the user (if D1 is available), and stash it on the
// context as `userId`. No tokens, no login — the install id IS the identity.
export const authMiddleware: MiddlewareHandler<{ Bindings: Env; Variables: RequestVars }> = async (
  c,
  next,
) => {
  const installId = validateInstallId(c.req.header('X-Install-Id'));
  const platform = c.req.header('X-Device-Platform') ?? 'unknown';
  const locale = 'en';

  // Best-effort user upsert. If D1 isn't configured, ensureUser throws
  // MAINTENANCE — let it surface so routes don't run against a missing DB.
  if (c.env.DB) {
    await ensureUser(c.env, installId, platform, locale, Date.now());
  }

  c.set('userId', installId);
  await next();
};
