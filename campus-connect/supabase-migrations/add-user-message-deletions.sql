-- =============================================
-- ADD USER MESSAGE DELETIONS TABLE
-- Migration: Track messages deleted by users (clear chat feature)
-- This allows users to clear their chat history without affecting other participants
-- Run this in your Supabase SQL Editor
-- =============================================

-- Create table to track messages deleted by users
CREATE TABLE IF NOT EXISTS user_message_deletions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  deleted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, conversation_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_message_deletions_user_id ON user_message_deletions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_message_deletions_conversation_id ON user_message_deletions(conversation_id);

-- Enable RLS
ALTER TABLE user_message_deletions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own message deletions"
  ON user_message_deletions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own message deletions"
  ON user_message_deletions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own message deletions"
  ON user_message_deletions FOR DELETE
  USING (user_id = auth.uid());

-- Add comment for documentation
COMMENT ON TABLE user_message_deletions IS 'Tracks conversations that users have cleared (deleted all messages from their view)';

