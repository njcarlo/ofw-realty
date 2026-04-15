-- Migration 008: Per-user Facebook Ad Account connections
-- Each agent/broker connects their own FB account independently

CREATE TABLE facebook_connections (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  fb_user_id          text NOT NULL,
  fb_user_name        text,
  fb_page_id          text,
  fb_page_name        text,
  fb_ad_account_id    text,          -- e.g. "act_123456789"
  fb_ad_account_name  text,
  access_token        text NOT NULL, -- long-lived user token (encrypted at rest)
  token_expires_at    timestamptz,
  scopes              text[],        -- granted permissions
  connected_at        timestamptz DEFAULT now(),
  disconnected_at     timestamptz,
  is_active           boolean DEFAULT true,
  UNIQUE(user_id)     -- one FB connection per user
);

-- RLS: users can only see/manage their own connection
ALTER TABLE facebook_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_fb_connection" ON facebook_connections
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "admin_all_fb_connections" ON facebook_connections
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Index for fast lookup
CREATE INDEX idx_fb_connections_user ON facebook_connections(user_id) WHERE is_active = true;
