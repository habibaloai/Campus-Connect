-- =============================================
-- URGENT FIX: Friend Request Notifications
-- Run this immediately to fix friend request notifications
-- =============================================

-- 1. Recreate the trigger function with proper error handling
CREATE OR REPLACE FUNCTION handle_friend_request_notification()
RETURNS TRIGGER AS $$
DECLARE
  requester_name TEXT;
BEGIN
  -- Only notify on new pending requests
  IF NEW.status = 'pending' THEN
    BEGIN
      -- Get requester name (use email if name is not available)
      SELECT COALESCE(name, email, 'Someone') INTO requester_name 
      FROM profiles 
      WHERE id = NEW.requester_id;

      -- Notify the recipient
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
      
    EXCEPTION
      WHEN OTHERS THEN
        -- Log error but don't fail the trigger
        RAISE WARNING 'Failed to create notification for friend request %: %', NEW.id, SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop and recreate the trigger
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
  event_manipulation
FROM information_schema.triggers
WHERE trigger_name = 'on_friend_request_received';

-- 4. Check if there are pending friend requests that need notifications
-- This will create notifications for any pending requests that don't have one
DO $$
DECLARE
  pending_request RECORD;
  requester_name TEXT;
  existing_notification_id UUID;
BEGIN
  FOR pending_request IN
    SELECT * FROM friend_requests
    WHERE status = 'pending'
    ORDER BY created_at DESC
  LOOP
    -- Check if notification already exists
    SELECT id INTO existing_notification_id
    FROM notifications
    WHERE user_id = pending_request.recipient_id
    AND type = 'social'
    AND title = 'New Friend Request'
    AND message LIKE '%sent you a friend request%'
    AND created_at BETWEEN pending_request.created_at - INTERVAL '5 minutes' 
                       AND pending_request.created_at + INTERVAL '5 minutes'
    LIMIT 1;
    
    -- If no notification exists, create one
    IF existing_notification_id IS NULL THEN
      -- Get requester name
      SELECT COALESCE(name, email, 'Someone') INTO requester_name 
      FROM profiles 
      WHERE id = pending_request.requester_id;
      
      -- Create notification
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
          pending_request.recipient_id,
          'social',
          'New Friend Request',
          COALESCE(requester_name, 'Someone') || ' sent you a friend request',
          '/(tabs)/friends?tab=requests',
          false,
          'high',
          pending_request.created_at  -- Use the request's created_at time
        );
        
        RAISE NOTICE 'Created missing notification for friend request %', pending_request.id;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE WARNING 'Failed to create notification for request %: %', pending_request.id, SQLERRM;
      END;
    END IF;
  END LOOP;
END $$;

-- 5. Verify real-time is enabled for notifications
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
    RAISE NOTICE 'Real-time enabled for notifications table';
  ELSE
    RAISE NOTICE 'Real-time already enabled for notifications table';
  END IF;
END $$;

-- 6. Final verification - check recent notifications
SELECT 
  id,
  user_id,
  type,
  title,
  message,
  created_at
FROM notifications
WHERE type = 'social'
AND title = 'New Friend Request'
ORDER BY created_at DESC
LIMIT 5;

-- Done! Friend request notifications should now work.
-- Test by having someone send you a friend request.

