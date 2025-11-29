# Notifications with Event Chat Integration

## Current Notification System

The notification system has been updated to work seamlessly with the new event chat functionality.

## Notification Types

### 1. Direct Messages ✅
- **Trigger**: When someone sends a direct message
- **Notification**: "New Message"
- **Action URL**: `/(tabs)/messages/{conversation_id}`
- **Priority**: High
- **Recipients**: All participants in the conversation except sender

### 2. Event Chat Messages ✅ (NEW)
- **Trigger**: When someone sends a message in an event chat
- **Notification**: "New Event Chat Message"
- **Message Format**: `[Sender Name] in "[Event Title]": [Message Preview]`
- **Action URL**: `/(tabs)/events/{event_id}?tab=chat`
- **Priority**: Medium
- **Recipients**: All event attendees except the sender

### 3. Friend Requests ✅
- **Trigger**: When you receive a friend request
- **Notification**: "New Friend Request"
- **Action URL**: `/(tabs)/friends?tab=requests`
- **Priority**: High

### 4. Friend Request Accepted ✅
- **Trigger**: When someone accepts your friend request
- **Notification**: "Friend Request Accepted"
- **Action URL**: `/(tabs)/friends?tab=requests`
- **Priority**: Medium

### 5. Post Likes ✅
- **Trigger**: When someone likes your post
- **Notification**: "Post Liked"
- **Action URL**: `/(tabs)/community/{post_id}`
- **Priority**: Medium

### 6. Post Comments ✅
- **Trigger**: When someone comments on your post
- **Notification**: "New Comment"
- **Action URL**: `/(tabs)/community/{post_id}`
- **Priority**: Medium

### 7. New Events ✅
- **Trigger**: When a new public event is created
- **Notification**: "New Event Created"
- **Action URL**: `/(tabs)/events/{event_id}`
- **Priority**: Medium
- **Recipients**: All users except the organizer

## How Event Chat Notifications Work

### Flow:
1. **User sends message in event chat** → Message inserted into `messages` table
2. **Trigger fires** → `handle_message_notification()` function executes
3. **Function checks conversation type** → If type = 'event'
4. **Gets all event attendees** → Queries `event_attendees` table
5. **Creates notifications** → One notification per attendee (except sender)
6. **Notification appears** → Users see notification in real-time
7. **User taps notification** → Navigates to event details with chat tab active

### Notification Details:
- **Title**: "New Event Chat Message"
- **Message Preview**: Shows sender name, event title, and first 80 characters of message
- **Navigation**: Opens the specific event's chat tab directly
- **Priority**: Medium (less urgent than direct messages)

## Update Required

**IMPORTANT**: You need to run the updated notification trigger SQL to enable event chat notifications:

```sql
-- Run this file in Supabase SQL Editor:
campus-connect/supabase-migrations/update-notifications-for-event-chat.sql
```

This will:
- Update the `handle_message_notification()` function
- Add support for 'event' conversation type
- Create notifications that navigate to the event chat tab

## Real-time Behavior

Both direct messages and event chat messages will:
1. ✅ Trigger notifications automatically via database triggers
2. ✅ Appear in real-time via Supabase real-time subscriptions
3. ✅ Update the unread count immediately
4. ✅ Navigate to the correct screen when tapped

## Notification Navigation

When a user taps an event chat notification:
1. Opens the Events tab
2. Navigates to the specific event details screen
3. Automatically switches to the "Chat" tab
4. Shows the event chat with the new message

The navigation uses the URL format: `/(tabs)/events/{event_id}?tab=chat`

## Testing Event Chat Notifications

1. **Create/Join an Event**
2. **Send a message in event chat** (from User A)
3. **Check other attendees** (User B, C, etc.) receive notifications
4. **Tap notification** → Should open event with chat tab active
5. **Verify real-time updates** → New messages appear immediately

## Notes

- Event chat notifications are **medium priority** (not as urgent as direct messages)
- Only event **attendees** receive notifications (not just anyone)
- Notification includes event context in the message preview
- Navigation goes directly to the chat tab within the event

