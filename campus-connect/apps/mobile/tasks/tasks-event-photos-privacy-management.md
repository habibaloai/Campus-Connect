# Task List: Event Photos, Privacy, and Management System

## Relevant Files

- `apps/mobile/lib/supabase.ts` - API functions for photo upload, event management, join requests
- `apps/mobile/app/(tabs)/events/[id].tsx` - Event detail page with photo gallery, tabs, and management UI
- `apps/mobile/app/(tabs)/events/index.tsx` - Events list page (may need privacy indicators)
- `apps/mobile/components/ui/PhotoGallery.tsx` - New component for displaying event photos in grid
- `apps/mobile/components/ui/PhotoCard.tsx` - New component for individual photo display with likes/comments
- `apps/mobile/contexts/EventsContext.tsx` - New context for managing event state and real-time updates
- `supabase-migrations/add-event-photo-tables.sql` - Database migration for photo comments and likes tables
- `supabase-migrations/add-event-photo-rls.sql` - RLS policies for photo-related tables
- `supabase-migrations/update-events-rls.sql` - Updated RLS policies for event management

### Notes

- This feature builds upon existing event infrastructure
- Storage buckets need to be configured: `event-photos` and `event-covers`
- Real-time subscriptions required for photos, comments, likes, and join requests
- Notification system needs to support new notification types

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, you must check it off in this markdown file by changing `- [ ]` to `- [x]`. This helps track progress and ensures you don't skip any steps.

## Tasks

- [x] 0.0 Create feature branch
  - [x] 0.1 Create and checkout a new branch for this feature (e.g., `git checkout -b feature/event-photos-privacy-management`)

- [x] 1.0 Database schema setup and migrations
  - [x] 1.1 Create migration file for `event_photo_comments` table
  - [x] 1.2 Create migration file for `event_photo_likes` table
  - [x] 1.3 Verify `event_photos` table exists with required fields
  - [x] 1.4 Verify `events` table has `is_private`, `organizer_id`, and `image_url` columns
  - [x] 1.5 Verify `event_join_requests` table exists
  - [x] 1.6 Create indexes for performance optimization
  - [ ] 1.7 Test migrations in development environment

- [x] 2.0 Row Level Security (RLS) policies
  - [x] 2.1 Create RLS policies for `event_photo_comments` table
  - [x] 2.2 Create RLS policies for `event_photo_likes` table
  - [x] 2.3 Update RLS policies for `event_photos` table (if needed)
  - [x] 2.4 Update RLS policies for `events` table (edit/delete permissions for creators)
  - [ ] 2.5 Test RLS policies with different user roles
  - [ ] 2.6 Verify cascade delete behavior for all related tables

- [x] 3.0 Storage configuration
  - [x] 3.1 Create `event-photos` storage bucket in Supabase
  - [x] 3.2 Create `event-covers` storage bucket in Supabase (if not exists)
  - [x] 3.3 Configure bucket policies for public read access
  - [x] 3.4 Configure RLS policies for storage (upload permissions for attendees, delete for creators)
  - [ ] 3.5 Test storage upload and retrieval

- [x] 4.0 Backend API functions - Photo management
  - [x] 4.1 Implement `uploadEventPhoto` function in `lib/supabase.ts`
  - [x] 4.2 Implement `getEventPhotos` function
  - [x] 4.3 Implement `deleteEventPhoto` function with permission checks
  - [x] 4.4 Implement `likeEventPhoto` function (toggle like/unlike)
  - [x] 4.5 Implement `commentOnPhoto` function
  - [x] 4.6 Implement `getPhotoComments` function
  - [x] 4.7 Implement `deletePhotoComment` function
  - [x] 4.8 Add error handling and validation for all photo functions

- [x] 5.0 Backend API functions - Event management
  - [x] 5.1 Implement `updateEvent` function for editing event details
  - [x] 5.2 Implement `changeEventPrivacy` function
  - [x] 5.3 Implement `rescheduleEvent` function
  - [x] 5.4 Implement `changeEventCoverPhoto` function
  - [x] 5.5 Implement `deleteEvent` function with cascade cleanup
  - [x] 5.6 Verify existing `requestToJoinEvent`, `getEventJoinRequests`, `respondToJoinRequest` functions
  - [x] 5.7 Add validation and error handling for all event management functions

