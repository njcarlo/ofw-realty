-- Migration 015: LUPA PH Services Portal — new tables, indexes, constraints, RLS policies,
-- storage bucket, and Realtime publication entries.
-- Task 1: Database migration and Supabase setup
-- Requirements: 1.1, 1.4, 2.3, 4.7, 4.8, 5.1, 6.3, 10.1

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. provider_profiles
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE provider_profiles (
  id                          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                     uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  full_name                   text        NOT NULL,
  license_number              text,
  license_type                text        CHECK (license_type IN ('prc', 'dti')),
  license_verification_status text        NOT NULL DEFAULT 'not_applicable'
                              CHECK (license_verification_status IN (
                                'not_applicable', 'verified', 'unverified_manual', 'failed'
                              )),
  prc_lookup_result           jsonb,                  -- raw PRC API response for admin review
  service_types               text[]      NOT NULL,   -- subset of defined Service_Type enum values
  coverage_areas              text[]      NOT NULL,   -- province/city level strings
  bio                         text        CHECK (char_length(bio) <= 1000),
  contact_phone               text,
  contact_email               text,
  photo_url                   text,
  availability                text        NOT NULL DEFAULT 'available'
                              CHECK (availability IN ('available', 'busy')),
  status                      text        NOT NULL DEFAULT 'pending_review'
                              CHECK (status IN ('pending_review', 'approved', 'rejected', 'suspended')),
  rejection_reason            text,
  is_featured                 boolean     NOT NULL DEFAULT false,
  featured_until              timestamptz,
  avg_rating                  numeric(3,1) DEFAULT NULL,
  completed_engagements       integer     NOT NULL DEFAULT 0,
  reviewed_by                 uuid        REFERENCES users(id),
  reviewed_at                 timestamptz,
  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)            -- one provider profile per platform user
);

