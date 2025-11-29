-- =============================================
-- ADD EVENT CHAT SUPPORT
-- This migration adds support for event-specific conversations
-- =============================================

-- Add event_id column to conversations table
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES events(id) ON DELETE CASCADE;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_conversations_event_id ON conversations(event_id);

-- Update the type constraint to include 'event'
-- First, drop the existing constraint (if any)
ALTER TABLE conversations 
DROP CONSTRAINT IF EXISTS conversations_type_check;

-- Add the new constraint with 'event' type
ALTER TABLE conversations 
ADD CONSTRAINT conversations_type_check 
CHECK (type IN ('direct', 'group', 'course', 'event'));

-- Add RLS policy for event conversations
-- Users can view event conversations if they are attendees of the event
DROP POLICY IF EXISTS "Users can view event conversations they attend" ON conversations;
CREATE POLICY "Users can view event conversations they attend"
  ON conversations FOR SELECT
  USING (
    (type = 'event' AND event_id IN (
      SELECT event_id 
      FROM event_attendees 
      WHERE user_id = auth.uid()
    ))
    OR
    (type != 'event' AND id IN (
      SELECT conversation_id 
      FROM conversation_participants 
      WHERE user_id = auth.uid()
    ))
  );

-- Users can create event conversations if they are attendees
DROP POLICY IF EXISTS "Users can create event conversations" ON conversations;
CREATE POLICY "Users can create event conversations"
  ON conversations FOR INSERT
  WITH CHECK (
    (type = 'event' AND event_id IN (
      SELECT event_id 
      FROM event_attendees 
      WHERE user_id = auth.uid()
    ))
    OR
    (type != 'event' AND auth.uid() IS NOT NULL)
  );

