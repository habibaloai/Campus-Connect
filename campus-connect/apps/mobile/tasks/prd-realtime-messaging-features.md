# Product Requirements Document: Real-Time Messaging Features

## Introduction/Overview

This document outlines the requirements for implementing real-time messaging features in the Campus Connect mobile application. Currently, the messaging system requires manual page refreshes to see new messages, lacks online status indicators, and doesn't show message delivery/read status. This feature will enhance the user experience by providing real-time updates, online presence indicators, and message status tracking.

**Problem Statement:** 
- Users cannot see if their conversation partners are online
- Message delivery and read status are not visible
- The messages tab requires manual refresh to see new messages
- Users have no visibility into whether their messages were received or read

**Goal:** Implement real-time messaging features including online status indicators, message status markers (sent/delivered/read), and automatic updates to the messages tab without requiring manual refresh.

## Goals

1. Display online status indicators for users within individual chat conversations
2. Show message status indicators (Sent, Delivered, Read) for outgoing messages
3. Automatically update the messages list in real-time without manual refresh
4. Implement real-time message delivery and read receipt tracking
5. Show typing indicators when users are actively typing
6. Update notification badges in real-time
7. Provide seamless real-time experience using Supabase real-time subscriptions

## User Stories

1. **As a user in a chat conversation**, I want to see if the other person is currently online, so that I know if they're available to respond.

2. **As a user sending messages**, I want to see when my message has been sent, delivered, and read, so that I know the recipient has received and seen my message.

3. **As a user**, I want the messages tab to automatically show new messages and update conversation previews, so that I don't have to manually refresh to see the latest activity.

4. **As a user**, I want to see when someone is typing a message, so that I know they're actively responding.

5. **As a user**, I want notification badges to update automatically when I receive new messages, so that I'm always aware of unread conversations.

6. **As a user**, I want my online status to be accurately reflected based on whether I have the app open and active, so that others know when I'm available.

## Functional Requirements

### FR1: Online Status Indicators

1.1. The system must track user online/offline status in real-time using Supabase presence channels.
1.2. Online status must be displayed only within individual chat conversation screens (not in the messages list).
1.3. Online status indicator must appear next to or below the recipient's name in the chat header.
1.4. Online status must be determined by whether the user has the app open and is actively connected (real-time connection state).
1.5. The system must show a green dot or "Online" badge when the user is online.
1.6. The system must show a gray dot or "Offline" badge when the user is offline.
1.7. The system must update online status in real-time when users come online or go offline.
1.8. The system must handle connection state changes gracefully (network disconnections, app backgrounding).

### FR2: Message Status Indicators

2.1. The system must track three message states for outgoing messages:
   - **Sent**: Message has been sent from the device
   - **Delivered**: Message has been delivered to the recipient's device
   - **Read**: Message has been read by the recipient

2.2. Message status must be displayed as text below each outgoing message (e.g., "Sent", "Delivered", "Read").

2.3. The system must show only the highest achieved status (hide "Sent" and "Delivered" once "Read" is achieved).

2.4. Status text must be displayed in a smaller, muted font below the message bubble.

2.5. The system must update message status in real-time as messages are delivered and read.

2.6. Status updates must occur automatically without requiring user action.

2.7. The system must handle status updates for messages sent while offline (update when connection is restored).

### FR3: Real-Time Messages List Updates

3.1. The messages tab must automatically update when new messages are received without requiring manual refresh.

3.2. The system must update conversation previews (last message, timestamp) in real-time.

3.3. The system must update unread message counts in real-time.

3.4. The system must reorder conversations based on most recent activity automatically.

3.5. The system must show new conversations that are created in real-time.

3.6. Updates must occur seamlessly without disrupting user interaction with the list.

3.7. The system must handle rapid updates gracefully (debounce/throttle if needed).

### FR4: Typing Indicators

4.1. The system must detect when a user is actively typing in a conversation.

4.2. The system must display a "typing..." indicator when the other user is typing.

4.3. Typing indicator must appear in the message area (below the last message or in a dedicated typing area).

4.4. The system must stop showing typing indicator after 3 seconds of inactivity or when a message is sent.

4.5. Typing indicators must work in real-time across all participants in a conversation.

### FR5: Real-Time Notification Badges

5.1. Notification badges on the messages tab must update automatically when new messages arrive.

5.2. Badge count must reflect the total number of unread conversations.

5.3. Badge must update in real-time without requiring app refresh or navigation.

