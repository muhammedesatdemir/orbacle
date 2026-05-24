# orbacle-backend

Cloudflare Workers backend for Orbacle's **Kâhin Yorumu** and **Derin Kehanet** tiers.

> **Phase 3 status:** scaffold + API contract + **mock** readings. No real LLM,
> no OpenAI key, no payments, no RevenueCat. The mobile app is **not** wired to
> this yet — it still runs the Phase 2 local mock (`USE_MOCK=true`).

## Stack

Cloudflare Workers · Hono · D1 (SQLite) · KV · Wrangler · TypeScript.

## Layout

```
src/
  index.ts            Hono app + route mounting
  types/              contract.ts (shared with mobile), env.ts, db.ts
  middleware/         cors, auth (X-Install-Id), rateLimit, errorHandler
  routes/             health, config, entitlements, kahin, deep, report, revenuecatWebhook
  services/           config, entitlement, usage, safety, prompt, llm (mock)
  lib/                errors, dates, validate, crypto
migrations/           0001_init, 0002_readings_reports, 0003_indexes
seed/                 config_v1.json, prompt_kahin_v1.txt, prompt_deep_v1.txt
test/                 vitest unit tests
```

## Local setup

```bash
cd orbacle-backend
npm install

# One-time: create D1 + KV, then paste the IDs into wrangler.toml placeholders
wrangler d1 create orbacle
wrangler kv namespace create CONFIG
wrangler kv namespace create RL

# Apply migrations locally
npm run db:migrate:local

# (Optional) load the KV config/prompt seeds locally
wrangler kv key put --binding=CONFIG "config_v1" --path=seed/config_v1.json --local
wrangler kv key put --binding=CONFIG "prompt_kahin_v1" --path=seed/prompt_kahin_v1.txt --local
wrangler kv key put --binding=CONFIG "prompt_deep_v1" --path=seed/prompt_deep_v1.txt --local

# Run
npm run dev          # http://localhost:8787
npm run typecheck
npm test
```

> If KV/D1 are not configured, the worker degrades gracefully: config falls back
> to the bundled `seed/config_v1.json` defaults, rate limiting falls back to an
> in-memory limiter, and entitlement/report routes return `MAINTENANCE` rather
> than crashing. This keeps `wrangler dev` usable for smoke testing the contract.

## Smoke test (with `wrangler dev` running)

```bash
curl localhost:8787/v1/health
curl localhost:8787/v1/config
curl -H "X-Install-Id: 11111111-1111-1111-1111-111111111111" localhost:8787/v1/entitlements
curl -X POST localhost:8787/v1/reading/kahin \
  -H "X-Install-Id: 11111111-1111-1111-1111-111111111111" \
  -H "Content-Type: application/json" \
  -d '{"question":"Ona tekrar yazmalı mıyım?","whisper":"Bekleyen kalp...","locale":"tr","category":"love"}'
```

## Secrets (never in git)

```bash
wrangler secret put OPENAI_API_KEY             # Phase 4
wrangler secret put REVENUECAT_WEBHOOK_SECRET  # Phase 6
```
