-- Open houses
CREATE TABLE open_houses (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id      uuid REFERENCES listings(id) ON DELETE CASCADE,
  realtor_id      uuid REFERENCES realtors(id),
  date            date NOT NULL,
  start_time      time NOT NULL,
  end_time        time NOT NULL,
  attendance_type text NOT NULL CHECK (attendance_type IN ('in_person','virtual','both')),
  venue_address   text,
  virtual_link    text,
  status          text DEFAULT 'scheduled' CHECK (status IN ('scheduled','completed','cancelled')),
  actual_attendance integer,
  social_post_id  text,
  created_at      timestamptz DEFAULT now()
);

-- Open house RSVPs
CREATE TABLE open_house_rsvps (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  open_house_id uuid REFERENCES open_houses(id) ON DELETE CASCADE,
  buyer_id      uuid REFERENCES users(id),
  response      text NOT NULL CHECK (response IN ('attending','maybe','not_attending')),
  created_at    timestamptz DEFAULT now(),
  UNIQUE(open_house_id, buyer_id)
);

-- Commission rates
CREATE TABLE commission_rates (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brokerage_id    uuid REFERENCES broker_companies(id) ON DELETE CASCADE,
  realtor_id      uuid REFERENCES realtors(id),
  property_type   text,
  rate_type       text NOT NULL CHECK (rate_type IN ('percentage','fixed')),
  rate_value      numeric(10,4) NOT NULL,
  is_default      boolean DEFAULT false,
  created_at      timestamptz DEFAULT now()
);

-- Commission records
CREATE TABLE commission_records (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id  uuid REFERENCES transactions(id),
  realtor_id      uuid REFERENCES realtors(id),
  brokerage_id    uuid REFERENCES broker_companies(id),
  rate_type       text,
  rate_value      numeric(10,4),
  base_amount     numeric(15,2),
  commission_amt  numeric(15,2),
  status          text DEFAULT 'pending' CHECK (status IN ('pending','paid')),
  paid_at         timestamptz,
  created_at      timestamptz DEFAULT now()
);

-- Property pool
CREATE TABLE property_pool (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brokerage_id        uuid REFERENCES broker_companies(id) ON DELETE CASCADE,
  claimed_by          uuid REFERENCES realtors(id),
  status              text DEFAULT 'available' CHECK (status IN ('available','claimed')),
  property_type       text NOT NULL,
  lat                 double precision NOT NULL,
  lng                 double precision NOT NULL,
  address             text,
  tct_number_enc      text,
  tax_declaration_no_enc text,
  lot_area_sqm        numeric(10,2),
  block_number        text,
  lot_number          text,
  asking_price        numeric(15,2),
  claimed_at          timestamptz,
  created_at          timestamptz DEFAULT now()
);

-- Saved areas
CREATE TABLE saved_areas (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id    uuid REFERENCES users(id) ON DELETE CASCADE,
  name        text,
  boundary    jsonb NOT NULL,
  level       text CHECK (level IN ('barangay','city','province')),
  created_at  timestamptz DEFAULT now()
);

-- Reviews
CREATE TABLE reviews (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id  uuid REFERENCES transactions(id),
  buyer_id        uuid REFERENCES users(id),
  target_id       uuid NOT NULL,
  target_type     text NOT NULL CHECK (target_type IN ('realtor','brokerage')),
  rating          integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment         text,
  response        text,
  is_removed      boolean DEFAULT false,
  created_at      timestamptz DEFAULT now()
);

-- Audit trail (append-only)
CREATE TABLE audit_trail (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id   uuid NOT NULL,
  user_id     uuid REFERENCES users(id),
  user_role   text,
  action      text NOT NULL,
  metadata    jsonb,
  created_at  timestamptz DEFAULT now()
);

-- Notifications
CREATE TABLE notifications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES users(id) ON DELETE CASCADE,
  type        text NOT NULL,
  title       text,
  body        text,
  data        jsonb,
  read_at     timestamptz,
  created_at  timestamptz DEFAULT now()
);

-- Notification preferences
CREATE TABLE notification_preferences (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  email_prefs jsonb DEFAULT '{}',
  schedule    text DEFAULT 'immediate' CHECK (schedule IN ('immediate','daily','weekly')),
  digest_time time DEFAULT '08:00',
  created_at  timestamptz DEFAULT now()
);

-- LGU tax rates (for closing cost calculator)
CREATE TABLE lgu_tax_rates (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  province            text NOT NULL,
  city                text NOT NULL,
  transfer_tax_rate   numeric(6,4) NOT NULL,
  zonal_value_per_sqm numeric(12,2),
  updated_at          timestamptz DEFAULT now(),
  UNIQUE(province, city)
);
