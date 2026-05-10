-- Migration 013: Developer Portal — new tables, indexes, and RLS policies
-- Tasks 1.1 + 1.4: Creates all developer portal tables with constraints,
-- indexes, and row-level security policies.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. developers
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE developers (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid        REFERENCES users(id) ON DELETE CASCADE,
  company_name        text        NOT NULL,
  company_type        text        NOT NULL
                      CHECK (company_type IN ('corporation','sole_proprietorship','partnership')),
  primary_contact     text        NOT NULL,
  logo_url            text,
  cover_url           text,
  description         text        CHECK (char_length(description) <= 1000),
  office_address      text,
  website_url         text,
  social_links        jsonb       DEFAULT '{}',
  years_in_operation  integer,
  verification_status text        NOT NULL DEFAULT 'pending'
                      CHECK (verification_status IN ('pending','verified','suspended','rejected')),
  verified_badge      boolean     DEFAULT false,
  verified_at         timestamptz,
  rejection_reason    text,
  suspended_at        timestamptz,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

CREATE INDEX developers_verification_idx ON developers(verification_status);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. projects
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE projects (
  id               uuid             PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id     uuid             REFERENCES developers(id) ON DELETE CASCADE,
  name             text             NOT NULL,
  project_type     text             NOT NULL
                   CHECK (project_type IN ('subdivision','condominium','townhouse','mixed_use')),
  province         text             NOT NULL,
  city             text             NOT NULL,
  barangay         text,
  lat              double precision NOT NULL,
  lng              double precision NOT NULL,
  total_units      integer          NOT NULL CHECK (total_units > 0),
  status           text             NOT NULL DEFAULT 'pre_selling'
                   CHECK (status IN ('pre_selling','ready_for_occupancy','sold_out','on_hold')),
  site_map_url     text,
  video_url        text,
  virtual_tour_url text,
  created_at       timestamptz      DEFAULT now(),
  updated_at       timestamptz      DEFAULT now()
);

CREATE INDEX projects_developer_idx  ON projects(developer_id);
CREATE INDEX projects_status_idx     ON projects(status);
CREATE INDEX projects_location_idx   ON projects USING GIST (extensions.ST_MakePoint(lng, lat));

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. project_photos
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE project_photos (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  uuid        REFERENCES projects(id) ON DELETE CASCADE,
  url         text        NOT NULL,
  is_primary  boolean     DEFAULT false,
  sort_order  integer     DEFAULT 0,
  created_at  timestamptz DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. units
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE units (
  id             uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     uuid           REFERENCES projects(id) ON DELETE CASCADE,
  unit_type      text           NOT NULL,
  identifier     text           NOT NULL,   -- block/lot or floor/unit number
  floor_area_sqm numeric(10,2)  NOT NULL CHECK (floor_area_sqm > 0),
  price_php      numeric(15,2)  NOT NULL CHECK (price_php > 0),
  floor_plan_url text,
  status         text           NOT NULL DEFAULT 'available'
                 CHECK (status IN ('available','reserved','sold')),
  created_at     timestamptz    DEFAULT now(),
  updated_at     timestamptz    DEFAULT now(),
  UNIQUE(project_id, identifier)
);

CREATE INDEX units_project_status_idx ON units(project_id, status);

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. broker_connections
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE broker_connections (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id  uuid        REFERENCES developers(id) ON DELETE CASCADE,
  broker_id     uuid        REFERENCES broker_companies(id) ON DELETE CASCADE,
  initiated_by  text        NOT NULL CHECK (initiated_by IN ('developer','broker')),
  status        text        NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','active','declined','terminated')),
  declined_at   timestamptz,
  terminated_at timestamptz,
  terminated_by text        CHECK (terminated_by IN ('developer','broker')),
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now(),
  UNIQUE(developer_id, broker_id)
);

CREATE INDEX broker_connections_developer_idx ON broker_connections(developer_id, status);
CREATE INDEX broker_connections_broker_idx    ON broker_connections(broker_id, status);

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. developer_commission_rates
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE developer_commission_rates (
  id            uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id uuid           REFERENCES broker_connections(id) ON DELETE CASCADE,
  developer_id  uuid           REFERENCES developers(id) ON DELETE CASCADE,
  rate_type     text           NOT NULL CHECK (rate_type IN ('percentage','fixed_php')),
  rate_value    numeric(10,4)  NOT NULL CHECK (rate_value > 0),
  is_default    boolean        DEFAULT false,
  promo_start   date,
  promo_end     date,
  created_at    timestamptz    DEFAULT now(),
  -- null connection_id = developer default rate
  CONSTRAINT promo_dates_valid CHECK (
    (promo_start IS NULL AND promo_end IS NULL)
    OR (promo_start IS NOT NULL AND promo_end IS NOT NULL AND promo_end > promo_start)
  )
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. developer_commission_records  (immutable — no UPDATE/DELETE via RLS)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE developer_commission_records (
  id               uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id   uuid           NOT NULL,   -- FK to reservation_requests
  connection_id    uuid           REFERENCES broker_connections(id),
  unit_id          uuid           REFERENCES units(id),
  rate_type        text           NOT NULL,
  rate_value       numeric(10,4)  NOT NULL,
  unit_price_php   numeric(15,2)  NOT NULL,
  gross_commission numeric(15,2)  NOT NULL,
  created_at       timestamptz    DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. reservation_requests
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE reservation_requests (
  id                        uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id                   uuid        REFERENCES units(id),
  connection_id             uuid        REFERENCES broker_connections(id),
  broker_id                 uuid        REFERENCES broker_companies(id),
  buyer_name                text        NOT NULL,
  buyer_contact             text        NOT NULL,
  reservation_fee_confirmed boolean     NOT NULL DEFAULT false,
  status                    text        NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending','confirmed','rejected','expired')),
  rejection_reason          text,
  response_window_hours     integer     NOT NULL DEFAULT 48,
  expires_at                timestamptz NOT NULL,
  responded_at              timestamptz,
  created_at                timestamptz DEFAULT now(),
  updated_at                timestamptz DEFAULT now()
);

CREATE INDEX reservation_requests_unit_idx    ON reservation_requests(unit_id, status);
CREATE INDEX reservation_requests_expires_idx ON reservation_requests(expires_at)
  WHERE status = 'pending';

-- ─────────────────────────────────────────────────────────────────────────────
-- 9. in_house_agent_tags
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE in_house_agent_tags (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id uuid        REFERENCES developers(id) ON DELETE CASCADE,
  realtor_id   uuid        REFERENCES realtors(id) ON DELETE CASCADE,
  status       text        NOT NULL DEFAULT 'invited'
               CHECK (status IN ('invited','active','removed')),
  invited_at   timestamptz DEFAULT now(),
  accepted_at  timestamptz,
  removed_at   timestamptz,
  UNIQUE(developer_id, realtor_id)
);

CREATE INDEX in_house_agent_tags_realtor_idx ON in_house_agent_tags(realtor_id, status);

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS — Enable on all new tables
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE developers                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_photos              ENABLE ROW LEVEL SECURITY;
ALTER TABLE units                       ENABLE ROW LEVEL SECURITY;
ALTER TABLE broker_connections          ENABLE ROW LEVEL SECURITY;
ALTER TABLE developer_commission_rates  ENABLE ROW LEVEL SECURITY;
ALTER TABLE developer_commission_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservation_requests        ENABLE ROW LEVEL SECURITY;
ALTER TABLE in_house_agent_tags         ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────────────────────
-- SECURITY DEFINER helper: is_developer_owner(p_developer_id uuid)
-- Returns true if auth.uid() is the user_id of the given developer record.
-- Avoids recursive RLS evaluation (same pattern as 006_fix_rls_recursion.sql).
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION is_developer_owner(p_developer_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM developers
    WHERE id = p_developer_id
      AND user_id = auth.uid()
  );
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- SECURITY DEFINER helper: get_broker_company_id()
-- Returns the broker_companies.id for the currently authenticated broker_admin.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_broker_company_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT brokerage_id FROM realtors WHERE id = auth.uid()
  UNION ALL
  SELECT id FROM broker_companies WHERE id = auth.uid()
  LIMIT 1;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS Policies: developers
-- ─────────────────────────────────────────────────────────────────────────────

-- Developers can read/write their own record
CREATE POLICY "developer_own_record"
ON developers FOR ALL
USING (user_id = auth.uid());

-- Admins can read all developer records
CREATE POLICY "admin_read_all_developers"
ON developers FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS Policies: projects
-- ─────────────────────────────────────────────────────────────────────────────

-- Developers can manage their own projects
CREATE POLICY "developer_own_projects"
ON projects FOR ALL
USING (is_developer_owner(developer_id));

-- Connected brokers can read projects from active connections
CREATE POLICY "connected_broker_read_projects"
ON projects FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM broker_connections bc
    WHERE bc.developer_id = projects.developer_id
      AND bc.broker_id = get_broker_company_id()
      AND bc.status = 'active'
  )
);

-- Admins can read all projects
CREATE POLICY "admin_read_all_projects"
ON projects FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS Policies: project_photos
-- ─────────────────────────────────────────────────────────────────────────────

-- Developers can manage photos for their own projects
CREATE POLICY "developer_own_project_photos"
ON project_photos FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = project_photos.project_id
      AND is_developer_owner(p.developer_id)
  )
);

