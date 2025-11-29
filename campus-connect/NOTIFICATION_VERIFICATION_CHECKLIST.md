# Notification System Verification Checklist

Use this checklist to verify that your notification system is working correctly after running the setup steps.

## ✅ Pre-Flight Checks

### 1. Verify Triggers Exist
Run this query in Supabase SQL Editor:

```sql
SELECT 
  trigger_name, 
  event_object_table, 
  action_timing, 
  event_manipulation
FROM information_schema.triggers
WHERE trigger_name IN (
  'on_event_created',
  'on_friend_request_received',
  'on_friend_request_accepted',
  'on_message_received',
  'on_post_liked',
  'on_post_commented'
)
ORDER BY event_object_table, trigger_name;
```

**Expected**: Should return 6 rows (one for each trigger)

### 2. Verify Real-time is Enabled
Run this query:

```sql
SELECT 
  schemaname,
  tablename,
  attname
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
AND tablename = 'notifications';
```

**Expected**: Should return at least one row showing notifications table is in real-time publication

**If empty**: Run this to enable it:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
```

### 3. Verify RLS Policies
Run this query:

```sql
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'notifications';
```

**Expected**: Should show policies for SELECT, INSERT, UPDATE, DELETE

## 🧪 Test Each Notification Type

### Test 1: Event Created Notification

1. **Action**: Create a new public event (with `organizer_id` set)
2. **Expected**: All users should receive a notification
3. **Check**: Go to notifications screen in app - all users should see "New Event Created" notification

**SQL to verify**:
```sql
SELECT COUNT(*) as notification_count, user_id
FROM notifications
WHERE type = 'event'
AND title = 'New Event Created'
AND created_at > NOW() - INTERVAL '5 minutes'
GROUP BY user_id
ORDER BY notification_count DESC;
```

### Test 2: Friend Request Notification

1. **Action**: User A sends friend request to User B
2. **Expected**: User B receives "New Friend Request" notification
3. **Check**: User B's notifications screen should show the request

**SQL to verify**:
```sql
SELECT * FROM notifications
WHERE type = 'social'
AND title = 'New Friend Request'
AND created_at > NOW() - INTERVAL '5 minutes'
ORDER BY created_at DESC
LIMIT 1;
```

### Test 3: Friend Request Accepted Notification

1. **Action**: User B accepts User A's friend request
2. **Expected**: User A receives "Friend Request Accepted" notification
3. **Check**: User A's notifications screen should show the acceptance

**SQL to verify**:
```sql
SELECT * FROM notifications
WHERE type = 'social'
AND title = 'Friend Request Accepted'
AND created_at > NOW() - INTERVAL '5 minutes'
ORDER BY created_at DESC
LIMIT 1;
```

### Test 4: Direct Message Notification

1. **Action**: User A sends a direct message to User B
2. **Expected**: User B receives "New Message" notification with message preview
3. **Check**: User B's notifications screen should show the message notification

**SQL to verify**:
```sql
SELECT * FROM notifications
WHERE type = 'social'
AND title = 'New Message'
AND created_at > NOW() - INTERVAL '5 minutes'
ORDER BY created_at DESC
LIMIT 1;
```

### Test 5: Post Liked Notification

1. **Action**: User A likes a post created by User B
2. **Expected**: User B receives "Post Liked" notification
3. **Check**: User B's notifications screen should show the like notification

**SQL to verify**:
```sql
SELECT * FROM notifications
WHERE type = 'social'
AND title = 'Post Liked'
AND created_at > NOW() - INTERVAL '5 minutes'
ORDER BY created_at DESC
LIMIT 1;
```

### Test 6: Post Commented Notification

1. **Action**: User A comments on a post created by User B
2. **Expected**: User B receives "New Comment" notification
3. **Check**: User B's notifications screen should show the comment notification

**SQL to verify**:
```sql
SELECT * FROM notifications
WHERE type = 'social'
AND title = 'New Comment'
AND created_at > NOW() - INTERVAL '5 minutes'
ORDER BY created_at DESC
LIMIT 1;
```

## 🔍 Real-time Verification

### Check Real-time Subscription in App

1. Open the app on two devices (or two browser tabs with different users)
2. On Device 1: Create an event / send friend request / send message / like post / comment
3. On Device 2: Watch the notifications screen
4. **Expected**: Notification should appear immediately without manual refresh

**Console logs to check**:
- Look for: `✅ Successfully subscribed to notifications real-time updates`
- Look for: `New notification received:`

## 🐛 Troubleshooting

### Issue: Notifications not appearing

**Check 1**: Verify triggers exist (see Pre-Flight Check #1)

**Check 2**: Check if notifications are being created in database:
```sql
SELECT * FROM notifications
ORDER BY created_at DESC
LIMIT 10;
```

**Check 3**: Check trigger function logs:
```sql
SELECT * FROM pg_stat_user_functions
WHERE funcname LIKE '%notification%';
```

**Check 4**: Verify RLS allows inserts:
- Check that "System can create notifications for any user" policy exists
- SECURITY DEFINER functions should bypass RLS, but verify the policy exists

### Issue: Real-time not working

**Check 1**: Verify real-time is enabled (see Pre-Flight Check #2)

**Check 2**: Check app console for subscription status messages

**Check 3**: Verify user is authenticated in the app

**Check 4**: Check network connectivity

### Issue: Event notifications not working

**Check**: Verify events table has `organizer_id` column:
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'events'
AND column_name = 'organizer_id';
```

**If missing**: Run:
```sql
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS organizer_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
```

### Issue: Message notifications not working

**Check**: Verify conversation type is set to 'direct':
```sql
SELECT id, type FROM conversations
WHERE id IN (SELECT DISTINCT conversation_id FROM messages ORDER BY created_at DESC LIMIT 5);
```

## 📋 Quick Verification Script

Run this complete verification script (also in `verify-notification-setup.sql`):

```sql
-- 1. Check triggers
SELECT COUNT(*) as trigger_count
FROM information_schema.triggers
WHERE trigger_name IN (
  'on_event_created',
  'on_friend_request_received',
  'on_friend_request_accepted',
  'on_message_received',
  'on_post_liked',
  'on_post_commented'
);
-- Expected: 6

-- 2. Check real-time
SELECT COUNT(*) as realtime_count
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
AND tablename = 'notifications';
-- Expected: >= 1

-- 3. Check RLS policies
SELECT COUNT(*) as policy_count
FROM pg_policies
WHERE tablename = 'notifications';
-- Expected: >= 3

-- 4. Check organizer_id column
SELECT COUNT(*) as column_exists
FROM information_schema.columns
WHERE table_name = 'events'
AND column_name = 'organizer_id';
-- Expected: 1
```

## ✅ All Checks Passed?

If all checks pass, your notification system is ready! Try creating a test notification by:

1. Creating an event
2. Sending a friend request
3. Sending a message
4. Liking a post
5. Commenting on a post

Notifications should appear automatically in real-time! 🎉

