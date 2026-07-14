-- ============================================================
-- RootX — Supabase Schema Addition: shopify_stores table
--
-- Run this in Supabase → SQL Editor → New Query → Run
-- ============================================================

-- ── Shopify Stores table ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS shopify_stores (
  id             UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        UUID        NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  store_domain   TEXT        NOT NULL,
  access_token   TEXT        NOT NULL,
  scopes         TEXT[]      NOT NULL DEFAULT '{}',
  status         TEXT        NOT NULL DEFAULT 'connected' CHECK (status IN ('connected', 'disconnected')),
  shop_name      TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security — users only access their own connected store
ALTER TABLE shopify_stores ENABLE ROW LEVEL SECURITY;

-- Select policy
CREATE POLICY "Users select own shopify stores"
  ON shopify_stores FOR SELECT
  USING (auth.uid() = user_id);

-- Insert policy
CREATE POLICY "Users insert own shopify stores"
  ON shopify_stores FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Update policy
CREATE POLICY "Users update own shopify stores"
  ON shopify_stores FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Delete policy
CREATE POLICY "Users delete own shopify stores"
  ON shopify_stores FOR DELETE
  USING (auth.uid() = user_id);

-- Index for fast user query lookups
CREATE INDEX IF NOT EXISTS shopify_stores_user_id_idx ON shopify_stores (user_id);