5.4. Badge must decrease when conversations are opened and messages are marked as read.

5.5. Badge updates must be synchronized across all app screens (tabs, headers, etc.).

### FR6: Real-Time Message Delivery

6.1. The system must mark messages as "delivered" when they are successfully received by the recipient's device.

6.2. Delivery status must be updated in real-time using Supabase real-time subscriptions.

6.3. The system must handle delivery status for messages sent to offline users (mark as delivered when they come online).

6.4. Delivery status must be tracked per message and per recipient (for group conversations).

### FR7: Read Receipts

7.1. The system must automatically mark messages as "read" when the recipient opens the conversation.

7.2. Read status must be updated in real-time and visible to the sender.

7.3. The system must track read status per message and per user (for group conversations).

7.4. Read receipts must only be shown for messages sent by the current user (outgoing messages).

7.5. The system must handle read status updates even if the user quickly navigates away from the conversation.

### FR8: Real-Time Subscriptions

8.1. The system must use Supabase real-time subscriptions for all real-time features.

8.2. Subscriptions must be established when entering a conversation and cleaned up when leaving.

8.3. The system must handle subscription errors gracefully (reconnect, show appropriate messages).

8.4. Subscriptions must be optimized to minimize bandwidth and battery usage.

8.5. The system must unsubscribe from channels when the app is backgrounded or closed.

## Non-Goals (Out of Scope)

1. **Online status in messages list** - Online status will only be shown in individual conversations, not in the conversation list.

2. **Last seen timestamps** - This feature will not include "last seen" or "last active" timestamps, only current online/offline status.

3. **Message editing/deletion indicators** - Real-time updates for message edits or deletions are out of scope.

4. **Read receipts for incoming messages** - Read status will only be shown for outgoing messages, not for messages received by the user.

5. **Group conversation typing indicators** - Typing indicators will show "Someone is typing..." rather than individual user names in group chats (can be enhanced later).

6. **Offline message queue UI** - While offline messages will be handled, there won't be a dedicated UI for viewing queued messages.

7. **Message status for group conversations** - Initial implementation focuses on direct messages; group message status tracking can be added later.

8. **Custom online status messages** - Users cannot set custom status messages (e.g., "Away", "Busy"); only online/offline.

## Design Considerations

### UI/UX Requirements

1. **Online Status Indicator:**
   - Location: Chat header, next to or below recipient name
   - Style: Small green circle (online) or gray circle (offline) with optional "Online"/"Offline" text
   - Size: Small, non-intrusive (8-10px circle)
   - Animation: Smooth fade in/out when status changes

2. **Message Status Indicators:**
   - Location: Below outgoing message bubbles
   - Style: Small text in muted color (gray)
   - Format: "Sent", "Delivered", or "Read" (only highest status shown)
   - Font size: 10-12px
   - Alignment: Right-aligned for outgoing messages

3. **Typing Indicator:**
   - Location: Below last message in conversation
   - Style: Italic text or animated dots ("typing...")
   - Color: Muted gray
   - Animation: Subtle pulsing or dot animation

4. **Real-Time Updates:**
   - Updates should be smooth and non-jarring
   - Use subtle animations for new messages appearing
   - Avoid full page refreshes or content jumping

### Technical Architecture

1. **Supabase Real-Time Subscriptions:**
   - Use Supabase presence channels for online status tracking
   - Use Supabase database subscriptions for message updates
   - Implement proper channel management (subscribe/unsubscribe)

2. **Message Status Tracking:**
   - Add `status` field to messages table: 'sent', 'delivered', 'read'
   - Update status automatically on message events
   - Use database triggers or application logic for status updates

3. **Online Status Tracking:**
   - Track user presence using Supabase presence channels
   - Update presence when app becomes active/inactive
   - Handle app state changes (foreground/background)

4. **Performance Considerations:**
   - Debounce typing indicators to reduce update frequency
   - Batch message status updates when possible
   - Optimize subscription queries to only fetch necessary data

## Technical Considerations

### Dependencies

1. **Supabase Real-Time:** Already integrated, provides presence channels and database subscriptions.
2. **Expo Router:** Already in use for navigation.
3. **React Native:** App state management for tracking foreground/background states.

### Implementation Notes

1. **Database Schema Updates:**
   - Add `status` column to `messages` table: `ENUM('sent', 'delivered', 'read')` default 'sent
   - Add `read_at` timestamp column to `messages` table (nullable)
   - Consider adding `presence` table or using Supabase presence channels directly

