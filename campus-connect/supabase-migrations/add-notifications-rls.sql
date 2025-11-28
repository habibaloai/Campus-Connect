-- Migration: Add RLS Policies for Notifications Table
-- This migration sets up RLS policies to ensure users can only see and create their own notifications

-- Enable RLS on notifications table if not already enabled
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can create notifications for themselves" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "System can create notifications for any user" ON notifications;

-- Policy: Users can view their own notifications
CREATE POLICY "Users can view their own notifications"
ON notifications
FOR SELECT
USING (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- Policy: Users can create notifications for themselves
-- This allows users to create notifications for themselves (though typically done by system)
CREATE POLICY "Users can create notifications for themselves"
ON notifications
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND user_id = auth.uid()
);

-- Policy: System can create notifications for any user
-- This allows the system (via service role or authenticated users creating notifications for others)
-- Note: In production, you might want to restrict this to service role only
-- For now, we'll allow authenticated users to create notifications for any user
-- (This is needed for event organizers to notify attendees, etc.)
CREATE POLICY "System can create notifications for any user"
ON notifications
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Policy: Users can update their own notifications (e.g., mark as read)
CREATE POLICY "Users can update their own notifications"
ON notifications
FOR UPDATE
USING (auth.uid() IS NOT NULL AND user_id = auth.uid())
WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- Policy: Users can delete their own notifications
CREATE POLICY "Users can delete their own notifications"
ON notifications
FOR DELETE
USING (auth.uid() IS NOT NULL AND user_id = auth.uid());

