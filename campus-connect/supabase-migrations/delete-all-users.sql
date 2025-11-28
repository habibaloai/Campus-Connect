-- =============================================
-- DELETE ALL USERS AND RELATED DATA
-- ⚠️ WARNING: This will delete ALL user accounts and their data!
-- Use only for development/testing purposes
-- =============================================

-- Step 1: Delete all related data first (due to foreign key constraints)
-- Delete in order: child tables first, then parent tables

-- Delete event attendees (references profiles)
DELETE FROM event_attendees;

-- Delete messages (references profiles via conversations)
DELETE FROM messages;

-- Delete conversation participants (references profiles)
DELETE FROM conversation_participants;

-- Delete conversations (may reference profiles)
DELETE FROM conversations;

-- Delete post replies (references profiles)
DELETE FROM post_replies;

-- Delete post likes (references profiles)
DELETE FROM post_likes;

-- Delete posts (references profiles)
DELETE FROM posts;

-- Delete any other tables that reference profiles
-- Add more DELETE statements here as needed

-- Step 2: Delete all profiles
DELETE FROM profiles;

-- Step 3: Delete auth users
-- NOTE: You cannot delete from auth.users via SQL
-- You must delete auth users via Supabase Dashboard:
-- 1. Go to Authentication → Users
-- 2. Delete each user manually, or
-- 3. Use the bulk delete feature if available

-- Verification queries (run after deletion to verify):
-- SELECT COUNT(*) FROM profiles; -- Should return 0
-- SELECT COUNT(*) FROM event_attendees; -- Should return 0
-- SELECT COUNT(*) FROM messages; -- Should return 0
-- SELECT COUNT(*) FROM conversations; -- Should return 0
-- SELECT COUNT(*) FROM posts; -- Should return 0

-- =============================================
-- ALTERNATIVE: Reset specific tables only
-- =============================================

-- If you only want to delete user data but keep events/posts structure:
-- DELETE FROM event_attendees;
-- DELETE FROM messages;
-- DELETE FROM conversation_participants;
-- DELETE FROM conversations;
-- DELETE FROM post_replies;
-- DELETE FROM post_likes;
-- DELETE FROM posts;
-- DELETE FROM profiles;

-- =============================================
-- NOTES:
-- =============================================
-- 1. This script deletes data but keeps table structure
-- 2. Auth users must be deleted via Dashboard (Authentication → Users)
-- 3. If you have CASCADE deletes, some deletions may happen automatically
-- 4. Always backup important data before running this script
-- 5. This is for development/testing only - never run in production!

COMMIT;



