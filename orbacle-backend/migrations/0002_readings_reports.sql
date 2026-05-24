-- Orbacle backend — readings (analytics + opt-in text) and reports (safety).

CREATE TABLE IF NOT EXISTS readings (
  id                TEXT PRIMARY KEY,           -- server-generated UUID
  user_id           TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type              TEXT NOT NULL,              -- 'kahin' | 'deep'
  locale            TEXT NOT NULL,
  category          TEXT,
  prompt_version    TEXT NOT NULL,
  model             TEXT NOT NULL,              -- 'mock' in Phase 3
  prompt_tokens     INTEGER NOT NULL DEFAULT 0,
  completion_tokens INTEGER NOT NULL DEFAULT 0,
  total_tokens      INTEGER NOT NULL DEFAULT 0,
  safety_flag       TEXT,                       -- NULL | 'self_harm' | ...
  created_at        INTEGER NOT NULL,
  -- Data minimization: text stored ONLY when the request opts in (save:true).
  question_text     TEXT,
  whisper_text      TEXT,
  answer_text       TEXT
);

CREATE TABLE IF NOT EXISTS reports (
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reading_id    TEXT,
  reason        TEXT NOT NULL,                  -- offensive | inaccurate | harmful | other
  detail        TEXT,
  question_text TEXT,
  answer_text   TEXT,
  status        TEXT NOT NULL DEFAULT 'open',   -- open | reviewed | dismissed
  created_at    INTEGER NOT NULL
);
