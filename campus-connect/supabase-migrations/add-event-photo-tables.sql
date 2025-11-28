-- Migration: Add Event Photo Comments and Likes Tables
-- This migration creates the necessary tables for event photo interactions

-- =============================================
-- Event Photo Comments Table
-- =============================================
CREATE TABLE IF NOT EXISTS event_photo_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  photo_id UUID NOT NULL REFERENCES event_photos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT event_photo_comments_content_not_empty CHECK (length(trim(content)) > 0)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_event_photo_comments_photo_id ON event_photo_comments(photo_id);
CREATE INDEX IF NOT EXISTS idx_event_photo_comments_user_id ON event_photo_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_event_photo_comments_created_at ON event_photo_comments(created_at DESC);

-- =============================================
-- Event Photo Likes Table
-- =============================================
CREATE TABLE IF NOT EXISTS event_photo_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  photo_id UUID NOT NULL REFERENCES event_photos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- Prevent duplicate likes from same user on same photo
  UNIQUE(photo_id, user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_event_photo_likes_photo_id ON event_photo_likes(photo_id);
CREATE INDEX IF NOT EXISTS idx_event_photo_likes_user_id ON event_photo_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_event_photo_likes_created_at ON event_photo_likes(created_at DESC);

-- =============================================
-- Verify event_photos table exists and has required columns
-- =============================================
-- Note: If event_photos table doesn't exist, create it
CREATE TABLE IF NOT EXISTS event_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for event_photos
CREATE INDEX IF NOT EXISTS idx_event_photos_event_id ON event_photos(event_id);
CREATE INDEX IF NOT EXISTS idx_event_photos_user_id ON event_photos(user_id);
CREATE INDEX IF NOT EXISTS idx_event_photos_created_at ON event_photos(created_at DESC);

-- =============================================
-- Verify events table has required columns
-- =============================================
-- Add is_private column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'events' AND column_name = 'is_private'
  ) THEN
    ALTER TABLE events ADD COLUMN is_private BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Add organizer_id column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'events' AND column_name = 'organizer_id'
  ) THEN
    ALTER TABLE events ADD COLUMN organizer_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add image_url column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'events' AND column_name = 'image_url'
  ) THEN
    ALTER TABLE events ADD COLUMN image_url TEXT;
  END IF;
END $$;

-- Add updated_at column if it doesn't exist (for tracking event updates)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'events' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE events ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- =============================================
-- Verify event_join_requests table exists
-- =============================================
CREATE TABLE IF NOT EXISTS event_join_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for event_join_requests
CREATE INDEX IF NOT EXISTS idx_event_join_requests_event_id ON event_join_requests(event_id);
CREATE INDEX IF NOT EXISTS idx_event_join_requests_user_id ON event_join_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_event_join_requests_status ON event_join_requests(status);
CREATE INDEX IF NOT EXISTS idx_event_join_requests_created_at ON event_join_requests(created_at DESC);

-- Partial unique index to prevent duplicate pending requests
-- This ensures a user can only have one pending request per event
CREATE UNIQUE INDEX IF NOT EXISTS idx_event_join_requests_unique_pending 
ON event_join_requests(event_id, user_id) 
WHERE status = 'pending';

-- =============================================
-- Comments
-- =============================================
COMMENT ON TABLE event_photo_comments IS 'Comments on event photos by attendees';
COMMENT ON TABLE event_photo_likes IS 'Likes on event photos by attendees';
COMMENT ON TABLE event_photos IS 'Photos uploaded by event attendees';
COMMENT ON COLUMN events.is_private IS 'Whether the event is private (requires join request) or public';
COMMENT ON COLUMN events.organizer_id IS 'ID of the user who created the event';
COMMENT ON COLUMN events.image_url IS 'URL of the event cover photo';

