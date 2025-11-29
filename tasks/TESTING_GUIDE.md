# Testing Guide: Event Management, Real-Time Updates, Discussion Features, and Group Messaging

## Prerequisites

1. **Database Migrations**: Run the migration files in Supabase SQL Editor:
   - `campus-connect/supabase-migrations/add-group-admin-permissions.sql`
   - `campus-connect/supabase-migrations/add-post-likes-trigger.sql`

2. **Environment Setup**:
   - Ensure `.env.local` (web) and `.env` (mobile) are configured with Supabase credentials
   - Start the development servers:
     - Web: `cd campus-connect && npm run dev`
     - Mobile: `cd campus-connect-mobile && npm start`

3. **Test Accounts**: Create at least 2 test accounts to test real-time features

---

## 1. Database Migrations Testing

### Test 1.1: Group Admin Permissions Migration
1. Open Supabase SQL Editor
2. Run `add-group-admin-permissions.sql`
3. Verify:
   ```sql
   -- Check if column exists
   SELECT column_name, data_type, column_default 
   FROM information_schema.columns 
   WHERE table_name = 'conversation_participants' AND column_name = 'is_admin';
   -- Should return: is_admin | boolean | false
   
   -- Check if existing group creators are admins
   SELECT cp.*, c.type 
   FROM conversation_participants cp
   JOIN conversations c ON c.id = cp.conversation_id
   WHERE c.type = 'group'
   ORDER BY cp.joined_at;
   -- First participant (creator) should have is_admin = true
   ```

### Test 1.2: Post Likes Trigger Migration
1. Run `add-post-likes-trigger.sql`
2. Verify:
   ```sql
   -- Test trigger by liking a post
   INSERT INTO post_likes (post_id, user_id) 
   VALUES ('some-post-id', 'some-user-id');
   
   -- Check if likes count updated
   SELECT id, likes FROM posts WHERE id = 'some-post-id';
   -- Likes count should be incremented
   
   -- Test trigger by unliking
   DELETE FROM post_likes WHERE post_id = 'some-post-id' AND user_id = 'some-user-id';
   
   -- Check if likes count updated
   SELECT id, likes FROM posts WHERE id = 'some-post-id';
   -- Likes count should be decremented
   ```

---

## 2. Event Deletion Feature Testing

### Test 2.1: Mobile Event Deletion
1. **Setup**:
   - Log in as a user who created an event
   - Navigate to Events tab
   - Open an event you created

2. **Test Delete Button Visibility**:
   - Open the edit modal (tap Edit icon)
   - Verify "Delete Event" button appears below "Save Changes"
   - Button should be red with Trash2 icon
   - Log out and view the same event as a different user
   - Verify delete button is NOT visible

3. **Test Delete Confirmation**:
   - As event organizer, tap "Delete Event"
   - Verify confirmation modal appears with:
     - Event title displayed
     - Warning message
     - List of what will be deleted
     - "Cancel" and "Delete" buttons

4###. **Test Deletion**:
   - Create a test event with:
     - Cover photo
     - At least 2 attendees
     - At least 1 photo uploaded
     - At least 1 join request
   - Delete the event
   - Verify:
     - Success message appears
     - Redirected to events list
     - Event no longer appears in list
     - Attendees receive notifications (check notifications tab)

5. **Test Storage Cleanup**:
   - Check Supabase Storage:
     - `event-covers` bucket: cover photo should be deleted
     - `event-photos` bucket: all photos for that event should be deleted

### Test 2.2: Web Event Deletion
1. **Setup**: Same as mobile
2. **Test Delete Button**:
   - Navigate to event detail page
   - Verify "Delete Event" button appears in header (red trash icon) OR in bottom action area
   - Only visible to organizer

3. **Test Deletion Flow**:
   - Same as mobile test
   - Verify UI consistency with mobile

---

## 3. Real-Time Event Updates Testing

### Test 3.1: Real-Time Event Creation (Mobile)
1. **Setup**:
   - Open Events tab on Device A (logged in as User A)
   - Open Events tab on Device B (logged in as User B)

2. **Test**:
   - On Device A, create a new event
   - On Device B, verify:
     - New event appears in list WITHOUT refreshing
     - Event appears in correct date order
     - No duplicate entries

