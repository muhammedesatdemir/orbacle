import type { Context } from 'hono';
import { ApiError } from '../lib/errors';

// Central error serializer. ApiError → its mapped status + ApiErrorResponse;
// anything else → 500 INTERNAL without leaking internals. Wired via app.onError.
export function errorHandler(err: Error, c: Context): Response {
  if (err instanceof ApiError) {
    const body = err.toResponse();
    const headers: Record<string, string> = {};
    if (err.retryAfter !== undefined) headers['Retry-After'] = String(err.retryAfter);
    return c.json(body, err.status as 400, headers);
  }
  // Unexpected — log to the Worker console, return a generic 500.
  console.error('Unhandled error:', err);
  return c.json(
    { ok: false, error: { code: 'INTERNAL', message: 'Something went wrong.' } },
    500,
  );
}
