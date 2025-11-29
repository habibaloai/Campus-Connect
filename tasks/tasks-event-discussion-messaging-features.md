# Tasks: Event Management, Real-Time Updates, Discussion Features, and Group Messaging

## Relevant Files

### Database & Migrations
- `campus-connect/supabase-migrations/add-group-admin-permissions.sql` - New migration file for adding is_admin field to conversation_participants
- `campus-connect/supabase-migrations/add-post-likes-trigger.sql` - New migration file for database trigger to update posts.likes count
- `campus-connect/supabase-schema.sql` - Main database schema file (reference for table structures)

### Event Management
- `campus-connect/apps/mobile/app/(tabs)/events/[id].tsx` - Event details screen with edit modal (needs delete button)
- `campus-connect/src/app/event/[id]/page.tsx` - Web event details page (needs delete button)
- `campus-connect/apps/mobile/lib/supabase.ts` - Contains deleteEvent API function (verify and expose)
- `campus-connect/src/lib/supabase.ts` - Web Supabase API functions (needs deleteEvent if missing)

### Events Tab Real-Time
- `campus-connect/apps/mobile/app/(tabs)/events/index.tsx` - Mobile events list screen (needs real-time subscriptions)
- `campus-connect/src/components/tabs/EventsTab.tsx` - Web events tab component (needs real-time subscriptions)
- `campus-connect/src/app/dashboard/events/page.tsx` - Web events page (needs real-time subscriptions)

### Discussion Features
- `campus-connect/apps/mobile/app/(tabs)/community/index.tsx` - Mobile community posts list (needs like/comment API integration)
- `campus-connect/apps/mobile/app/(tabs)/community/[id].tsx` - Mobile post details screen (needs like/comment functionality)
- `campus-connect/src/components/tabs/CommunityTab.tsx` - Web community tab (needs like/comment API integration)
- `campus-connect/src/app/dashboard/community/page.tsx` - Web community page (needs like/comment functionality)
- `campus-connect/apps/mobile/lib/supabase.ts` - Mobile API functions (needs likePost, unlikePost, addComment, etc.)
- `campus-connect/src/lib/supabase.ts` - Web API functions (needs likePost, unlikePost, addComment, etc.)

### Group Messaging
- `campus-connect/apps/mobile/app/(tabs)/messages/index.tsx` - Mobile messages list (needs "New Group" button and group creation UI)
- `campus-connect/apps/mobile/app/(tabs)/messages/[id].tsx` - Mobile chat screen (needs group member management UI)
- `campus-connect/src/app/dashboard/messages/page.tsx` - Web messages page (needs "New Group" button and group creation UI)
- `campus-connect/src/app/dashboard/messages/[id]/page.tsx` - Web chat page (needs group member management UI)
- `campus-connect/apps/mobile/lib/supabase.ts` - Mobile API functions (needs group management functions)
- `campus-connect/src/lib/supabase.ts` - Web API functions (needs group management functions)

### Notes
- All API functions should be implemented in both mobile and web Supabase files
- Real-time subscriptions should follow the pattern used in the Messages tab
- Test all features on both platforms (web and mobile)

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, you must check it off in this markdown file by changing `- [ ]` to `- [x]`. This helps track progress and ensures you don't skip any steps.

Example:
- `- [ ] 1.1 Read file` → `- [x] 1.1 Read file` (after completing)

Update the file after completing each sub-task, not just after completing an entire parent task.

## Tasks

- [x] 0.0 Create feature branch
  - [x] 0.1 Create and checkout a new branch for this feature (e.g., `git checkout -b feature/event-discussion-messaging-features`)
  - [x] 0.2 Verify you're on the new branch with `git branch`

- [x] 1.0 Database schema changes and migrations
  - [x] 1.1 Create migration file `campus-connect/supabase-migrations/add-group-admin-permissions.sql`
  - [x] 1.2 Add `is_admin BOOLEAN DEFAULT false` column to `conversation_participants` table
  - [x] 1.3 Add index on `(conversation_id, is_admin)` for efficient admin queries
  - [x] 1.4 Create migration file `campus-connect/supabase-migrations/add-post-likes-trigger.sql`
  - [x] 1.5 Create database trigger function to update `posts.likes` count when `post_likes` records are inserted/deleted
  - [x] 1.6 Verify cascade delete rules exist for all event-related tables (events, event_photos, event_photo_comments, event_photo_likes, event_attendees, event_join_requests)
  - [x] 1.7 Test migrations in Supabase SQL Editor to ensure they run without errors
  - [x] 1.8 Document any manual steps needed to apply migrations