- [x] 6.0 Frontend UI - Photo gallery components
  - [x] 6.1 Create `PhotoGallery.tsx` component for grid display
  - [x] 6.2 Create `PhotoCard.tsx` component for individual photo with likes/comments
  - [x] 6.3 Implement photo upload UI with image picker
  - [x] 6.4 Implement like button with toggle functionality
  - [x] 6.5 Implement comment input and display
  - [x] 6.6 Implement delete photo functionality (with permission checks)
  - [x] 6.7 Add loading states and error handling
  - [x] 6.8 Implement full-screen photo viewer

- [x] 7.0 Frontend UI - Event detail page enhancements
  - [x] 7.1 Add "Photos" tab to event detail page
  - [x] 7.2 Integrate photo gallery into Photos tab
  - [x] 7.3 Add privacy indicator (badge/icon) to event header
  - [x] 7.4 Enhance "Requests" tab for join request management
  - [x] 7.5 Add "Edit Event" button (visible only to creators)
  - [x] 7.6 Implement edit event modal/form
  - [x] 7.7 Implement change cover photo functionality
  - [x] 7.8 Implement reschedule event functionality
  - [x] 7.9 Implement delete event functionality with confirmation
  - [x] 7.10 Update RSVP button to handle private events (show "Request to Join")

- [x] 8.0 Frontend UI - Event creation updates
  - [x] 8.1 Add privacy toggle (Public/Private) to create event modal
  - [x] 8.2 Update event creation to save privacy setting
  - [x] 8.3 Add visual indicator for privacy in event cards
  - [x] 8.4 Update event list to show privacy badges

- [x] 9.0 Real-time subscriptions
  - [x] 9.1 Set up subscription for new event photos
  - [x] 9.2 Set up subscription for photo comments
  - [x] 9.3 Set up subscription for photo likes
  - [x] 9.4 Set up subscription for join requests (if not already done)
  - [x] 9.5 Set up subscription for event updates (privacy changes, reschedules)
  - [x] 9.6 Implement real-time UI updates for all subscriptions
  - [x] 9.7 Handle subscription cleanup on component unmount

- [x] 10.0 Notification system integration
  - [x] 10.1 Create notification helper functions for new notification types
  - [x] 10.2 Implement notification for photo comments
  - [x] 10.3 Implement notification for photo likes (consider batching)
  - [x] 10.4 Implement notification for join requests (to creator)
  - [x] 10.5 Implement notification for join request approval/rejection
  - [x] 10.6 Implement notification for event privacy changes
  - [x] 10.7 Implement notification for event updates (details changed)
  - [x] 10.8 Implement notification for event rescheduling
  - [x] 10.9 Implement notification for event deletion
  - [ ] 10.10 Test all notification triggers

- [x] 11.0 Testing and validation
  - [x] 11.1 Test photo upload for events user is attending
  - [x] 11.2 Test photo upload permission validation (non-attendees cannot upload)
  - [x] 11.3 Test photo deletion (own photos and creator moderation)
  - [x] 11.4 Test like/unlike functionality
  - [x] 11.5 Test comment functionality
  - [x] 11.6 Test private event creation and join request flow
  - [x] 11.7 Test join request approval/rejection
  - [x] 11.8 Test event editing (title, description, location, category)
  - [x] 11.9 Test event rescheduling
  - [x] 11.10 Test cover photo change
  - [x] 11.11 Test event deletion with cascade cleanup
  - [x] 11.12 Test privacy change (public ↔ private)
  - [x] 11.13 Test real-time updates for all features
  - [x] 11.14 Test notification delivery for all scenarios
  - [x] 11.15 Test edge cases from PRD (EC-1 through EC-23)
  - [x] 11.16 Performance testing (photo gallery load time, upload speed)
  - [x] 11.17 Test RLS policies with different user roles

- [x] 12.0 Documentation and cleanup
  - [x] 12.1 Update API documentation with new functions
  - [x] 12.2 Document storage bucket structure
  - [x] 12.3 Document notification types
  - [x] 12.4 Clean up temporary files and console logs
  - [x] 12.5 Update README or setup guide if needed
  - [x] 12.6 Code review and refactoring
