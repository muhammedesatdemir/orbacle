import type { MiddlewareHandler } from 'hono';
import type { Env, RequestVars } from '../types/env';
import { ApiError } from '../lib/errors';

// A single fixed-window counter. limit = max hits per window; windowSec = size.
export interface RateRule {
  key: string;
  limit: number;
  windowSec: number;
}

// In-memory fallback used when the RL KV namespace isn't bound (local dev / test).
// Per-isolate only — fine for smoke testing, not for production accuracy.
const memoryStore = new Map<string, { count: number; expires: number }>();

async function hit(env: Env, rule: RateRule, now: number): Promise<boolean> {
  const windowId = Math.floor(now / 1000 / rule.windowSec);
  const fullKey = `rl:${rule.key}:${windowId}`;

  if (env.RL) {
    const current = parseInt((await env.RL.get(fullKey)) ?? '0', 10);
    if (current >= rule.limit) return false;
    // Fixed-window increment. Not perfectly atomic on KV, but adequate as an
    // abuse guard (the goal is a ceiling, not exact accounting).
    await env.RL.put(fullKey, String(current + 1), { expirationTtl: rule.windowSec + 1 });
    return true;
  }

  // Memory fallback.
  const expires = (windowId + 1) * rule.windowSec * 1000;
  const entry = memoryStore.get(fullKey);
  if (entry && entry.expires > now) {
    if (entry.count >= rule.limit) return false;
    entry.count += 1;
    return true;
  }
  memoryStore.set(fullKey, { count: 1, expires });
  return true;
}

// Builds a middleware enforcing the given rules (per user + per IP + per route).
// `rules` receives the resolved userId and client IP so callers can compose keys.
export function rateLimit(
  rulesFor: (userId: string, ip: string) => RateRule[],
): MiddlewareHandler<{ Bindings: Env; Variables: RequestVars }> {
  return async (c, next) => {
    const userId = c.get('userId');
    const ip = c.req.header('CF-Connecting-IP') ?? 'local';
    const now = Date.now();
    const rules = rulesFor(userId, ip);
    for (const rule of rules) {
      const ok = await hit(c.env, rule, now);
      if (!ok) {
        throw new ApiError('RATE_LIMITED', {
          message: 'Too many requests. Please slow down.',
          retryAfter: rule.windowSec,
        });
      }
    }
    await next();
  };
}

// Standard rule sets (limits from the Phase 3 spec). Tunable in Phase 4-5.
export const READING_RULES = (tier: 'kahin' | 'deep') => (userId: string, ip: string): RateRule[] => [
  { key: `${tier}:min:${userId}`, limit: tier === 'kahin' ? 5 : 2, windowSec: 60 },
  { key: `user:hour:${userId}`, limit: 40, windowSec: 3600 },
  { key: `ip:hour:${ip}`, limit: 120, windowSec: 3600 },
];

export const REPORT_RULES = (userId: string, ip: string): RateRule[] => [
  { key: `report:min:${userId}`, limit: 5, windowSec: 60 },
  { key: `ip:hour:${ip}`, limit: 120, windowSec: 3600 },
];
