// App-level service config. Phase 3: scaffolding only — the app does not call
// the backend yet (oracleService runs the local mock). Phase 4 will read the
// real base URL (e.g. from app.json `extra`) and flip oracleService off mock.

// Placeholder base URL. Replace with the deployed Worker URL in Phase 4
// (e.g. https://orbacle-backend.<account>.workers.dev). Kept here so there is a
// single source of truth when wiring goes live.
export const API_BASE_URL = '';

// Network timeout for backend calls (Phase 4).
export const API_TIMEOUT_MS = 20000;

// Mirror of the backend's v1 paths.
export const API_PATHS = {
  health: '/v1/health',
  config: '/v1/config',
  entitlements: '/v1/entitlements',
  readingKahin: '/v1/reading/kahin',
  readingDeep: '/v1/reading/deep',
  report: '/v1/report',
} as const;