- [x] 2.0 Event Deletion feature implementation
  - [x] 2.1 Verify `deleteEvent` function exists in `campus-connect/apps/mobile/lib/supabase.ts` and review its implementation
  - [x] 2.2 Add `deleteEvent` function to `campus-connect/src/lib/supabase.ts` if it doesn't exist (copy from mobile version)
  - [x] 2.3 Open `campus-connect/apps/mobile/app/(tabs)/events/[id].tsx` and locate the edit modal section
  - [x] 2.4 Add "Delete Event" button below the "Save Changes" button in the edit modal
  - [x] 2.5 Style the delete button with destructive/red styling (use Trash2 icon from lucide-react-native)
  - [x] 2.6 Add state for delete confirmation dialog (showDeleteConfirm)
  - [x] 2.7 Create confirmation dialog component with:
    - Event title display
    - Warning message about permanent deletion
    - List of what will be deleted (event, photos, attendees, etc.)
    - "Cancel" and "Delete" buttons
  - [x] 2.8 Implement delete handler function that:
    - Calls `api.deleteEvent(eventId, user.id)`
    - Shows loading state during deletion
    - Handles success (show success message, redirect to events list)
    - Handles errors (show error message)
  - [x] 2.9 Ensure delete button is only visible when `user?.id === event?.organizer_id`
  - [x] 2.10 Add delete functionality to web version in `campus-connect/src/app/event/[id]/page.tsx`
  - [ ] 2.11 Test event deletion with events that have photos, attendees, and join requests
  - [ ] 2.12 Verify notifications are sent to all attendees when event is deleted
  - [ ] 2.13 Verify storage cleanup (cover photos and event photos) works correctly

- [x] 3.0 Events Tab Real-Time Updates implementation
  - [x] 3.1 Open `campus-connect/apps/mobile/app/(tabs)/events/index.tsx`
  - [x] 3.2 Review how real-time subscriptions are implemented in `campus-connect/apps/mobile/app/(tabs)/messages/index.tsx` for reference
  - [x] 3.3 Add `useEffect` hook to subscribe to `events` table INSERT events when component mounts
  - [x] 3.4 In INSERT subscription callback, add new event to the events list state (check for duplicates)
  - [x] 3.5 Add subscription to `events` table UPDATE events to update existing events in the list
  - [x] 3.6 Add subscription to `events` table DELETE events to remove deleted events from the list
  - [x] 3.7 Add subscription to `event_attendees` table INSERT/DELETE events to update attendee counts
  - [x] 3.8 In attendee subscription callback, update the `attendee_count` for the affected event
  - [x] 3.9 Add cleanup function in `useEffect` return to unsubscribe from all subscriptions when component unmounts
  - [x] 3.10 Handle subscription errors gracefully (log errors, show connection status if needed)
  - [x] 3.11 Add real-time updates to event detail page (`campus-connect/apps/mobile/app/(tabs)/events/[id].tsx`):
    - Subscribe to UPDATE events for the specific event ID
    - Subscribe to DELETE events for the specific event ID
    - If deleted, show "Event Deleted" message and redirect after 3 seconds
    - Update event details in real-time when changed
  - [x] 3.12 Implement same real-time subscriptions for web version in `campus-connect/src/components/tabs/EventsTab.tsx`
  - [x] 3.13 Implement real-time updates in web event detail page (`campus-connect/src/app/event/[id]/page.tsx`)
  - [ ] 3.14 Test real-time updates by:
    - Creating a new event in one browser/device, verify it appears in another
    - Updating an event, verify changes appear in real-time
    - Deleting an event, verify it disappears in real-time
    - Joining/leaving events, verify attendee count updates

