// Shared API contract between the Orbacle mobile app and the backend.
//
// This file is kept BYTE-FOR-BYTE in sync with the backend copy at
// `orbacle-backend/src/types/contract.ts`. There is no build-time link between
// the two, so when you change one, mirror it in the other. Dependency-free.
//
// Phase 3: defined for readiness only. The app does NOT call the backend yet —
// oracleService still runs the local mock (USE_MOCK=true). Wiring happens in
// Phase 4.

// --- Locales (must match the mobile app's supported languages) ---------------
export const LOCALES = [
  'tr', 'en', 'es-LA', 'pt-BR', 'hi-IN', 'id-ID', 'ar', 'de-DE', 'fr-FR', 'ja-JP',
] as const;
export type Locale = (typeof LOCALES)[number];

// --- Answer categories (must match the Phase 1 whisper categories) -----------
export const ANSWER_CATEGORIES = [
  'love', 'decision', 'career', 'money', 'family', 'daily',
  'uncertainty', 'patience', 'warning', 'newBeginning', 'competition', 'yesNo', 'general',
] as const;
export type AnswerCategory = (typeof ANSWER_CATEGORIES)[number];

export type ReadingType = 'kahin' | 'deep';

// --- Requests ----------------------------------------------------------------
export interface ReadingRequest {
  question: string;
  whisper: string;
  locale: Locale;
  category?: AnswerCategory;
  save?: boolean;
}

export interface ReportRequest {
  reading_id?: string;
  reason: ReportReason;
  detail?: string;
  question?: string;
  answer?: string;
}

export type ReportReason = 'offensive' | 'inaccurate' | 'harmful' | 'other';

// --- Quota snapshot ----------------------------------------------------------
export interface TierQuota {
  used: number;
  limit: number;
  remaining: number;
}

export interface QuotaSnapshot {
  premium: boolean;
  kahin: TierQuota;
  deep: TierQuota;
  deep_pack_balance: number;
  resets_at: number;
}

// --- Responses ---------------------------------------------------------------
export interface ReadingResponse {
  ok: true;
  reading_id: string;
  type: ReadingType;
  text: string;
  locale: Locale;
  created_at: number;
  safety_blocked: boolean;
  quota: QuotaSnapshot;
  disclaimer: string;
}

export interface EntitlementsResponse {
  ok: true;
  premium: boolean;
  premium_expires_at: number | null;
  deep_pack_balance: number;
  first_deep_used: boolean;
  quota: QuotaSnapshot;
}

export interface ReportResponse {
  ok: true;
  report_id: string;
}

export interface HealthResponse {
  ok: true;
  service: 'orbacle-backend';
  version: string;
  // Present only in development. Booleans only — never the key value.
  debug?: {
    environment: string;
    use_mock_llm_raw_present: boolean;
    use_mock_llm_parsed: boolean;
    has_openai_key: boolean;
  };
}

export interface ConfigResponse {
  ok: true;
  limits: {
    free_kahin_daily: number;
    rewarded_kahin_daily_max: number;
    premium_kahin_daily: number;
    premium_deep_daily: number;
    deep_trial_lifetime: number;
    question_max_chars: number;
    whisper_max_chars: number;
  };
  feature_flags: {
    deep_enabled: boolean;
    rewarded_ads_enabled: boolean;
    maintenance_mode: boolean;
  };
  prompt_versions: {
    kahin: string;
    deep: string;
  };
  disclaimer: string;
}

// --- Errors ------------------------------------------------------------------
export type ApiErrorCode =
  | 'INVALID_INPUT'
  | 'UNAUTHORIZED'
  | 'NEEDS_PAYWALL'
  | 'NO_QUOTA'
  | 'RATE_LIMITED'
  | 'UPSTREAM_ERROR'
  | 'MAINTENANCE'
  | 'INTERNAL';

export type PaywallReason =
  | 'free_kahin_exhausted'
  | 'free_deep_trial_used'
  | 'deep_pack_empty';

export interface ApiErrorResponse {
  ok: false;
  error: {
    code: ApiErrorCode;
    message: string;
    paywall_reason?: PaywallReason;
    retry_after?: number;
  };
}

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

export function isAnswerCategory(value: unknown): value is AnswerCategory {
  return typeof value === 'string' && (ANSWER_CATEGORIES as readonly string[]).includes(value);
}
