-- Orbacle backend — indexes for the common access patterns.

-- Housekeeping cron will sweep old daily_usage rows by date.
CREATE INDEX IF NOT EXISTS idx_daily_usage_date ON daily_usage(usage_date);

-- "recent readings for a user" and per-user history.
CREATE INDEX IF NOT EXISTS idx_readings_user_time ON readings(user_id, created_at);

-- Daily cost/usage rollups across all users.
CREATE INDEX IF NOT EXISTS idx_readings_created ON readings(created_at);

-- Moderation queue: open reports oldest-first.
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status, created_at);

-- RevenueCat webhook lookup by app_user_id (Phase 6).
CREATE INDEX IF NOT EXISTS idx_users_rc ON users(rc_app_user_id);
