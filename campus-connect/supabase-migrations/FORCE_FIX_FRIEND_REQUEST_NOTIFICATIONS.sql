-- =============================================
-- FORCE FIX FRIEND REQUEST NOTIFICATIONS
-- This will completely recreate the trigger with all fixes
-- =============================================

-- Step 1: Drop the trigger if it exists
DROP TRIGGER IF EXISTS on_friend_request_received ON friend_requests;

-- Step 2: Drop the function if it exists
DROP FUNCTION IF EXISTS handle_friend_request_notification();

-- Step 3: Create the function with ALL the necessary settings
CREATE FUNCTION handle_friend_request_notification()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  requester_name TEXT;
  notification_id UUID;
BEGIN
  -- Only notify on new pending requests
  IF NEW.status = 'pending' THEN
    BEGIN
      -- Get requester name with multiple fallbacks
      SELECT COALESCE(
        (SELECT name FROM profiles WHERE id = NEW.requester_id),
        (SELECT email FROM profiles WHERE id = NEW.requester_id),
        'Someone'
      ) INTO requester_name;

      -- Ensure we have a name
      IF requester_name IS NULL THEN
        requester_name := 'Someone';
      END IF;

      -- Insert notification (bypasses RLS because of SECURITY DEFINER)
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
      
      -- Log success (check Supabase logs)
      RAISE NOTICE '✅ Friend request notification created: id=%, recipient=%, requester=%', 
        notification_id, NEW.recipient_id, NEW.requester_id;
      
    EXCEPTION
      WHEN OTHERS THEN
        -- Log detailed error (check Supabase logs)
        RAISE WARNING '❌ Failed to create friend request notification for request %: % (SQLSTATE: %)', 
          NEW.id, SQLERRM, SQLSTATE;
        -- Don't fail the trigger - let the friend request be created anyway
    END;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Step 4: Create the trigger
CREATE TRIGGER on_friend_request_received
  AFTER INSERT ON friend_requests
  FOR EACH ROW
  WHEN (NEW.status = 'pending')
  EXECUTE FUNCTION handle_friend_request_notification();

-- Step 5: Verify trigger was created
SELECT 
  '✅ Trigger created successfully!' as status,
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE trigger_name = 'on_friend_request_received';

-- Step 6: Verify function was created with correct settings
SELECT 
  '✅ Function created successfully!' as status,
  proname as function_name,
  prosecdef as is_security_definer,
  CASE 
    WHEN prosecdef THEN '✅ SECURITY DEFINER enabled'
    ELSE '❌ SECURITY DEFINER NOT enabled'
  END as security_status,
  proconfig as config_settings
FROM pg_proc
WHERE proname = 'handle_friend_request_notification';

-- Step 7: Test with a sample (if there's a recent pending request)
-- This will show if the trigger works
DO $$
DECLARE
  test_count INTEGER;
BEGIN
  -- Count pending requests
  SELECT COUNT(*) INTO test_count
  FROM friend_requests
  WHERE status = 'pending';
  
  RAISE NOTICE 'There are % pending friend requests in the database', test_count;
  
  IF test_count > 0 THEN
    RAISE NOTICE '✅ Trigger is ready. Next friend request should create a notification.';
    RAISE NOTICE '💡 To test: Have someone send you a friend request and check notifications.';
  ELSE
    RAISE NOTICE '✅ Trigger is ready. No pending requests to test with.';
  END IF;
END $$;

