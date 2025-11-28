# Product Requirements Document: Event Photos, Privacy, and Management System

## Introduction/Overview

This PRD covers three interconnected features that enhance the event system: **Event Photos**, **Event Creation & Privacy**, and **Event Management**. These features enable users to create rich, interactive event experiences with photo sharing, privacy controls, and comprehensive event management capabilities.

**Problem Solved:** 
- **Event Photos:** Users currently have no way to share photos from events they attend, limiting social engagement and event documentation.
- **Event Privacy:** All events are currently public, preventing organizers from creating exclusive or controlled-access events.
- **Event Management:** Event creators lack the ability to manage their events after creation, making it difficult to update details, handle changes, or maintain control.

**Goal:** Provide a complete event management system that allows users to create, manage, and document events with photo sharing, privacy controls, and full lifecycle management.

## Goals

1. Enable users to upload and share unlimited photos for events they're attending
2. Allow photos to receive comments and likes to foster engagement
3. Provide event creators with moderation capabilities (delete any photo in their event)
4. Enable users to create events with public or private privacy settings
5. Implement a join request system for private events with approval workflow
6. Give event creators full control to edit, reschedule, and manage their events
7. Ensure all actions trigger appropriate notifications for user awareness
8. Maintain data integrity with proper cascade deletion when events are removed

## User Stories

### As an Event Attendee (Photo Features)

- **US-1:** As an event attendee, I want to upload photos to events I'm attending so I can share my experience with others
- **US-2:** As an event attendee, I want to see who uploaded each photo and when it was uploaded so I can understand the context
- **US-3:** As an event attendee, I want to like photos from events I'm attending to show appreciation
- **US-4:** As an event attendee, I want to comment on photos to engage in discussions about the event
- **US-5:** As a photo uploader, I want to delete my own photos if I change my mind or made a mistake
- **US-6:** As an event attendee, I want to receive notifications when someone comments on or likes my photos

### As an Event Creator (Privacy & Management)

- **US-7:** As an event creator, I want to specify whether my event is public or private when creating it
- **US-8:** As an event creator, I want to change the privacy setting of my event at any time to adapt to changing circumstances
- **US-9:** As a private event creator, I want to receive join requests from users who want to attend
- **US-10:** As a private event creator, I want to approve or decline join requests to control who attends my event
- **US-11:** As an event creator, I want to edit event details (title, description, location, category) after creation
- **US-12:** As an event creator, I want to change the cover photo of my event to update its visual representation
- **US-13:** As an event creator, I want to reschedule my event (change date and/or time) when plans change
- **US-14:** As an event creator, I want to delete my event if it's cancelled or no longer needed
- **US-15:** As an event creator, I want to delete any photo in my event to moderate inappropriate content
- **US-16:** As an event creator, I want to receive notifications when users request to join my private event

### As a User Requesting to Join Private Events

- **US-17:** As a user, I want to see which events are private so I know I need to request access
- **US-18:** As a user, I want to send a join request to private events I'm interested in attending
- **US-19:** As a user, I want to receive notifications when my join request is approved or declined
- **US-20:** As a user, I want to automatically be added to the event when my request is approved
- **US-21:** As a user, I want to see "Request to Join" button for private events before sending a request (both on event list and detail page)
- **US-22:** As a user, I want to see "Request Pending" status both on the event list and event detail page after sending a request
- **US-23:** As an event organizer, I should never see join/request buttons for my own events

## Functional Requirements

### Event Photos

#### Photo Upload

1. **FR-1:** The system must allow users who are attending an event to upload photos to that event
2. **FR-2:** The system must allow unlimited photo uploads per user per event (no restrictions)
3. **FR-3:** The system must store photos in the `event_photos` table with the following fields:
   - `id` (UUID, primary key)
   - `event_id` (UUID, foreign key to events)
   - `user_id` (UUID, foreign key to profiles)
   - `photo_url` (TEXT, required - URL to stored image)
   - `created_at` (TIMESTAMPTZ, auto-generated)
4. **FR-4:** The system must validate that the user is an attendee of the event before allowing photo upload
5. **FR-5:** The system must upload photos to Supabase Storage in the appropriate bucket/folder
6. **FR-6:** The system must display a loading state during photo upload
7. **FR-7:** The system must show success/error messages after upload completion

#### Photo Display

8. **FR-8:** The system must display all photos for an event in a gallery or grid view
9. **FR-9:** The system must show the following information for each photo:
   - The photo image
   - Uploader's name
   - Uploader's avatar/profile picture
   - Upload timestamp (formatted as relative time, e.g., "2 hours ago" or absolute date/time)