2. **Real-Time Subscriptions:**
   - Subscribe to `messages` table changes for the current conversation
   - Subscribe to presence channel for online status
   - Subscribe to `conversations` table for list updates
   - Implement proper cleanup on component unmount

3. **File Structure:**
   - Update `app/(tabs)/messages/index.tsx` to add real-time subscriptions
   - Update `app/(tabs)/messages/[id].tsx` to add online status, typing indicators, and message status
   - Extend `lib/supabase.ts` with presence and typing indicator functions
   - Create hooks: `useOnlineStatus`, `useTypingIndicator`, `useMessageStatus`

4. **App State Management:**
   - Track app state (foreground/background) using `AppState` API
   - Update online status when app state changes
   - Handle network connectivity changes

5. **Message Status Flow:**
   ```
   User sends message → Status: "Sent"
   ↓
   Message saved to database → Status: "Sent"
   ↓
   Recipient's device receives message → Status: "Delivered" (via real-time subscription)
   ↓
   Recipient opens conversation → Status: "Read" (via markAsRead function + real-time update)
   ```

6. **Online Status Flow:**
   ```
   User opens app → Join presence channel → Status: "Online"
   ↓
   User navigates to conversation → Presence tracked per conversation
   ↓
   User backgrounds app → Leave presence channel → Status: "Offline"
   ↓
   User returns to app → Rejoin presence channel → Status: "Online"
   ```

### API Functions to Add/Update

```typescript
// In lib/supabase.ts

// Presence/Online Status
trackPresence: (conversationId: string, userId: string) => {
  // Join presence channel for conversation
}

getOnlineStatus: (userId: string) => {
  // Get current online status for a user
}

// Typing Indicators
sendTypingIndicator: (conversationId: string, userId: string, isTyping: boolean) => {
  // Broadcast typing status
}

subscribeToTyping: (conversationId: string, callback: (userId: string, isTyping: boolean) => void) => {
  // Subscribe to typing indicators
}

// Message Status
updateMessageStatus: (messageId: string, status: 'sent' | 'delivered' | 'read') => {
  // Update message status
}

subscribeToMessageStatus: (conversationId: string, callback: (messageId: string, status: string) => void) => {
  // Subscribe to message status updates
}

// Real-time conversations list
subscribeToConversations: (userId: string, callback: (conversation: Conversation) => void) => {
  // Subscribe to conversation updates
}
```

## Success Metrics

1. **User Engagement:**
   - 80% of users report feeling more confident about message delivery
   - 60% increase in message response rate within 5 minutes

2. **Real-Time Performance:**
   - 95% of message status updates occur within 2 seconds
   - 99% of online status updates occur within 1 second
   - Zero manual refreshes required to see new messages

3. **User Satisfaction:**
   - 85% of users find online status indicators helpful
   - 90% of users prefer real-time updates over manual refresh

4. **Technical Performance:**
   - Real-time subscriptions maintain connection 99% of the time
   - Battery impact is minimal (< 5% additional drain)
   - Network usage is optimized (no unnecessary data transfers)

5. **Feature Adoption:**
   - 70% of conversations show active use of read receipts
   - Typing indicators appear in 40% of active conversations

## Open Questions

1. **Presence Channel Strategy:** Should we use a global presence channel per user, or per-conversation presence channels? (Recommendation: Per-conversation for better privacy and performance)

2. **Typing Indicator Debounce:** What is the optimal debounce time for typing indicators? (Recommendation: 1-2 seconds)

3. **Offline Message Handling:** How should we handle message status for messages sent to offline users? (Recommendation: Mark as "sent" until user comes online, then mark as "delivered")

4. **Group Conversation Status:** Should read receipts show individual read status per participant in group chats, or just "X of Y read"? (Out of scope for initial version, but consider for future)

5. **Battery Optimization:** Should we reduce real-time update frequency when the app is in the background? (Recommendation: Yes, use reduced frequency or pause when backgrounded)

6. **Privacy Settings:** Should users be able to disable read receipts or hide their online status? (Consider for future enhancement)

7. **Message Status Persistence:** Should message status be stored in the database or only tracked in real-time? (Recommendation: Store in database for persistence across app restarts)

---

**Document Version:** 1.0  
**Last Updated:** [Current Date]  
**Author:** AI Assistant  
**Status:** Ready for Implementation



