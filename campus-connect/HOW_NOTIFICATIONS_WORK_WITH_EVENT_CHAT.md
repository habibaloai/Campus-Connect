# How Notifications Work with Event Chat

## Overview

With the new event chat functionality, the notification system has been enhanced to support event chat messages. Here's how it all works together:

## Complete Notification Flow

### 1. **Direct Messages** ✅
- **When**: Someone sends you a direct message
- **Notification**: "New Message"
- **Action**: Opens direct message conversation
- **URL**: `/(tabs)/messages/{conversation_id}`
- **Priority**: High

### 2. **Event Chat Messages** ✅ (NEW)
- **When**: Someone sends a message in an event chat you're attending
- **Notification**: "New Event Chat Message"
- **Message Format**: `[Sender Name] in "[Event Title]": [Message Preview]`
- **Action**: Opens event details with chat tab active
- **URL**: `/(tabs)/events/{event_id}?tab=chat`
- **Priority**: Medium
- **Recipients**: All event attendees except the sender

### 3. **Friend Requests** ✅
- **When**: Someone sends you a friend request
- **Notification**: "New Friend Request"
- **Action**: Opens friend requests tab
- **URL**: `/(tabs)/friends?tab=requests`
- **Priority**: High

### 4. **Friend Request Accepted** ✅
- **When**: Someone accepts your friend request
- **Notification**: "Friend Request Accepted"
- **Action**: Opens friend requests tab
- **URL**: `/(tabs)/friends?tab=requests`
- **Priority**: Medium

### 5. **Post Likes** ✅
- **When**: Someone likes your post
- **Notification**: "Post Liked"
- **Action**: Opens the specific post
- **URL**: `/(tabs)/community/{post_id}`
- **Priority**: Medium

### 6. **Post Comments** ✅
- **When**: Someone comments on your post
- **Notification**: "New Comment"
- **Action**: Opens the specific post
- **URL**: `/(tabs)/community/{post_id}`
- **Priority**: Medium

### 7. **New Events** ✅
- **When**: A new public event is created
- **Notification**: "New Event Created"
- **Action**: Opens the event details
- **URL**: `/(tabs)/events/{event_id}`
- **Priority**: Medium
- **Recipients**: All users except the organizer

## Event Chat Notification Details

### How It Works:

1. **User sends message in event chat**
   - Message is inserted into `messages` table
   - `conversation_id` points to an event conversation
   - Conversation has `type = 'event'` and `event_id` set

2. **Database trigger fires**
   - `handle_message_notification()` function executes
   - Detects conversation type is 'event'
   - Gets the `event_id` from the conversation
   - Queries `event_attendees` table for all attendees

3. **Notifications created**
   - One notification per attendee (except sender)
   - Notification includes:
     - Sender name
     - Event title
     - Message preview (first 80 characters)
   - Action URL includes `?tab=chat` parameter

4. **User receives notification**
   - Appears in real-time (via Supabase real-time)
   - Shows in notifications screen
   - Unread count updates

5. **User taps notification**
   - Navigates to: `/(tabs)/events/{event_id}?tab=chat`
   - Event details screen opens
   - Chat tab is automatically selected
   - Message is visible in chat

### Example Notification:

**Title**: "New Event Chat Message"  
**Message**: "John Doe in \"Study Group Session\": Hey everyone, let's meet at the library..."  
**Action**: Opens event details with chat tab active

## Real-Time Updates

Both notification types support real-time updates:

- ✅ **Database trigger** creates notification automatically
- ✅ **Supabase real-time** delivers notification instantly
- ✅ **NotificationContext** refreshes list automatically
- ✅ **Unread count** updates in real-time

## Navigation Behavior

### Event Chat Notification Navigation:

1. User taps notification
2. App navigates to: `/(tabs)/events/{event_id}?tab=chat`
3. Event details screen reads `tab` query parameter
4. Sets `activeTab` state to 'chat'
5. Chat tab is displayed immediately
6. User sees the new message

## Update Required

To enable event chat notifications, you need to run the updated notification trigger:

**Run this SQL in Supabase:**
```sql
-- File: campus-connect/supabase-migrations/notification-triggers-complete.sql
-- Or run: campus-connect/supabase-migrations/update-notifications-for-event-chat.sql
```

Both files now include event chat notification support.

## Differences: Direct vs Event Chat

| Feature | Direct Messages | Event Chat |
|---------|----------------|------------|
| **Priority** | High | Medium |
| **Notification Title** | "New Message" | "New Event Chat Message" |
| **Message Preview** | Includes sender name | Includes sender + event title |
| **Action URL** | `/(tabs)/messages/{id}` | `/(tabs)/events/{id}?tab=chat` |
| **Recipients** | Conversation participants | Event attendees |
| **Who Gets Notified** | All participants except sender | All attendees except sender |

## Testing

1. **Join an event** as User A
2. **Join the same event** as User B, C, etc.
3. **Send a message in event chat** as User A
4. **Check notifications** for User B and C
5. **Tap notification** → Should open event with chat tab active

## Technical Implementation

- **Database Trigger**: `handle_message_notification()` checks conversation type
- **Event Detection**: Queries `conversations.event_id` to identify event chats
- **Participant Query**: Uses `event_attendees` table to find recipients
- **Notification Format**: Includes event context in message preview
- **Navigation**: Uses query parameter `?tab=chat` to open correct tab