10. **FR-10:** The system must only show photos to users who are attending the event
11. **FR-11:** The system must order photos by creation date (newest first by default)
12. **FR-12:** The system must support viewing photos in full-screen or detail view

#### Photo Comments

13. **FR-13:** The system must allow event attendees to comment on photos
14. **FR-14:** The system must store comments in the `event_photo_comments` table with:
   - `id` (UUID, primary key)
   - `photo_id` (UUID, foreign key to event_photos)
   - `user_id` (UUID, foreign key to profiles)
   - `content` (TEXT, required)
   - `created_at` (TIMESTAMPTZ, auto-generated)
15. **FR-15:** The system must display comments below each photo with:
   - Commenter's name and avatar
   - Comment content
   - Comment timestamp
16. **FR-16:** The system must allow users to delete their own comments
17. **FR-17:** The system must send a notification to the photo uploader when someone comments on their photo
18. **FR-18:** The system must display comment count for each photo

#### Photo Likes

19. **FR-19:** The system must allow event attendees to like photos
20. **FR-20:** The system must store likes in the `event_photo_likes` table with:
   - `id` (UUID, primary key)
   - `photo_id` (UUID, foreign key to event_photos)
   - `user_id` (UUID, foreign key to profiles)
   - `created_at` (TIMESTAMPTZ, auto-generated)
   - Unique constraint on (photo_id, user_id) to prevent duplicate likes
21. **FR-21:** The system must display the like count for each photo
22. **FR-22:** The system must show which users have liked a photo (optional: show first 3-5 names)
23. **FR-23:** The system must allow users to unlike a photo by clicking the like button again
24. **FR-24:** The system must send a notification to the photo uploader when someone likes their photo (optional: batch notifications to avoid spam)

#### Photo Deletion

25. **FR-25:** The system must allow photo uploaders to delete their own photos
26. **FR-26:** The system must allow event creators to delete any photo in their event (moderation capability)
27. **FR-27:** When a photo is deleted, the system must:
   - Delete the photo record from the database
   - Delete the image file from storage
   - Cascade delete all associated comments and likes
28. **FR-28:** The system must show a confirmation dialog before deleting a photo
29. **FR-29:** The system must display appropriate success/error messages after deletion

### Event Creation & Privacy

#### Event Creation

30. **FR-30:** The system must allow authenticated users to create events
31. **FR-31:** The system must require the following fields when creating an event:
   - Title (required)
   - Date (required)
   - Time (required)
   - Location (required)
   - Description (optional)
   - Category (required, from predefined list)
   - Max attendees (optional, default 100)
   - Cover photo/image (optional)
   - Privacy setting: Public or Private (required, default: Public)
32. **FR-32:** The system must automatically set the `organizer_id` field to the current user's ID when creating an event
33. **FR-33:** The system must automatically add the event creator as an attendee when the event is created
34. **FR-34:** The system must store the privacy setting in the `is_private` boolean field in the events table
35. **FR-35:** The system must display a clear indicator (badge, icon, or text) showing whether an event is public or private

#### Privacy Settings

36. **FR-36:** The system must allow event creators to change the privacy setting (public ↔ private) at any time, even after the event is created
37. **FR-37:** When an event is changed from public to private:
   - The system must notify all current attendees about the privacy change
   - The system must prevent new direct joins (users must request to join)
   - Existing attendees remain as attendees
38. **FR-38:** When an event is changed from private to public:
   - The system must notify all pending join request users that they can now join directly
   - The system must allow anyone to join without approval
   - Pending join requests can be automatically approved or remain pending (clarify with product team)

#### Private Event Join Requests

39. **FR-39:** For private events, the system must show a "Request to Join" button instead of a "Join Event" button to non-attendees
40. **FR-40:** The system must allow users to send join requests to private events
41. **FR-41:** The system must store join requests in the `event_join_requests` table with status 'pending'
42. **FR-42:** The system must prevent duplicate join requests (if a user already has a pending request, show existing state)
43. **FR-43:** The system must send a notification to the event creator when a new join request is submitted
44. **FR-44:** The system must display all pending join requests to the event creator in a dedicated "Requests" tab or section
45. **FR-45:** The system must show a badge count of pending requests on the event page for creators
46. **FR-46:** The system must allow event creators to approve join requests, which:
   - Updates the request status to 'accepted'
   - Automatically adds the user to the `event_attendees` table
   - Sends a notification to the user
   - Removes the request from the pending list
