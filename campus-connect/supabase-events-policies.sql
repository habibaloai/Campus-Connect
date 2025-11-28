-- RLS Policies for Events and Event Attendees
-- Run this in your Supabase SQL Editor to enable event functionality

-- =====================================================
-- EVENTS TABLE POLICIES
-- =====================================================

-- Allow everyone to view events
DROP POLICY IF EXISTS "Events viewable by everyone" ON events;
CREATE POLICY "Events viewable by everyone" 
ON events FOR SELECT 
USING (true);

-- Allow authenticated users to create events
DROP POLICY IF EXISTS "Users can create events" ON events;
CREATE POLICY "Users can create events" 
ON events FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Allow event organizers to update their events (optional)
DROP POLICY IF EXISTS "Organizers can update events" ON events;
CREATE POLICY "Organizers can update events" 
ON events FOR UPDATE 
TO authenticated 
USING (true);

-- Allow event organizers to delete their events (optional)
DROP POLICY IF EXISTS "Organizers can delete events" ON events;
CREATE POLICY "Organizers can delete events" 
ON events FOR DELETE 
TO authenticated 
USING (true);

-- =====================================================
-- EVENT ATTENDEES TABLE POLICIES
-- =====================================================

-- Allow everyone to view event attendees
DROP POLICY IF EXISTS "Anyone can view event attendees" ON event_attendees;
CREATE POLICY "Anyone can view event attendees" 
ON event_attendees FOR SELECT 
USING (true);

-- Allow authenticated users to join events (insert their own attendance)
DROP POLICY IF EXISTS "Users can join events" ON event_attendees;
CREATE POLICY "Users can join events" 
ON event_attendees FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- Allow users to leave events (delete their own attendance)
DROP POLICY IF EXISTS "Users can leave events" ON event_attendees;
CREATE POLICY "Users can leave events" 
ON event_attendees FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check that policies were created successfully
-- SELECT tablename, policyname, permissive, roles, cmd, qual 
-- FROM pg_policies 
-- WHERE tablename IN ('events', 'event_attendees');










