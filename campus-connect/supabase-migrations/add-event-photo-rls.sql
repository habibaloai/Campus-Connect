-- Migration: Row Level Security (RLS) Policies for Event Photos, Comments, and Likes
-- This migration sets up RLS policies to ensure proper access control

-- =============================================
-- Enable RLS on all tables
-- =============================================
ALTER TABLE event_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_photo_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_photo_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_join_requests ENABLE ROW LEVEL SECURITY;

-- =============================================
-- Event Photos RLS Policies
-- =============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view photos for events they're attending" ON event_photos;
DROP POLICY IF EXISTS "Users can upload photos to events they're attending" ON event_photos;
DROP POLICY IF EXISTS "Users can delete their own photos" ON event_photos;
DROP POLICY IF EXISTS "Event creators can delete any photo in their event" ON event_photos;

-- Policy: Users can view photos for events they're attending
CREATE POLICY "Users can view photos for events they're attending"
ON event_photos
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM event_attendees
    WHERE event_attendees.event_id = event_photos.event_id
    AND event_attendees.user_id = auth.uid()
  )
);

-- Policy: Users can upload photos to events they're attending
CREATE POLICY "Users can upload photos to events they're attending"
ON event_photos
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM event_attendees
    WHERE event_attendees.event_id = event_photos.event_id
    AND event_attendees.user_id = auth.uid()
  )
);

-- Policy: Users can delete their own photos
CREATE POLICY "Users can delete their own photos"
ON event_photos
FOR DELETE
USING (
  auth.uid() IS NOT NULL
  AND user_id = auth.uid()
);

-- Policy: Event creators can delete any photo in their event
CREATE POLICY "Event creators can delete any photo in their event"
ON event_photos
FOR DELETE
USING (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM events
    WHERE events.id = event_photos.event_id
    AND events.organizer_id = auth.uid()
  )
);

-- =============================================
-- Event Photo Comments RLS Policies
-- =============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view comments on photos for events they're attending" ON event_photo_comments;
DROP POLICY IF EXISTS "Users can comment on photos for events they're attending" ON event_photo_comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON event_photo_comments;

-- Policy: Users can view comments on photos for events they're attending
CREATE POLICY "Users can view comments on photos for events they're attending"
ON event_photo_comments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM event_photos
    INNER JOIN event_attendees ON event_attendees.event_id = event_photos.event_id
    WHERE event_photos.id = event_photo_comments.photo_id
    AND event_attendees.user_id = auth.uid()
  )
);

-- Policy: Users can comment on photos for events they're attending
CREATE POLICY "Users can comment on photos for events they're attending"
ON event_photo_comments
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM event_photos
    INNER JOIN event_attendees ON event_attendees.event_id = event_photos.event_id
    WHERE event_photos.id = event_photo_comments.photo_id
    AND event_attendees.user_id = auth.uid()
  )
);

-- Policy: Users can delete their own comments
CREATE POLICY "Users can delete their own comments"
ON event_photo_comments
FOR DELETE
USING (
  auth.uid() IS NOT NULL
  AND user_id = auth.uid()
);

-- =============================================
-- Event Photo Likes RLS Policies
-- =============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view likes on photos for events they're attending" ON event_photo_likes;
DROP POLICY IF EXISTS "Users can like photos for events they're attending" ON event_photo_likes;
DROP POLICY IF EXISTS "Users can unlike photos" ON event_photo_likes;

-- Policy: Users can view likes on photos for events they're attending
CREATE POLICY "Users can view likes on photos for events they're attending"
ON event_photo_likes
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM event_photos
    INNER JOIN event_attendees ON event_attendees.event_id = event_photos.event_id
    WHERE event_photos.id = event_photo_likes.photo_id
    AND event_attendees.user_id = auth.uid()
  )
);

-- Policy: Users can like photos for events they're attending
CREATE POLICY "Users can like photos for events they're attending"
ON event_photo_likes
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM event_photos
    INNER JOIN event_attendees ON event_attendees.event_id = event_photos.event_id
    WHERE event_photos.id = event_photo_likes.photo_id
    AND event_attendees.user_id = auth.uid()
  )
);

-- Policy: Users can unlike photos (delete their like)
CREATE POLICY "Users can unlike photos"
ON event_photo_likes
FOR DELETE
USING (
  auth.uid() IS NOT NULL
  AND user_id = auth.uid()
);

-- =============================================
-- Event Join Requests RLS Policies
-- =============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own join requests" ON event_join_requests;
DROP POLICY IF EXISTS "Event creators can view join requests for their events" ON event_join_requests;
DROP POLICY IF EXISTS "Users can create join requests" ON event_join_requests;
DROP POLICY IF EXISTS "Users can cancel their own join requests" ON event_join_requests;
DROP POLICY IF EXISTS "Event creators can update join request status" ON event_join_requests;

-- Policy: Users can view their own join requests
CREATE POLICY "Users can view their own join requests"
ON event_join_requests
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND user_id = auth.uid()
);

-- Policy: Event creators can view join requests for their events
CREATE POLICY "Event creators can view join requests for their events"
ON event_join_requests
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM events
    WHERE events.id = event_join_requests.event_id
    AND events.organizer_id = auth.uid()
  )
);

-- Policy: Users can create join requests
CREATE POLICY "Users can create join requests"
ON event_join_requests
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND user_id = auth.uid()
  AND status = 'pending'
);

-- Policy: Users can cancel their own join requests
CREATE POLICY "Users can cancel their own join requests"
ON event_join_requests
FOR DELETE
USING (
  auth.uid() IS NOT NULL
  AND user_id = auth.uid()
  AND status = 'pending'
);

-- Policy: Event creators can update join request status
CREATE POLICY "Event creators can update join request status"
ON event_join_requests
FOR UPDATE
USING (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM events
    WHERE events.id = event_join_requests.event_id
    AND events.organizer_id = auth.uid()
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM events
    WHERE events.id = event_join_requests.event_id
    AND events.organizer_id = auth.uid()
  )
);

-- =============================================
-- Events Table RLS Policies (Update)
-- =============================================

-- Ensure RLS is enabled on events table
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Event creators can update their events" ON events;
DROP POLICY IF EXISTS "Event creators can delete their events" ON events;

-- Policy: Event creators can update their events
CREATE POLICY "Event creators can update their events"
ON events
FOR UPDATE
USING (
  auth.uid() IS NOT NULL
  AND organizer_id = auth.uid()
)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND organizer_id = auth.uid()
);

-- Policy: Event creators can delete their events
CREATE POLICY "Event creators can delete their events"
ON events
FOR DELETE
USING (
  auth.uid() IS NOT NULL
  AND organizer_id = auth.uid()
);

