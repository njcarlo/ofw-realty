-- ============================================================
-- Fix infinite recursion in RLS policies on users table
-- The admin policy was querying users table to check role,
-- which triggered the same policy again (infinite loop)
-- Solution: use auth.jwt() to get role from JWT claims instead
-- ============================================================

-- Drop the recursive admin policies
DROP POLICY IF EXISTS "admin_full_access_users" ON users;
DROP POLICY IF EXISTS "admin_full_access_listings" ON listings;
DROP POLICY IF EXISTS "admin_full_access_documents" ON documents;
DROP POLICY IF EXISTS "admin_read_audit" ON audit_trail;
DROP POLICY IF EXISTS "realtor_read_own_audit" ON audit_trail;
DROP POLICY IF EXISTS "buyer_read_own_audit" ON audit_trail;

-- ============================================================
-- Recreate admin policies using auth.jwt() instead of
-- querying the users table (avoids recursion)
-- ============================================================

-- Helper: check if current user is admin via JWT metadata
-- JWT contains user_metadata.role set during registration

CREATE POLICY "admin_full_access_users" ON users
  FOR ALL USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "admin_full_access_listings" ON listings
  FOR ALL USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "admin_full_access_documents" ON documents
  FOR ALL USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- Audit trail read policies (non-recursive)
CREATE POLICY "admin_read_audit" ON audit_trail
  FOR SELECT USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "realtor_read_own_audit" ON audit_trail
  FOR SELECT USING (
    entity_id IN (
      SELECT id FROM transactions WHERE realtor_id = auth.uid()
    )
  );

CREATE POLICY "buyer_read_own_audit" ON audit_trail
  FOR SELECT USING (
    entity_id IN (
      SELECT id FROM transactions WHERE buyer_id = auth.uid()
    )
  );

-- ============================================================
-- Also fix the pool policy which queries realtor_brokerage_affiliations
-- (safe — no recursion there, but let's make it explicit)
-- ============================================================

DROP POLICY IF EXISTS "pool_brokerage_only" ON property_pool;

CREATE POLICY "pool_brokerage_only" ON property_pool
  FOR SELECT USING (
    brokerage_id IN (
      SELECT brokerage_id FROM realtor_brokerage_affiliations
      WHERE realtor_id = auth.uid() AND status = 'active'
    )
    OR (auth.jwt() -> 'user_metadata' ->> 'role') IN ('broker_admin', 'admin')
  );

-- ============================================================
-- Allow service role to bypass RLS entirely (for API server)
-- The NestJS API uses the service role key which bypasses RLS
-- This is already the default Supabase behavior
-- ============================================================
