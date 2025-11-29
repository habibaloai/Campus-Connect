# Notification System Setup Guide

This guide explains how to set up the complete notification system for Campus Connect.

## Overview

The notification system now includes database triggers that automatically create notifications for:
1. ✅ New events created (notifies all users for public events)
2. ✅ Friend requests received
3. ✅ Friend requests accepted
4. ✅ Direct messages received
5. ✅ Post likes
6. ✅ Post comments

## Setup Steps

### 1. Run the Database Triggers SQL

Run the SQL file in your Supabase SQL Editor:

```bash
campus-connect/supabase-migrations/notification-triggers-complete.sql
```

This will create all the necessary triggers that automatically create notifications in the database.

### 2. Verify Triggers Are Created

After running the SQL, you can verify the triggers exist by running this query in Supabase:

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

### 3. Enable Real-time on Notifications Table

Make sure real-time is enabled for the notifications table in Supabase:

1. Go to Supabase Dashboard
2. Navigate to Database → Replication
3. Enable replication for the `notifications` table

Or run this SQL:

```sql
-- Enable real-time for notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
```

### 4. Test the Notifications

Once set up, notifications will be created automatically:

- **New Event**: Create an event → All users get notified
- **Friend Request**: Send a friend request → Recipient gets notified
- **Friend Request Accepted**: Accept a friend request → Requester gets notified
- **Direct Message**: Send a message → Recipient gets notified
- **Post Liked**: Like a post → Post author gets notified
- **Post Commented**: Comment on a post → Post author gets notified

### 5. Real-time Updates

The mobile app already includes real-time subscriptions in `NotificationContext.tsx` that will:
- Automatically refresh notifications when new ones are created
- Update the unread count in real-time
- Show notifications instantly without manual refresh

## Notification Types

Notifications use these types from the database enum:
- `event` - For event-related notifications
- `social` - For friend requests, messages, likes, comments
- `academic` - For academic-related notifications
- `financial` - For financial notifications
- `urgent` - For urgent notifications
- `reminder` - For reminder notifications

## Database Schema

The notifications table has the following structure:

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  type TEXT,  -- 'academic', 'financial', 'event', 'social', 'urgent', 'reminder'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  action_url TEXT,
  priority TEXT DEFAULT 'medium',  -- 'low', 'medium', 'high', 'urgent'
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Customization Options

### Limit Event Notifications to Friends/Followers

If you want to only notify friends/followers instead of all users when an event is created, modify the trigger function in `notification-triggers-complete.sql`:

```sql
-- Instead of:
FOR user_record IN
  SELECT id FROM profiles WHERE id != NEW.organizer_id

-- Use:
FOR user_record IN
  SELECT f.friend_id as id 
  FROM friendships f 
  WHERE f.user_id = NEW.organizer_id
  UNION
  SELECT fo.follower_id as id
  FROM follows fo
  WHERE fo.following_id = NEW.organizer_id
```

## Troubleshooting

### Notifications Not Appearing

1. **Check if triggers exist**: Run the verification query above
2. **Check if real-time is enabled**: Verify in Supabase Dashboard → Database → Replication
3. **Check RLS policies**: Make sure the notification RLS policies allow inserts (see `add-notifications-rls.sql`)
4. **Check console logs**: Look for real-time subscription status messages

### Real-time Not Working

1. Ensure real-time is enabled for the notifications table
2. Check that the user is authenticated
3. Verify the subscription is established (check console for "✅ Successfully subscribed" message)

## Files Modified/Created

1. ✅ `supabase-migrations/notification-triggers-complete.sql` - All notification triggers
2. ✅ `contexts/NotificationContext.tsx` - Added real-time subscription for notifications
3. ✅ This documentation file

## Next Steps

1. Run the SQL migration in Supabase
2. Enable real-time replication for notifications table
3. Test each notification type to ensure they work correctly
4. Monitor notification creation in the Supabase dashboard


