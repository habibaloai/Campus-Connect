-- =============================================
-- FIX FRIEND REQUEST NOTIFICATION TRIGGER
-- Run this to ensure the friend request notification trigger works correctly
-- =============================================

-- First, let's check what might be wrong and then fix it

-- 1. Drop and recreate the function with better error handling
CREATE OR REPLACE FUNCTION handle_friend_request_notification()
RETURNS TRIGGER AS $$
DECLARE
  requester_name TEXT;
  notification_result TEXT;
BEGIN
  -- Only notify on new pending requests
  IF NEW.status = 'pending' THEN
    -- Get requester name (use email if name is not available)
    SELECT COALESCE(name, email, 'Someone') INTO requester_name 
    FROM profiles 
    WHERE id = NEW.requester_id;

    -- Notify the recipient
    BEGIN
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
        COALESCE(requester_name, 'Someone') || ' sent you a friend request',
        '/profile/' || NEW.requester_id::text,
        false,
        'high',
        NOW()
      );
      
      -- Log success (optional, for debugging)
      RAISE NOTICE 'Notification created for user %', NEW.recipient_id;
      
    EXCEPTION
      WHEN OTHERS THEN
        -- Log error but don't fail the trigger
        RAISE WARNING 'Failed to create notification: %', SQLERRM;
        -- Return NEW anyway so the friend request still gets created
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Ensure the trigger exists and is properly set up
DROP TRIGGER IF EXISTS on_friend_request_received ON friend_requests;
CREATE TRIGGER on_friend_request_received
  AFTER INSERT ON friend_requests
  FOR EACH ROW
  WHEN (NEW.status = 'pending')
  EXECUTE FUNCTION handle_friend_request_notification();

-- 3. Verify the trigger was created
SELECT 
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_friend_request_received';

-- 4. Ensure RLS policies allow the trigger to insert notifications
-- The trigger uses SECURITY DEFINER, so it should bypass RLS, but let's verify policies exist

-- Check current policies
SELECT policyname, cmd, permissive
FROM pg_policies
WHERE tablename = 'notifications';

-- =============================================
-- TEST: Create a test notification to verify RLS works
-- =============================================
-- Uncomment the lines below to test (replace with actual user IDs)
/*
DO $$
DECLARE
  test_user_id UUID := 'YOUR_USER_ID_HERE';
  test_requester_id UUID := 'YOUR_REQUSTER_ID_HERE';
BEGIN
  -- Try to insert a notification as the trigger would
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    action_url,
    read,
    priority
  ) VALUES (
    test_user_id,
    'social',
    'Test Notification',
    'This is a test notification',
    '/profile/' || test_requester_id::text,
    false,
    'high'
  );
  
  RAISE NOTICE 'Test notification created successfully';
  
  -- Clean up
  DELETE FROM notifications 
  WHERE title = 'Test Notification' 
  AND created_at > NOW() - INTERVAL '1 minute';
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error creating test notification: %', SQLERRM;
END $$;
*/

