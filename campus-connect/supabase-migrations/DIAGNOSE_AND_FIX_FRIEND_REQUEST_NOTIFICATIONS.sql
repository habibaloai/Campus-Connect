-- =============================================
-- DIAGNOSE AND FIX FRIEND REQUEST NOTIFICATIONS
-- Run this to diagnose why notifications aren't working
-- =============================================

-- Step 1: Check if trigger exists
SELECT 
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_friend_request_received';

-- Step 2: Check if function exists
SELECT 
  routine_name,
  routine_type,
  security_type
FROM information_schema.routines
WHERE routine_name = 'handle_friend_request_notification';

-- Step 3: Check recent friend requests
SELECT 
  id,
  requester_id,
  recipient_id,
  status,
  created_at
FROM friend_requests
ORDER BY created_at DESC
LIMIT 5;

-- Step 4: Check if notifications table exists and has correct structure
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'notifications'
ORDER BY ordinal_position;

-- Step 5: Check if any notifications were created for recent friend requests
SELECT 
  fr.id as request_id,
  fr.requester_id,
  fr.recipient_id,
  fr.status,
  fr.created_at as request_created,
  n.id as notification_id,
  n.title,
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
WHERE fr.status = 'pending'
ORDER BY fr.created_at DESC
LIMIT 10;

-- Step 6: Recreate the trigger function with better error handling and logging
CREATE OR REPLACE FUNCTION handle_friend_request_notification()
RETURNS TRIGGER AS $$
DECLARE
  requester_name TEXT;
  notification_id UUID;
BEGIN
  -- Only notify on new pending requests
  IF NEW.status = 'pending' THEN
    BEGIN
      -- Get requester name with fallback
      SELECT COALESCE(name, email, 'Someone') INTO requester_name 
      FROM profiles 
      WHERE id = NEW.requester_id;

      -- If requester_name is still NULL, set default
      IF requester_name IS NULL THEN
        requester_name := 'Someone';
      END IF;

      -- Insert notification
      INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        action_url,
        read,
        priority,
        created_at
      ) VALUES (
        NEW.recipient_id,
        'social',
        'New Friend Request',
        requester_name || ' sent you a friend request',
        '/(tabs)/friends?tab=requests',
        false,
        'high',
        NOW()
      )
      RETURNING id INTO notification_id;
      
      -- Log success (visible in Supabase logs)
      RAISE NOTICE '✅ Notification created: id=%, user_id=%, title=New Friend Request', 
        notification_id, NEW.recipient_id;
      
    EXCEPTION
      WHEN OTHERS THEN
        -- Log detailed error (visible in Supabase logs)
        RAISE WARNING '❌ Failed to create friend request notification for recipient %: % (SQLSTATE: %)', 
          NEW.recipient_id, SQLERRM, SQLSTATE;
        -- Don't fail the trigger - let the friend request be created anyway
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Ensure trigger exists and is properly configured
DROP TRIGGER IF EXISTS on_friend_request_received ON friend_requests;
CREATE TRIGGER on_friend_request_received
  AFTER INSERT ON friend_requests
  FOR EACH ROW
  WHEN (NEW.status = 'pending')
  EXECUTE FUNCTION handle_friend_request_notification();

-- Step 8: Verify trigger was created
SELECT 
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation,
  '✅ TRIGGER CREATED' as status
FROM information_schema.triggers
WHERE trigger_name = 'on_friend_request_received';

-- Step 9: Check if notifications table has RLS enabled and if trigger can bypass it
-- The SECURITY DEFINER should allow the trigger to bypass RLS, but let's verify
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'notifications';

-- Step 10: Ensure notifications table allows inserts from triggers
-- Check RLS policies on notifications table
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
WHERE tablename = 'notifications';

-- Step 11: Test the trigger manually with the most recent friend request
-- (This will help identify if there are any issues)
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
    -- Try to manually call the function
    BEGIN
      PERFORM handle_friend_request_notification() FROM friend_requests WHERE id = test_request.id;
      test_result := '✅ Function executed successfully';
    EXCEPTION
      WHEN OTHERS THEN
        test_result := '❌ Function error: ' || SQLERRM;
    END;
    
    RAISE NOTICE 'Test result: %', test_result;
  ELSE
    RAISE NOTICE 'No pending friend requests found to test';
  END IF;
END $$;

-- Step 12: Check if real-time is enabled for notifications
SELECT 
  schemaname,
  tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
AND tablename = 'notifications';

-- If real-time is not enabled, run this:
-- ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Step 13: Summary
SELECT 
  'Diagnostic complete. Check the results above.' as summary,
  'If trigger exists but notifications are not created, check Supabase logs for WARNING messages.' as next_step,
  'The trigger function uses SECURITY DEFINER to bypass RLS.' as note;

