-- =============================================
-- RESET ALL CHATS
-- This script deletes all messages, conversations, and participants
-- Use with caution - this will permanently delete all chat data!
-- =============================================

-- Disable RLS temporarily for cleanup (if needed)
-- ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE conversation_participants DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;

-- Delete all messages first (they reference conversations)
DELETE FROM messages;

-- Delete all conversation participants (they reference conversations)
DELETE FROM conversation_participants;

-- Delete all conversations
DELETE FROM conversations;

-- Re-enable RLS (if disabled above)
-- ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Verify deletion
SELECT 
  (SELECT COUNT(*) FROM messages) as message_count,
  (SELECT COUNT(*) FROM conversation_participants) as participant_count,
  (SELECT COUNT(*) FROM conversations) as conversation_count;

-- All counts should be 0

