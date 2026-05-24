import { ReadingRequest, ReadingResult } from '../reading/types';
import {
  API_BASE_URL,
  API_PATHS,
  APP_VERSION,
  USE_BACKEND_KAHIN,
  USE_BACKEND_DEEP,
} from './config';
import { apiPost } from './apiClient';
import { classifyBackendError } from './apiError';
import { getInstallId } from './installId';
import type {
  ReadingResponse,
  QuotaSnapshot,
  PaywallReason,
  Locale,
} from '../api/contract';
import { Platform } from 'react-native';

// Whether a tier should hit the backend (vs the local mock). Backend is only
// used when its base URL is set and the per-tier flag is on. Phase 4: Kâhin yes,
// Deep no. The mobile app NEVER holds an API key — all LLM work is server-side.
export function tierUsesBackend(tier: ReadingResult['tier']): boolean {
  if (!API_BASE_URL) return false;
  return tier === 'kahin' ? USE_BACKEND_KAHIN : USE_BACKEND_DEEP;
}

// Simulated round-trip delay for the local mock path so the loading state shows.
const MOCK_MIN_MS = 900;
const MOCK_MAX_MS = 1600;
function mockDelay(): number {
  return MOCK_MIN_MS + Math.floor(Math.random() * (MOCK_MAX_MS - MOCK_MIN_MS));
}

// Rich result the UI can branch on. `quota` is present only for backend results
// (it is the server's source-of-truth snapshot to sync into local state).
export type OracleOutcome =
  | { kind: 'ok'; tier: ReadingResult['tier']; text: string; quota?: QuotaSnapshot }
  | { kind: 'safety'; tier: ReadingResult['tier']; text: string; quota?: QuotaSnapshot }
  | { kind: 'paywall'; tier: ReadingResult['tier']; reason?: PaywallReason }
  | { kind: 'fallback'; tier: ReadingResult['tier']; text: string };

// Maps the mobile `Language` to the backend `Locale`. They share the same string
// values today; the cast is centralized here in case they diverge later.
function toLocale(language: string): Locale {
  return language as Locale;
}

// Local mock reading (used by Deep, by Kâhin when the backend is off, and as the
// fallback when a backend call fails). Quota handling stays with the caller
// (local entitlement consume) in this path.
async function mockReading(
  req: ReadingRequest,
  renderPlaceholder: (req: ReadingRequest) => string,
): Promise<ReadingResult> {
  await new Promise<void>((resolve) => setTimeout(resolve, mockDelay()));
  return { tier: req.tier, text: renderPlaceholder(req) };
}

// Phase 2/3 compatible entry point kept for callers that only want a plain
// reading (currently unused by HomeScreen, which uses requestOutcome). Mock-only.
export async function requestReading(
  req: ReadingRequest,
  renderPlaceholder: (req: ReadingRequest) => string,
): Promise<ReadingResult> {
  return mockReading(req, renderPlaceholder);
}

// Main entry point for HomeScreen. Routes a tier to the backend or the local
// mock and returns a rich outcome. On ANY backend failure it falls back to a
// local mock reading so the user is never left with a blank/error screen.
export async function requestOutcome(
  req: ReadingRequest,
  renderPlaceholder: (req: ReadingRequest) => string,
): Promise<OracleOutcome> {
  if (!tierUsesBackend(req.tier)) {
    // Local mock path (Deep, or Kâhin when backend disabled). The caller handles
    // local quota consumption for this path.
    const r = await mockReading(req, renderPlaceholder);
    return { kind: 'ok', tier: req.tier, text: r.text };
  }

  try {
    const installId = await getInstallId();
    const path = req.tier === 'kahin' ? API_PATHS.readingKahin : API_PATHS.readingDeep;
    const res = await apiPost<ReadingResponse>(
      path,
      { installId, platform: Platform.OS, appVersion: APP_VERSION },
      {
        question: req.question,
        whisper: req.whisper,
        locale: toLocale(req.language),
        category: req.category,
        save: false,
      },
    );
    if (res.safety_blocked) {
      return { kind: 'safety', tier: req.tier, text: res.text, quota: res.quota };
    }
    return { kind: 'ok', tier: req.tier, text: res.text, quota: res.quota };
  } catch (e) {
    const cls = classifyBackendError(e);
    if (cls.paywall) {
      // Quota exhausted → let the UI open the paywall; do NOT fall back to mock.
      return { kind: 'paywall', tier: req.tier, reason: cls.reason };
    }
    // Network / timeout / UPSTREAM_ERROR / anything else → graceful local
    // fallback so the experience continues. Quota was not spent server-side.
    const r = await mockReading(req, renderPlaceholder);
    return { kind: 'fallback', tier: req.tier, text: r.text };
  }
}
