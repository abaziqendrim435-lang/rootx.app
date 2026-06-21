-- ============================================================
-- RootX — Supabase Schema Addition: subscriptions table
--
-- Run this in Supabase → SQL Editor → New Query
-- ============================================================

-- ── Subscriptions table ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
  id                  UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id             UUID        NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id             TEXT        NOT NULL DEFAULT 'free' CHECK (plan_id IN ('free', 'pro', 'business')),
  stripe_customer_id  TEXT,
  stripe_subscription_id TEXT,
  stripe_price_id     TEXT,
  status              TEXT        NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing', 'incomplete')),
  current_period_end  TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN    DEFAULT false,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security — users only access their own row
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users select own subscription"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Service role (used by webhook) can insert/update
CREATE POLICY "Service role manages subscriptions"
  ON subscriptions FOR ALL
  USING (true)
  WITH CHECK (true);

-- Index for fast webhook lookups
CREATE INDEX IF NOT EXISTS subscriptions_stripe_customer_idx
  ON subscriptions (stripe_customer_id);

CREATE INDEX IF NOT EXISTS subscriptions_stripe_sub_idx
  ON subscriptions (stripe_subscription_id);

-- Auto-create a free subscription row when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.subscriptions (user_id, plan_id, status)
  VALUES (NEW.id, 'free', 'active')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger (drop first to allow re-running safely)
DROP TRIGGER IF EXISTS on_auth_user_created_subscription ON auth.users;
CREATE TRIGGER on_auth_user_created_subscription
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_subscription();
