-- =============================================
-- AVATARS STORAGE BUCKET SETUP
-- =============================================
-- This migration creates the "avatars" bucket and sets up RLS policies
-- Run this in your Supabase SQL Editor

-- Create the avatars bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true, -- Public read access
  5242880, -- 5MB file size limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png']
)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- RLS POLICIES FOR AVATARS BUCKET
-- =============================================

-- Drop existing policies if they exist (to avoid conflicts when re-running)
DROP POLICY IF EXISTS "Users can upload own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own avatars (root)" ON storage.objects;
DROP POLICY IF EXISTS "Public avatar access" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatars" ON storage.objects;

-- Policy: Users can upload their own avatars
-- Files are stored directly in bucket root as: {user_id}_{timestamp}.jpg
-- This policy allows authenticated users to upload files with their user_id prefix
CREATE POLICY "Users can upload own avatars"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.uid() IS NOT NULL -- User must be authenticated
  AND (
    -- Files in root with user_id prefix (format: {user_id}_{timestamp}.jpg)
    (name LIKE auth.uid()::text || '_%' OR name LIKE auth.uid()::text || '-%')
    OR
    -- Files in user folders (format: {user_id}/{filename})
    (storage.foldername(name))[1] = auth.uid()::text
  )
);

-- Policy: Public read access to all avatars
CREATE POLICY "Public avatar access"
ON storage.objects
FOR SELECT
USING (bucket_id = 'avatars');

-- Policy: Users can delete their own avatars
CREATE POLICY "Users can delete own avatars"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'avatars'
  AND (
    -- If files are in user folders
    auth.uid()::text = (storage.foldername(name))[1]
    OR
    -- If files are in root with user_id prefix
    ((storage.foldername(name))[1] IS NULL AND (name LIKE auth.uid()::text || '_%' OR name LIKE auth.uid()::text || '-%'))
  )
);

-- Policy: Users can update their own avatars (optional, for replacing files)
CREATE POLICY "Users can update own avatars"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'avatars'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR
    ((storage.foldername(name))[1] IS NULL AND (name LIKE auth.uid()::text || '_%' OR name LIKE auth.uid()::text || '-%'))
  )
);