- [x] 4.0 Discussion Features (Likes and Comments) implementation
  - [x] 4.1 Review existing like/comment code in `campus-connect/apps/mobile/app/(tabs)/community/[id].tsx`
  - [x] 4.2 Check `campus-connect/apps/mobile/lib/supabase.ts` for existing `likePost`, `unlikePost`, `addComment`, `getComments`, `deleteComment` functions
  - [x] 4.3 Implement or fix `likePost(postId: string, userId: string)` function:
    - Check if user already liked (query post_likes table)
    - If not liked, insert into post_likes table
    - Update posts.likes count (or rely on database trigger)
    - Return success/error
  - [x] 4.4 Implement or fix `unlikePost(postId: string, userId: string)` function:
    - Delete from post_likes table where post_id and user_id match
    - Update posts.likes count (or rely on database trigger)
    - Return success/error
  - [x] 4.5 Implement or fix `addComment(postId: string, userId: string, content: string)` function:
    - Validate content (not empty, max length)
    - Insert into post_replies table
    - Return comment data with author profile
    - Send notification to post author
  - [x] 4.6 Implement or fix `getComments(postId: string)` function:
    - Query post_replies table with author profile join
    - Order by created_at (newest or oldest - clarify)
    - Return comments array
  - [x] 4.7 Implement or fix `deleteComment(commentId: string, userId: string)` function:
    - Verify user is comment author
    - Delete from post_replies table
    - Return success/error
  - [x] 4.8 Add same API functions to `campus-connect/src/lib/supabase.ts` for web version
  - [x] 4.9 Update mobile post list (`campus-connect/apps/mobile/app/(tabs)/community/index.tsx`):
    - Ensure like button calls `api.likePost` or `api.unlikePost` based on `is_liked` state
    - Update local state optimistically when like/unlike is clicked
    - Handle errors and revert state if API call fails
  - [x] 4.10 Update mobile post details (`campus-connect/apps/mobile/app/(tabs)/community/[id].tsx`):
    - Ensure like button is fully functional
    - Ensure comment input and submit button work
    - Display comments with author info
    - Add delete button for user's own comments
    - Show loading states during operations
  - [x] 4.11 Add real-time subscriptions for likes:
    - Subscribe to INSERT/DELETE on `post_likes` table
    - Update like count and `is_liked` state in real-time
  - [x] 4.12 Add real-time subscriptions for comments:
    - Subscribe to INSERT on `post_replies` table
    - Add new comments to the comments list in real-time
    - Subscribe to DELETE to remove deleted comments
  - [ ] 4.13 Update web community tab (`campus-connect/src/components/tabs/CommunityTab.tsx`):
    - Fix like functionality to use API functions
    - Ensure proper state management
  - [ ] 4.14 Update web community page (`campus-connect/src/app/dashboard/community/page.tsx`):
    - Fix comment functionality
    - Add real-time subscriptions
  - [ ] 4.15 Test like functionality:
    - Like a post, verify count updates and icon changes
    - Unlike a post, verify count updates and icon changes
    - Verify real-time updates when another user likes/unlikes
  - [ ] 4.16 Test comment functionality:
    - Add a comment, verify it appears
    - Delete own comment, verify it's removed
    - Verify real-time updates when another user comments
    - Verify notifications are sent to post authors