CREATE INDEX provider_profiles_status_idx       ON provider_profiles(status);
CREATE INDEX provider_profiles_service_types_idx ON provider_profiles USING GIN(service_types);
CREATE INDEX provider_profiles_coverage_idx      ON provider_profiles USING GIN(coverage_areas);
-- Directory sort: featured first, then by avg_rating desc, then by completed_engagements desc
CREATE INDEX provider_profiles_directory_idx     ON provider_profiles(
  is_featured DESC,
  avg_rating  DESC NULLS LAST,
  completed_engagements DESC
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. service_requests
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE service_requests (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id      uuid        NOT NULL REFERENCES users(id),
  service_type      text        NOT NULL
                    CHECK (service_type IN (
                      'property_appraisal',
                      'geodetic_survey',
                      'title_transfer',
                      'notarization',
                      'legal_consultation',
                      'property_tax_assistance',
                      'building_permit_processing',
                      'other'
                    )),
  other_description text,       -- required when service_type = 'other'
  description       text        NOT NULL,
  province          text        NOT NULL,
  city              text        NOT NULL,
  barangay          text,
  preferred_timeline text,
  budget_min_php    numeric(12,2),
  budget_max_php    numeric(12,2),
  status            text        NOT NULL DEFAULT 'open'
                    CHECK (status IN ('open', 'in_progress', 'expired', 'completed', 'cancelled')),
  proposal_count    integer     NOT NULL DEFAULT 0,
  expires_at        timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  extension_granted boolean     NOT NULL DEFAULT false,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  -- "Other" service type must always have a non-empty description
  CONSTRAINT other_requires_description CHECK (
    service_type != 'other'
    OR (other_description IS NOT NULL AND char_length(other_description) > 0)
  )
);

CREATE INDEX service_requests_status_idx       ON service_requests(status);
CREATE INDEX service_requests_service_type_idx ON service_requests(service_type);
CREATE INDEX service_requests_location_idx     ON service_requests(province, city);
CREATE INDEX service_requests_created_idx      ON service_requests(created_at DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. proposals
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE proposals (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id         uuid        NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
  provider_id        uuid        NOT NULL REFERENCES provider_profiles(id),
  message            text        NOT NULL,
  fee_min_php        numeric(12,2),
  fee_max_php        numeric(12,2),
  estimated_timeline text        NOT NULL,
  status             text        NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  UNIQUE (request_id, provider_id)  -- one proposal per provider per request (Req 4.8)
);

CREATE INDEX proposals_request_idx  ON proposals(request_id);
CREATE INDEX proposals_provider_idx ON proposals(provider_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. engagements
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE engagements (
  id                      uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id              uuid        NOT NULL REFERENCES service_requests(id),
  proposal_id             uuid        NOT NULL REFERENCES proposals(id),
  requester_id            uuid        NOT NULL REFERENCES users(id),
  provider_id             uuid        NOT NULL REFERENCES provider_profiles(id),
  status                  text        NOT NULL DEFAULT 'active'
                          CHECK (status IN ('active', 'completed', 'disputed', 'cancelled')),
  requester_completed_at  timestamptz,
  provider_completed_at   timestamptz,
  auto_completed_at       timestamptz,
  dispute_raised_by       uuid        REFERENCES users(id),
  dispute_raised_at       timestamptz,
  resolution_note         text,
  resolved_by             uuid        REFERENCES users(id),
  resolved_at             timestamptz,
  rating_window_closes_at timestamptz,  -- set to completed_at + 14 days (Req 6.7)
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX engagements_requester_idx ON engagements(requester_id);
CREATE INDEX engagements_provider_idx  ON engagements(provider_id);
CREATE INDEX engagements_status_idx    ON engagements(status);

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. ratings
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE ratings (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id uuid        NOT NULL REFERENCES engagements(id),
  requester_id  uuid        NOT NULL REFERENCES users(id),
  provider_id   uuid        NOT NULL REFERENCES provider_profiles(id),
  score         integer     NOT NULL CHECK (score BETWEEN 1 AND 5),
  review        text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (engagement_id)    -- one rating per engagement (Req 6.3)
);

CREATE INDEX ratings_provider_idx ON ratings(provider_id, created_at DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. engagement_messages
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE engagement_messages (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id uuid        NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  sender_id     uuid        NOT NULL REFERENCES users(id),
  content       text        NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX engagement_messages_engagement_idx ON engagement_messages(engagement_id, created_at ASC);

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS — Enable on all new tables
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE provider_profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_requests     ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals            ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagements          ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings              ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagement_messages  ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────────────────────
-- SECURITY DEFINER helper: get_provider_profile_id()
-- Returns the provider_profiles.id for the currently authenticated user.
-- Avoids recursive RLS evaluation (same pattern as 006_fix_rls_recursion.sql).
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_provider_profile_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT id FROM provider_profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS Policies: provider_profiles
-- ─────────────────────────────────────────────────────────────────────────────

-- Public can read approved provider profiles (Req 3.1, 10.2)
CREATE POLICY "providers_public_select"
ON provider_profiles FOR SELECT
USING (status = 'approved');

-- Owners can update their own profile (Req 1.8, 1.9)
CREATE POLICY "providers_owner_update"
ON provider_profiles FOR UPDATE
USING (user_id = auth.uid());

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS Policies: service_requests
-- ─────────────────────────────────────────────────────────────────────────────

-- Public can read open and in-progress requests (Req 2.4, 10.2)
CREATE POLICY "requests_public_select"
ON service_requests FOR SELECT
USING (status IN ('open', 'in_progress'));

-- Owners can update their own requests (Req 2.7)
CREATE POLICY "requests_owner_update"
ON service_requests FOR UPDATE
USING (requester_id = auth.uid());

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS Policies: proposals
-- ─────────────────────────────────────────────────────────────────────────────

-- Participants can read proposals: the submitting provider OR the requester who owns the request
CREATE POLICY "proposals_participant_select"
ON proposals FOR SELECT
USING (
  provider_id IN (SELECT id FROM provider_profiles WHERE user_id = auth.uid())
  OR request_id IN (SELECT id FROM service_requests WHERE requester_id = auth.uid())
);

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS Policies: engagements
-- ─────────────────────────────────────────────────────────────────────────────

-- Participants (requester or provider) can read their own engagements (Req 5.1)
CREATE POLICY "engagements_participant_select"
ON engagements FOR SELECT
USING (
  requester_id = auth.uid()
  OR provider_id IN (SELECT id FROM provider_profiles WHERE user_id = auth.uid())
);

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS Policies: engagement_messages
-- ─────────────────────────────────────────────────────────────────────────────

-- Participants of the parent engagement can read messages (Req 5.6)
CREATE POLICY "messages_participant_select"
ON engagement_messages FOR SELECT
USING (
  engagement_id IN (
    SELECT id FROM engagements
    WHERE requester_id = auth.uid()
       OR provider_id IN (SELECT id FROM provider_profiles WHERE user_id = auth.uid())
  )
);

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS Policies: ratings
-- ─────────────────────────────────────────────────────────────────────────────

-- Ratings are publicly readable (Req 3.3, 6.6)
CREATE POLICY "ratings_public_select"
ON ratings FOR SELECT
USING (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- Storage bucket: provider-photos
-- Public bucket, 5 MB limit, images only (Req 1.2)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'provider-photos',
  'provider-photos',
  true,       -- public bucket (profile photos are publicly visible)
  5242880,    -- 5 MB (5 * 1024 * 1024)
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Authenticated users can upload to their own folder (path: {user_id}/*)
CREATE POLICY "providers_upload_own_photo"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'provider-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND auth.role() = 'authenticated'
);

-- Owners can update/replace their own photo
CREATE POLICY "providers_update_own_photo"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'provider-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Owners can delete their own photo
CREATE POLICY "providers_delete_own_photo"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'provider-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Anyone can read provider photos (public bucket)
CREATE POLICY "public_read_provider_photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'provider-photos');

-- ─────────────────────────────────────────────────────────────────────────────
-- Realtime publication — enable live updates for messaging and status changes
-- ─────────────────────────────────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE engagement_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE engagements;
ALTER PUBLICATION supabase_realtime ADD TABLE proposals;