47. **FR-47:** The system must allow event creators to decline join requests, which:
   - Deletes the request from the database
   - Sends a notification to the user
   - Removes the request from the pending list
48. **FR-48:** The system must allow users to cancel their own pending join requests
49. **FR-49:** The system must update the attendee count after approving a request

### Event Management

#### Edit Event Details

50. **FR-50:** The system must allow event creators to edit the following event details:
   - Title
   - Description
   - Location
   - Category
   - Max attendees
51. **FR-51:** The system must provide an "Edit Event" button or option visible only to event creators
52. **FR-52:** The system must validate all required fields when editing
53. **FR-53:** The system must show a confirmation dialog or save button to confirm changes
54. **FR-54:** The system must update the `updated_at` timestamp when event details are modified
55. **FR-55:** The system must notify all attendees when significant event details change (title, date, time, location)

#### Change Cover Photo

56. **FR-56:** The system must allow event creators to change the event cover photo at any time
57. **FR-57:** The system must upload the new cover photo to Supabase Storage
58. **FR-58:** The system must delete the old cover photo from storage when replaced
59. **FR-59:** The system must update the `image_url` field in the events table
60. **FR-60:** The system must display the new cover photo immediately after upload

#### Reschedule Event

61. **FR-61:** The system must allow event creators to reschedule events by changing the date and/or time
62. **FR-62:** The system must validate that the new date/time is in the future (or allow past dates if needed - clarify)
63. **FR-63:** The system must notify all attendees when an event is rescheduled
64. **FR-64:** The notification must include:
   - The old date/time
   - The new date/time
   - A link to view the event
65. **FR-65:** The system must update both the `date` and `time` fields in the events table

#### Delete Event

66. **FR-66:** The system must allow event creators to delete their events
67. **FR-67:** The system must show a confirmation dialog before deleting an event, warning about permanent deletion
68. **FR-68:** When an event is deleted, the system must permanently delete:
   - The event record from the `events` table
   - All associated event photos (cascade delete)
   - All photo comments (cascade delete)
   - All photo likes (cascade delete)
   - All event attendees records (cascade delete)
   - All join requests (cascade delete)
   - The cover photo from storage
   - All photo files from storage
69. **FR-69:** The system must notify all attendees when an event is deleted
70. **FR-70:** The system must prevent deletion if the event has already occurred (optional: clarify if past events can be deleted)
71. **FR-71:** The system must display appropriate success/error messages after deletion

### Notifications

72. **FR-72:** The system must send notifications for the following events:
   - New join request (to event creator)
   - Join request approved (to requester)
   - Join request declined (to requester)
   - Photo comment (to photo uploader)
   - Photo like (to photo uploader)
   - Event privacy changed (to all attendees)
   - Event details changed (to all attendees)
   - Event rescheduled (to all attendees)
   - Event deleted (to all attendees)
73. **FR-73:** All notifications must be stored in the `notifications` table with:
   - `id` (UUID, primary key)
   - `user_id` (UUID, foreign key to profiles)
   - `type` (TEXT, e.g., 'event', 'photo_comment', 'photo_like')
   - `title` (TEXT, notification title)
   - `message` (TEXT, notification message)
   - `action_url` (TEXT, optional - link to relevant page)
   - `read` (BOOLEAN, default false)
   - `created_at` (TIMESTAMPTZ, auto-generated)
74. **FR-74:** The system must mark notifications as unread when created
75. **FR-75:** The system must support real-time notification delivery using Supabase real-time subscriptions

### Database & Data Integrity

76. **FR-76:** The system must enforce referential integrity for all foreign key relationships
77. **FR-77:** The system must use CASCADE DELETE for all dependent records when an event is deleted
78. **FR-78:** The system must use CASCADE DELETE for all comments and likes when a photo is deleted
79. **FR-79:** The system must prevent users from performing actions on events they don't have permission for
80. **FR-80:** The system must validate that users are authenticated before allowing any create/edit/delete operations

## Non-Functional Requirements

### Performance

1. **NFR-1:** Photo uploads should complete within 5 seconds for images up to 5MB
2. **NFR-2:** Photo gallery should load and display within 2 seconds for events with up to 50 photos
3. **NFR-3:** Event list should load within 1 second
4. **NFR-4:** Real-time updates (notifications, new photos) should appear within 1 second

### Security

