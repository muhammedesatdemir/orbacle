import { Hono } from 'hono';
import type { Env } from '../types/env';
import { isLocale, type Locale } from '../types/contract';
import { getConfig, toConfigResponse } from '../services/configService';

export const configRoute = new Hono<{ Bindings: Env }>();

// Public — no auth. Returns limits, feature flags, prompt versions, disclaimer.
// Locale picked from ?locale= (validated) so the disclosure copy is localized.
configRoute.get('/', async (c) => {
  const q = c.req.query('locale');
  const locale: Locale = isLocale(q) ? q : 'en';
  const cfg = await getConfig(c.env);
  return c.json(toConfigResponse(cfg, locale));
});
