# Quick Fix: Friend Request Notifications Not Working

If you received a friend request but didn't get a notification, follow these steps:

## Step 1: Run the Diagnostic Query

Run this in your Supabase SQL Editor to check what's wrong:

```sql
-- Check if trigger exists
SELECT trigger_name, event_object_table, action_timing
FROM information_schema.triggers
WHERE trigger_name = 'on_friend_request_received';

-- Check recent friend requests and their notifications
SELECT 
  fr.id as request_id,
  fr.requester_id,
  fr.recipient_id,
  fr.status,
  fr.created_at as request_time,
  n.id as notification_id,
  CASE 
    WHEN n.id IS NULL THEN '❌ NO NOTIFICATION'
    ELSE '✅ NOTIFICATION EXISTS'
  END as notification_status
FROM friend_requests fr
LEFT JOIN notifications n ON (
  n.user_id = fr.recipient_id 
  AND n.type = 'social'
  AND n.title = 'New Friend Request'
  AND n.created_at BETWEEN fr.created_at - INTERVAL '1 minute' AND fr.created_at + INTERVAL '5 minutes'
)
ORDER BY fr.created_at DESC
LIMIT 10;
```

## Step 2: Run the Fix Script

Run the entire `fix-friend-request-notification.sql` file in your Supabase SQL Editor. This will:

1. Recreate the trigger function with better error handling
2. Recreate the trigger
3. Add a WHEN clause to only fire on pending requests
4. Verify everything is set up correctly

## Step 3: Test It

After running the fix, send yourself a test friend request (or have someone send you one) and check if the notification appears.

## Step 4: Check Real-time is Enabled

Make sure real-time is enabled for notifications:

```sql
-- Check if real-time is enabled
SELECT COUNT(*) as is_enabled
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
AND tablename = 'notifications';

-- If it returns 0, enable it:
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
```

## Common Issues and Solutions

### Issue: Trigger exists but notifications aren't created

**Solution**: The trigger function might be failing silently. The fix script adds better error handling. Check the Supabase logs for any errors.

### Issue: Real-time not working

**Solution**: Enable real-time replication for the notifications table (see Step 4 above).

### Issue: RLS blocking inserts

**Solution**: The trigger uses `SECURITY DEFINER` which should bypass RLS, but verify your RLS policies allow inserts. Check that the policy "System can create notifications for any user" exists.

### Issue: Notification created but not showing in app

**Solution**: 
1. Check app console for real-time subscription messages
2. Manually refresh notifications in the app
3. Verify you're logged in as the correct user

## Quick Test After Fix

Run this to manually trigger a notification for the most recent pending friend request:

```sql
-- This will manually create a notification for the most recent pending request
DO $$
DECLARE
  latest_request RECORD;
  requester_name TEXT;
BEGIN
  -- Get the most recent pending friend request
  SELECT * INTO latest_request
  FROM friend_requests
  WHERE status = 'pending'
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF latest_request.id IS NOT NULL THEN
    -- Get requester name
    SELECT COALESCE(name, email) INTO requester_name
    FROM profiles
    WHERE id = latest_request.requester_id;
    
    -- Create notification
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      action_url,
      read,
      priority
    ) VALUES (
      latest_request.recipient_id,
      'social',
      'New Friend Request',
      COALESCE(requester_name, 'Someone') || ' sent you a friend request',
      '/profile/' || latest_request.requester_id::text,
      false,
      'high'
    );
    
    RAISE NOTICE 'Notification created for request %', latest_request.id;
  ELSE
    RAISE NOTICE 'No pending friend requests found';
  END IF;
END $$;
```

This will create a notification for the most recent pending friend request if one exists.

