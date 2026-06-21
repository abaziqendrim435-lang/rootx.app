-- ============================================================
-- RootX — Supabase Database Schema v2
--
-- Run this in your Supabase project:
-- Dashboard → SQL Editor → New Query → Paste & Run
--
-- SETUP ORDER:
-- 1. Enable Email Auth: Auth → Settings → Email → Enable
-- 2. Run this SQL in SQL Editor
-- ============================================================

-- ── Requests table (existing) ─────────────────────────────────
CREATE TABLE IF NOT EXISTS requests (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  name         TEXT        NOT NULL,
  email        TEXT        NOT NULL,
  business_type TEXT,
  selected_agent TEXT      NOT NULL,
  message      TEXT,
  status       TEXT        DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Allow public inserts"
  ON requests FOR INSERT
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Allow service role reads"
  ON requests FOR SELECT
  USING (true);

CREATE INDEX IF NOT EXISTS requests_created_at_idx ON requests (created_at DESC);
CREATE INDEX IF NOT EXISTS requests_status_idx ON requests (status);

-- ── Generations table (new — requires Supabase Auth) ──────────
CREATE TABLE IF NOT EXISTS generations (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_type   TEXT        NOT NULL,
  agent_name   TEXT        NOT NULL,
  agent_icon   TEXT        NOT NULL DEFAULT '',
  inputs       JSONB       NOT NULL DEFAULT '{}',
  outputs      JSONB       NOT NULL DEFAULT '{}',
  is_saved     BOOLEAN     NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security — users only access their own rows
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users select own generations"
  ON generations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own generations"
  ON generations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own generations"
  ON generations FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own generations"
  ON generations FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes for dashboard queries
CREATE INDEX IF NOT EXISTS generations_user_id_idx ON generations (user_id);
CREATE INDEX IF NOT EXISTS generations_created_at_idx ON generations (created_at DESC);
CREATE INDEX IF NOT EXISTS generations_agent_type_idx ON generations (agent_type);
CREATE INDEX IF NOT EXISTS generations_is_saved_idx ON generations (is_saved) WHERE is_saved = true;