5. **NFR-5:** All photo uploads must be validated for file type (images only: JPG, PNG, GIF, WebP)
6. **NFR-6:** All photo uploads must be validated for file size (recommended max: 10MB per photo)
7. **NFR-7:** Row Level Security (RLS) policies must be enforced for all database operations
8. **NFR-8:** Only authenticated users can create events
9. **NFR-9:** Only event creators can edit/delete their events
10. **NFR-10:** Only event attendees can upload photos and interact with photos
11. **NFR-11:** Only event creators can moderate photos (delete any photo)

### Usability

12. **NFR-12:** The UI must clearly distinguish between public and private events
13. **NFR-13:** Photo upload must support drag-and-drop or file picker
14. **NFR-14:** Error messages must be clear and actionable
15. **NFR-15:** Loading states must be shown for all async operations
16. **NFR-16:** The interface must be responsive and work on mobile devices

### Scalability

17. **NFR-17:** The system must handle events with hundreds of photos
18. **NFR-18:** The system must support pagination for photo galleries in large events
19. **NFR-19:** The system must efficiently handle storage for thousands of event photos

## Non-Goals (Out of Scope)

1. **NG-1:** Photo editing features (filters, cropping, etc.) - users should edit photos before upload
2. **NG-2:** Photo albums or organization within events
3. **NG-3:** Photo tagging or mentions
4. **NG-4:** Photo sharing outside the app (social media integration)
5. **NG-5:** Bulk photo upload (users upload one at a time)
6. **NG-6:** Photo moderation by admins (only event creators can moderate)
7. **NG-7:** Event templates or recurring events
8. **NG-8:** Event co-organizers or multiple creators
9. **NG-9:** Event invitations (separate from join requests)
10. **NG-10:** Event waitlists (separate feature)
11. **NG-11:** Event analytics or reporting dashboard
12. **NG-12:** Photo download or export functionality
13. **NG-13:** Video uploads (photos only)
14. **NG-14:** Photo compression or optimization (handled by storage service)
15. **NG-15:** Email notifications (in-app notifications only)

## Design Considerations

### UI Components

#### Photo Gallery
- Grid layout with responsive columns (2-3 columns on mobile, 4-5 on desktop)
- Lazy loading for performance
- Click to view full-size photo
- Like and comment buttons visible on hover or below photo
- Upload button prominently displayed for attendees

#### Event Privacy Indicator
- Badge or icon showing "Public" or "Private"
- Color coding: Green for public, Orange/Red for private
- Visible on event cards and event detail pages

#### Join Request Interface
- "Request to Join" button for private events (replaces "Join Event")
- Button state changes to "Requested" after submission
- Requests tab/section for event creators with list of pending requests
- Badge count showing number of pending requests

#### Event Management
- "Edit Event" button visible only to creators
- Modal or separate page for editing event details
- Confirmation dialogs for destructive actions (delete, reschedule)
- Clear visual hierarchy showing editable fields

### User Experience Flow

#### Photo Upload Flow
1. User attends event → Sees "Upload Photo" button
2. User selects photo → System validates and uploads
3. Photo appears in gallery → Other attendees can see, like, comment
4. Uploader receives notifications for interactions

#### Private Event Join Flow
1. User sees private event → Sees "Request to Join" button
2. User clicks button → Request sent, button changes to "Requested"
3. Creator receives notification → Opens event, sees request in Requests tab
4. Creator approves/rejects → User receives notification
5. If approved → User automatically added as attendee

#### Event Management Flow
1. Creator opens their event → Sees "Edit Event" or management options
2. Creator makes changes → Saves changes
3. System validates → Updates database
4. Attendees receive notifications about significant changes

## Technical Considerations

### Database Schema

#### New Tables Required

**`event_photo_comments`**
```sql
CREATE TABLE event_photo_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  photo_id UUID REFERENCES event_photos(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_event_photo_comments_photo_id ON event_photo_comments(photo_id);
CREATE INDEX idx_event_photo_comments_user_id ON event_photo_comments(user_id);
```

**`event_photo_likes`**
```sql
CREATE TABLE event_photo_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  photo_id UUID REFERENCES event_photos(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(photo_id, user_id)
);

CREATE INDEX idx_event_photo_likes_photo_id ON event_photo_likes(photo_id);
CREATE INDEX idx_event_photo_likes_user_id ON event_photo_likes(user_id);
```

#### Existing Tables to Modify

**`events` table** - Already has:
- `is_private` (BOOLEAN) - for privacy setting
- `organizer_id` (UUID) - for tracking creator
- `image_url` (TEXT) - for cover photo

