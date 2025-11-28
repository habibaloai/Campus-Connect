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

- [ ] 0.0 Create feature branch
  - [ ] 0.1 Create and checkout a new branch for this feature (e.g., `git checkout -b feature/event-photos-privacy-management`)

- [ ] 1.0 Database schema setup and migrations
  - [ ] 1.1 Create migration file for `event_photo_comments` table
  - [ ] 1.2 Create migration file for `event_photo_likes` table
  - [ ] 1.3 Verify `event_photos` table exists with required fields
  - [ ] 1.4 Verify `events` table has `is_private`, `organizer_id`, and `image_url` columns
  - [ ] 1.5 Verify `event_join_requests` table exists
  - [ ] 1.6 Create indexes for performance optimization
  - [ ] 1.7 Test migrations in development environment

- [ ] 2.0 Row Level Security (RLS) policies
  - [ ] 2.1 Create RLS policies for `event_photo_comments` table
  - [ ] 2.2 Create RLS policies for `event_photo_likes` table
  - [ ] 2.3 Update RLS policies for `event_photos` table (if needed)
  - [ ] 2.4 Update RLS policies for `events` table (edit/delete permissions for creators)
  - [ ] 2.5 Test RLS policies with different user roles
  - [ ] 2.6 Verify cascade delete behavior for all related tables

- [ ] 3.0 Storage configuration
  - [ ] 3.1 Create `event-photos` storage bucket in Supabase
  - [ ] 3.2 Create `event-covers` storage bucket in Supabase (if not exists)
  - [ ] 3.3 Configure bucket policies for public read access
  - [ ] 3.4 Configure RLS policies for storage (upload permissions for attendees, delete for creators)
  - [ ] 3.5 Test storage upload and retrieval

- [ ] 4.0 Backend API functions - Photo management
  - [ ] 4.1 Implement `uploadEventPhoto` function in `lib/supabase.ts`
  - [ ] 4.2 Implement `getEventPhotos` function
  - [ ] 4.3 Implement `deleteEventPhoto` function with permission checks
  - [ ] 4.4 Implement `likeEventPhoto` function (toggle like/unlike)
  - [ ] 4.5 Implement `commentOnPhoto` function
  - [ ] 4.6 Implement `getPhotoComments` function
  - [ ] 4.7 Implement `deletePhotoComment` function
  - [ ] 4.8 Add error handling and validation for all photo functions

- [ ] 5.0 Backend API functions - Event management
  - [ ] 5.1 Implement `updateEvent` function for editing event details
  - [ ] 5.2 Implement `changeEventPrivacy` function
  - [ ] 5.3 Implement `rescheduleEvent` function
  - [ ] 5.4 Implement `changeEventCoverPhoto` function
  - [ ] 5.5 Implement `deleteEvent` function with cascade cleanup
  - [ ] 5.6 Verify existing `requestToJoinEvent`, `getEventJoinRequests`, `respondToJoinRequest` functions
  - [ ] 5.7 Add validation and error handling for all event management functions

- [ ] 6.0 Frontend UI - Photo gallery components
  - [ ] 6.1 Create `PhotoGallery.tsx` component for grid display
  - [ ] 6.2 Create `PhotoCard.tsx` component for individual photo with likes/comments
  - [ ] 6.3 Implement photo upload UI with image picker
  - [ ] 6.4 Implement like button with toggle functionality
  - [ ] 6.5 Implement comment input and display
  - [ ] 6.6 Implement delete photo functionality (with permission checks)
  - [ ] 6.7 Add loading states and error handling
  - [ ] 6.8 Implement full-screen photo viewer

- [ ] 7.0 Frontend UI - Event detail page enhancements
  - [ ] 7.1 Add "Photos" tab to event detail page
  - [ ] 7.2 Integrate photo gallery into Photos tab
  - [ ] 7.3 Add privacy indicator (badge/icon) to event header
  - [ ] 7.4 Enhance "Requests" tab for join request management
  - [ ] 7.5 Add "Edit Event" button (visible only to creators)
  - [ ] 7.6 Implement edit event modal/form
  - [ ] 7.7 Implement change cover photo functionality
  - [ ] 7.8 Implement reschedule event functionality
  - [ ] 7.9 Implement delete event functionality with confirmation
  - [ ] 7.10 Update RSVP button to handle private events (show "Request to Join")

- [ ] 8.0 Frontend UI - Event creation updates
  - [ ] 8.1 Add privacy toggle (Public/Private) to create event modal
  - [ ] 8.2 Update event creation to save privacy setting
  - [ ] 8.3 Add visual indicator for privacy in event cards
  - [ ] 8.4 Update event list to show privacy badges

- [ ] 9.0 Real-time subscriptions
  - [ ] 9.1 Set up subscription for new event photos
  - [ ] 9.2 Set up subscription for photo comments
  - [ ] 9.3 Set up subscription for photo likes
  - [ ] 9.4 Set up subscription for join requests (if not already done)
  - [ ] 9.5 Set up subscription for event updates (privacy changes, reschedules)
  - [ ] 9.6 Implement real-time UI updates for all subscriptions
  - [ ] 9.7 Handle subscription cleanup on component unmount

- [ ] 10.0 Notification system integration
  - [ ] 10.1 Create notification helper functions for new notification types
  - [ ] 10.2 Implement notification for photo comments
  - [ ] 10.3 Implement notification for photo likes (consider batching)
  - [ ] 10.4 Implement notification for join requests (to creator)
  - [ ] 10.5 Implement notification for join request approval/rejection
  - [ ] 10.6 Implement notification for event privacy changes
  - [ ] 10.7 Implement notification for event updates (details changed)
  - [ ] 10.8 Implement notification for event rescheduling
  - [ ] 10.9 Implement notification for event deletion
  - [ ] 10.10 Test all notification triggers

- [ ] 11.0 Testing and validation
  - [ ] 11.1 Test photo upload for events user is attending
  - [ ] 11.2 Test photo upload permission validation (non-attendees cannot upload)
  - [ ] 11.3 Test photo deletion (own photos and creator moderation)
  - [ ] 11.4 Test like/unlike functionality
  - [ ] 11.5 Test comment functionality
  - [ ] 11.6 Test private event creation and join request flow
  - [ ] 11.7 Test join request approval/rejection
  - [ ] 11.8 Test event editing (title, description, location, category)
  - [ ] 11.9 Test event rescheduling
  - [ ] 11.10 Test cover photo change
  - [ ] 11.11 Test event deletion with cascade cleanup
  - [ ] 11.12 Test privacy change (public ↔ private)
  - [ ] 11.13 Test real-time updates for all features
  - [ ] 11.14 Test notification delivery for all scenarios
  - [ ] 11.15 Test edge cases from PRD (EC-1 through EC-23)
  - [ ] 11.16 Performance testing (photo gallery load time, upload speed)
  - [ ] 11.17 Test RLS policies with different user roles

- [ ] 12.0 Documentation and cleanup
  - [ ] 12.1 Update API documentation with new functions
  - [ ] 12.2 Document storage bucket structure
  - [ ] 12.3 Document notification types
  - [ ] 12.4 Clean up temporary files and console logs
  - [ ] 12.5 Update README or setup guide if needed
  - [ ] 12.6 Code review and refactoring

