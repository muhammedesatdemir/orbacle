import type { Env } from '../types/env';
import type { ConfigResponse, Locale } from '../types/contract';

// Runtime config shape (superset of what we expose via /v1/config). Stored in
// KV under "config_v1"; falls back to DEFAULT_CONFIG when KV is absent.
export interface AppConfig {
  freeKahinDailyLimit: number;
  rewardedKahinDailyMax: number;
  premiumKahinDailyLimit: number;
  premiumDeepDailyLimit: number;
  deepTrialLifetime: number;
  kahinMaxTokens: number;
  deepMaxTokens: number;
  questionMaxChars: number;
  whisperMaxChars: number;
  activePromptVersions: { kahin: string; deep: string };
  useMockLLM: boolean;
  featureFlags: {
    deep_enabled: boolean;
    rewarded_ads_enabled: boolean;
    maintenance_mode: boolean;
  };
}

// Mirror of seed/config_v1.json — used when KV has no config_v1 key (e.g. local
// `wrangler dev` before seeding). Keep the two in sync.
export const DEFAULT_CONFIG: AppConfig = {
  freeKahinDailyLimit: 1,
  rewardedKahinDailyMax: 2,
  premiumKahinDailyLimit: 30,
  premiumDeepDailyLimit: 3,
  deepTrialLifetime: 1,
  kahinMaxTokens: 220,
  deepMaxTokens: 700,
  questionMaxChars: 200,
  whisperMaxChars: 120,
  activePromptVersions: { kahin: 'prompt_kahin_v1', deep: 'prompt_deep_v1' },
  useMockLLM: true,
  featureFlags: {
    deep_enabled: true,
    rewarded_ads_enabled: false,
    maintenance_mode: false,
  },
};

const DISCLAIMERS: Record<Locale, string> = {
  tr: 'Yorumlar eğlence ve kişisel farkındalık amaçlıdır.',
  en: 'Readings are for entertainment and personal reflection.',
  'es-LA': 'Las lecturas son para entretenimiento y reflexión personal.',
  'pt-BR': 'As leituras são para entretenimento e reflexão pessoal.',
  'hi-IN': 'व्याख्याएँ मनोरंजन और व्यक्तिगत आत्म-चिंतन के लिए हैं।',
  'id-ID': 'Bacaan ini untuk hiburan dan refleksi pribadi.',
  ar: 'القراءات للترفيه والتأمل الشخصي.',
  'de-DE': 'Deutungen dienen der Unterhaltung und persönlichen Reflexion.',
  'fr-FR': 'Les lectures sont à but de divertissement et de réflexion personnelle.',
  'ja-JP': '読み解きは娯楽と自己内省のためのものです。',
};

export function disclaimerFor(locale: Locale): string {
  return DISCLAIMERS[locale] ?? DISCLAIMERS.en;
}

// Merges a partial KV-parsed config over the defaults so a malformed/partial
// config can never crash the worker.
function mergeConfig(partial: unknown): AppConfig {
  if (typeof partial !== 'object' || partial === null) return DEFAULT_CONFIG;
  const p = partial as Record<string, unknown>;
  const num = (v: unknown, d: number) => (typeof v === 'number' && Number.isFinite(v) ? v : d);
  const pv = (p.activePromptVersions ?? {}) as Record<string, unknown>;
  const ff = (p.featureFlags ?? {}) as Record<string, unknown>;
  const bool = (v: unknown, d: boolean) => (typeof v === 'boolean' ? v : d);
  return {
    freeKahinDailyLimit: num(p.freeKahinDailyLimit, DEFAULT_CONFIG.freeKahinDailyLimit),
    rewardedKahinDailyMax: num(p.rewardedKahinDailyMax, DEFAULT_CONFIG.rewardedKahinDailyMax),
    premiumKahinDailyLimit: num(p.premiumKahinDailyLimit, DEFAULT_CONFIG.premiumKahinDailyLimit),
    premiumDeepDailyLimit: num(p.premiumDeepDailyLimit, DEFAULT_CONFIG.premiumDeepDailyLimit),
    deepTrialLifetime: num(p.deepTrialLifetime, DEFAULT_CONFIG.deepTrialLifetime),
    kahinMaxTokens: num(p.kahinMaxTokens, DEFAULT_CONFIG.kahinMaxTokens),
    deepMaxTokens: num(p.deepMaxTokens, DEFAULT_CONFIG.deepMaxTokens),
    questionMaxChars: num(p.questionMaxChars, DEFAULT_CONFIG.questionMaxChars),
    whisperMaxChars: num(p.whisperMaxChars, DEFAULT_CONFIG.whisperMaxChars),
    activePromptVersions: {
      kahin: typeof pv.kahin === 'string' ? pv.kahin : DEFAULT_CONFIG.activePromptVersions.kahin,
      deep: typeof pv.deep === 'string' ? pv.deep : DEFAULT_CONFIG.activePromptVersions.deep,
    },
    useMockLLM: bool(p.useMockLLM, DEFAULT_CONFIG.useMockLLM),
    featureFlags: {
      deep_enabled: bool(ff.deep_enabled, DEFAULT_CONFIG.featureFlags.deep_enabled),
      rewarded_ads_enabled: bool(ff.rewarded_ads_enabled, DEFAULT_CONFIG.featureFlags.rewarded_ads_enabled),
      maintenance_mode: bool(ff.maintenance_mode, DEFAULT_CONFIG.featureFlags.maintenance_mode),
    },
  };
}

// Reads config_v1 from KV, falling back to DEFAULT_CONFIG. Cheap enough to call
// per-request in Phase 3; a per-isolate cache can be added later if needed.
export async function getConfig(env: Env): Promise<AppConfig> {
  if (!env.CONFIG) return DEFAULT_CONFIG;
  try {
    const raw = await env.CONFIG.get('config_v1', 'json');
    return mergeConfig(raw);
  } catch {
    return DEFAULT_CONFIG;
  }
}

// Builds the public /v1/config payload (subset of AppConfig) for a locale.
export function toConfigResponse(cfg: AppConfig, locale: Locale): ConfigResponse {
  return {
    ok: true,
    limits: {
      free_kahin_daily: cfg.freeKahinDailyLimit,
      rewarded_kahin_daily_max: cfg.rewardedKahinDailyMax,
      premium_kahin_daily: cfg.premiumKahinDailyLimit,
      premium_deep_daily: cfg.premiumDeepDailyLimit,
      deep_trial_lifetime: cfg.deepTrialLifetime,
      question_max_chars: cfg.questionMaxChars,
      whisper_max_chars: cfg.whisperMaxChars,
    },
    feature_flags: cfg.featureFlags,
    prompt_versions: cfg.activePromptVersions,
    disclaimer: disclaimerFor(locale),
  };
}