### Test 3.2: Real-Time Event Updates (Mobile)
1. **Setup**: Same as above
2. **Test**:
   - On Device A, edit an event (change title, location, etc.)
   - On Device B, verify:
     - Event details update in real-time
     - If viewing event detail page, details update automatically

### Test 3.3: Real-Time Event Deletion (Mobile)
1. **Setup**: Same as above
2. **Test**:
   - On Device A, delete an event
   - On Device B, verify:
     - Event disappears from list immediately
     - If viewing event detail page, shows "Event Deleted" message
     - Auto-redirects after 3 seconds

### Test 3.4: Real-Time Attendee Count Updates (Mobile)
1. **Setup**: Same as above
2. **Test**:
   - On Device A, join an event
   - On Device B, verify:
     - Attendee count increases immediately
     - If viewing event detail page, count updates in real-time
   - On Device A, leave the event
   - On Device B, verify:
     - Attendee count decreases immediately

### Test 3.5: Web Real-Time Updates
1. **Setup**: Open Events tab in two different browser tabs/windows
2. **Test**: Same scenarios as mobile (creation, updates, deletion, attendee changes)
3. **Verify**: All updates appear in real-time across tabs

---

## 4. Discussion Features (Likes and Comments) Testing

### Test 4.1: Like Functionality (Mobile)
1. **Setup**:
   - Navigate to Community tab
   - Open a post

2. **Test Like**:
   - Tap heart icon
   - Verify:
     - Icon fills with red color immediately (optimistic update)
     - Like count increases by 1
     - Post author receives notification

3. **Test Unlike**:
   - Tap heart icon again
   - Verify:
     - Icon unfills immediately
     - Like count decreases by 1

4. **Test Error Handling**:
   - Disable network
   - Try to like a post
   - Verify:
     - UI reverts to previous state
     - Error message appears

### Test 4.2: Real-Time Like Updates (Mobile)
1. **Setup**:
   - Device A: View a post
   - Device B: View the same post

2. **Test**:
   - On Device A, like the post
   - On Device B, verify:
     - Like count updates immediately
     - Heart icon fills (if same user) or count updates (if different user)

### Test 4.3: Comment Functionality (Mobile)
1. **Setup**: Open a post detail page

2. **Test Add Comment**:
   - Type a comment in the input field
   - Tap Send button
   - Verify:
     - Comment appears immediately in comments list
     - Comment shows author name, avatar, timestamp
     - Reply count on post increases
     - Post author receives notification

3. **Test Comment Validation**:
   - Try to send empty comment → Should be disabled
   - Try to send very long comment (>5000 chars) → Should show error

4. **Test Delete Comment**:
   - Add a comment as current user
   - Verify delete button (trash icon) appears on your comment
   - Tap delete button
   - Confirm deletion
   - Verify:
     - Comment is removed from list
     - Reply count decreases
     - Delete button only appears on your own comments

### Test 4.4: Real-Time Comment Updates (Mobile)
1. **Setup**:
   - Device A: View a post
   - Device B: View the same post

2. **Test**:
   - On Device A, add a comment
   - On Device B, verify:
     - New comment appears immediately
     - Reply count updates
     - Comments are in chronological order

3. **Test Comment Deletion**:
   - On Device A, delete a comment
   - On Device B, verify:
     - Comment disappears immediately
     - Reply count decreases

### Test 4.5: Post List Likes (Mobile)
1. **Setup**: Navigate to Community tab (post list)

2. **Test**:
   - Tap heart icon on a post in the list
   - Verify:
     - Icon state updates immediately
     - Like count updates
     - Navigate to post detail, verify like state is consistent

### Test 4.6: Web Discussion Features
1. **Setup**: Navigate to Community tab/page on web

2. **Test Like/Unlike**:
   - Click heart icon on a post
   - Verify same behavior as mobile

3. **Test Comments**:
   - Open a post
   - Add a comment
   - Verify same behavior as mobile

4. **Test Real-Time Updates**:
   - Open two browser tabs
   - Test like and comment updates in real-time

---

## 5. Group Messaging Testing (If Implemented)

### Test 5.1: Create Group
1. **Setup**: Navigate to Messages tab

2. **Test**:
   - Tap "New Group" button
   - Enter group name
   - Search and select at least 2 members
   - Tap "Create Group"
   - Verify:
     - Group conversation is created
     - Creator is automatically admin
     - All selected members are in the group
     - Navigate to group info, verify admin badge on creator