- [ ] 5.0 Group Messaging feature implementation
  - [ ] 5.1 Verify `createGroupConversation` function exists in `campus-connect/apps/mobile/lib/supabase.ts` and test it
  - [ ] 5.2 Implement `addGroupMembers(conversationId: string, adminId: string, memberIds: string[])` function:
    - Verify adminId has admin permissions
    - Check for duplicate members
    - Insert new members into conversation_participants
    - Return success/error
  - [ ] 5.3 Implement `removeGroupMember(conversationId: string, adminId: string, memberId: string)` function:
    - Verify adminId has admin permissions
    - Check that memberId is not the last admin
    - Remove member from conversation_participants
    - Return success/error
  - [ ] 5.4 Implement `assignGroupAdmin(conversationId: string, creatorId: string, userId: string)` function:
    - Verify creatorId has admin permissions
    - Update is_admin to true for userId
    - Return success/error
  - [ ] 5.5 Implement `revokeGroupAdmin(conversationId: string, creatorId: string, userId: string)` function:
    - Verify creatorId has admin permissions
    - Check that userId is not the only admin
    - Update is_admin to false for userId
    - Return success/error
  - [ ] 5.6 Implement `leaveGroup(conversationId: string, userId: string)` function:
    - Check if user is the last admin (prevent leaving if so)
    - Remove user from conversation_participants
    - Return success/error
  - [ ] 5.7 Implement `getGroupMembers(conversationId: string)` function:
    - Query conversation_participants with profile joins
    - Return members with is_admin flag
    - Order by is_admin (admins first) then joined_at
  - [ ] 5.8 Add all group management functions to `campus-connect/src/lib/supabase.ts` for web version
  - [ ] 5.9 Update `createGroupConversation` to set is_admin=true for the creator
  - [ ] 5.10 Open `campus-connect/apps/mobile/app/(tabs)/messages/index.tsx`
  - [ ] 5.11 Add "New Group" button next to "New Chat" button in the header
  - [ ] 5.12 Create group creation modal/screen with:
    - Group name input field (required, max 100 chars)
    - User search input (reuse existing user search logic)
    - List of selected members (show avatars, names, remove button)
    - "Create Group" button (disabled if less than 2 members selected)
    - Validation and error handling
  - [ ] 5.13 Implement group creation handler:
    - Validate group name and member count
    - Call `api.createGroupConversation(userId, groupName, memberIds)`
    - Navigate to the new group conversation on success
    - Show error message on failure
  - [ ] 5.14 Open `campus-connect/apps/mobile/app/(tabs)/messages/[id].tsx`
  - [ ] 5.15 Add group info button/icon in header (only for group conversations)
  - [ ] 5.16 Create group info modal/screen showing:
    - Group name
    - List of all members with avatars and names
    - Admin badges next to admin members
    - "Add Members" button (admin only)
    - "Remove Member" option for each member (admin only, except themselves)
    - "Leave Group" button (all members)
    - "Assign Admin" / "Revoke Admin" options (creator only)
  - [ ] 5.17 Implement "Add Members" functionality:
    - Show user search interface
    - Allow selecting multiple users
    - Call `api.addGroupMembers` with selected user IDs
    - Update member list in real-time
  - [ ] 5.18 Implement "Remove Member" functionality:
    - Show confirmation dialog
    - Call `api.removeGroupMember`
    - Update member list
  - [ ] 5.19 Implement "Leave Group" functionality:
    - Show confirmation dialog
    - Call `api.leaveGroup`
    - Navigate back to messages list
  - [ ] 5.20 Implement admin assignment/revocation:
    - Show confirmation dialog
    - Call `api.assignGroupAdmin` or `api.revokeGroupAdmin`
    - Update member list with new admin status
  - [ ] 5.21 Add real-time subscriptions for group member changes:
    - Subscribe to INSERT/DELETE on conversation_participants for group conversations
    - Update member list when members are added/removed
    - Subscribe to UPDATE to detect admin role changes
  - [ ] 5.22 Update group conversation display in messages list:
    - Show group icon for group conversations
    - Show member count
    - Display group name instead of participant name
  - [ ] 5.23 Update chat screen to show sender names in group conversations (since multiple people can send)
  - [ ] 5.24 Implement same group creation UI in web version (`campus-connect/src/app/dashboard/messages/page.tsx`)
  - [ ] 5.25 Implement group info and management UI in web chat page (`campus-connect/src/app/dashboard/messages/[id]/page.tsx`)
  - [ ] 5.26 Test group creation:
    - Create a group with 3+ members
    - Verify creator is automatically admin
    - Verify group appears in conversations list
  - [ ] 5.27 Test group member management:
    - Add members as admin
    - Remove members as admin
    - Try to remove last admin (should fail)
    - Assign admin to another member
    - Revoke admin from a member
  - [ ] 5.28 Test group leaving:
    - Regular member leaves group
    - Admin leaves group (when other admins exist)
    - Try to leave as last admin (should fail or transfer admin)

- [ ] 6.0 Testing and cross-platform verification
  - [ ] 6.1 Test event deletion on mobile:
    - Delete event with no photos/attendees
    - Delete event with photos and attendees
    - Verify notifications are sent
    - Verify redirect to events list works
  - [ ] 6.2 Test event deletion on web:
    - Same tests as mobile
    - Verify UI consistency
  - [ ] 6.3 Test real-time event updates on mobile:
    - Have two devices open Events tab
    - Create/update/delete event on one device
    - Verify changes appear on other device without refresh
  - [ ] 6.4 Test real-time event updates on web:
    - Same tests as mobile
    - Test with multiple browser tabs
  - [ ] 6.5 Test like functionality on mobile:
    - Like/unlike posts
    - Verify real-time updates
    - Verify notifications
  - [ ] 6.6 Test like functionality on web:
    - Same tests as mobile
  - [ ] 6.7 Test comment functionality on mobile:
    - Add comments
    - Delete own comments
    - Verify real-time updates
    - Verify notifications
  - [ ] 6.8 Test comment functionality on web:
    - Same tests as mobile
  - [ ] 6.9 Test group messaging on mobile:
    - Create groups
    - Add/remove members
    - Assign/revoke admins
    - Leave groups
    - Send messages in groups
  - [ ] 6.10 Test group messaging on web:
    - Same tests as mobile
  - [ ] 6.11 Test edge cases:
    - Event deletion while users are viewing it
    - Rapid like/unlike toggles
    - Multiple users commenting simultaneously
    - Group creator trying to remove themselves as last admin
    - Network disconnection during real-time updates
  - [ ] 6.12 Verify all error messages are user-friendly
  - [ ] 6.13 Verify all loading states are displayed
  - [ ] 6.14 Check for memory leaks (ensure subscriptions are cleaned up)
  - [ ] 6.15 Test on different screen sizes (mobile) and browsers (web)
  - [ ] 6.16 Document any known issues or limitations

