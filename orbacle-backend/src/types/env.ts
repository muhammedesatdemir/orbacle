// Cloudflare bindings + vars + secrets available on the Worker env.
// Bindings may be undefined in local/test contexts; services degrade gracefully.
export interface Env {
  // D1 database (migrations in /migrations). Optional so `wrangler dev` works
  // before binding IDs are filled in.
  DB?: D1Database;
  // KV namespace holding config_v1 and prompt_* keys.
  CONFIG?: KVNamespace;
  // KV namespace for rate-limit counters (short TTLs).
  RL?: KVNamespace;

  // Vars (wrangler.toml [vars]).
  ENVIRONMENT?: string;
  SERVICE_VERSION?: string;
  USE_MOCK_LLM?: string; // "true" in Phase 3

  // Secrets (wrangler secret put). Empty/undefined in Phase 3.
  OPENAI_API_KEY?: string;
  REVENUECAT_WEBHOOK_SECRET?: string;
}

// Per-request values stashed on Hono's context via c.set(...).
export interface RequestVars {
  userId: string; // resolved install id (auth middleware)
}