**`event_photos` table** - Already exists with:
- `id`, `event_id`, `user_id`, `photo_url`, `description`, `created_at`

**`event_join_requests` table** - Already exists (from previous PRD)

### Row Level Security (RLS) Policies

#### Event Photos
- **View:** Users can view photos for events they're attending
- **Insert:** Users can upload photos to events they're attending
- **Delete:** Users can delete their own photos OR event creators can delete any photo in their event

#### Photo Comments
- **View:** Users can view comments on photos for events they're attending
- **Insert:** Users can comment on photos for events they're attending
- **Delete:** Users can delete their own comments

#### Photo Likes
- **View:** Users can view likes on photos for events they're attending
- **Insert:** Users can like photos for events they're attending
- **Delete:** Users can unlike (delete their like) from photos

#### Events
- **Update:** Only event creators (organizer_id = auth.uid()) can update their events
- **Delete:** Only event creators can delete their events

### Storage Considerations

- Photos should be stored in Supabase Storage
- Recommended bucket structure: `event-photos/{event_id}/{photo_id}.{ext}`
- Cover photos: `event-covers/{event_id}.{ext}`
- Implement cleanup function to delete orphaned files
- Consider image optimization/compression at upload time

### API Functions

**Photo Management:**
- `uploadEventPhoto(eventId, file)` - Upload photo to event
- `getEventPhotos(eventId)` - Get all photos for an event
- `deleteEventPhoto(photoId, isCreator)` - Delete photo (with permission check)
- `likeEventPhoto(photoId)` - Like/unlike a photo
- `commentOnPhoto(photoId, content)` - Add comment to photo
- `getPhotoComments(photoId)` - Get comments for a photo
- `deletePhotoComment(commentId)` - Delete own comment

**Event Management:**
- `createEvent(eventData)` - Create new event with privacy setting
- `updateEvent(eventId, updates)` - Update event details
- `changeEventPrivacy(eventId, isPrivate)` - Change privacy setting
- `rescheduleEvent(eventId, newDate, newTime)` - Reschedule event
- `changeEventCoverPhoto(eventId, file)` - Update cover photo
- `deleteEvent(eventId)` - Delete event and all associated data

**Join Requests:**
- `requestToJoinEvent(eventId)` - Send join request (already exists)
- `getEventJoinRequests(eventId)` - Get pending requests (already exists)
- `respondToJoinRequest(requestId, accept)` - Approve/reject (already exists)

### Real-Time Subscriptions

- Subscribe to `event_photos` table for new photos
- Subscribe to `event_photo_comments` for new comments
- Subscribe to `event_photo_likes` for new likes
- Subscribe to `event_join_requests` for new requests
- Subscribe to `events` table for event updates (privacy changes, reschedules)
- Subscribe to `notifications` table for user notifications

### Notification System

- Integrate with existing notification system
- Notification types:
  - `event_join_request` - New join request
  - `event_join_approved` - Request approved
  - `event_join_rejected` - Request rejected
  - `photo_comment` - Comment on photo
  - `photo_like` - Like on photo
  - `event_privacy_changed` - Privacy setting changed
  - `event_updated` - Event details changed
  - `event_rescheduled` - Event rescheduled
  - `event_deleted` - Event deleted

## Success Metrics

1. **Photo Engagement:**
   - Average photos per event
   - Average likes per photo
   - Average comments per photo
   - Photo upload success rate

2. **Private Event Adoption:**
   - Percentage of events created as private
   - Average join requests per private event
   - Join request approval rate
   - Time to approve/reject requests

3. **Event Management Usage:**
   - Percentage of events that are edited after creation
   - Frequency of event rescheduling
   - Event deletion rate

4. **User Engagement:**
   - Percentage of attendees who upload photos
   - Notification open rate
   - User retention for events with photos vs. without

5. **System Performance:**
   - Photo upload success rate
   - Average photo load time
   - Error rate for all operations

## Edge Cases

### Photo-Related Edge Cases

1. **EC-1:** User uploads photo but loses internet connection mid-upload
   - **Solution:** Show error message, allow retry, don't create partial record

2. **EC-2:** User deletes photo while others are viewing it
   - **Solution:** Real-time update removes photo from all viewers' screens

3. **EC-3:** User leaves event after uploading photos
   - **Solution:** Photos remain visible to remaining attendees, uploader can still delete their photos

4. **EC-4:** Multiple users try to delete the same photo simultaneously
   - **Solution:** Database constraints prevent duplicate deletions, first deletion succeeds

