import { Hono } from 'hono';
import type { Env } from '../types/env';
import type { HealthResponse } from '../types/contract';

export const healthRoute = new Hono<{ Bindings: Env }>();

healthRoute.get('/', (c) => {
  const body: HealthResponse = {
    ok: true,
    service: 'orbacle-backend',
    version: c.env.SERVICE_VERSION ?? 'v1',
  };
  return c.json(body);
});
