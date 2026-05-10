-- ============================================================
-- Migration 016: Broker-to-Broker (B2B) Network
-- Tables: b2b_profiles, b2b_connections, b2b_posts, b2b_post_reactions,
--         b2b_comments, b2b_listing_shares, b2b_service_offers,
--         b2b_prc_verifications
-- ============================================================

-- ── 1. B2B Profiles (one per broker_company or realtor) ──────────────────────
CREATE TABLE IF NOT EXISTS b2b_profiles (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  broker_company_id     uuid        REFERENCES broker_companies(id),
  display_name          text        NOT NULL,
  headline              text        CHECK (char_length(headline) <= 160),
  bio                   text        CHECK (char_length(bio) <= 1000),
  avatar_url            text,
  cover_url             text,
  location              text,
  years_experience      integer,
  specializations       text[],
  languages             text[],
  website_url           text,
  social_links          jsonb       DEFAULT '{}',
  -- PRC Verification
  prc_license_number    text,
  prc_license_type      text        CHECK (prc_license_type IN ('broker', 'salesperson', 'appraiser')),
  prc_id_url            text,       -- uploaded PRC ID image
  prc_verified          boolean     NOT NULL DEFAULT false,
  prc_verified_at       timestamptz,
  prc_verification_note text,
  -- Stats (denormalized for performance)
  connection_count      integer     NOT NULL DEFAULT 0,
  listing_count         integer     NOT NULL DEFAULT 0,
  post_count            integer     NOT NULL DEFAULT 0,
  -- Status
  is_active             boolean     NOT NULL DEFAULT true,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

CREATE INDEX b2b_profiles_broker_company_idx ON b2b_profiles(broker_company_id);
CREATE INDEX b2b_profiles_prc_verified_idx   ON b2b_profiles(prc_verified);
CREATE INDEX b2b_profiles_location_idx       ON b2b_profiles(location);

-- ── 2. PRC Verification Requests ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS b2b_prc_verifications (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id        uuid        NOT NULL REFERENCES b2b_profiles(id) ON DELETE CASCADE,
  prc_license_number text       NOT NULL,
  prc_license_type  text        NOT NULL,
  prc_id_url        text        NOT NULL,
  selfie_url        text,       -- optional selfie with ID
  status            text        NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'approved', 'rejected', 'needs_resubmission')),
  reviewed_by       uuid        REFERENCES users(id),
  reviewed_at       timestamptz,
  rejection_reason  text,
  submitted_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX b2b_prc_verifications_profile_idx ON b2b_prc_verifications(profile_id);
CREATE INDEX b2b_prc_verifications_status_idx  ON b2b_prc_verifications(status);

-- ── 3. Connections (LinkedIn-style) ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS b2b_connections (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id  uuid        NOT NULL REFERENCES b2b_profiles(id) ON DELETE CASCADE,
  addressee_id  uuid        NOT NULL REFERENCES b2b_profiles(id) ON DELETE CASCADE,
  status        text        NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'accepted', 'declined', 'withdrawn')),
  message       text        CHECK (char_length(message) <= 300),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (requester_id, addressee_id),
  CHECK (requester_id != addressee_id)
);

CREATE INDEX b2b_connections_requester_idx  ON b2b_connections(requester_id, status);
CREATE INDEX b2b_connections_addressee_idx  ON b2b_connections(addressee_id, status);

