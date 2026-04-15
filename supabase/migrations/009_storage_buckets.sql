-- Migration 009: Supabase Storage buckets for document uploads

-- Agent/Broker verification documents (private — only owner + admin can access)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'agent-documents',
  'agent-documents',
  false,  -- private bucket
  10485760,  -- 10MB limit
  ARRAY['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Listing photos (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'listing-photos',
  'listing-photos',
  true,  -- public bucket
  10485760,  -- 10MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for agent-documents bucket
-- Agents can upload their own documents
CREATE POLICY "agents_upload_own_docs"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'agent-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Agents can read their own documents
CREATE POLICY "agents_read_own_docs"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'agent-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Admins can read all documents
CREATE POLICY "admins_read_all_docs"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'agent-documents'
  AND EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- RLS policies for listing-photos bucket
-- Realtors can upload listing photos
CREATE POLICY "realtors_upload_listing_photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'listing-photos'
  AND auth.role() = 'authenticated'
);

-- Anyone can read listing photos (public bucket)
CREATE POLICY "public_read_listing_photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'listing-photos');
