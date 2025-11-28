# Product Requirements Document: Event Join Requests System

## Introduction/Overview

The Event Join Requests System enables private event management by allowing event organizers to control who can attend their events. When an event is marked as private, users must request permission to join, and organizers can review, accept, or reject these requests. This feature enhances event privacy, security, and gives organizers full control over their event attendees.

**Problem Solved:** Previously, all events were public and anyone could join. This created issues for exclusive events, limited-capacity gatherings, or events requiring pre-screening. The join request system solves this by implementing a permission-based access model.

**Goal:** Provide a seamless, real-time system for managing private event access requests with clear user feedback and organizer control.

## Goals

1. Enable event organizers to create private events that require approval for attendance
2. Provide users with a clear, intuitive way to request access to private events
3. Give organizers an efficient interface to review and manage join requests
4. Deliver real-time updates for both requesters and organizers
5. Ensure all actions are properly logged and users are notified of status changes
6. Support bulk operations for organizers managing multiple requests (future enhancement)

## User Stories

### As a User (Event Attendee)
- **US-1:** As a user, I want to see a "Request to Join" button on private events so I can request access
- **US-2:** As a user, I want my button to change to "Requested" immediately after clicking so I know my request was sent
- **US-3:** As a user, I want to cancel my pending request if I change my mind
- **US-4:** As a user, I want to receive a notification when my request is accepted or rejected
- **US-5:** As a user, I want to automatically be added to the event when my request is accepted

### As an Event Organizer
- **US-6:** As an organizer, I want to see all pending join requests in one place
- **US-7:** As an organizer, I want to see a badge count of pending requests so I know how many need attention
- **US-8:** As an organizer, I want to see user information (name, avatar, major) for each request to make informed decisions
- **US-9:** As an organizer, I want to accept or reject requests with a single click
- **US-10:** As an organizer, I want to receive notifications when new requests come in
- **US-11:** As an organizer, I want to see requests update in real-time without refreshing (future enhancement: bulk accept/reject)

## Functional Requirements

### Request Management

1. **FR-1:** The system must allow users to request to join private events by clicking a "Join Event" button
2. **FR-2:** The system must immediately update the button text to "Requested" after a request is submitted
3. **FR-3:** The system must store all join requests in the `event_join_requests` database table with status 'pending'
4. **FR-4:** The system must prevent duplicate requests (if a user already has a pending request, show existing state)
5. **FR-5:** The system must allow users to cancel their pending request by clicking the "Requested" button again
6. **FR-6:** The system must delete the request from the database when a user cancels

### Organizer View

7. **FR-7:** The system must display a "Requests" tab only to event organizers
8. **FR-8:** The system must show a badge with the count of pending requests on the Requests tab
9. **FR-9:** The system must list all pending join requests for the event
10. **FR-10:** The system must display the following information for each request:
    - User's full name
    - User's avatar/profile picture
    - User's major (if available)
    - Request submission date/time
11. **FR-11:** The system must update the requests list in real-time when new requests arrive (using Supabase real-time subscriptions)
12. **FR-12:** The system must show a loading state while fetching requests

### Accept/Reject Functionality

