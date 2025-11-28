# Task List: Event Join Requests System Implementation

## Relevant Files

- `campus-connect/ADD_EVENT_JOIN_REQUESTS_TABLE.sql` - Database schema and RLS policies for event join requests table
- `campus-connect/apps/mobile/lib/supabase.ts` - Backend API functions for join request operations
- `campus-connect/apps/mobile/app/(tabs)/events/[id].tsx` - Frontend UI component for event details and join requests
- `campus-connect/apps/mobile/app/(tabs)/events/index.tsx` - Events list screen (may need updates for private event indicators)
- `campus-connect/apps/mobile/components/ui/EventCard.tsx` - Event card component (may need updates for private event display)

### Notes

- This feature requires both frontend and backend implementation
- Real-time subscriptions are critical for live updates
- All database operations must respect RLS policies
- Notifications must be sent for all state changes

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, you must check it off in this markdown file by changing `- [ ]` to `- [x]`. This helps track progress and ensures you don't skip any steps.

Example:
- `- [ ] 1.1 Read file` → `- [x] 1.1 Read file` (after completing)

Update the file after completing each sub-task, not just after completing an entire parent task.

## Tasks

- [x] 0.0 Create feature branch
  - [x] 0.1 Create and checkout a new branch for this feature (e.g., `git checkout -b feature/event-join-requests`)

- [x] 1.0 Database Setup and Schema Verification
  - [x] 1.1 Verify `event_join_requests` table exists with correct schema (id, event_id, user_id, status, created_at, updated_at)
  - [x] 1.2 Verify UNIQUE constraint on (event_id, user_id) prevents duplicate requests
  - [x] 1.3 Verify foreign key constraints with CASCADE delete for event_id and user_id
  - [x] 1.4 Verify CHECK constraint on status field (pending, accepted, rejected)
  - [x] 1.5 Verify all required indexes are created (event_id, user_id, status)
  - [x] 1.6 Verify RLS is enabled on the table
  - [x] 1.7 Verify RLS policy for authenticated users to create requests
  - [x] 1.8 Verify RLS policy for organizers to view/manage requests
  - [x] 1.9 Verify RLS policy for users to view their own requests
  - [x] 1.10 Test cascade delete when event is deleted
  - [x] 1.11 Test cascade delete when user is deleted

- [x] 2.0 Backend API Implementation
  - [x] 2.1 Implement `requestToJoinEvent` function with duplicate check
  - [x] 2.2 Add notification creation for organizer in `requestToJoinEvent`
  - [x] 2.3 Implement `getEventJoinRequests` function with user profile join
  - [x] 2.4 Filter `getEventJoinRequests` to only return pending requests
  - [x] 2.5 Implement `cancelJoinRequest` function with proper error handling
  - [x] 2.6 Implement `respondToJoinRequest` function for accepting requests
  - [x] 2.7 Add user to attendees table when request is accepted
  - [x] 2.8 Implement `respondToJoinRequest` function for rejecting requests
  - [x] 2.9 Add notification creation for accepted requests
  - [x] 2.10 Add notification creation for rejected requests
  - [x] 2.11 Add comprehensive error handling to all API functions
  - [x] 2.12 Add input validation (check event exists, user exists, etc.)
  - [x] 2.13 Handle edge cases (event deleted, user deleted, already attending)

- [x] 3.0 Frontend Request Management UI
  - [x] 3.1 Create state variable for userJoinRequest in event detail component
  - [x] 3.2 Implement `fetchUserJoinRequest` function to get current request status
  - [x] 3.3 Update `handleRSVP` function to handle private event requests
  - [x] 3.4 Add logic to show "Requested" button state when request is pending
  - [x] 3.5 Add logic to cancel request when "Requested" button is clicked
  - [x] 3.6 Implement immediate button state update after request submission
  - [x] 3.7 Add loading spinner during request operations
  - [x] 3.8 Add error alerts for failed request operations
  - [x] 3.9 Style button with yellow background for "Requested" state
  - [x] 3.10 Hide join button completely for event organizers
  - [x] 3.11 Add useEffect to fetch user request status on component mount

