import { Hono } from 'hono';
import type { Env, RequestVars } from '../types/env';
import { authMiddleware } from '../middleware/auth';
import { rateLimit, READING_RULES } from '../middleware/rateLimit';
import { handleReading } from './reading';

export const deepRoute = new Hono<{ Bindings: Env; Variables: RequestVars }>();

deepRoute.use('*', authMiddleware, rateLimit(READING_RULES('deep')));
deepRoute.post('/', (c) => handleReading(c, 'deep'));
