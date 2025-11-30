-- Migration for Event Announcements
-- Only event organizers can post announcements

-- Create event_announcements table
CREATE TABLE IF NOT EXISTS event_announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  organizer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_event_announcements_event_id ON event_announcements(event_id);
CREATE INDEX IF NOT EXISTS idx_event_announcements_organizer_id ON event_announcements(organizer_id);
CREATE INDEX IF NOT EXISTS idx_event_announcements_created_at ON event_announcements(created_at DESC);

-- Enable Row Level Security
ALTER TABLE event_announcements ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Anyone can read announcements for events they have access to
CREATE POLICY "Anyone can view event announcements"
  ON event_announcements
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_announcements.event_id
      AND (
        events.is_private = false
        OR EXISTS (
          SELECT 1 FROM event_attendees
          WHERE event_attendees.event_id = events.id
          AND event_attendees.user_id = auth.uid()
        )
        OR events.organizer_id = auth.uid()
      )
    )
  );

-- Only event organizers can insert announcements
CREATE POLICY "Only organizers can create announcements"
  ON event_announcements
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_announcements.event_id
      AND events.organizer_id = auth.uid()
    )
  );

-- Only event organizers can update their own announcements
CREATE POLICY "Only organizers can update announcements"
  ON event_announcements
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_announcements.event_id
      AND events.organizer_id = auth.uid()
    )
  );

-- Only event organizers can delete their own announcements
CREATE POLICY "Only organizers can delete announcements"
  ON event_announcements
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_announcements.event_id
      AND events.organizer_id = auth.uid()
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_event_announcements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_event_announcements_updated_at
  BEFORE UPDATE ON event_announcements
  FOR EACH ROW
  EXECUTE FUNCTION update_event_announcements_updated_at();