- [x] 4.0 Organizer Request Management UI
  - [x] 4.1 Create state variables for joinRequests and loadingJoinRequests
  - [x] 4.2 Implement `fetchJoinRequests` function for organizers
  - [x] 4.3 Add "Requests" tab to tab navigation (only visible to organizers)
  - [x] 4.4 Create Requests tab UI component with request list
  - [x] 4.5 Display user avatar, name, major, and request date for each request
  - [x] 4.6 Add Accept button for each request with green styling
  - [x] 4.7 Add Reject button for each request with red styling
  - [x] 4.8 Implement `handleRespondToRequest` function
  - [x] 4.9 Add badge count on Requests tab icon showing pending count
  - [x] 4.10 Add empty state UI when no pending requests
  - [x] 4.11 Add loading state while fetching requests
  - [x] 4.12 Refresh requests list after accept/reject actions
  - [x] 4.13 Refresh attendees list after accepting a request

- [x] 5.0 Real-Time Subscriptions
  - [x] 5.1 Set up Supabase real-time channel for event_join_requests table
  - [x] 5.2 Filter subscription by event_id to only receive relevant updates
  - [x] 5.3 Subscribe to INSERT events for new requests
  - [x] 5.4 Subscribe to UPDATE events for status changes
  - [x] 5.5 Subscribe to DELETE events for rejected/cancelled requests
  - [x] 5.6 Call fetchJoinRequests when new request is detected
  - [x] 5.7 Call fetchUserJoinRequest when user's request status changes
  - [x] 5.8 Set up cleanup function to unsubscribe on component unmount
  - [x] 5.9 Test real-time updates with multiple browser tabs/devices

- [x] 6.0 Notification System Integration
  - [x] 6.1 Verify notifications table exists with required fields
  - [x] 6.2 Create notification in `requestToJoinEvent` for organizer
  - [x] 6.3 Include requester name and event title in notification message
  - [x] 6.4 Set action_url to deep link to event Requests tab
  - [x] 6.5 Create notification in `respondToJoinRequest` for accepted requests
  - [x] 6.6 Create notification in `respondToJoinRequest` for rejected requests
  - [x] 6.7 Set notification type to 'event' for all join request notifications
  - [x] 6.8 Handle notification creation errors gracefully (don't fail request)
  - [x] 6.9 Test notification delivery in app
  - [x] 6.10 Verify notification deep linking works correctly

- [x] 7.0 Data Integrity and Edge Cases
  - [x] 7.1 Prevent duplicate requests in `requestToJoinEvent` (check existing)
  - [x] 7.2 Prevent requesting to join if already attending event
  - [x] 7.3 Handle case where event is deleted (cascade delete requests)
  - [x] 7.4 Handle case where user is deleted (cascade delete requests)
  - [x] 7.5 Add validation to check event exists before creating request
  - [x] 7.6 Add validation to check event is private before allowing request
  - [x] 7.7 Add validation to check user is not organizer before showing button
  - [x] 7.8 Handle network errors gracefully with user-friendly messages
  - [x] 7.9 Handle database constraint violations with clear error messages
  - [x] 7.10 Add retry logic for failed network requests

- [ ] 8.0 Testing and Validation
  - [ ] 8.1 Test user can request to join private event
  - [ ] 8.2 Test button changes to "Requested" immediately after click
  - [ ] 8.3 Test user can cancel pending request
  - [ ] 8.4 Test organizer receives notification for new request
  - [ ] 8.5 Test organizer can see requests in Requests tab
  - [ ] 8.6 Test organizer can accept request (user added to attendees)
  - [ ] 8.7 Test organizer can reject request (request deleted)
  - [ ] 8.8 Test user receives notification when accepted
  - [ ] 8.9 Test user receives notification when rejected
  - [ ] 8.10 Test real-time updates work for new requests
  - [ ] 8.11 Test real-time updates work for accepted/rejected requests
  - [ ] 8.12 Test duplicate request prevention
  - [ ] 8.13 Test organizer cannot see join button
  - [ ] 8.14 Test error handling for invalid events/users
  - [ ] 8.15 Test with multiple concurrent requests from different users

