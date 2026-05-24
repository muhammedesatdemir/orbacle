import type { ApiErrorResponse, PaywallReason } from '../api/contract';

// Thrown by apiClient on non-2xx responses; carries the parsed ApiErrorResponse
// when the body matched the contract. Kept in its own module (no react-native
// imports) so pure logic and tests can use it without pulling in RN.
export class ApiClientError extends Error {
  readonly status: number;
  readonly body?: ApiErrorResponse;
  constructor(status: number, message: string, body?: ApiErrorResponse) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.body = body;
  }
}

// Decides how to handle a thrown backend error: a paywall/quota error opens the
// paywall; anything else (network, timeout, upstream, parse) means graceful
// local fallback. Pure + dependency-free so it can be unit-tested on plain Node.
export function classifyBackendError(
  error: unknown,
): { paywall: true; reason?: PaywallReason } | { paywall: false } {
  if (error instanceof ApiClientError && error.body && !error.body.ok) {
    const code = error.body.error.code;
    if (code === 'NEEDS_PAYWALL' || code === 'NO_QUOTA') {
      return { paywall: true, reason: error.body.error.paywall_reason };
    }
  }
  return { paywall: false };
}
