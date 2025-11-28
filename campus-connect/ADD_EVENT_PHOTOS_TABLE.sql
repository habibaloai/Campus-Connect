-- Quick Fix: Add event_photos table for posting photos to events
-- Run this in your Supabase SQL Editor

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

-- Verify the table was created
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'event_photos'
ORDER BY ordinal_position;