-- Connected brokers can read project photos
CREATE POLICY "connected_broker_read_project_photos"
ON project_photos FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM projects p
    JOIN broker_connections bc ON bc.developer_id = p.developer_id
    WHERE p.id = project_photos.project_id
      AND bc.broker_id = get_broker_company_id()
      AND bc.status = 'active'
  )
);

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS Policies: units
-- ─────────────────────────────────────────────────────────────────────────────

-- Developers can manage units in their own projects
CREATE POLICY "developer_own_units"
ON units FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = units.project_id
      AND is_developer_owner(p.developer_id)
  )
);

-- Connected brokers can read units from active connections
CREATE POLICY "connected_broker_read_units"
ON units FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM broker_connections bc
    JOIN projects p ON p.id = units.project_id
    WHERE bc.developer_id = p.developer_id
      AND bc.broker_id = get_broker_company_id()
      AND bc.status = 'active'
  )
);

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS Policies: broker_connections
-- ─────────────────────────────────────────────────────────────────────────────

-- Developers can manage their own connections
CREATE POLICY "developer_own_connections"
ON broker_connections FOR ALL
USING (is_developer_owner(developer_id));

-- Brokers can read and update connections they are part of
CREATE POLICY "broker_own_connections"
ON broker_connections FOR SELECT
USING (broker_id = get_broker_company_id());

