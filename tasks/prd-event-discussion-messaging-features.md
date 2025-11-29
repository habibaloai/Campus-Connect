# Product Requirements Document: Event Management, Real-Time Updates, Discussion Features, and Group Messaging

## Introduction/Overview

This document outlines the requirements for implementing four critical features in the Campus Connect application:

1. **Event Management** - Allow event organizers to delete their events with proper cleanup and notifications
2. **Events Tab Real-Time Updates** - Implement automatic real-time updates for the Events tab similar to the Messages tab
3. **Discussion Features** - Complete the implementation of like and comment functionality for community posts
4. **Group Messaging** - Enable users to create and manage group conversations with admin permissions

**Problem Statements:**
- Event organizers currently cannot delete their events through the UI, even though the backend API exists
- The Events tab requires manual refresh to see new events, changes, or deletions
- Discussion posts have like and comment UI elements, but the API functions are incomplete or missing
- Users can only engage in direct messaging; group conversations are not accessible through the UI

**Goal:** Implement all four features to provide a complete, real-time, and fully functional event management, discussion, and messaging experience.

## Goals

1. Enable event organizers to delete their events through the UI with proper confirmation and cleanup
2. Implement real-time updates for the Events tab to automatically reflect changes without manual refresh
3. Complete the like and comment functionality for discussion posts with proper API integration
4. Enable users to create and manage group conversations with member management and admin permissions
5. Ensure all features work seamlessly across both web and mobile platforms
6. Maintain data consistency and proper cleanup when events are deleted
7. Provide real-time feedback for all user interactions

## User Stories

### Event Management

1. **As an event organizer**, I want to delete my event from the edit event page, so that I can remove events that are cancelled or no longer needed.

2. **As an event organizer**, I want to see a confirmation dialog before deleting an event, so that I don't accidentally delete important events.

3. **As an event attendee**, I want to be notified when an event I'm attending is deleted, so that I'm aware the event has been cancelled.

### Events Tab Real-Time Updates

4. **As a user**, I want the Events tab to automatically show new events as they're created, so that I don't miss new opportunities.

5. **As a user**, I want to see event updates (title, date, location changes) in real-time, so that I'm always viewing current information.

6. **As a user**, I want deleted events to disappear from my Events tab automatically, so that I'm not viewing outdated information.

7. **As a user**, I want to see attendee count updates in real-time, so that I know how many people are joining events.

### Discussion Features

8. **As a user**, I want to like and unlike discussion posts, so that I can show appreciation for helpful content.

9. **As a user**, I want to see the like count update in real-time when others like a post, so that I see current engagement metrics.

10. **As a user**, I want to comment on discussion posts, so that I can participate in conversations.

11. **As a user**, I want to see new comments appear in real-time, so that I can follow ongoing discussions.

12. **As a post author**, I want to see notifications when someone likes or comments on my post, so that I'm aware of engagement.

### Group Messaging

13. **As a user**, I want to create a group conversation from the Messages tab, so that I can chat with multiple people at once.

14. **As a group creator**, I want to add and remove members from my group, so that I can manage the conversation participants.

15. **As a group creator**, I want to assign admin permissions to other members, so that they can help manage the group.

16. **As a group admin**, I want to remove members from the group, so that I can moderate the conversation.

17. **As a group member**, I want to leave a group conversation, so that I can opt out of groups I no longer want to participate in.

18. **As a group member**, I want to see all group members and their roles, so that I know who can manage the group.

## Functional Requirements

### Feature 1: Event Deletion

#### Delete Event UI

1. **FR-1:** The system must display a "Delete Event" button on the edit event page, positioned below the "Save Changes" button.

2. **FR-2:** The "Delete Event" button must only be visible to the event organizer (the user who created the event).

3. **FR-3:** The "Delete Event" button must be styled differently (e.g., red/destructive styling) to indicate it's a dangerous action.

4. **FR-4:** When the "Delete Event" button is clicked, the system must show a confirmation dialog with:
   - Event title
   - Warning message about permanent deletion
   - Information about what will be deleted (event, photos, attendees, etc.)
   - "Cancel" and "Delete" buttons