13. **FR-13:** The system must provide "Accept" and "Reject" buttons for each pending request
14. **FR-14:** When an organizer accepts a request:
    - Update the request status to 'accepted' in the database
    - Automatically add the user to the `event_attendees` table
    - Remove the request from the pending list (it's no longer 'pending')
    - Send a notification to the user
    - Refresh the attendees list
15. **FR-15:** When an organizer rejects a request:
    - Delete the request from the `event_join_requests` table
    - Send a notification to the user
    - Remove the request from the pending list
16. **FR-16:** The system must refresh the event attendee count after accepting a request
17. **FR-17:** The system must show success/error messages after accept/reject actions

### Notifications

18. **FR-18:** The system must send a notification to the event organizer when a new join request is submitted
19. **FR-19:** The notification must include:
    - Requester's name
    - Event title
    - Link to the event's Requests tab
20. **FR-20:** The system must send a notification to the user when their request is accepted
21. **FR-21:** The system must send a notification to the user when their request is rejected
22. **FR-22:** All notifications must be stored in the `notifications` table with appropriate metadata

### UI/UX Requirements

23. **FR-23:** The "Join Event" button must be hidden for event organizers (they're automatically attending)
24. **FR-24:** The button must show different states:
    - "Join Event" (default, blue background)
    - "Requested" (pending request, yellow background)
    - "Leave Event" (if already attending)
25. **FR-25:** The button must be disabled while a request is being processed (show loading spinner)
26. **FR-26:** The Requests tab must only be visible to event organizers
27. **FR-27:** The Requests tab must show an empty state when there are no pending requests

### Database & Data Integrity

28. **FR-28:** The system must ensure referential integrity (requests reference valid events and users)
29. **FR-29:** The system must prevent users from requesting to join events they're already attending
30. **FR-30:** The system must handle edge cases (event deleted, user deleted, etc.) gracefully

## Non-Goals (Out of Scope)

1. **NG-1:** Bulk accept/reject operations (planned for future enhancement - see Future Enhancements)
2. **NG-2:** Request expiration or auto-rejection after a time period
3. **NG-3:** Request comments or messages from organizers to requesters
4. **NG-4:** Request priority or ranking system
5. **NG-5:** Ability for organizers to invite users directly (separate feature)
6. **NG-6:** Request history or audit log beyond current pending/accepted/rejected states
7. **NG-7:** Email notifications (only in-app notifications are included)

## Design Considerations

### UI Components

- **Button States:** Use color coding for button states:
  - Blue (`#14b8a6`): Default "Join Event" state
  - Yellow (`#fbbf24`): "Requested" state
  - Gray: "Leave Event" state (if already attending)

- **Requests Tab Layout:**
  - Card-based layout for each request
  - Avatar on the left, user info in the center, action buttons on the right
  - Clear visual separation between requests
  - Responsive design for mobile devices

- **Badge Design:**
  - Red badge with white text
  - Positioned on the Requests tab icon
  - Shows count of pending requests
  - Hidden when count is 0

### User Experience Flow

1. User views private event → Sees "Join Event" button
2. User clicks button → Button immediately changes to "Requested" (yellow)
3. Organizer receives notification → Opens event → Sees Requests tab with badge
4. Organizer reviews request → Clicks Accept or Reject
5. User receives notification → If accepted, can now access event features

## Technical Considerations

### Database Schema

**Table: `event_join_requests`**
```sql
CREATE TABLE event_join_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);
```

**Key Relationships:**
- `event_id` → `events.id` (cascade delete if event is deleted)
- `user_id` → `profiles.id` (cascade delete if user is deleted)
- Unique constraint prevents duplicate requests

**Indexes:**
- `idx_event_join_requests_event_id` on `event_id`
- `idx_event_join_requests_user_id` on `user_id`
- `idx_event_join_requests_status` on `status`

### Row Level Security (RLS) Policies

1. **Users can create requests:** Authenticated users can insert requests where `user_id = auth.uid()`
2. **Organizers can view requests:** Organizers can view all requests for their events
3. **Users can view their own requests:** Users can view their own request status
4. **Organizers can update/delete requests:** Organizers can accept/reject requests for their events

### API Functions

**`requestToJoinEvent(eventId, userId)`**
- Checks for existing request
- Creates new request with status 'pending'
- Sends notification to organizer
- Returns request data

**`getEventJoinRequests(eventId)`**
- Fetches all pending requests for an event
- Includes user profile data (name, avatar, major)
- Only returns requests with status 'pending'
- Ordered by creation date (newest first)

**`cancelJoinRequest(eventId, userId)`**
- Deletes pending request from database
- Used when user cancels their request

**`respondToJoinRequest(requestId, accept, eventId, userId)`**
- If accept: Updates status to 'accepted', adds user to attendees, sends notification
- If reject: Deletes request, sends notification

### Real-Time Subscriptions

- Uses Supabase real-time channels
- Subscribes to `event_join_requests` table changes
- Filters by `event_id` to only receive relevant updates
- Automatically refreshes UI when requests are added/updated/deleted

### Notification System

- Notifications stored in `notifications` table
- Type: 'event'
- Includes `action_url` for deep linking to event
- Read/unread status tracking

## Success Metrics

1. **Adoption Rate:** % of private events that receive at least one join request
2. **Response Time:** Average time for organizers to accept/reject requests
3. **User Satisfaction:** User feedback on request process clarity
4. **Notification Engagement:** % of users who open notifications about request status
5. **Error Rate:** % of failed requests (database errors, network issues)
6. **Request Completion Rate:** % of requests that result in acceptance (vs. rejection/cancellation)

## Future Enhancements (High Priority)

### Bulk Operations
- **FE-1:** Allow organizers to select multiple requests and accept/reject them in bulk
- **FE-2:** "Accept All" button for events with many pending requests
- **FE-3:** Filter and sort options for requests (by date, major, etc.)

### Enhanced Request Management
- **FE-4:** Request expiration (auto-reject after X days if no response)
- **FE-5:** Request reminders for organizers (notify if request pending > 24 hours)
- **FE-6:** Request history view (show accepted/rejected requests, not just pending)

### Communication Features
- **FE-7:** Allow organizers to send messages to requesters before accepting/rejecting
- **FE-8:** Allow requesters to add a note/message with their request

### Analytics
- **FE-9:** Dashboard showing request statistics (acceptance rate, average response time)
- **FE-10:** Export request data for event organizers

## Open Questions

1. Should there be a limit on the number of pending requests per event?
2. Should organizers be able to set custom acceptance criteria or auto-accept rules?
3. Should there be a way for organizers to pre-approve certain users (whitelist)?
4. Should rejected users be able to request again, or should there be a cooldown period?
5. Should there be different request types (e.g., "Waitlist" vs. "Join Request")?

## Implementation Notes

- The feature is currently implemented and functional
- Real-time subscriptions are active for live updates
- All database tables and RLS policies are in place
- Notification system is integrated
- Future enhancements (bulk operations) are planned for high-priority implementation

## Related Documentation

- Database schema: `ADD_EVENT_JOIN_REQUESTS_TABLE.sql`
- Complete event setup: `COMPLETE_EVENT_SETUP.sql`
- API implementation: `apps/mobile/lib/supabase.ts` (functions: `requestToJoinEvent`, `getEventJoinRequests`, `cancelJoinRequest`, `respondToJoinRequest`)
- UI implementation: `apps/mobile/app/(tabs)/events/[id].tsx`

