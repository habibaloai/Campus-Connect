-- Migration: Add RLS Policies for event_attendees Table
-- This migration sets up RLS policies to allow users to join events and organizers to add attendees

-- Enable RLS on event_attendees table if not already enabled
ALTER TABLE event_attendees ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view attendees for events" ON event_attendees;
DROP POLICY IF EXISTS "Users can join events themselves" ON event_attendees;
DROP POLICY IF EXISTS "Event organizers can add attendees" ON event_attendees;
DROP POLICY IF EXISTS "Users can leave events" ON event_attendees;

-- Policy: Users can view attendees for any event
CREATE POLICY "Users can view attendees for events"
ON event_attendees
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Policy: Users can join events themselves (for public events)
CREATE POLICY "Users can join events themselves"
ON event_attendees
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND user_id = auth.uid()
);

-- Policy: Event organizers can add attendees (when approving join requests)
CREATE POLICY "Event organizers can add attendees"
ON event_attendees
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM events
    WHERE events.id = event_attendees.event_id
    AND events.organizer_id = auth.uid()
  )
);

-- Policy: Users can leave events (delete their own attendance)
CREATE POLICY "Users can leave events"
ON event_attendees
FOR DELETE
USING (
  auth.uid() IS NOT NULL
  AND user_id = auth.uid()
);

-- Policy: Event organizers can remove attendees (for moderation)
CREATE POLICY "Event organizers can remove attendees"
ON event_attendees
FOR DELETE
USING (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM events
    WHERE events.id = event_attendees.event_id
    AND events.organizer_id = auth.uid()
  )
);

