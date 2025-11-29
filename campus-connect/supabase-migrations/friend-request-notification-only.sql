-- =============================================
-- FRIEND REQUEST NOTIFICATION TRIGGER
-- This creates the trigger for friend request notifications
-- =============================================

-- Step 1: Ensure notifications table exists
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  action_url TEXT,
  read BOOLEAN DEFAULT false,
  priority TEXT DEFAULT 'medium',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Enable real-time for notifications (if not already enabled)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
  END IF;
END $$;

-- Step 3: Create the trigger function
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
      
      -- Log success
      RAISE NOTICE '✅ Friend request notification created: id=%, recipient=%', 
        notification_id, NEW.recipient_id;
      
    EXCEPTION
      WHEN OTHERS THEN
        -- Log error but don't fail the trigger
        RAISE WARNING '❌ Failed to create friend request notification: %', SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create the trigger
DROP TRIGGER IF EXISTS on_friend_request_received ON friend_requests;
CREATE TRIGGER on_friend_request_received
  AFTER INSERT ON friend_requests
  FOR EACH ROW
  WHEN (NEW.status = 'pending')
  EXECUTE FUNCTION handle_friend_request_notification();

-- Step 5: Verify trigger was created
SELECT 
  '✅ Friend request notification trigger created successfully!' as status,
  trigger_name,
  event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'on_friend_request_received';

