import type { Env } from '../types/env';
import type { ReadingType } from '../types/contract';
import { uuid } from '../lib/crypto';

export interface ReadingLogInput {
  userId: string;
  type: ReadingType;
  locale: string;
  category: string | null;
  promptVersion: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  safetyFlag: string | null;
  // Persisted ONLY when the request opted in (data minimization).
  question: string | null;
  whisper: string | null;
  answer: string | null;
}

// Inserts a readings row and returns its id. Best-effort: a logging failure must
// never fail the user's reading (it already succeeded), so callers may ignore
// errors. If D1 is absent we still return a generated id so the response is valid.
export async function logReading(env: Env, input: ReadingLogInput): Promise<string> {
  const id = uuid();
  if (!env.DB) return id;
  try {
    await env.DB
      .prepare(
        `INSERT INTO readings
           (id, user_id, type, locale, category, prompt_version, model,
            prompt_tokens, completion_tokens, total_tokens, safety_flag, created_at,
            question_text, whisper_text, answer_text)
         VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?15)`,
      )
      .bind(
        id,
        input.userId,
        input.type,
        input.locale,
        input.category,
        input.promptVersion,
        input.model,
        input.promptTokens,
        input.completionTokens,
        input.totalTokens,
        input.safetyFlag,
        Date.now(),
        input.question,
        input.whisper,
        input.answer,
      )
      .run();
  } catch {
    // Swallow — the reading was already produced; logging is non-critical.
  }
  return id;
}
