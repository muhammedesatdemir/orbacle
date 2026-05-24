// Shared API contract between the Orbacle backend and the mobile app.
//
// This file is kept BYTE-FOR-BYTE in sync with the mobile copy at
// `src/api/contract.ts`. There is no build-time link between the two repos in
// Phase 3, so when you change one, mirror it in the other. Keep it dependency-
// free (pure types + small const arrays) so both sides can import it cleanly.

// --- Locales (must match the mobile app's supported languages) ---------------
export const LOCALES = [
  'tr', 'en', 'es-LA', 'pt-BR', 'hi-IN', 'id-ID', 'ar', 'de-DE', 'fr-FR', 'ja-JP',
] as const;
export type Locale = (typeof LOCALES)[number];

// --- Answer categories (must match the Phase 1 whisper categories) -----------
export const ANSWER_CATEGORIES = [
  'love', 'decision', 'career', 'money', 'family', 'daily',
  'uncertainty', 'patience', 'warning', 'newBeginning', 'yesNo', 'general',
] as const;
export type AnswerCategory = (typeof ANSWER_CATEGORIES)[number];

export type ReadingType = 'kahin' | 'deep';

// --- Requests ----------------------------------------------------------------
export interface ReadingRequest {
  question: string;
  // The Layer-1 whisper already shown to the user (context for the reading).
  whisper: string;
  locale: Locale;
  category?: AnswerCategory;
  // When true the backend may persist question/answer text (data minimization:
  // off by default). Phase 3 stores nothing unless this is true.
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

// --- Quota snapshot (returned with readings and entitlements) ----------------
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
  // Unix ms of the next UTC midnight (when daily counters reset).
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
  // True when the safety pre-filter returned a safe redirect instead of a
  // reading. In that case quota is NOT consumed.
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
  // Localized to the request locale (or the fallback) for the disclosure copy.
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
    // Seconds to wait before retrying (RATE_LIMITED).
    retry_after?: number;
  };
}

// Convenience type guards usable on both sides.
export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

export function isAnswerCategory(value: unknown): value is AnswerCategory {
  return typeof value === 'string' && (ANSWER_CATEGORIES as readonly string[]).includes(value);
}