-- ── 4. Posts (feed) ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS b2b_posts (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id     uuid        NOT NULL REFERENCES b2b_profiles(id) ON DELETE CASCADE,
  content       text        NOT NULL CHECK (char_length(content) <= 3000),
  media_urls    text[],
  post_type     text        NOT NULL DEFAULT 'update'
                CHECK (post_type IN ('update', 'listing_share', 'service_offer', 'market_insight', 'co_broking_request')),
  -- Optional linked entities
  listing_id    uuid        REFERENCES listings(id) ON DELETE SET NULL,
  visibility    text        NOT NULL DEFAULT 'network'
                CHECK (visibility IN ('public', 'network', 'connections_only')),
  reaction_count  integer   NOT NULL DEFAULT 0,
  comment_count   integer   NOT NULL DEFAULT 0,
  share_count     integer   NOT NULL DEFAULT 0,
  is_pinned       boolean   NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX b2b_posts_author_idx   ON b2b_posts(author_id, created_at DESC);
CREATE INDEX b2b_posts_type_idx     ON b2b_posts(post_type);
CREATE INDEX b2b_posts_listing_idx  ON b2b_posts(listing_id) WHERE listing_id IS NOT NULL;

-- ── 5. Post Reactions ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS b2b_post_reactions (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     uuid        NOT NULL REFERENCES b2b_posts(id) ON DELETE CASCADE,
  profile_id  uuid        NOT NULL REFERENCES b2b_profiles(id) ON DELETE CASCADE,
  reaction    text        NOT NULL DEFAULT 'like'
              CHECK (reaction IN ('like', 'insightful', 'celebrate', 'support')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, profile_id)
);

CREATE INDEX b2b_post_reactions_post_idx ON b2b_post_reactions(post_id);

-- ── 6. Comments ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS b2b_comments (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     uuid        NOT NULL REFERENCES b2b_posts(id) ON DELETE CASCADE,
  author_id   uuid        NOT NULL REFERENCES b2b_profiles(id) ON DELETE CASCADE,
  content     text        NOT NULL CHECK (char_length(content) <= 1000),
  parent_id   uuid        REFERENCES b2b_comments(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX b2b_comments_post_idx ON b2b_comments(post_id, created_at ASC);

-- ── 7. Listing Shares (broker shares a listing to the network) ────────────────
CREATE TABLE IF NOT EXISTS b2b_listing_shares (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id      uuid        NOT NULL REFERENCES b2b_profiles(id) ON DELETE CASCADE,
  listing_id      uuid        NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  co_broke        boolean     NOT NULL DEFAULT false,
  commission_split numeric(5,2),  -- percentage offered to co-broker
  note            text        CHECK (char_length(note) <= 500),
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (profile_id, listing_id)
);

CREATE INDEX b2b_listing_shares_profile_idx ON b2b_listing_shares(profile_id);
CREATE INDEX b2b_listing_shares_listing_idx ON b2b_listing_shares(listing_id);

-- ── 8. Service Offers (broker advertises services to the network) ─────────────
CREATE TABLE IF NOT EXISTS b2b_service_offers (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id      uuid        NOT NULL REFERENCES b2b_profiles(id) ON DELETE CASCADE,
  title           text        NOT NULL,
  description     text        NOT NULL CHECK (char_length(description) <= 1000),
  service_type    text        NOT NULL
                  CHECK (service_type IN (
                    'co_broking', 'referral', 'training', 'mentorship',
                    'legal', 'appraisal', 'documentation', 'marketing', 'other'
                  )),
  coverage_areas  text[],
  fee_type        text        CHECK (fee_type IN ('fixed', 'percentage', 'negotiable', 'free')),
  fee_amount      numeric(12,2),
  is_active       boolean     NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX b2b_service_offers_profile_idx ON b2b_service_offers(profile_id);
CREATE INDEX b2b_service_offers_type_idx    ON b2b_service_offers(service_type);

-- ── 9. Direct Messages ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS b2b_messages (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id     uuid        NOT NULL REFERENCES b2b_profiles(id) ON DELETE CASCADE,
  recipient_id  uuid        NOT NULL REFERENCES b2b_profiles(id) ON DELETE CASCADE,
  content       text        NOT NULL CHECK (char_length(content) <= 2000),
  read_at       timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  CHECK (sender_id != recipient_id)
);

CREATE INDEX b2b_messages_sender_idx    ON b2b_messages(sender_id, created_at DESC);
CREATE INDEX b2b_messages_recipient_idx ON b2b_messages(recipient_id, read_at NULLS FIRST);

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE b2b_profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE b2b_prc_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE b2b_connections       ENABLE ROW LEVEL SECURITY;
ALTER TABLE b2b_posts             ENABLE ROW LEVEL SECURITY;
ALTER TABLE b2b_post_reactions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE b2b_comments          ENABLE ROW LEVEL SECURITY;
ALTER TABLE b2b_listing_shares    ENABLE ROW LEVEL SECURITY;
ALTER TABLE b2b_service_offers    ENABLE ROW LEVEL SECURITY;
ALTER TABLE b2b_messages          ENABLE ROW LEVEL SECURITY;

-- Public can read active profiles
CREATE POLICY "b2b_profiles_public_read"
ON b2b_profiles FOR SELECT USING (is_active = true);

-- Owners can update their own profile
CREATE POLICY "b2b_profiles_owner_update"
ON b2b_profiles FOR UPDATE USING (user_id = auth.uid());

-- Public posts visible to all
CREATE POLICY "b2b_posts_public_read"
ON b2b_posts FOR SELECT USING (visibility = 'public');

-- Authenticated users can read network posts
CREATE POLICY "b2b_posts_network_read"
ON b2b_posts FOR SELECT USING (
  visibility IN ('public', 'network') AND auth.uid() IS NOT NULL
);

-- Service offers are public
CREATE POLICY "b2b_service_offers_public_read"
ON b2b_service_offers FOR SELECT USING (is_active = true);

-- Listing shares are public
CREATE POLICY "b2b_listing_shares_public_read"
ON b2b_listing_shares FOR SELECT USING (true);

-- Connections: participants can read
CREATE POLICY "b2b_connections_participant_read"
ON b2b_connections FOR SELECT USING (
  requester_id IN (SELECT id FROM b2b_profiles WHERE user_id = auth.uid())
  OR addressee_id IN (SELECT id FROM b2b_profiles WHERE user_id = auth.uid())
);

-- Messages: participants can read
CREATE POLICY "b2b_messages_participant_read"
ON b2b_messages FOR SELECT USING (
  sender_id IN (SELECT id FROM b2b_profiles WHERE user_id = auth.uid())
  OR recipient_id IN (SELECT id FROM b2b_profiles WHERE user_id = auth.uid())
);

-- PRC verifications: owner only
CREATE POLICY "b2b_prc_owner_read"
ON b2b_prc_verifications FOR SELECT USING (
  profile_id IN (SELECT id FROM b2b_profiles WHERE user_id = auth.uid())
);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE b2b_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE b2b_post_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE b2b_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE b2b_connections;
ALTER PUBLICATION supabase_realtime ADD TABLE b2b_messages;
