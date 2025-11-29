-- =============================================
-- DEBUG FRIEND REQUEST NOTIFICATIONS
-- Run this to see what's happening with friend request notifications
-- =============================================

-- Step 1: Check if trigger exists
SELECT 
  'Trigger Check' as check_type,
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation,
  CASE 
    WHEN trigger_name IS NOT NULL THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status
FROM information_schema.triggers
WHERE trigger_name = 'on_friend_request_received';

-- Step 2: Check if function exists
SELECT 
  'Function Check' as check_type,
  routine_name,
  routine_type,
  security_type,
  CASE 
    WHEN routine_name IS NOT NULL THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status
FROM information_schema.routines
WHERE routine_name = 'handle_friend_request_notification';

-- Step 3: Check recent friend requests
SELECT 
  'Recent Friend Requests' as check_type,
  id,
  requester_id,
  recipient_id,
  status,
  created_at
FROM friend_requests
WHERE status = 'pending'
ORDER BY created_at DESC
LIMIT 5;

-- Step 4: Check if notifications were created for recent friend requests
SELECT 
  'Notification Check' as check_type,
  fr.id as request_id,
  fr.requester_id,
  fr.recipient_id,
  fr.status,
  fr.created_at as request_created,
  n.id as notification_id,
  n.title,
  n.created_at as notification_created,
  CASE 
    WHEN n.id IS NULL THEN '❌ NO NOTIFICATION'
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
WHERE fr.status = 'pending'
ORDER BY fr.created_at DESC
LIMIT 10;

-- Step 5: Check the actual trigger function code
SELECT 
  'Function Code' as check_type,
  pg_get_functiondef(oid) as function_definition
FROM pg_proc
WHERE proname = 'handle_friend_request_notification';

-- Step 6: Test the trigger manually with the most recent pending request
DO $$
DECLARE
  test_request RECORD;
  test_result TEXT;
BEGIN
  -- Get the most recent pending friend request
  SELECT * INTO test_request
  FROM friend_requests
  WHERE status = 'pending'
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF test_request.id IS NOT NULL THEN
    RAISE NOTICE 'Testing with request: id=%, requester=%, recipient=%', 
      test_request.id, test_request.requester_id, test_request.recipient_id;
    
    -- Try to manually call the function logic
    BEGIN
      -- Simulate what the trigger should do
      PERFORM handle_friend_request_notification() FROM friend_requests WHERE id = test_request.id;
      test_result := '✅ Function executed';
    EXCEPTION
      WHEN OTHERS THEN
        test_result := '❌ Function error: ' || SQLERRM;
    END;
    
    RAISE NOTICE 'Test result: %', test_result;
  ELSE
    RAISE NOTICE 'No pending friend requests found to test';
  END IF;
END $$;

-- Step 7: Check RLS policies on notifications table
SELECT 
  'RLS Policy Check' as check_type,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'notifications';

-- Step 8: Check if there are any errors in the function
-- Look for SECURITY DEFINER and search_path settings
SELECT 
  'Function Security' as check_type,
  proname as function_name,
  prosecdef as is_security_definer,
  proconfig as config_settings
FROM pg_proc
WHERE proname = 'handle_friend_request_notification';

