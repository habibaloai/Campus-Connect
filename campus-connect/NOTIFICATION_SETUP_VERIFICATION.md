# Notification System Verification

## ✅ All Notification Types Are Configured

### 1. Friend Request Sent ✅
- **Trigger**: `on_friend_request_received`
- **Function**: `handle_friend_request_notification()`
- **When**: New friend request with status 'pending' is inserted
- **Recipient**: The person receiving the request
- **Action URL**: `/(tabs)/friends?tab=requests`

### 2. Friend Request Accepted ✅
- **Trigger**: `on_friend_request_accepted`
- **Function**: `handle_friend_request_accepted_notification()`
- **When**: Friend request status changes to 'accepted'
- **Recipient**: The person who sent the request
- **Action URL**: `/(tabs)/friends?tab=requests`

### 3. Direct Message ✅
- **Trigger**: `on_message_received`
- **Function**: `handle_message_notification()`
- **When**: New message inserted in a 'direct' conversation
- **Recipient**: All participants except the sender
- **Action URL**: `/(tabs)/messages/{conversation_id}`

### 4. Event Chat Message ✅
- **Trigger**: `on_message_received` (same trigger, different logic)
- **Function**: `handle_message_notification()`
- **When**: New message inserted in an 'event' conversation
- **Recipient**: All event attendees except the sender
- **Action URL**: `/(tabs)/events/{event_id}?tab=chat`

### 5. Post Liked ✅
- **Trigger**: `on_post_liked`
- **Function**: `handle_post_liked_notification()`
- **When**: New like inserted in `post_likes` table
- **Recipient**: Post author (if not the liker)
- **Action URL**: `/(tabs)/community/{post_id}`

### 6. Post Commented (Replies) ✅
- **Trigger**: `on_post_commented`
- **Function**: `handle_post_commented_notification()`
- **When**: New comment/reply inserted in `post_replies` table
- **Recipient**: Post author (if not the commenter)
- **Action URL**: `/(tabs)/community/{post_id}`

---

## 🔧 Setup Instructions

### Step 1: Run the Notification Triggers SQL

Run this file in your Supabase SQL Editor:
```sql
-- File: campus-connect/supabase-migrations/ensure-all-notifications-work.sql
```

This will:
- ✅ Create/update all notification trigger functions
- ✅ Add error handling to prevent trigger failures
- ✅ Verify all triggers are created correctly

### Step 2: Verify Real-Time is Enabled

Ensure the `notifications` table has real-time enabled:
```sql
-- Enable real-time for notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
```

### Step 3: Verify App-Side Real-Time Subscription

The app already has real-time subscriptions set up in:
- `campus-connect/apps/mobile/contexts/NotificationContext.tsx`

The subscription listens for:
- ✅ `INSERT` events on `notifications` table (new notifications)
- ✅ `UPDATE` events on `notifications` table (mark as read)

---

## 🧪 Testing Each Notification Type

### Test 1: Friend Request
1. User A sends friend request to User B
2. ✅ User B should receive notification: "New Friend Request"
3. ✅ User B taps notification → Opens friend requests tab
4. ✅ User B accepts request
5. ✅ User A should receive notification: "Friend Request Accepted"

### Test 2: Direct Message
1. User A sends a direct message to User B
2. ✅ User B should receive notification: "New Message"
3. ✅ Notification shows message preview
4. ✅ User B taps notification → Opens the conversation

### Test 3: Event Chat Message
1. User A and User B join the same event
2. User A sends message in event chat
3. ✅ User B should receive notification: "New Event Chat Message"
4. ✅ Notification shows event name and message preview
5. ✅ User B taps notification → Opens event with chat tab active

### Test 4: Post Liked
1. User A creates a post
2. User B likes the post
3. ✅ User A should receive notification: "Post Liked"
4. ✅ Notification shows who liked it
5. ✅ User A taps notification → Opens the post

### Test 5: Post Commented
1. User A creates a post
2. User B comments on the post
3. ✅ User A should receive notification: "New Comment"
4. ✅ Notification shows who commented
5. ✅ User A taps notification → Opens the post

---

## 🔍 Verification Queries

Run these in Supabase SQL Editor to verify everything is set up:

### Check All Triggers Exist
```sql
SELECT 
  trigger_name, 
  event_object_table, 
  action_timing, 
  event_manipulation
FROM information_schema.triggers
WHERE trigger_name IN (
  'on_friend_request_received',
  'on_friend_request_accepted',
  'on_message_received',
  'on_post_liked',
  'on_post_commented'
)
ORDER BY event_object_table;
```

### Check All Functions Exist
```sql
SELECT 
  routine_name,
  routine_type,
  security_type
FROM information_schema.routines
WHERE routine_name IN (
  'handle_friend_request_notification',
  'handle_friend_request_accepted_notification',
  'handle_message_notification',
  'handle_post_liked_notification',
  'handle_post_commented_notification'
)
ORDER BY routine_name;
```

### Check Real-Time is Enabled
```sql
SELECT 
  schemaname,
  tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
AND tablename = 'notifications';
```

### Check Recent Notifications
```sql
SELECT 
  id,
  user_id,
  type,
  title,
  message,
  action_url,
  read,
  created_at
FROM notifications
ORDER BY created_at DESC
LIMIT 20;
```

---

## 📱 App-Side Configuration

### Real-Time Subscription ✅
Already configured in `NotificationContext.tsx`:
- Listens for new notifications
- Auto-refreshes notification list
- Updates unread count

### Navigation ✅
All notification types navigate correctly:
- Friend requests → Friends tab (requests)
- Direct messages → Messages conversation
- Event chat → Event details (chat tab)
- Post likes/comments → Post details

---

## 🐛 Troubleshooting

### Notifications Not Appearing

1. **Check Triggers Exist**
   - Run verification queries above
   - Ensure all triggers are created

2. **Check Real-Time Subscription**
   - Check browser console for subscription status
   - Should see: "✅ Successfully subscribed to notifications real-time updates"

3. **Check Database Logs**
   - In Supabase Dashboard → Logs
   - Look for trigger errors or warnings

4. **Check Notification Creation**
   - Run verification queries to see if notifications are being created
   - Check if `action_url` is set correctly

### Common Issues

**Issue**: Friend request notification not working
- **Fix**: Ensure trigger has `WHEN (NEW.status = 'pending')` clause
- **Fix**: Check that requester name lookup works

**Issue**: Event chat notification not working
- **Fix**: Verify `conversations.event_id` is set
- **Fix**: Verify user is in `event_attendees` table

**Issue**: Post like/comment notification not working
- **Fix**: Verify `post_likes` and `post_replies` tables exist
- **Fix**: Check that post author lookup works

---

## ✅ Summary

All notification types are configured:
- ✅ Friend request sent
- ✅ Friend request accepted
- ✅ Direct message
- ✅ Event chat message
- ✅ Post liked
- ✅ Post commented (replies)

**Next Step**: Run `ensure-all-notifications-work.sql` in Supabase SQL Editor to ensure all triggers are up to date with error handling.

