import { Platform } from 'react-native';

// App-level service config.
//
// Phase 4: Kâhin is wired to the backend; Deep stays mock. The API key lives
// ONLY on the backend (a Wrangler secret) — never here.

// Local dev base URLs. Android emulator reaches the host via 10.0.2.2; iOS
// simulator uses localhost. A physical device needs the host's LAN IP instead.
// Production: replace with the deployed Worker URL.
const LOCAL_BASE_URL = Platform.OS === 'android' ? 'http://10.0.2.2:8787' : 'http://localhost:8787';

// Single source of truth for the API base. Empty disables backend calls
// (oracleService then stays on the local mock).
export const API_BASE_URL = LOCAL_BASE_URL;

// Per-tier backend switches. Phase 5: both Kâhin and Deep use the backend.
// Set either to false to fall back to that tier's local mock.
export const USE_BACKEND_KAHIN = true;
export const USE_BACKEND_DEEP = true;

// Phase 5.1: lets the placeholder "Go Premium" button sync premium with the
// backend via the dev-only endpoint, so backend quota matches the UI in testing.
// This is NOT a payment path. SET TO false FOR PRODUCTION BUILDS — the matching
// backend endpoint is also gated to ENVIRONMENT==='development', so there is no
// real free-premium hole, but keep this off in prod for clarity.
export const ENABLE_DEV_PREMIUM_SYNC = true;

// Network timeout for backend calls.
export const API_TIMEOUT_MS = 20000;

// App version sent in the X-App-Version header (informational).
export const APP_VERSION = '1.2';

// Mirror of the backend's v1 paths.
export const API_PATHS = {
  health: '/v1/health',
  config: '/v1/config',
  entitlements: '/v1/entitlements',
  readingKahin: '/v1/reading/kahin',
  readingDeep: '/v1/reading/deep',
  report: '/v1/report',
  devGrantPremium: '/v1/dev/grant-premium',
  devRevokePremium: '/v1/dev/revoke-premium',
  devResetUser: '/v1/dev/reset-user',
} as const;
