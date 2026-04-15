-- ============================================================
-- Pre-migration setup
-- Runs BEFORE tables are created
-- ============================================================

-- Fix PostGIS search path so ST_MakePoint is accessible
SET search_path TO public, extensions;

-- Create hazard-layers storage bucket (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('hazard-layers', 'hazard-layers', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to hazard-layers bucket
CREATE POLICY "Public read hazard layers"
ON storage.objects FOR SELECT
USING (bucket_id = 'hazard-layers');

-- Allow authenticated users (admin) to upload hazard layers
CREATE POLICY "Admin upload hazard layers"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'hazard-layers' AND
  auth.role() = 'authenticated'
);
