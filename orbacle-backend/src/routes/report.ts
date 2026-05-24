import { Hono } from 'hono';
import type { Env, RequestVars } from '../types/env';
import type { ReportResponse } from '../types/contract';
import { authMiddleware } from '../middleware/auth';
import { rateLimit, REPORT_RULES } from '../middleware/rateLimit';
import { parseReportRequest } from '../lib/validate';
import { uuid } from '../lib/crypto';

export const reportRoute = new Hono<{ Bindings: Env; Variables: RequestVars }>();

reportRoute.use('*', authMiddleware, rateLimit(REPORT_RULES));

reportRoute.post('/', async (c) => {
  const userId = c.get('userId');
  const raw = await c.req.json().catch(() => null);
  const req = parseReportRequest(raw);
  const id = uuid();

  // Persist when D1 is available; otherwise still return success so the client
  // flow works during local dev (the report is simply not stored).
  if (c.env.DB) {
    try {
      await c.env.DB
        .prepare(
          `INSERT INTO reports
             (id, user_id, reading_id, reason, detail, question_text, answer_text, status, created_at)
           VALUES (?1,?2,?3,?4,?5,?6,?7,'open',?8)`,
        )
        .bind(
          id,
          userId,
          req.reading_id ?? null,
          req.reason,
          req.detail ?? null,
          req.question ?? null,
          req.answer ?? null,
          Date.now(),
        )
        .run();
    } catch (e) {
      console.error('report insert failed:', e);
    }
  }

  const body: ReportResponse = { ok: true, report_id: id };
  return c.json(body);
});
