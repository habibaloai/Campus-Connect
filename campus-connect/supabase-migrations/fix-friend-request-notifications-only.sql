-- =============================================
-- FIX FRIEND REQUEST NOTIFICATIONS ONLY
-- Run this to fix friend request notifications
-- (Other notifications already work)
-- =============================================

-- Step 1: Create/update the trigger function with proper permissions
CREATE OR REPLACE FUNCTION handle_friend_request_notification()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requester_name TEXT;
  notification_id UUID;
BEGIN
  -- Only notify on new pending requests
  IF NEW.status = 'pending' THEN
    BEGIN
      -- Get requester name with fallbacks
      SELECT COALESCE(
        (SELECT name FROM profiles WHERE id = NEW.requester_id),
        (SELECT email FROM profiles WHERE id = NEW.requester_id),
        'Someone'
      ) INTO requester_name;

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
      RAISE NOTICE '✅ Friend request notification created: id=%, recipient=%', 
        notification_id, NEW.recipient_id;
      
    EXCEPTION
      WHEN OTHERS THEN
        -- Log error (check Supabase logs for details)
        RAISE WARNING '❌ Failed to create friend request notification: % (SQLSTATE: %)', 
          SQLERRM, SQLSTATE;
        -- Don't fail the trigger - let the friend request be created anyway
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Drop and recreate the trigger
DROP TRIGGER IF EXISTS on_friend_request_received ON friend_requests;
CREATE TRIGGER on_friend_request_received
  AFTER INSERT ON friend_requests
  FOR EACH ROW
  WHEN (NEW.status = 'pending')
  EXECUTE FUNCTION handle_friend_request_notification();

-- Step 3: Verify trigger was created
SELECT 
  '✅ Friend request notification trigger created!' as status,
  trigger_name,
  event_object_table,
  action_timing
FROM information_schema.triggers
WHERE trigger_name = 'on_friend_request_received';

