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

// Per-tier backend switches. Phase 4: Kâhin on, Deep off (stays mock).
export const USE_BACKEND_KAHIN = true;
export const USE_BACKEND_DEEP = false;

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
} as const;
