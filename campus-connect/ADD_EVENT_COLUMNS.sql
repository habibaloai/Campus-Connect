-- Quick Fix: Add missing columns to events table
-- Run this in your Supabase SQL Editor

-- Add is_private column (for private/public events)
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false;

-- Add organizer_id column (to track who created the event)
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS organizer_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- Verify the columns were added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'events' 
AND column_name IN ('is_private', 'organizer_id');