5. **FR-5:** The confirmation dialog must require explicit confirmation (user must click "Delete" button, not just dismiss).

#### Delete Event Backend

6. **FR-6:** The system must verify that the user attempting to delete is the event organizer before proceeding.

7. **FR-7:** When an event is deleted, the system must permanently delete:
   - The event record from the `events` table
   - All associated event photos from the `event_photos` table (cascade delete)
   - All photo comments from the `event_photo_comments` table (cascade delete)
   - All photo likes from the `event_photo_likes` table (cascade delete)
   - All event attendees records from the `event_attendees` table (cascade delete)
   - All join requests from the `event_join_requests` table (cascade delete)
   - The cover photo from Supabase Storage (`event-covers` bucket)
   - All photo files from Supabase Storage (`event-photos` bucket)

8. **FR-8:** The system must handle storage deletion errors gracefully (log warnings but don't fail the deletion if storage cleanup fails).

9. **FR-9:** The system must notify all attendees when an event is deleted by creating notifications with:
   - Type: `event_deleted`
   - Title: "Event Cancelled"
   - Message: "[Event Title] has been cancelled"
   - Action URL: Link to events list or null

10. **FR-10:** After successful deletion, the system must redirect the user to the Events list page.

11. **FR-11:** The system must display a success message confirming the event was deleted.

12. **FR-12:** The system must handle deletion errors gracefully and display appropriate error messages to the user.

### Feature 2: Events Tab Real-Time Updates

#### Real-Time Event Creation

13. **FR-13:** The system must subscribe to INSERT events on the `events` table using Supabase real-time subscriptions.

14. **FR-14:** When a new event is created, the system must automatically add it to the Events list without requiring a manual refresh.

15. **FR-15:** New events must appear in the correct chronological order (sorted by date).

#### Real-Time Event Updates

16. **FR-16:** The system must subscribe to UPDATE events on the `events` table for real-time updates.

17. **FR-17:** When event details are updated (title, description, date, time, location, category, max_attendees), the system must automatically update the event card in the list.

18. **FR-18:** If the user is viewing an event detail page that is being updated, the system must refresh the event details in real-time.

19. **FR-19:** The system must show a visual indicator (e.g., "Updated" badge or animation) when an event is updated in real-time.

#### Real-Time Event Deletion

20. **FR-20:** The system must subscribe to DELETE events on the `events` table.

21. **FR-21:** When an event is deleted, the system must automatically remove it from the Events list without requiring a manual refresh.

22. **FR-22:** If the user is viewing an event detail page that is being deleted, the system must:
   - Show a message: "This event has been deleted"
   - Redirect to the Events list page after 3 seconds
   - Or provide a "Go Back" button

#### Real-Time Attendee Count Updates

23. **FR-23:** The system must subscribe to INSERT and DELETE events on the `event_attendees` table.

24. **FR-24:** When users join or leave events, the system must automatically update the attendee count on event cards in real-time.

25. **FR-25:** The attendee count must update on both the Events list and the event detail page.

#### Real-Time Subscription Management

26. **FR-26:** The system must properly initialize real-time subscriptions when the Events tab is mounted.

27. **FR-27:** The system must clean up subscriptions when the Events tab is unmounted or the user navigates away.

28. **FR-28:** The system must handle subscription errors gracefully and attempt to reconnect if the connection is lost.

29. **FR-29:** The system must filter subscriptions to only receive updates for events that are relevant (e.g., future events, events the user is attending).

### Feature 3: Discussion Features (Likes and Comments)

#### Like Functionality

30. **FR-30:** The system must provide API functions to like and unlike posts:
   - `likePost(postId: string, userId: string)` - Add a like
   - `unlikePost(postId: string, userId: string)` - Remove a like
   - `getPostLikes(postId: string)` - Get all likes for a post

31. **FR-31:** The system must update the `posts.likes` count when a like is added or removed (use database trigger or API logic).

32. **FR-32:** The system must check if a user has already liked a post before allowing another like (enforce unique constraint).

33. **FR-33:** The system must display the current like count for each post.

34. **FR-34:** The system must visually indicate when the current user has liked a post (e.g., filled heart icon vs. outline).

35. **FR-35:** The system must allow users to toggle likes (click to like, click again to unlike).

36. **FR-36:** The system must update the like count and like status in real-time when other users like/unlike posts.

37. **FR-37:** The system must send a notification to the post author when someone likes their post (optional: batch notifications to avoid spam).

#### Comment Functionality

38. **FR-38:** The system must provide API functions for comments:
   - `addComment(postId: string, userId: string, content: string)` - Add a comment
   - `getComments(postId: string)` - Get all comments for a post
   - `deleteComment(commentId: string, userId: string)` - Delete a comment (only by author)
   - `updateComment(commentId: string, userId: string, content: string)` - Update a comment (only by author)

39. **FR-39:** The system must validate that comment content is not empty and has a minimum length (e.g., 1 character, max 5000 characters).

40. **FR-40:** The system must display comments below each post with:
   - Commenter's name and avatar
   - Comment content
   - Comment timestamp (formatted as "X minutes ago" or absolute date)
   - Delete/edit buttons (only visible to comment author)

41. **FR-41:** The system must display the comment count for each post.

42. **FR-42:** The system must allow users to delete their own comments.

43. **FR-43:** The system must update the comment count in real-time when new comments are added.

44. **FR-44:** The system must display new comments in real-time without requiring a page refresh.

45. **FR-45:** The system must send a notification to the post author when someone comments on their post.

46. **FR-46:** The system must subscribe to real-time updates for both `post_likes` and `post_replies` tables.

47. **FR-47:** The system must handle comment editing (if implemented) with proper validation and real-time updates.

#### Discussion UI Integration

48. **FR-48:** The system must ensure the like button is fully functional on both the post list and post detail pages.

49. **FR-49:** The system must ensure the comment input field and submit button are fully functional.

50. **FR-50:** The system must display error messages if like/comment operations fail.

51. **FR-51:** The system must show loading states while like/comment operations are in progress.

### Feature 4: Group Messaging

#### Create Group Conversation

52. **FR-52:** The system must provide a "New Group" button in the Messages tab (visible to all authenticated users).

53. **FR-53:** When "New Group" is clicked, the system must show a group creation screen with:
   - Group name input field (required, max 100 characters)
   - Member search/selection interface
   - List of selected members
   - "Create Group" button

54. **FR-54:** The system must allow users to search for other users by name to add as group members.

55. **FR-55:** The system must require at least 2 members (in addition to the creator) to create a group.

56. **FR-56:** The system must prevent adding duplicate members to the group.

57. **FR-57:** The system must prevent users from adding themselves to the group (they're automatically added as creator).

58. **FR-58:** When a group is created, the system must:
   - Create a conversation record with `type = 'group'` and the group name
   - Add the creator as a participant with admin role
   - Add all selected members as participants
   - Return the new conversation to the UI

59. **FR-59:** After group creation, the system must automatically navigate to the new group conversation.

#### Group Member Management

60. **FR-60:** The system must display all group members in the group conversation header or info screen.

61. **FR-61:** The system must show member roles (Admin, Member) next to each member's name.

62. **FR-62:** Group creators must automatically have admin permissions.

63. **FR-63:** The system must provide an "Add Members" option (visible to admins only) that allows searching and adding new members.

64. **FR-64:** The system must provide a "Remove Member" option (visible to admins only) for each member (except themselves).

65. **FR-65:** The system must prevent removing the last admin from a group (at least one admin must remain).

66. **FR-66:** The system must allow regular members to leave the group (remove themselves).

67. **FR-67:** The system must allow admins to leave the group only if there's at least one other admin remaining.

68. **FR-68:** When a member is removed or leaves, the system must:
   - Remove them from `conversation_participants`
   - Notify remaining members (optional)
   - Update the group member list in real-time

#### Group Admin Permissions

69. **FR-69:** The system must store admin status in the database (add `is_admin` boolean field to `conversation_participants` table or create a separate `group_admins` table).

70. **FR-70:** The system must allow group creators to assign admin permissions to other members.

71. **FR-71:** The system must allow group creators to revoke admin permissions from other admins (but not from themselves if they're the only admin).

72. **FR-72:** The system must restrict the following actions to admins only:
   - Adding members
   - Removing members
   - Assigning/revoking admin permissions
   - Changing group name (if implemented)

73. **FR-73:** The system must display admin-only UI elements (buttons, menus) only to users with admin permissions.

#### Group Messaging UI

74. **FR-74:** The system must display group conversations differently from direct messages in the Messages list (e.g., group icon, member count).

75. **FR-75:** The system must show the group name in the conversation header.

76. **FR-76:** The system must show all group members in the conversation (either in header or in a separate "Group Info" screen).

77. **FR-77:** The system must allow users to view group details (members, admins, creation date) from within the conversation.

78. **FR-78:** The system must support sending messages to groups (existing message sending functionality should work for groups).

79. **FR-79:** The system must display message sender names in group conversations (since multiple people can send messages).

80. **FR-80:** The system must implement real-time updates for group member changes (additions, removals, role changes).

#### Group Messaging Backend

81. **FR-81:** The system must add database migration to support admin permissions:
   - Add `is_admin BOOLEAN DEFAULT false` to `conversation_participants` table, OR
   - Create a separate `group_admins` table with `conversation_id` and `user_id`

82. **FR-82:** The system must provide API functions for group management:
   - `createGroupConversation(userId: string, name: string, memberIds: string[])` - Already exists, verify it works
   - `addGroupMembers(conversationId: string, adminId: string, memberIds: string[])` - Add members
   - `removeGroupMember(conversationId: string, adminId: string, memberId: string)` - Remove member
   - `assignGroupAdmin(conversationId: string, creatorId: string, userId: string)` - Assign admin
   - `revokeGroupAdmin(conversationId: string, creatorId: string, userId: string)` - Revoke admin
   - `leaveGroup(conversationId: string, userId: string)` - Leave group
   - `getGroupMembers(conversationId: string)` - Get all members with roles

83. **FR-83:** The system must validate admin permissions before allowing member management operations.

84. **FR-84:** The system must enforce business rules (e.g., at least one admin must remain).

## Non-Functional Requirements

### Performance

1. **NFR-1:** Real-time subscriptions must not cause significant performance degradation or excessive database queries.

2. **NFR-2:** Event deletion must complete within 5 seconds for events with up to 100 attendees and 50 photos.

3. **NFR-3:** Like and comment operations must respond within 1 second.

4. **NFR-4:** Group creation must complete within 2 seconds for groups with up to 20 members.

### Reliability

5. **NFR-5:** Real-time subscriptions must automatically reconnect if the connection is lost.

6. **NFR-6:** Failed operations (like, comment, delete) must display clear error messages to users.

7. **NFR-7:** Event deletion must be atomic - either all related data is deleted or the operation fails and nothing is deleted.

### Security

8. **NFR-8:** Only event organizers can delete their events (enforced at both UI and API levels).

9. **NFR-9:** Only post authors can delete their own comments.

10. **NFR-10:** Only group admins can add/remove members and manage permissions.

11. **NFR-11:** All API functions must validate user permissions before executing operations.

12. **NFR-12:** Real-time subscriptions must only send updates to authorized users.

### Usability

13. **NFR-13:** Confirmation dialogs must be clear and not easily dismissible by accident.

14. **NFR-14:** Real-time updates must be smooth and not cause UI flickering or jumping.

15. **NFR-15:** Loading states must be shown for all async operations.

16. **NFR-16:** Error messages must be user-friendly and actionable.

## Non-Goals (Out of Scope)

1. **NG-1:** Event deletion recovery/undo functionality (deletions are permanent).

2. **NG-2:** Event deletion scheduling (deleting events at a future date).

3. **NG-3:** Real-time typing indicators for Events tab (only for Messages).

4. **NG-4:** Comment editing functionality (only deletion is required, editing is optional).

5. **NG-5:** Comment replies/nested comments (flat comment structure only).

6. **NG-6:** Group conversation settings (mute, notifications) - future enhancement.

7. **NG-7:** Group conversation media sharing (text messages only for now).

8. **NG-8:** Event deletion for past events (can be deleted regardless of date).

9. **NG-9:** Bulk event operations (delete multiple events at once).

10. **NG-10:** Advanced group features (polls, announcements, etc.) - future enhancement.

## Design Considerations

### Event Deletion UI

- The delete button should be styled with a destructive/red color scheme
- Confirmation dialog should use a modal overlay
- Success/error messages should use toast notifications or inline alerts
- Consider showing a loading spinner during deletion

### Real-Time Updates UI

- Use subtle animations to indicate updates (e.g., fade-in for new items, highlight for updated items)
- Avoid jarring transitions that might confuse users
- Consider debouncing rapid updates to prevent UI flickering
- Show connection status indicator if real-time connection is lost

### Discussion Features UI

- Like button should provide visual feedback (animation, color change)
- Comment input should be clearly visible and accessible
- Comments should be displayed in chronological order (newest first or oldest first - clarify)
- Consider pagination or "Load More" for posts with many comments

### Group Messaging UI

- Group creation screen should be intuitive with clear member selection
- Group info screen should clearly show admins vs. regular members
- Admin actions should be clearly marked and separated from regular actions
- Consider using icons or badges to indicate admin status

## Technical Considerations

### Database Schema Changes

1. **TC-1:** Add `is_admin` field to `conversation_participants` table OR create `group_admins` table (recommend adding to `conversation_participants` for simplicity).

2. **TC-2:** Ensure database triggers exist to update `posts.likes` count when `post_likes` records are added/removed (or handle in API).

3. **TC-3:** Verify cascade delete rules are properly set for all event-related tables.

### API Integration

4. **TC-4:** The `deleteEvent` API function already exists in `apps/mobile/lib/supabase.ts` - verify it works correctly and expose it in the UI.

5. **TC-5:** Review existing like/comment API functions - complete missing implementations or fix broken ones.

6. **TC-6:** The `createGroupConversation` API function exists - verify it works and add missing group management functions.

### Real-Time Subscriptions

7. **TC-7:** Use Supabase real-time subscriptions similar to the Messages tab implementation.

8. **TC-8:** Subscribe to multiple tables: `events`, `event_attendees`, `post_likes`, `post_replies`, `conversation_participants`.

9. **TC-9:** Implement proper subscription cleanup to prevent memory leaks.

10. **TC-10:** Handle subscription errors and reconnection logic.

### Platform Compatibility

11. **TC-11:** Ensure all features work on both web (Next.js) and mobile (React Native/Expo) platforms.

12. **TC-12:** Test real-time subscriptions on both platforms (may have different behavior).

13. **TC-13:** Verify storage deletion works correctly on both platforms.

## Success Metrics

1. **SM-1:** Event deletion success rate > 99% (deletions complete without errors).

2. **SM-2:** Real-time update latency < 2 seconds (time from database change to UI update).

3. **SM-3:** Like/comment operation success rate > 99%.

4. **SM-4:** Group creation success rate > 99%.

5. **SM-5:** User engagement: Increase in likes/comments on discussion posts by 50% within 1 month.

6. **SM-6:** User satisfaction: Reduce support tickets related to "events not updating" by 80%.

7. **SM-7:** Feature adoption: 30% of users create at least one group conversation within 1 month.

## Edge Cases

### Event Deletion

1. **EC-1:** Event organizer deletes event while other users are viewing it
   - **Solution:** Real-time update shows "Event Deleted" message, redirect to events list

2. **EC-2:** Event deletion fails partway through (e.g., storage deletion fails)
   - **Solution:** Log error, complete database deletion, show warning about storage cleanup failure

3. **EC-3:** Event organizer account is deleted
   - **Solution:** Handle orphaned events per business rules (allow deletion by admins or prevent organizer deletion if events exist)

4. **EC-4:** Multiple users try to delete the same event simultaneously
   - **Solution:** Database constraints prevent duplicate deletions, first deletion succeeds

5. **EC-5:** Event has many photos (100+) - deletion takes time
   - **Solution:** Show progress indicator, perform deletion asynchronously if needed

### Real-Time Updates

6. **EC-6:** User loses internet connection while viewing Events tab
   - **Solution:** Show connection status, queue updates, sync when reconnected

7. **EC-7:** Rapid-fire event updates (multiple updates in quick succession)
   - **Solution:** Debounce updates or batch them to prevent UI flickering

8. **EC-8:** User is on Events list, another user deletes an event they're about to view
   - **Solution:** Event disappears from list, if user navigates to deleted event, show "Not Found" page

9. **EC-9:** Real-time subscription fails to initialize
   - **Solution:** Fall back to polling, show connection error, retry subscription

### Discussion Features

10. **EC-10:** User likes a post, then immediately unlikes it
   - **Solution:** Handle rapid toggles, ensure final state is correct

11. **EC-11:** Multiple users comment on the same post simultaneously
   - **Solution:** Real-time updates show all comments, handle race conditions in comment count

12. **EC-12:** User deletes a comment while another user is viewing it
   - **Solution:** Real-time update removes comment from view, show "Comment deleted" placeholder if needed

13. **EC-13:** Post author deletes post while users are commenting
   - **Solution:** Cascade delete comments, show "Post deleted" message to users viewing post

14. **EC-14:** Comment content exceeds maximum length
   - **Solution:** Validate on frontend and backend, show character count, prevent submission

### Group Messaging

15. **EC-15:** Group creator tries to remove themselves as the only admin
   - **Solution:** Prevent removal, show error "Cannot remove the last admin"

16. **EC-16:** User tries to add a member who is already in the group
   - **Solution:** Check for duplicates, show "Member already in group" message

17. **EC-17:** Group member leaves while messages are being sent
   - **Solution:** Member stops receiving messages after leaving, existing messages remain visible

18. **EC-18:** Group creator deletes their account
   - **Solution:** Transfer admin to another member or handle orphaned groups per business rules

19. **EC-19:** User tries to create a group with duplicate member selections
   - **Solution:** Filter duplicates before creation, show only unique members

20. **EC-20:** Group reaches maximum size (if limit exists)
   - **Solution:** Enforce limit, show "Group is full" message when trying to add members

21. **EC-21:** Non-admin user tries to perform admin actions
   - **Solution:** API validation prevents action, show "Permission denied" error

22. **EC-22:** Group name contains invalid characters or exceeds length
   - **Solution:** Validate on frontend and backend, show error message

## Open Questions

1. **OQ-1:** Should event deletion be allowed for past events, or only future events?

2. **OQ-2:** Should there be a limit on the number of members in a group conversation? If yes, what is the limit?

3. **OQ-3:** Should comment editing be implemented now, or is deletion-only sufficient?

4. **OQ-4:** Should likes on posts trigger individual notifications, or batched notifications (e.g., "5 people liked your post")?

5. **OQ-5:** Should group conversations have a maximum message history limit, or keep all messages indefinitely?

6. **OQ-6:** Should event deletion require a reason or cancellation message to be provided to attendees?

7. **OQ-7:** Should there be a "soft delete" option for events (archive instead of permanent deletion)?

8. **OQ-8:** Should group admins be able to change the group name after creation?

9. **OQ-9:** Should real-time updates work when the app is in the background (mobile), or only when active?

10. **OQ-10:** Should comment replies/nested comments be supported, or keep flat comment structure?

---

## Implementation Notes

- All features should be implemented with proper error handling and user feedback
- Real-time subscriptions should be properly cleaned up to prevent memory leaks
- Database migrations should be created for any schema changes
- All API functions should include proper permission checks
- UI should provide loading states and error messages for all operations
- Both web and mobile platforms should be tested thoroughly

