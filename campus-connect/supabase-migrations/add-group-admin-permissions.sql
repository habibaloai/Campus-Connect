-- Migration: Add group admin permissions to conversation_participants
-- This allows tracking which users are admins in group conversations

-- Add is_admin column to conversation_participants table
ALTER TABLE conversation_participants 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Create index for efficient admin queries
CREATE INDEX IF NOT EXISTS idx_conversation_participants_admin 
ON conversation_participants(conversation_id, is_admin) 
WHERE is_admin = true;

-- Update existing group conversations: set creator as admin
-- Note: This assumes the first participant (by joined_at) is the creator
UPDATE conversation_participants cp
SET is_admin = true
FROM conversations c
WHERE cp.conversation_id = c.id
  AND c.type = 'group'
  AND cp.joined_at = (
    SELECT MIN(joined_at)
    FROM conversation_participants
    WHERE conversation_id = cp.conversation_id
  );

-- Add comment for documentation
COMMENT ON COLUMN conversation_participants.is_admin IS 'Indicates if the participant is an admin in a group conversation. Only applicable for group type conversations.';


