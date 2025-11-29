-- =============================================
-- VERIFICATION SCRIPT FOR NOTIFICATION SETUP
-- Run this to verify your notification system is set up correctly
-- =============================================

-- 1. Check if all triggers exist
SELECT 
  trigger_name, 
  event_object_table, 
  action_timing, 
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE trigger_name IN (
  'on_event_created',
  'on_friend_request_received',
  'on_friend_request_accepted',
  'on_message_received',
  'on_post_liked',
  'on_post_commented'
)
ORDER BY event_object_table, trigger_name;

-- 2. Check if trigger functions exist
SELECT 
  routine_name,
  routine_type,
  security_type
FROM information_schema.routines
WHERE routine_name IN (
  'handle_new_event_notification',
  'handle_friend_request_notification',
  'handle_friend_request_accepted_notification',
  'handle_message_notification',
  'handle_post_liked_notification',
  'handle_post_commented_notification'
)
ORDER BY routine_name;

-- 3. Check if notifications table exists and has correct structure
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns
WHERE table_name = 'notifications'
ORDER BY ordinal_position;

-- 4. Check if real-time is enabled for notifications table
SELECT 
  schemaname,
  tablename,
  attname
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
AND tablename = 'notifications';

-- 5. Check RLS policies on notifications table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'notifications'
ORDER BY policyname;

-- 6. Check if events table has organizer_id column
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'events' 
AND column_name = 'organizer_id';

-- =============================================
-- EXPECTED RESULTS:
-- =============================================
-- 1. Should return 6 triggers (one for each notification type)
-- 2. Should return 6 functions, all with SECURITY DEFINER
-- 3. Should show notifications table with: id, user_id, type, title, message, read, action_url, priority, created_at
-- 4. Should return at least one row showing notifications table is in real-time publication
-- 5. Should show at least 3 policies (view, insert, update)
-- 6. Should return one row showing organizer_id exists in events table
-- =============================================

