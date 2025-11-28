-- Complete Event Setup: Storage + Database Columns
-- Run this entire script in your Supabase SQL Editor
-- This sets up everything needed for event images and privacy features

-- ============================================
-- STEP 1: Add missing columns to events table
-- ============================================

-- Add image_url column for event images
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add is_private column (for private/public events)
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false;

-- Add organizer_id column (to track who created the event)
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS organizer_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- ============================================
-- STEP 2: Verify columns were added
-- ============================================

SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns
WHERE table_name = 'events' 
AND column_name IN ('image_url', 'is_private', 'organizer_id')
ORDER BY column_name;

-- ============================================
-- STEP 3: Create event_photos table (for posting photos to events)
-- ============================================

-- Create event_photos table
CREATE TABLE IF NOT EXISTS event_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE event_photos ENABLE ROW LEVEL SECURITY;

-- Policy: Allow attendees to view all photos for events they're attending
DROP POLICY IF EXISTS "Attendees can view event photos" ON event_photos;
CREATE POLICY "Attendees can view event photos" ON event_photos
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM event_attendees
      WHERE event_attendees.user_id = auth.uid()
      AND event_attendees.event_id = event_photos.event_id
    )
  );

-- Policy: Allow attendees to add photos to events they're attending
DROP POLICY IF EXISTS "Attendees can add photos" ON event_photos;
CREATE POLICY "Attendees can add photos" ON event_photos
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'::text
    AND user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM event_attendees
      WHERE event_attendees.user_id = auth.uid()
      AND event_attendees.event_id = event_photos.event_id
    )
  );

-- Policy: Allow users to delete their own photos
DROP POLICY IF EXISTS "Users can delete their own photos" ON event_photos;
CREATE POLICY "Users can delete their own photos" ON event_photos
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_event_photos_event_id ON event_photos(event_id);
CREATE INDEX IF NOT EXISTS idx_event_photos_user_id ON event_photos(user_id);

-- ============================================
-- STEP 4: Create event_join_requests table (for private events)
-- ============================================

-- Create event_join_requests table
CREATE TABLE IF NOT EXISTS event_join_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE event_join_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to request to join events
DROP POLICY IF EXISTS "Allow authenticated users to request to join events" ON event_join_requests;
CREATE POLICY "Allow authenticated users to request to join events" ON event_join_requests
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated'::text AND user_id = auth.uid());

-- Policy: Allow event organizers to view and manage join requests
DROP POLICY IF EXISTS "Allow event organizers to view and manage join requests" ON event_join_requests;
CREATE POLICY "Allow event organizers to view and manage join requests" ON event_join_requests
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM events 
      WHERE events.id = event_join_requests.event_id 
      AND events.organizer_id = auth.uid()
    )
  );

-- Policy: Allow users to view their own join requests
DROP POLICY IF EXISTS "Allow users to view their own join requests" ON event_join_requests;
CREATE POLICY "Allow users to view their own join requests" ON event_join_requests
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_event_join_requests_event_id ON event_join_requests(event_id);
CREATE INDEX IF NOT EXISTS idx_event_join_requests_user_id ON event_join_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_event_join_requests_status ON event_join_requests(status);

-- ============================================
-- NEXT STEPS (Do these in Supabase Dashboard):
-- ============================================
-- 
-- 1. Create Storage Bucket:
--    - Go to: Storage → New bucket
--    - Name: "events" (exactly, lowercase)
--    - ✅ Check "Public bucket"
--    - File size: 5 MB
--    - Click "Create bucket"
--
-- 2. Set Up Storage Policies:
--    - Go to: Storage → events bucket → Policies tab
--    - Create 4 policies (see QUICK_STORAGE_SETUP.md)
--
-- 3. Test:
--    - Create an event with a photo in your app
--    - Join the event
--    - Try posting photos to the event
--    - It should work! ✅
--

