import { Hono } from 'hono';
import type { Env, RequestVars } from '../types/env';
import { authMiddleware } from '../middleware/auth';
import { rateLimit, READING_RULES } from '../middleware/rateLimit';
import { handleReading } from './reading';

export const kahinRoute = new Hono<{ Bindings: Env; Variables: RequestVars }>();

kahinRoute.use('*', authMiddleware, rateLimit(READING_RULES('kahin')));
kahinRoute.post('/', (c) => handleReading(c, 'kahin'));
