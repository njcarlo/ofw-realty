-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE broker_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE realtors ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE open_houses ENABLE ROW LEVEL SECURITY;
ALTER TABLE open_house_rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_pool ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_trail ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_devices ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PUBLIC READ POLICIES (no login required)
-- ============================================================

-- Public can read active listings
CREATE POLICY "public_read_active_listings" ON listings
  FOR SELECT USING (status = 'active' AND scam_flagged = false);

-- Public can read listing photos
CREATE POLICY "public_read_listing_photos" ON listing_photos
  FOR SELECT USING (true);

-- Public can read agent portfolios
CREATE POLICY "public_read_realtors" ON realtors
  FOR SELECT USING (true);

-- Public can read broker companies
CREATE POLICY "public_read_broker_companies" ON broker_companies
  FOR SELECT USING (true);

-- ============================================================
-- USER OWN DATA POLICIES
-- ============================================================

-- Users can read and update their own profile
CREATE POLICY "users_own_profile_read" ON users
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "users_own_profile_update" ON users
  FOR UPDATE USING (id = auth.uid());

-- Buyers can only see their own inquiries
CREATE POLICY "buyers_own_inquiries" ON inquiries
  FOR SELECT USING (buyer_id = auth.uid());

-- Realtors can see inquiries for their listings
CREATE POLICY "realtors_listing_inquiries" ON inquiries
  FOR SELECT USING (realtor_id = auth.uid());

-- Users can see messages in their own inquiries
CREATE POLICY "users_own_messages" ON messages
  FOR SELECT USING (
    inquiry_id IN (
      SELECT id FROM inquiries
      WHERE buyer_id = auth.uid() OR realtor_id = auth.uid()
    )
  );

-- Buyers can see their own transactions
CREATE POLICY "buyers_own_transactions" ON transactions
  FOR SELECT USING (buyer_id = auth.uid());

-- Realtors can see their own transactions
CREATE POLICY "realtors_own_transactions" ON transactions
  FOR SELECT USING (realtor_id = auth.uid());

-- Buyers can see their own saved areas
CREATE POLICY "buyers_own_saved_areas" ON saved_areas
  FOR ALL USING (buyer_id = auth.uid());

-- Users can see their own notifications
CREATE POLICY "users_own_notifications" ON notifications
  FOR ALL USING (user_id = auth.uid());

-- Users can manage their own notification preferences
CREATE POLICY "users_own_notification_prefs" ON notification_preferences
  FOR ALL USING (user_id = auth.uid());

-- Users can see their own devices
CREATE POLICY "users_own_devices" ON user_devices
  FOR ALL USING (user_id = auth.uid());

-- ============================================================
-- REALTOR POLICIES
-- ============================================================

-- Realtors can create and manage their own listings
CREATE POLICY "realtors_manage_own_listings" ON listings
  FOR ALL USING (realtor_id = auth.uid());

-- Realtors can see property pool for their brokerage
CREATE POLICY "pool_brokerage_only" ON property_pool
  FOR SELECT USING (
    brokerage_id IN (
      SELECT brokerage_id FROM realtor_brokerage_affiliations
      WHERE realtor_id = auth.uid() AND status = 'active'
    )
  );

-- ============================================================
-- DEAL ROOM POLICIES (participants only)
-- ============================================================

CREATE POLICY "deal_room_participants" ON deal_rooms
  FOR SELECT USING (
    buyer_id = auth.uid() OR
    co_borrower_id = auth.uid() OR
    realtor_id = auth.uid()
  );

-- ============================================================
-- AUDIT TRAIL — APPEND ONLY (no UPDATE or DELETE)
-- ============================================================

-- Anyone can insert audit events (API handles authorization)
CREATE POLICY "audit_insert_only" ON audit_trail
  FOR INSERT WITH CHECK (true);

-- Admins can read all audit trail
CREATE POLICY "admin_read_audit" ON audit_trail
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
  );

-- Realtors/brokers can read audit for their own transactions
CREATE POLICY "realtor_read_own_audit" ON audit_trail
  FOR SELECT USING (
    entity_id IN (
      SELECT id FROM transactions WHERE realtor_id = auth.uid()
    ) OR
    entity_id IN (
      SELECT id FROM transactions WHERE brokerage_id IN (
        SELECT brokerage_id FROM realtor_brokerage_affiliations
        WHERE realtor_id = auth.uid() AND status = 'active'
      )
    )
  );

-- Buyers can read audit for their own transactions
CREATE POLICY "buyer_read_own_audit" ON audit_trail
  FOR SELECT USING (
    entity_id IN (
      SELECT id FROM transactions WHERE buyer_id = auth.uid()
    )
  );

-- CRITICAL: No UPDATE or DELETE policies on audit_trail
-- This enforces append-only behavior at the database level

-- ============================================================
-- ADMIN FULL ACCESS
-- ============================================================

CREATE POLICY "admin_full_access_users" ON users
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
  );

CREATE POLICY "admin_full_access_listings" ON listings
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
  );

CREATE POLICY "admin_full_access_documents" ON documents
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
  );