CREATE POLICY "broker_update_connections"
ON broker_connections FOR UPDATE
USING (broker_id = get_broker_company_id());

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS Policies: developer_commission_rates
-- ─────────────────────────────────────────────────────────────────────────────

-- Developers can manage their own commission rates
CREATE POLICY "developer_own_commission_rates"
ON developer_commission_rates FOR ALL
USING (is_developer_owner(developer_id));

-- Connected brokers can read commission rates for their connections
CREATE POLICY "broker_read_commission_rates"
ON developer_commission_rates FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM broker_connections bc
    WHERE bc.id = developer_commission_rates.connection_id
      AND bc.broker_id = get_broker_company_id()
      AND bc.status = 'active'
  )
);

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS Policies: developer_commission_records  (immutable — no UPDATE/DELETE)
-- ─────────────────────────────────────────────────────────────────────────────

-- Developers can read commission records for their connections
CREATE POLICY "developer_read_commission_records"
ON developer_commission_records FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM broker_connections bc
    WHERE bc.id = developer_commission_records.connection_id
      AND is_developer_owner(bc.developer_id)
  )
);

-- Brokers can read commission records for their connections
CREATE POLICY "broker_read_commission_records"
ON developer_commission_records FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM broker_connections bc
    WHERE bc.id = developer_commission_records.connection_id
      AND bc.broker_id = get_broker_company_id()
  )
);

-- Commission records are immutable — no UPDATE or DELETE allowed
CREATE POLICY "commission_records_no_update"
ON developer_commission_records FOR UPDATE USING (false);

CREATE POLICY "commission_records_no_delete"
ON developer_commission_records FOR DELETE USING (false);

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS Policies: reservation_requests
-- ─────────────────────────────────────────────────────────────────────────────

-- Developers can read/update reservations for their units
CREATE POLICY "developer_own_reservations"
ON reservation_requests FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM units u
    JOIN projects p ON p.id = u.project_id
    WHERE u.id = reservation_requests.unit_id
      AND is_developer_owner(p.developer_id)
  )
);

-- Brokers can read and insert reservations for their connections
CREATE POLICY "broker_read_reservations"
ON reservation_requests FOR SELECT
USING (broker_id = get_broker_company_id());

CREATE POLICY "broker_insert_reservations"
ON reservation_requests FOR INSERT
WITH CHECK (broker_id = get_broker_company_id());

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS Policies: in_house_agent_tags
-- ─────────────────────────────────────────────────────────────────────────────

-- Developers can manage their own in-house agent tags
CREATE POLICY "developer_own_agent_tags"
ON in_house_agent_tags FOR ALL
USING (is_developer_owner(developer_id));

-- Agents can read their own tags and update (accept/decline invitation)
CREATE POLICY "agent_read_own_tags"
ON in_house_agent_tags FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM realtors r
    WHERE r.id = in_house_agent_tags.realtor_id
      AND r.id = auth.uid()
  )
);

CREATE POLICY "agent_update_own_tags"
ON in_house_agent_tags FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM realtors r
    WHERE r.id = in_house_agent_tags.realtor_id
      AND r.id = auth.uid()
  )
);
