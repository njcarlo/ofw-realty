-- Migration 014: Developer Portal — schema extensions and storage buckets
-- Tasks 1.2 + 1.3: Extends existing tables with developer role and vanity URL
-- fields, and provisions developer/project media storage buckets.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Add `developer` role to users.role CHECK constraint  (Task 1.2)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE users
  DROP CONSTRAINT users_role_check,
  ADD CONSTRAINT users_role_check
    CHECK (role IN ('buyer','seller','realtor','broker_admin','admin','developer'));

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Add vanity URL columns to broker_companies  (Task 1.2)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE broker_companies
  ADD COLUMN vanity_slug          text UNIQUE,
  ADD COLUMN vanity_slug_set_at   timestamptz,
  ADD COLUMN previous_vanity_slug text,
  ADD COLUMN previous_slug_set_at timestamptz;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Storage buckets  (Task 1.3)
-- ─────────────────────────────────────────────────────────────────────────────

-- Developer logos and cover images (public, 10 MB, images only)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'developer-media',
  'developer-media',
  true,       -- public bucket
  10485760,   -- 10 MB (10 * 1024 * 1024)
  ARRAY['image/jpeg','image/jpg','image/png','image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Project photos and site maps (public, 20 MB, images + PDFs)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'project-media',
  'project-media',
  true,       -- public bucket
  20971520,   -- 20 MB (20 * 1024 * 1024)
  ARRAY['image/jpeg','image/jpg','image/png','image/webp','application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Storage RLS policies — developer-media bucket  (Task 1.3)
-- ─────────────────────────────────────────────────────────────────────────────

-- Developers can upload to their own folder (path: {user_id}/*)
CREATE POLICY "developers_upload_own_media"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'developer-media'
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'developer'
  )
);

-- Developers can update/replace their own media
CREATE POLICY "developers_update_own_media"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'developer-media'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Developers can delete their own media
CREATE POLICY "developers_delete_own_media"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'developer-media'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Anyone can read developer media (public bucket)
CREATE POLICY "public_read_developer_media"
ON storage.objects FOR SELECT
USING (bucket_id = 'developer-media');

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Storage RLS policies — project-media bucket  (Task 1.3)
-- ─────────────────────────────────────────────────────────────────────────────

-- Developers can upload project media to their own folder (path: {user_id}/*)
CREATE POLICY "developers_upload_project_media"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'project-media'
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'developer'
  )
);

-- Developers can update/replace their own project media
CREATE POLICY "developers_update_project_media"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'project-media'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Developers can delete their own project media
CREATE POLICY "developers_delete_project_media"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'project-media'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Anyone can read project media (public bucket)
CREATE POLICY "public_read_project_media"
ON storage.objects FOR SELECT
USING (bucket_id = 'project-media');
