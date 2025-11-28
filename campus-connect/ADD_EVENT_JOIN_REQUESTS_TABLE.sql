-- Quick Fix: Add event_join_requests table for private events
-- Run this in your Supabase SQL Editor

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

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_event_join_requests_event_id ON event_join_requests(event_id);
CREATE INDEX IF NOT EXISTS idx_event_join_requests_user_id ON event_join_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_event_join_requests_status ON event_join_requests(status);

-- Verify the table was created
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'event_join_requests'
ORDER BY ordinal_position;

