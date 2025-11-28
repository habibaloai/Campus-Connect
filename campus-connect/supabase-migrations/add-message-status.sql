-- =============================================
-- ADD MESSAGE STATUS TRACKING
-- Migration: Add status and read_at columns to messages table
-- Run this in your Supabase SQL Editor
-- =============================================

-- Add status column to messages table
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS status TEXT CHECK (status IN ('sent', 'delivered', 'read')) DEFAULT 'sent';

-- Add read_at timestamp column to messages table
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

-- Update existing messages that have read=true to have status='read'
UPDATE messages 
SET status = 'read', 
    read_at = created_at 
WHERE read = true AND status IS NULL;

-- Update existing messages that have read=false to have status='sent' (if status is NULL)
UPDATE messages 
SET status = 'sent' 
WHERE read = false AND status IS NULL;

-- Create index on status column for better query performance
CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);

-- Create index on read_at column for better query performance
CREATE INDEX IF NOT EXISTS idx_messages_read_at ON messages(read_at) WHERE read_at IS NOT NULL;

-- Add comment to status column for documentation
COMMENT ON COLUMN messages.status IS 'Message delivery status: sent (message sent), delivered (message received), read (message read)';

-- Add comment to read_at column for documentation
COMMENT ON COLUMN messages.read_at IS 'Timestamp when the message was read by the recipient';

COMMIT;


