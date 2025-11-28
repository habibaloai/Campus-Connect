-- Migration: Setup Storage Buckets for Event Photos and Covers
-- This migration creates and configures storage buckets for event-related images

-- =============================================
-- Create event-photos storage bucket
-- =============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'event-photos',
  'event-photos',
  true, -- Public read access
  10485760, -- 10MB file size limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- Create event-covers storage bucket
-- =============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'event-covers',
  'event-covers',
  true, -- Public read access
  10485760, -- 10MB file size limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- Drop existing policies if they exist
-- =============================================
DROP POLICY IF EXISTS "Event attendees can upload photos" ON storage.objects;
DROP POLICY IF EXISTS "Public can view event photos" ON storage.objects;
DROP POLICY IF EXISTS "Photo uploaders can delete their photos" ON storage.objects;
DROP POLICY IF EXISTS "Event creators can delete any photo in their event" ON storage.objects;
DROP POLICY IF EXISTS "Event creators can upload cover photos" ON storage.objects;
DROP POLICY IF EXISTS "Public can view event cover photos" ON storage.objects;
DROP POLICY IF EXISTS "Event creators can update their cover photos" ON storage.objects;
DROP POLICY IF EXISTS "Event creators can delete their cover photos" ON storage.objects;

-- =============================================
-- Storage Policies for event-photos bucket
-- =============================================

-- Policy: Event attendees can upload photos
-- Photos are stored as: event-photos/{event_id}/{photo_id}.{ext}
CREATE POLICY "Event attendees can upload photos"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'event-photos'
  AND auth.uid() IS NOT NULL
  AND (
    -- Photos in event folders: event-photos/{event_id}/{filename}
    -- Extract event_id from path and verify user is attendee
    EXISTS (
      SELECT 1 FROM event_attendees
      WHERE event_attendees.event_id::text = (storage.foldername(name))[1]
      AND event_attendees.user_id = auth.uid()
    )
  )
);

-- Policy: Public can view event photos
CREATE POLICY "Public can view event photos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'event-photos');

-- Policy: Photo uploaders can delete their photos
-- Photos are linked via event_photos table
CREATE POLICY "Photo uploaders can delete their photos"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'event-photos'
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM event_photos
    WHERE event_photos.photo_url LIKE '%' || storage.objects.name || '%'
    AND event_photos.user_id = auth.uid()
  )
);

-- Policy: Event creators can delete any photo in their event
CREATE POLICY "Event creators can delete any photo in their event"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'event-photos'
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM event_photos
    INNER JOIN events ON events.id = event_photos.event_id
    WHERE event_photos.photo_url LIKE '%' || storage.objects.name || '%'
    AND events.organizer_id = auth.uid()
  )
);

-- =============================================
-- Storage Policies for event-covers bucket
-- =============================================

-- Policy: Event creators can upload cover photos
-- Cover photos are stored as: event-covers/{event_id}.{ext}
CREATE POLICY "Event creators can upload cover photos"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'event-covers'
  AND auth.uid() IS NOT NULL
  AND (
    -- Cover photos: event-covers/{event_id}.{ext}
    -- Extract event_id from filename and verify user is organizer
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id::text = split_part(split_part(name, '/', 2), '.', 1)
      AND events.organizer_id = auth.uid()
    )
    OR
    -- Alternative: event-covers/{event_id}/{filename}
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id::text = (storage.foldername(name))[1]
      AND events.organizer_id = auth.uid()
    )
  )
);

-- Policy: Public can view event cover photos
CREATE POLICY "Public can view event cover photos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'event-covers');

-- Policy: Event creators can update their cover photos
CREATE POLICY "Event creators can update their cover photos"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'event-covers'
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM events
    WHERE (
      events.id::text = split_part(split_part(name, '/', 2), '.', 1)
      OR events.id::text = (storage.foldername(name))[1]
    )
    AND events.organizer_id = auth.uid()
  )
);

-- Policy: Event creators can delete their cover photos
CREATE POLICY "Event creators can delete their cover photos"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'event-covers'
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM events
    WHERE (
      events.id::text = split_part(split_part(name, '/', 2), '.', 1)
      OR events.id::text = (storage.foldername(name))[1]
    )
    AND events.organizer_id = auth.uid()
  )
);