5. **EC-5:** Photo upload fails due to storage quota exceeded
   - **Solution:** Show clear error message about storage limit

6. **EC-6:** User tries to upload non-image file
   - **Solution:** Validate file type before upload, show error message

7. **EC-7:** Photo file is corrupted or unreadable
   - **Solution:** Validate file integrity, show error if file cannot be processed

### Privacy & Join Request Edge Cases

8. **EC-8:** Event creator changes privacy from private to public while requests are pending
   - **Solution:** Notify pending requesters, allow them to join directly, optionally auto-approve requests

9. **EC-9:** User sends join request, then event creator changes event to public
   - **Solution:** Notify user, allow direct join, remove pending request

10. **EC-10:** Event creator deletes event while join requests are pending
    - **Solution:** Cascade delete all requests, notify requesters that event was cancelled

11. **EC-11:** User tries to join private event they were already approved for
    - **Solution:** Check if user is already an attendee, show "Already Attending" state

12. **EC-12:** Event creator tries to request to join their own private event
    - **Solution:** API validation prevents this with error "You cannot request to join your own event", and UI hides join/request buttons for organizers. Creator is automatically an attendee when event is created.

### Event Management Edge Cases

13. **EC-13:** Event creator tries to reschedule event to past date
    - **Solution:** Validate date is in future (or allow if business rules permit), show warning

14. **EC-14:** Event creator deletes event that has many photos and attendees
    - **Solution:** Show confirmation with count of items to be deleted, proceed with cascade deletion

15. **EC-15:** Multiple users try to edit event simultaneously
    - **Solution:** Last write wins, or implement optimistic locking with conflict resolution

16. **EC-16:** Event creator changes cover photo but upload fails
    - **Solution:** Keep old cover photo, show error message, allow retry

17. **EC-17:** Event is deleted while users are viewing it
    - **Solution:** Real-time update shows "Event Deleted" message, redirect to events list

18. **EC-18:** User tries to edit event they didn't create
    - **Solution:** RLS policies prevent update, show "Unauthorized" error

19. **EC-19:** Event creator account is deleted
    - **Solution:** Set organizer_id to NULL (if ON DELETE SET NULL) or handle orphaned events per business rules

20. **EC-20:** Event has reached max attendees, then creator increases max_attendees
    - **Solution:** Allow new joins/requests up to new limit

### Notification Edge Cases

21. **EC-21:** User receives notification for deleted event
    - **Solution:** Check if event exists before showing notification, or show "Event no longer available"

22. **EC-22:** User receives multiple notifications for same action (e.g., batch photo likes)
    - **Solution:** Batch notifications or debounce to avoid spam

23. **EC-23:** Notification is sent but user has disabled notifications
    - **Solution:** Store notification but don't send push notification, show in-app only

## Open Questions

1. Should there be a file size limit for photo uploads? (Recommended: 10MB)
2. Should photo likes trigger individual notifications or batched notifications?
3. When an event privacy changes from private to public, should pending join requests be auto-approved?
4. Should past events be editable, or should editing be restricted to future events?
5. Should event creators be able to transfer event ownership to another user?
6. Should there be a limit on comment length for photo comments?
7. Should photo comments support replies/nested comments, or only top-level comments?
8. Should event deletion be allowed for events that have already occurred?
9. Should there be a grace period for event deletion (e.g., can undo within 24 hours)?
10. Should event rescheduling allow changing to past dates, or only future dates?
11. Should cover photo changes trigger notifications to attendees?
12. Should there be moderation tools for photo comments (e.g., event creator can delete comments)?

## Implementation Notes

- This PRD builds upon existing infrastructure:
  - `event_photos` table already exists
  - `event_join_requests` table already exists (from previous feature)
  - `events` table already has `is_private` and `organizer_id` columns
- New tables needed: `event_photo_comments`, `event_photo_likes`
- Storage buckets need to be configured for event photos and cover photos
- RLS policies need to be updated/created for new tables
- Real-time subscriptions need to be set up for all new features
- Notification system needs to support new notification types

## Related Documentation

- Previous PRD: `tasks/prd-event-join-requests.md` (Join Request System)
- Database migrations:
  - `ADD_EVENT_PHOTOS_TABLE.sql`
  - `ADD_EVENT_COLUMNS.sql`
  - `COMPLETE_EVENT_SETUP.sql`
  - `EVENT_FEATURES_MIGRATION.sql`
- Storage setup: `EVENT_IMAGES_SETUP_GUIDE.md`, `STORAGE_SETUP.md`

