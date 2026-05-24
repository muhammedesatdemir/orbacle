import type { ApiErrorCode, ApiErrorResponse, PaywallReason } from '../types/contract';

// Maps each error code to its HTTP status. Note: SAFETY is NOT an error — a
// safety-blocked reading returns HTTP 200 with safety_blocked:true.
const STATUS: Record<ApiErrorCode, number> = {
  INVALID_INPUT: 400,
  UNAUTHORIZED: 401,
  NEEDS_PAYWALL: 402,
  NO_QUOTA: 403,
  RATE_LIMITED: 429,
  UPSTREAM_ERROR: 502,
  MAINTENANCE: 503,
  INTERNAL: 500,
};

export interface ApiErrorOptions {
  message?: string;
  paywallReason?: PaywallReason;
  retryAfter?: number;
}

// Thrown anywhere in a route/service; caught by the errorHandler middleware and
// serialized to ApiErrorResponse with the right status.
export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;
  readonly paywallReason?: PaywallReason;
  readonly retryAfter?: number;

  constructor(code: ApiErrorCode, opts: ApiErrorOptions = {}) {
    super(opts.message ?? code);
    this.name = 'ApiError';
    this.code = code;
    this.status = STATUS[code];
    this.paywallReason = opts.paywallReason;
    this.retryAfter = opts.retryAfter;
  }

  toResponse(): ApiErrorResponse {
    return {
      ok: false,
      error: {
        code: this.code,
        message: this.message,
        ...(this.paywallReason ? { paywall_reason: this.paywallReason } : {}),
        ...(this.retryAfter !== undefined ? { retry_after: this.retryAfter } : {}),
      },
    };
  }
}

export function statusFor(code: ApiErrorCode): number {
  return STATUS[code];
}
