-- Run after migrating to project frbkrtxbymsrzwmdhzlp
-- 1) Creates avatars bucket + policies (if missing)
-- 2) Rewrites profile avatar_url host from old project to new

-- Avatars bucket + RLS (from setup-avatars-storage.sql)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Users can upload own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public avatar access" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatars" ON storage.objects;

CREATE POLICY "Users can upload own avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.uid() IS NOT NULL
  AND (
    name LIKE auth.uid()::text || '_%'
    OR name LIKE auth.uid()::text || '-%'
    OR (storage.foldername(name))[1] = auth.uid()::text
  )
);

CREATE POLICY "Public avatar access"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can delete own avatars"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR ((storage.foldername(name))[1] IS NULL AND (name LIKE auth.uid()::text || '_%' OR name LIKE auth.uid()::text || '-%'))
  )
);

CREATE POLICY "Users can update own avatars"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR ((storage.foldername(name))[1] IS NULL AND (name LIKE auth.uid()::text || '_%' OR name LIKE auth.uid()::text || '-%'))
  )
);

-- Rewrite stored URLs to new project host
UPDATE profiles
SET avatar_url = TRIM(
  REPLACE(
    REPLACE(avatar_url, 'https://ojmkhimriptucfsulfzv.supabase.co', 'https://frbkrtxbymsrzwmdhzlp.supabase.co'),
    '%20',
    ''
  )
)
WHERE avatar_url IS NOT NULL
  AND avatar_url LIKE '%ojmkhimriptucfsulfzv.supabase.co%';

-- Also fix banner URLs if present
UPDATE profiles
SET banner_url = TRIM(
  REPLACE(
    REPLACE(banner_url, 'https://ojmkhimriptucfsulfzv.supabase.co', 'https://frbkrtxbymsrzwmdhzlp.supabase.co'),
    '%20',
    ''
  )
)
WHERE banner_url IS NOT NULL
  AND banner_url LIKE '%ojmkhimriptucfsulfzv.supabase.co%';
