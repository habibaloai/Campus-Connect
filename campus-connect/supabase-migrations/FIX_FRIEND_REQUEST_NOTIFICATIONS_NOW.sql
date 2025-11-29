-- =============================================
-- IMMEDIATE FIX FOR FRIEND REQUEST NOTIFICATIONS
-- Run this NOW to fix friend request notifications
-- =============================================

-- Step 1: Ensure notifications table exists with correct structure
-- (This should already exist, but let's make sure)
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

-- Step 2: Ensure real-time is enabled for notifications
-- Use DO block to check if table is already in publication before adding
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

-- Step 3: Create/update the trigger function with SECURITY DEFINER
-- This allows the trigger to bypass RLS and insert notifications
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
      -- Get requester name with multiple fallbacks
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
      RAISE NOTICE '✅ Friend request notification created: id=%, recipient=%, requester=%', 
        notification_id, NEW.recipient_id, NEW.requester_id;
      
    EXCEPTION
      WHEN OTHERS THEN
        -- Log detailed error (check Supabase logs)
        RAISE WARNING '❌ Failed to create notification for friend request %: % (SQLSTATE: %)', 
          NEW.id, SQLERRM, SQLSTATE;
        -- Don't fail the trigger - let the friend request be created anyway
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Drop and recreate the trigger
DROP TRIGGER IF EXISTS on_friend_request_received ON friend_requests;
CREATE TRIGGER on_friend_request_received
  AFTER INSERT ON friend_requests
  FOR EACH ROW
  WHEN (NEW.status = 'pending')
  EXECUTE FUNCTION handle_friend_request_notification();

-- Step 5: Verify trigger was created
SELECT 
  '✅ Trigger created successfully' as status,
  trigger_name,
  event_object_table,
  action_timing
FROM information_schema.triggers
WHERE trigger_name = 'on_friend_request_received';

-- Step 6: Verify function exists
SELECT 
  '✅ Function created successfully' as status,
  routine_name,
  security_type
FROM information_schema.routines
WHERE routine_name = 'handle_friend_request_notification';

-- Step 7: Test with a manual check
-- Check if there are any recent pending friend requests without notifications
SELECT 
  fr.id as request_id,
  fr.requester_id,
  fr.recipient_id,
  fr.created_at,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM notifications n 
      WHERE n.user_id = fr.recipient_id 
      AND n.title = 'New Friend Request'
      AND n.created_at >= fr.created_at - INTERVAL '1 minute'
    ) THEN '✅ Has notification'
    ELSE '❌ Missing notification'
  END as notification_status
FROM friend_requests fr
WHERE fr.status = 'pending'
ORDER BY fr.created_at DESC
LIMIT 5;

-- Step 8: If there are missing notifications, create them manually
-- (This backfills notifications for recent requests that might have been missed)
INSERT INTO notifications (user_id, type, title, message, action_url, read, priority, created_at)
SELECT 
  fr.recipient_id,
  'social',
  'New Friend Request',
  COALESCE(p.name, p.email, 'Someone') || ' sent you a friend request',
  '/(tabs)/friends?tab=requests',
  false,
  'high',
  fr.created_at
FROM friend_requests fr
LEFT JOIN profiles p ON p.id = fr.requester_id
WHERE fr.status = 'pending'
AND fr.created_at > NOW() - INTERVAL '24 hours'
AND NOT EXISTS (
  SELECT 1 FROM notifications n 
  WHERE n.user_id = fr.recipient_id 
  AND n.title = 'New Friend Request'
  AND n.created_at >= fr.created_at - INTERVAL '1 minute'
  AND n.created_at <= fr.created_at + INTERVAL '5 minutes'
)
ON CONFLICT DO NOTHING;

-- Step 9: Final verification
SELECT 
  '✅ Setup complete!' as status,
  'Check Supabase logs for any WARNING messages' as note,
  'Test by sending a new friend request' as next_step;

