import { API_BASE_URL, API_TIMEOUT_MS } from './config';
import type { ApiErrorResponse } from '../api/contract';

// Thin fetch wrapper for the backend. Phase 3: present but UNUSED — oracleService
// stays on the local mock (USE_MOCK=true). Phase 4 wires this in once a real
// API_BASE_URL and an install id exist. No axios; native fetch + AbortController.

// Thrown on non-2xx responses; carries the parsed ApiErrorResponse when present.
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

export interface ApiClientOptions {
  // The anonymous install id sent as X-Install-Id. Generation lands in Phase 4.
  installId: string;
  platform?: string;
  appVersion?: string;
}

async function request<T>(
  method: 'GET' | 'POST',
  path: string,
  opts: ApiClientOptions,
  body?: unknown,
): Promise<T> {
  if (!API_BASE_URL) {
    // Guards against accidental use before Phase 4 wiring.
    throw new ApiClientError(0, 'API base URL is not configured yet.');
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      method,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'X-Install-Id': opts.installId,
        'X-Device-Platform': opts.platform ?? 'unknown',
        'X-App-Version': opts.appVersion ?? '',
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const json = (await res.json().catch(() => undefined)) as T | ApiErrorResponse | undefined;
    if (!res.ok) {
      throw new ApiClientError(
        res.status,
        `Request failed: ${res.status}`,
        json as ApiErrorResponse | undefined,
      );
    }
    return json as T;
  } finally {
    clearTimeout(timer);
  }
}

export function apiGet<T>(path: string, opts: ApiClientOptions): Promise<T> {
  return request<T>('GET', path, opts);
}

export function apiPost<T>(path: string, opts: ApiClientOptions, body: unknown): Promise<T> {
  return request<T>('POST', path, opts, body);
}