### Test 5.2: Group Member Management
1. **Setup**: Open a group conversation as admin

2. **Test Add Members**:
   - Tap group info icon
   - Tap "Add Members"
   - Select users
   - Verify:
     - New members appear in member list
     - Real-time update for all group members

3. **Test Remove Members**:
   - As admin, remove a member
   - Verify:
     - Member is removed from list
     - Member can no longer see the group

4. **Test Leave Group**:
   - As regular member, tap "Leave Group"
   - Verify:
     - You're removed from group
     - Redirected to messages list

5. **Test Last Admin Protection**:
   - As last admin, try to leave group
   - Verify:
     - Error message: "Cannot leave as last admin"
     - OR option to transfer admin before leaving

### Test 5.3: Admin Management
1. **Setup**: Open group as creator

2. **Test Assign Admin**:
   - Assign admin to another member
   - Verify:
     - Member shows admin badge
     - Member can now manage group

3. **Test Revoke Admin**:
   - Revoke admin from a member
   - Verify:
     - Admin badge removed
     - Member can no longer manage group

4. **Test Last Admin Protection**:
   - As only admin, try to revoke your own admin
   - Verify:
     - Error: "Cannot revoke last admin"

---

## 6. Edge Cases and Error Handling

### Test 6.1: Network Disconnection
1. **Test**:
   - Disable network
   - Try to like, comment, delete event
   - Verify:
     - Error messages appear
     - UI reverts to previous state
     - Operations complete when network restored

### Test 6.2: Concurrent Operations
1. **Test**:
   - Multiple users like the same post simultaneously
   - Verify:
     - All likes are recorded
     - Count is accurate
     - No duplicate likes

### Test 6.3: Rapid Toggling
1. **Test**:
   - Rapidly like/unlike a post multiple times
   - Verify:
     - Final state is correct
     - No race conditions
     - UI doesn't flicker excessively

### Test 6.4: Deleted Content
1. **Test**:
   - User A views an event
   - User B deletes the event
   - Verify:
     - User A sees "Event Deleted" message
     - Auto-redirects after timeout

---

## 7. Performance Testing

### Test 7.1: Large Lists
1. **Test**:
   - Create 50+ events
   - Verify:
     - Events list loads efficiently
     - Real-time updates don't cause lag
     - Scrolling is smooth

### Test 7.2: Many Comments
1. **Test**:
   - Post with 100+ comments
   - Verify:
     - Comments load efficiently
     - Real-time updates work
     - UI remains responsive

---

## 8. Cross-Platform Verification

### Test 8.1: Mobile ↔ Web Sync
1. **Test**:
   - Like a post on mobile
   - Check web version
   - Verify:
     - Like state is synced
     - Count is consistent

2. **Test**:
   - Add comment on web
   - Check mobile version
   - Verify:
     - Comment appears on mobile
     - Real-time sync works

---

## Checklist Summary

- [ ] Database migrations run successfully
- [ ] Event deletion works (mobile & web)
- [ ] Delete button only visible to organizer
- [ ] Real-time event creation works
- [ ] Real-time event updates work
- [ ] Real-time event deletion works
- [ ] Real-time attendee count updates work
- [ ] Like functionality works (mobile & web)
- [ ] Unlike functionality works
- [ ] Real-time like updates work
- [ ] Comment functionality works (mobile & web)
- [ ] Comment deletion works
- [ ] Real-time comment updates work
- [ ] Notifications are sent correctly
- [ ] Error handling works
- [ ] Edge cases handled properly
- [ ] Cross-platform sync works

---

## Troubleshooting

### Real-time updates not working?
- Check Supabase Realtime is enabled
- Verify RLS policies allow subscriptions
- Check browser console/React Native logs for errors
- Ensure user is authenticated

### Notifications not appearing?
- Check `notifications` table has correct data
- Verify notification creation API is called
- Check notification settings in app

### Database trigger not updating counts?
- Run migration again
- Check trigger exists: `SELECT * FROM pg_trigger WHERE tgname LIKE '%likes%';`
- Manually test trigger function

### Storage cleanup not working?
- Check storage bucket permissions
- Verify file paths are correct
- Check Supabase Storage logs


