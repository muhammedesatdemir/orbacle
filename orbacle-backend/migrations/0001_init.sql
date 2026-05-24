-- Orbacle backend — core tables: users, entitlements, daily_usage.

CREATE TABLE IF NOT EXISTS users (
  id             TEXT PRIMARY KEY,            -- client-generated install UUID
  platform       TEXT NOT NULL DEFAULT 'unknown',
  locale         TEXT NOT NULL DEFAULT 'en',
  created_at     INTEGER NOT NULL,            -- unix ms
  last_seen_at   INTEGER NOT NULL,
  rc_app_user_id TEXT                          -- RevenueCat app_user_id (Phase 6)
);

CREATE TABLE IF NOT EXISTS entitlements (
  user_id            TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  premium_active     INTEGER NOT NULL DEFAULT 0,  -- 0 | 1
  premium_expires_at INTEGER,                     -- unix ms; NULL = no premium
  premium_product    TEXT,                        -- e.g. orbacle_premium_monthly
  deep_pack_balance  INTEGER NOT NULL DEFAULT 0,  -- consumable Deep credits
  first_deep_used    INTEGER NOT NULL DEFAULT 0,  -- lifetime free Deep trials used
  updated_at         INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS daily_usage (
  user_id        TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  usage_date     TEXT NOT NULL,                -- 'YYYY-MM-DD' (UTC)
  kahin_count    INTEGER NOT NULL DEFAULT 0,
  deep_count     INTEGER NOT NULL DEFAULT 0,
  rewarded_kahin INTEGER NOT NULL DEFAULT 0,   -- ad-earned extra Kâhin for the day
  PRIMARY KEY (user_id, usage_date)
);
