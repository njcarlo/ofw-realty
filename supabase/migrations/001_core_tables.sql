-- Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

-- Make PostGIS functions available in public schema
SET search_path TO public, extensions;

-- Users
CREATE TABLE users (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email           text UNIQUE NOT NULL,
  phone           text,
  full_name       text NOT NULL,
  role            text NOT NULL CHECK (role IN ('buyer','seller','realtor','broker_admin','admin')),
  avatar_url      text,
  cover_url       text,
  bio             text CHECK (char_length(bio) <= 500),
  spoken_languages text[],
  timezone        text DEFAULT 'Asia/Manila',
  language_pref   text DEFAULT 'en' CHECK (language_pref IN ('en','fil')),
  email_verified  boolean DEFAULT false,
  mfa_enabled     boolean DEFAULT false,
  failed_login_attempts integer DEFAULT 0,
  locked_until    timestamptz,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- User devices (for device fingerprinting / suspicious login detection)
CREATE TABLE user_devices (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid REFERENCES users(id) ON DELETE CASCADE,
  fingerprint     text NOT NULL,
  country_code    text,
  ip_address      text,
  user_agent      text,
  last_seen_at    timestamptz DEFAULT now(),
  is_trusted      boolean DEFAULT false,
  created_at      timestamptz DEFAULT now()
);

-- Broker companies
CREATE TABLE broker_companies (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  slug            text UNIQUE NOT NULL,
  logo_url        text,
  cover_url       text,
  description     text CHECK (char_length(description) <= 1000),
  office_address  text,
  operating_hours jsonb,
  social_links    jsonb,
  verified_badge  boolean DEFAULT false,
  verified_at     timestamptz,
  monthly_ad_cap  numeric(12,2),
  co_broking      boolean DEFAULT false,
  created_at      timestamptz DEFAULT now()
);

-- Realtors
CREATE TABLE realtors (
  id                  uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  slug                text UNIQUE NOT NULL,
  prc_license_number  text,
  prc_license_expiry  date,
  specializations     text[],
  primary_brokerage   uuid REFERENCES broker_companies(id),
  is_independent      boolean DEFAULT false,
  verified_badge      boolean DEFAULT false,
  verified_at         timestamptz,
  blockchain_qr_url   text,
  performance_points  integer DEFAULT 0,
  created_at          timestamptz DEFAULT now()
);

-- Realtor-brokerage affiliations
CREATE TABLE realtor_brokerage_affiliations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  realtor_id      uuid REFERENCES realtors(id) ON DELETE CASCADE,
  brokerage_id    uuid REFERENCES broker_companies(id) ON DELETE CASCADE,
  is_primary      boolean DEFAULT false,
  status          text DEFAULT 'active' CHECK (status IN ('active','archived')),
  archived_at     timestamptz,
  created_at      timestamptz DEFAULT now()
);

-- Developer pages
CREATE TABLE developer_pages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id    uuid REFERENCES users(id),
  name            text NOT NULL,
  slug            text UNIQUE NOT NULL,
  description     text,
  amenities       text[],
  site_map_url    text,
  location        text,
  lat             double precision,
  lng             double precision,
  created_at      timestamptz DEFAULT now()
);

-- Listings
CREATE TABLE listings (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  realtor_id          uuid REFERENCES realtors(id),
  brokerage_id        uuid REFERENCES broker_companies(id),
  property_type       text NOT NULL CHECK (property_type IN ('residential_lot','house_and_lot','condo','commercial','farm_lot')),
  title               text NOT NULL,
  description         text,
  price_php           numeric(15,2) NOT NULL,
  lat                 double precision NOT NULL,
  lng                 double precision NOT NULL,
  address             text,
  province            text,
  city                text,
  barangay            text,
  lot_area_sqm        numeric(10,2),
  block_number        text,
  lot_number          text,
  tct_number_enc      text,
  tax_declaration_no_enc text,
  status              text DEFAULT 'active' CHECK (status IN ('active','reserved','sold','deactivated')),
  is_featured         boolean DEFAULT false,
  featured_until      timestamptz,
  blockchain_verified boolean DEFAULT false,
  blockchain_hash     text,
  floor_plan_url      text,
  master_plan_url     text,
  developer_page_id   uuid REFERENCES developer_pages(id),
  from_property_pool  boolean DEFAULT false,
  pool_property_id    uuid,
  scam_flagged        boolean DEFAULT false,
  scam_flag_reason    text,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

-- Spatial index for map queries
CREATE INDEX listings_location_idx ON listings USING GIST (extensions.ST_MakePoint(lng, lat));
CREATE INDEX listings_status_idx ON listings(status);
CREATE INDEX listings_featured_idx ON listings(is_featured, created_at DESC);

-- Listing photos
CREATE TABLE listing_photos (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id  uuid REFERENCES listings(id) ON DELETE CASCADE,
  url         text NOT NULL,
  is_primary  boolean DEFAULT false,
  sort_order  integer DEFAULT 0,
  created_at  timestamptz DEFAULT now()
);

-- Inquiries
CREATE TABLE inquiries (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id      uuid REFERENCES listings(id),
  buyer_id        uuid REFERENCES users(id),
  realtor_id      uuid REFERENCES realtors(id),
  message         text,
  offer_price_php numeric(15,2),
  status          text DEFAULT 'pending' CHECK (status IN ('pending','responded','closed')),
  lead_score      integer DEFAULT 0,
  source          text DEFAULT 'platform' CHECK (source IN ('platform','messenger','viber')),
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- Messages
CREATE TABLE messages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id  uuid REFERENCES inquiries(id) ON DELETE CASCADE,
  sender_id   uuid REFERENCES users(id),
  content     text,
  type        text DEFAULT 'text' CHECK (type IN ('text','video','image','system')),
  media_url   text,
  read_at     timestamptz,
  created_at  timestamptz DEFAULT now()
);

-- Transactions
CREATE TABLE transactions (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id          uuid REFERENCES listings(id),
  buyer_id            uuid REFERENCES users(id),
  realtor_id          uuid REFERENCES realtors(id),
  brokerage_id        uuid REFERENCES broker_companies(id),
  final_price_php     numeric(15,2),
  status              text DEFAULT 'reserved' CHECK (status IN ('reserved','contract_signed','loan_processing','turn_over','sold','cancelled')),
  escrow_enabled      boolean DEFAULT false,
  escrow_contract_id  text,
  commission_record_id uuid,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

-- Documents
CREATE TABLE documents (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id        uuid NOT NULL,
  owner_type      text NOT NULL CHECK (owner_type IN ('realtor','brokerage','transaction','amla')),
  doc_type        text NOT NULL,
  doc_number      integer CHECK (doc_number BETWEEN 1 AND 9),
  file_url        text NOT NULL,
  status          text DEFAULT 'submitted' CHECK (status IN ('submitted','approved','pending','expired')),
  rejection_reason text,
  expiry_date     date,
  blockchain_hash text,
  reviewed_by     uuid REFERENCES users(id),
  reviewed_at     timestamptz,
  created_at      timestamptz DEFAULT now()
);
