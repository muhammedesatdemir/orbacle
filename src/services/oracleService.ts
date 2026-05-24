import { ReadingRequest, ReadingResult } from '../reading/types';

// Phase 2 is fully local: no backend, no AI, no network. This service only
// simulates the latency of a future remote call and returns placeholder text
// supplied by the caller (built from localized i18n templates, so nothing is
// generated on-device and no "AI" wording is involved). When the backend lands
// (Phase 4), flip USE_MOCK to false and route through the real API client; the
// caller-facing signature stays the same.
export const USE_MOCK = true;

// Simulated round-trip delay range (ms) so the loading state is exercised and
// the reveal feels deliberate rather than instant.
const MOCK_MIN_MS = 900;
const MOCK_MAX_MS = 1600;

function mockDelay(): number {
  return MOCK_MIN_MS + Math.floor(Math.random() * (MOCK_MAX_MS - MOCK_MIN_MS));
}

// `renderPlaceholder` turns the request into the localized placeholder body.
// Kept as a callback so this service never imports i18n (a React hook) and
// stays a pure async boundary.
export async function requestReading(
  req: ReadingRequest,
  renderPlaceholder: (req: ReadingRequest) => string,
): Promise<ReadingResult> {
  if (USE_MOCK) {
    await new Promise<void>((resolve) => setTimeout(resolve, mockDelay()));
    return { tier: req.tier, text: renderPlaceholder(req) };
  }
  // Phase 4: real backend call goes here.
  throw new Error('Remote oracle service not implemented yet.');
}
