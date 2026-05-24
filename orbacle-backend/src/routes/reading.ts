import type { Context } from 'hono';
import type { Env, RequestVars } from '../types/env';
import type { ReadingResponse, ReadingType } from '../types/contract';
import { ApiError } from '../lib/errors';
import { parseReadingRequest } from '../lib/validate';
import { getConfig, disclaimerFor } from '../services/configService';
import { prefilter, safeMessageFor } from '../services/safetyService';
import {
  loadState,
  buildQuota,
  canUseKahin,
  canUseDeep,
  consume,
  paywallReasonFor,
} from '../services/entitlementService';
import { buildMessages, promptVersionFor } from '../services/promptService';
import { generateReading } from '../services/llmService';
import { logReading } from '../services/usageService';

type Ctx = Context<{ Bindings: Env; Variables: RequestVars }>;

// Shared handler for both reading tiers. Order is deliberate:
//   1. validate input            -> INVALID_INPUT
//   2. maintenance / feature gate -> MAINTENANCE / NO_QUOTA
//   3. safety pre-filter          -> HTTP 200, safe message, NO quota spent
//   4. availability check (no decrement yet)
//   5. generate reading (mock now; real LLM later) -> UPSTREAM_ERROR (no spend)
//   6. consume quota (atomic)     -> only after a successful reading
//   7. log + respond
export async function handleReading(c: Ctx, tier: ReadingType): Promise<Response> {
  const userId = c.get('userId');
  const now = Date.now();
  const cfg = await getConfig(c.env);

  if (cfg.featureFlags.maintenance_mode) {
    throw new ApiError('MAINTENANCE', { message: 'Service is temporarily unavailable.' });
  }
  if (tier === 'deep' && !cfg.featureFlags.deep_enabled) {
    throw new ApiError('NO_QUOTA', { message: 'Deep readings are currently disabled.' });
  }

  const raw = await c.req.json().catch(() => null);
  const req = parseReadingRequest(raw, cfg.questionMaxChars, cfg.whisperMaxChars);
  const category = req.category ?? 'general';

  // 3) Safety pre-filter — never spends quota, returns a safe redirect at 200.
  const safety = prefilter(req.question, req.whisper);
  if (safety.blocked) {
    const state = await loadState(c.env, userId, now);
    const readingId = await logReading(c.env, {
      userId,
      type: tier,
      locale: req.locale,
      category,
      promptVersion: promptVersionFor(tier, cfg.activePromptVersions),
      model: 'none',
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      safetyFlag: safety.flag ?? 'blocked',
      question: req.save ? req.question : null,
      whisper: req.save ? req.whisper : null,
      answer: null,
    });
    const body: ReadingResponse = {
      ok: true,
      reading_id: readingId,
      type: tier,
      text: safeMessageFor(req.locale),
      locale: req.locale,
      created_at: now,
      safety_blocked: true,
      quota: buildQuota(state, cfg, now),
      disclaimer: disclaimerFor(req.locale),
    };
    return c.json(body);
  }

  // 4) Availability check before doing any (mock) work, to avoid wasted calls.
  const pre = await loadState(c.env, userId, now);
  const available = tier === 'kahin' ? canUseKahin(pre, cfg) : canUseDeep(pre, cfg);
  if (!available) {
    if (pre.premium) throw new ApiError('NO_QUOTA', { message: 'Daily limit reached.' });
    throw new ApiError('NEEDS_PAYWALL', {
      message: 'Additional access is needed for this reading.',
      paywallReason: paywallReasonFor(tier, pre, cfg),
    });
  }

  // 5) Generate — Kâhin can use the real LLM (Phase 4); Deep stays mock. On any
  // failure generateReading throws (UPSTREAM_ERROR) and quota is NOT spent.
  const promptVersion = promptVersionFor(tier, cfg.activePromptVersions);
  const messages = await buildMessages(c.env, promptVersion, {
    question: req.question,
    whisper: req.whisper,
    category,
    locale: req.locale,
  });
  const maxTokens = tier === 'kahin' ? cfg.kahinMaxTokens : cfg.deepMaxTokens;
  const model = tier === 'kahin' ? cfg.kahinModel : cfg.deepModel;
  const llm = await generateReading(c.env, cfg, {
    tier,
    messages,
    locale: req.locale,
    category,
    model,
    maxTokens,
    temperature: cfg.llmTemperature,
  });

  // 6) Consume quota atomically AFTER a successful reading.
  const after = await consume(c.env, userId, tier, cfg, now);

  // 7) Log (best-effort) + respond.
  const readingId = await logReading(c.env, {
    userId,
    type: tier,
    locale: req.locale,
    category,
    promptVersion,
    model: llm.model,
    promptTokens: llm.promptTokens,
    completionTokens: llm.completionTokens,
    totalTokens: llm.totalTokens,
    safetyFlag: null,
    question: req.save ? req.question : null,
    whisper: req.save ? req.whisper : null,
    answer: req.save ? llm.text : null,
  });

  const body: ReadingResponse = {
    ok: true,
    reading_id: readingId,
    type: tier,
    text: llm.text,
    locale: req.locale,
    created_at: now,
    safety_blocked: false,
    quota: buildQuota(after, cfg, now),
    disclaimer: disclaimerFor(req.locale),
  };
  return c.json(body);
}
