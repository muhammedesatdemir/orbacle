import { Hono } from 'hono';
import type { Env } from '../types/env';
import type { HealthResponse } from '../types/contract';
import { getConfig } from '../services/configService';
import { resolveUseMock } from '../services/llmService';

export const healthRoute = new Hono<{ Bindings: Env }>();

healthRoute.get('/', async (c) => {
  const body: HealthResponse = {
    ok: true,
    service: 'orbacle-backend',
    version: c.env.SERVICE_VERSION ?? 'v1',
  };

  // Dev-only diagnostics to confirm the LLM wiring. Booleans only — the key
  // value is never exposed.
  if (c.env.ENVIRONMENT === 'development') {
    const cfg = await getConfig(c.env);
    body.debug = {
      environment: c.env.ENVIRONMENT,
      use_mock_llm_raw_present: c.env.USE_MOCK_LLM !== undefined && c.env.USE_MOCK_LLM !== '',
      use_mock_llm_parsed: resolveUseMock(c.env, cfg),
      has_openai_key: !!c.env.OPENAI_API_KEY,
    };
  }

  return c.json(body);
});
