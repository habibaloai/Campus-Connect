-- =============================================
-- DIAGNOSTIC QUERIES FOR FRIEND REQUEST NOTIFICATIONS
-- Run these to diagnose why notifications aren't working
-- =============================================

-- 1. Check if the trigger exists
SELECT 
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_friend_request_received';

-- 2. Check if the trigger function exists
SELECT 
  routine_name,
  routine_type,
  security_type,
  routine_definition
FROM information_schema.routines
WHERE routine_name = 'handle_friend_request_notification';

-- 3. Check recent friend requests
SELECT 
  id,
  requester_id,
  recipient_id,
  status,
  created_at
FROM friend_requests
ORDER BY created_at DESC
LIMIT 10;

-- 4. Check if any notifications were created for friend requests
SELECT 
  id,
  user_id,
  type,
  title,
  message,
  created_at
FROM notifications
WHERE type = 'social'
AND title LIKE '%Friend Request%'
ORDER BY created_at DESC
LIMIT 10;

-- 5. Check the most recent friend request and see if notification should have been created
SELECT 
  fr.id as request_id,
  fr.requester_id,
  fr.recipient_id,
  fr.status,
  fr.created_at as request_created,
  n.id as notification_id,
  n.created_at as notification_created,
  CASE 
    WHEN n.id IS NULL THEN '❌ NO NOTIFICATION CREATED'
    ELSE '✅ NOTIFICATION EXISTS'
  END as status
FROM friend_requests fr
LEFT JOIN notifications n ON (
  n.user_id = fr.recipient_id 
  AND n.type = 'social'
  AND n.title = 'New Friend Request'
  AND n.created_at >= fr.created_at - INTERVAL '1 minute'
  AND n.created_at <= fr.created_at + INTERVAL '5 minutes'
)
ORDER BY fr.created_at DESC
LIMIT 5;

-- 6. Test the trigger function manually (replace with actual IDs)
-- This will show if there are any errors in the function
DO $$
DECLARE
  test_result TEXT;
BEGIN
  -- Get the most recent pending friend request
  PERFORM handle_friend_request_notification()
  FROM (
    SELECT * FROM friend_requests 
    WHERE status = 'pending' 
    ORDER BY created_at DESC 
    LIMIT 1
  ) AS latest_request;
  
  RAISE NOTICE 'Trigger function executed successfully';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error: %', SQLERRM;
END $$;

-- 7. Check RLS policies on notifications table
SELECT 
  policyname,
  cmd,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'notifications'
ORDER BY policyname;

-- 8. Check if notifications can be inserted (test insert)
-- This will fail if RLS is blocking inserts
INSERT INTO notifications (
  user_id,
  type,
  title,
  message,
  read,
  priority
) VALUES (
  auth.uid(), -- Replace with actual user ID if needed
  'social',
  'Test Notification',
  'This is a test',
  false,
  'medium'
)
RETURNING id, created_at;

-- If the test insert works, delete it
DELETE FROM notifications 
WHERE title = 'Test Notification' 
AND created_at > NOW() - INTERVAL '1 minute';

