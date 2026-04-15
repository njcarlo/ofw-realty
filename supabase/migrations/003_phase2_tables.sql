-- Live site visits
CREATE TABLE live_site_visits (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id      uuid REFERENCES listings(id),
  realtor_id      uuid REFERENCES realtors(id),
  status          text DEFAULT 'active' CHECK (status IN ('active','completed')),
  gps_track       jsonb DEFAULT '[]',
  started_at      timestamptz DEFAULT now(),
  ended_at        timestamptz
);

-- Site visit media
CREATE TABLE site_visit_media (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id        uuid REFERENCES live_site_visits(id) ON DELETE CASCADE,
  type            text NOT NULL CHECK (type IN ('photo','video')),
  url             text NOT NULL,
  lat             double precision,
  lng             double precision,
  captured_at     timestamptz DEFAULT now()
);

-- Deal rooms
CREATE TABLE deal_rooms (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id  uuid REFERENCES transactions(id),
  realtor_id      uuid REFERENCES realtors(id),
  buyer_id        uuid REFERENCES users(id),
  co_borrower_id  uuid REFERENCES users(id),
  status          text DEFAULT 'active' CHECK (status IN ('active','submitted','closed')),
  created_at      timestamptz DEFAULT now()
);

-- Performance points
CREATE TABLE performance_points (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  realtor_id      uuid REFERENCES realtors(id) ON DELETE CASCADE,
  brokerage_id    uuid REFERENCES broker_companies(id),
  action_type     text NOT NULL,
  points_awarded  integer NOT NULL,
  reference_id    uuid,
  created_at      timestamptz DEFAULT now()
);

-- Ad campaigns
CREATE TABLE ad_campaigns (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id          uuid REFERENCES listings(id),
  owner_id            uuid NOT NULL,
  owner_type          text NOT NULL CHECK (owner_type IN ('realtor','brokerage')),
  meta_campaign_id    text,
  meta_adset_id       text,
  meta_ad_id          text,
  budget_type         text CHECK (budget_type IN ('daily','lifetime')),
  budget_php          numeric(12,2),
  target_countries    text[],
  target_age_min      integer,
  target_age_max      integer,
  target_gender       text,
  interest_keywords   text[],
  start_date          date,
  end_date            date,
  status              text DEFAULT 'pending_review' CHECK (status IN ('pending_review','active','paused','completed','rejected')),
  impressions         integer DEFAULT 0,
  reach               integer DEFAULT 0,
  clicks              integer DEFAULT 0,
  cost_spent_php      numeric(12,2) DEFAULT 0,
  last_synced_at      timestamptz,
  created_at          timestamptz DEFAULT now()
);

-- Co-broking listings
CREATE TABLE co_broking_listings (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id      uuid REFERENCES listings(id) ON DELETE CASCADE,
  co_broker_id    uuid REFERENCES broker_companies(id),
  commission_split numeric(5,2),
  status          text DEFAULT 'pending' CHECK (status IN ('pending','approved','removed')),
  created_at      timestamptz DEFAULT now()
);

-- Infrastructure projects (for ROI overlay)
CREATE TABLE infrastructure_projects (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  type            text NOT NULL CHECK (type IN ('expressway','lrt_mrt','bridge','road','other')),
  geojson         jsonb NOT NULL,
  estimated_completion_year integer,
  source          text,
  updated_at      timestamptz DEFAULT now()
);

-- Tokenized properties
CREATE TABLE tokenized_properties (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id      uuid REFERENCES listings(id),
  brokerage_id    uuid REFERENCES broker_companies(id),
  total_shares    integer NOT NULL,
  price_per_share numeric(12,2) NOT NULL,
  available_shares integer NOT NULL,
  blockchain_ref  text,
  created_at      timestamptz DEFAULT now()
);

-- Token holdings
CREATE TABLE token_holdings (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tokenized_property_id uuid REFERENCES tokenized_properties(id),
  buyer_id              uuid REFERENCES users(id),
  shares_owned          integer NOT NULL CHECK (shares_owned > 0),
  blockchain_ref        text,
  created_at            timestamptz DEFAULT now()
);
