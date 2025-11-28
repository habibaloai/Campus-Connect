# Comprehensive Test Guide - Campus Connect Mobile App

## 🎯 Purpose
This guide ensures all features work perfectly before deployment. Test each section systematically and check off items as you complete them.

---

## 📋 Pre-Testing Checklist

Before starting, ensure:
- [ ] Database migration has been run (`add-message-status.sql`)
- [ ] Supabase is configured correctly (see `SUPABASE-CONFIG-GUIDE.md`)
- [ ] App is running (`npm start`)
- [ ] You have at least 2 test user accounts
- [ ] Browser console is open (F12) for error checking
- [ ] Network connection is stable

---

## 1. Authentication & User Management

### 1.1 Sign Up Flow

**Test Case 1.1.1: New User Signup**
- [ ] Navigate to Sign Up screen
- [ ] Enter valid name, email, and password
- [ ] Confirm password matches
- [ ] Click "Create Account"
- [ ] ✅ Success message appears
- [ ] ✅ Redirects to Login screen
- [ ] ✅ User receives verification email (if enabled)

**Test Case 1.1.2: Duplicate Signup Prevention**
- [ ] Try to sign up with an email that already has an account
- [ ] ✅ **IMPORTANT**: Error message MUST appear: "An account with this email already exists. Please sign in instead."
- [ ] ✅ Error message appears in RED above the form (not just in console)
- [ ] ✅ Cannot create duplicate account
- [ ] ✅ No new account is created
- [ ] ✅ Does NOT show "Account created successfully" message
- [ ] ✅ Does NOT redirect to login screen
- [ ] ✅ Stays on signup screen with error visible

**Test Case 1.1.3: Signup Validation**
- [ ] Try to sign up with empty fields
- [ ] ✅ Error: "Please fill in all fields"
- [ ] Try invalid email format (e.g., "test@")
- [ ] ✅ Error: "Please enter a valid email address"
- [ ] Try password less than 6 characters
- [ ] ✅ Error: "Password must be at least 6 characters"
- [ ] Try mismatched passwords
- [ ] ✅ Error: "Passwords do not match"

**Test Case 1.1.4: Email Verification**
- [ ] Sign up with new account
- [ ] Check email for verification link
- [ ] Click verification link
- [ ] ✅ Redirects to app callback
- [ ] ✅ Shows "Email verified successfully!"
- [ ] ✅ Can now sign in

---

### 1.2 Sign In Flow

**Test Case 1.2.1: Successful Login**
- [ ] Enter valid email and password
- [ ] Click "Sign In"
- [ ] ✅ Navigates to Home screen
- [ ] ✅ User profile loads correctly
- [ ] ✅ No errors in console

**Test Case 1.2.2: Invalid Credentials**
- [ ] Enter wrong password
- [ ] ✅ Error: "Invalid email or password"
- [ ] Enter non-existent email
- [ ] ✅ Error: "Invalid email or password"
- [ ] Try empty fields
- [ ] ✅ Validation errors appear

**Test Case 1.2.3: Unverified Email**
- [ ] Try to sign in with unverified email
- [ ] ✅ Appropriate error message (if email verification is enabled)

---

### 1.3 Forgot Password Flow

**Test Case 1.3.1: Request Password Reset**
- [ ] Click "Forgot Password?" on login screen
- [ ] Enter valid email address
- [ ] Click "Send Reset Link"
- [ ] ✅ Success message appears
- [ ] ✅ Email is sent (check inbox)

**Test Case 1.3.2: Password Reset Link**
- [ ] Open password reset email
- [ ] Click reset link
- [ ] ✅ Opens in app (not web app main page)
- [ ] ✅ Shows "Password reset link verified! Redirecting..."
- [ ] ✅ Redirects to Reset Password screen
- [ ] ✅ NOT redirected to web app main page

**Test Case 1.3.3: Reset Password**
- [ ] Enter new password (min 6 characters)
- [ ] Confirm new password
- [ ] Click "Reset Password"
- [ ] ✅ Success message appears
- [ ] ✅ Redirects to Login screen
- [ ] ✅ Can sign in with new password
- [ ] ✅ Old password no longer works

**Test Case 1.3.4: Reset Password Validation**
- [ ] Try passwords that don't match
- [ ] ✅ Error: "Passwords do not match"
- [ ] Try password less than 6 characters
- [ ] ✅ Error: "Password must be at least 6 characters"
- [ ] Try empty fields
- [ ] ✅ Error: "Please fill in all fields"

**Test Case 1.3.5: Expired Reset Link**
- [ ] Wait 1+ hour (or use expired link)
- [ ] Try to reset password
- [ ] ✅ Error: "Link might be expired or invalid"
- [ ] ✅ Can request new reset link

---

### 1.4 Sign Out

**Test Case 1.4.1: Sign Out**
- [ ] Navigate to Profile screen
- [ ] Click "Sign Out"
- [ ] ✅ Redirects to Login screen
- [ ] ✅ Session is cleared
- [ ] ✅ Cannot access protected screens

---

## 2. Real-Time Messaging Features

### 2.1 Online Status Indicators

**Test Case 2.1.1: Online Status Display**
- [ ] User A: Open a conversation with User B
- [ ] ✅ Chat header shows "Online" or "Offline" status
- [ ] ✅ Green dot appears when User B is online
- [ ] ✅ Gray dot appears when User B is offline

**Test Case 2.1.2: Real-Time Status Updates**
- [ ] User A: Open conversation with User B
- [ ] User B: Open the same conversation (different device/tab)
- [ ] ✅ User A sees User B's status change to "Online"
- [ ] User B: Close app or navigate away
- [ ] ✅ User A sees status change to "Offline" (may take a few seconds)
- [ ] User B: Reopen app
- [ ] ✅ User A sees status change back to "Online"

**Test Case 2.1.3: App State Management**
- [ ] User A: Open conversation
- [ ] User A: Background the app (home button)
- [ ] ✅ Presence is updated (goes offline)
- [ ] User A: Foreground the app
- [ ] ✅ Presence reconnects (goes online)

---

### 2.2 Message Status Indicators

**Test Case 2.2.1: Message Status Progression**
- [ ] User A: Send a message to User B
- [ ] ✅ "Sent" appears below the message immediately
- [ ] User B: Device receives message (opens conversation)
- [ ] ✅ User A sees status change to "Delivered"
- [ ] User B: Opens the conversation
- [ ] ✅ User A sees status change to "Read"
- [ ] ✅ "Sent" and "Delivered" disappear, only "Read" shows

**Test Case 2.2.2: Status Display Rules**
- [ ] Send multiple messages
- [ ] ✅ Only highest status is shown (hides lower statuses)
- [ ] ✅ Status updates in real-time (no refresh needed)
- [ ] ✅ Status only shows for outgoing messages (not incoming)

**Test Case 2.2.3: Status Persistence**
- [ ] Send message, see "Sent"
- [ ] Close and reopen conversation
- [ ] ✅ Status is preserved ("Sent", "Delivered", or "Read")
- [ ] ✅ Status updates correctly when recipient reads

---

### 2.3 Typing Indicators

**Test Case 2.3.1: Typing Indicator Display**
- [ ] User A & User B: Both in same conversation
- [ ] User B: Start typing a message
- [ ] ✅ User A sees "typing..." indicator appear
- [ ] ✅ Indicator appears within 1-2 seconds

**Test Case 2.3.2: Typing Indicator Auto-Hide**
- [ ] User B: Start typing, then stop (don't send)
- [ ] ✅ Indicator disappears after ~3 seconds
- [ ] User B: Send the message
- [ ] ✅ Indicator disappears immediately

**Test Case 2.3.3: Multiple Typing Users**
- [ ] In group conversation, multiple users type
- [ ] ✅ Shows "Someone is typing..." (or user names if implemented)

---

### 2.4 Real-Time Messages List

**Test Case 2.4.1: Automatic Updates**
- [ ] User A: Be on Messages list screen
- [ ] User B: Send a new message to User A
- [ ] ✅ Message appears automatically (no manual refresh)
- [ ] ✅ Conversation moves to top of list
- [ ] ✅ Last message preview updates
- [ ] ✅ Timestamp updates
- [ ] ✅ Unread count badge updates

**Test Case 2.4.2: Multiple Conversations**
- [ ] Have multiple conversations
- [ ] Receive messages in different conversations
- [ ] ✅ All conversations update correctly
- [ ] ✅ Correct conversation moves to top
- [ ] ✅ No duplicates or missing messages

**Test Case 2.4.3: Pull to Refresh**
- [ ] Pull down on messages list
- [ ] ✅ Refreshes conversations
- [ ] ✅ Shows loading indicator
- [ ] ✅ Updates complete list

---

### 2.5 Notification Badges

**Test Case 2.5.1: Badge Display**
- [ ] User A: Have unread messages
- [ ] ✅ Red badge appears on Messages tab
- [ ] ✅ Badge shows correct unread count
- [ ] ✅ Badge shows "99+" if count > 99

**Test Case 2.5.2: Real-Time Badge Updates**
- [ ] User A: On Home or Events tab
- [ ] User B: Sends new message
- [ ] ✅ Badge count increases automatically
- [ ] ✅ Badge updates without refresh

**Test Case 2.5.3: Badge Clearing**
- [ ] User A: Open Messages tab
- [ ] User A: Read all conversations
- [ ] ✅ Badge count decreases
- [ ] ✅ Badge disappears when all read

---

### 2.6 Message Functionality

**Test Case 2.6.1: Send Message**
- [ ] Open conversation
- [ ] Type message
- [ ] Click send button
- [ ] ✅ Message appears immediately
- [ ] ✅ Message shows "Sent" status
- [ ] ✅ Scrolls to bottom automatically

**Test Case 2.6.2: Receive Message**
- [ ] User A: In conversation
- [ ] User B: Sends message
- [ ] ✅ Message appears automatically
- [ ] ✅ No refresh needed
- [ ] ✅ Message is marked as read automatically

**Test Case 2.6.3: Message History**
- [ ] Open conversation with existing messages
- [ ] ✅ All messages load correctly
- [ ] ✅ Messages are in correct order (oldest to newest)
- [ ] ✅ Date separators appear correctly
- [ ] ✅ Sender names show for group chats

---

## 3. Events

### 3.1 Event Creation

**Test Case 3.1.1: Create Event**
- [ ] Navigate to Events tab
- [ ] Click "Create Event"
- [ ] Fill in:
  - [ ] Title (required)
  - [ ] Category (required)
  - [ ] Location (required)
  - [ ] Max Attendees (optional)
  - [ ] Description (optional)
- [ ] Click "Create Event"
- [ ] ✅ Event is created successfully
- [ ] ✅ Success message appears
- [ ] ✅ Event appears in events list
- [ ] ✅ Modal closes

**Test Case 3.1.2: Event Creation Validation**
- [ ] Try to create event without title
- [ ] ✅ Error: "Please fill in title and location"
- [ ] Try without location
- [ ] ✅ Error: "Please fill in title and location"
- [ ] Try without being signed in
- [ ] ✅ Error: "Sign In Required"

**Test Case 3.1.3: Event Details**
- [ ] Create event
- [ ] Check event in list
- [ ] ✅ Event has correct title
- [ ] ✅ Event has correct location
- [ ] ✅ Event has correct category
- [ ] ✅ Event shows organizer name
- [ ] ✅ Event has default time (6:00 PM)

---

### 3.2 Event Viewing

**Test Case 3.2.1: View Events List**
- [ ] Navigate to Events tab
- [ ] ✅ Events list loads
- [ ] ✅ Events show date, location, attendees
- [ ] ✅ Events are sorted by date
- [ ] ✅ Can scroll through events

**Test Case 3.2.2: View Event Details**
- [ ] Click on an event
- [ ] ✅ Event details screen opens
- [ ] ✅ Shows all event information
- [ ] ✅ Shows list of attendees
- [ ] ✅ Shows attendee avatars with correct initials
- [ ] ✅ "Message" button appears for each attendee

**Test Case 3.2.3: Search Events**
- [ ] Use search bar
- [ ] Search by title
- [ ] ✅ Correct events appear
- [ ] Search by location
- [ ] ✅ Correct events appear
- [ ] Search by category
- [ ] ✅ Correct events appear

---

### 3.3 Join/Leave Events

**Test Case 3.3.1: Join Event**
- [ ] Click "Join Event" button
- [ ] ✅ Button changes to "Joined ✓"
- [ ] ✅ Attendee count increases
- [ ] ✅ User appears in attendees list
- [ ] ✅ Avatar appears in event card

**Test Case 3.3.2: Leave Event**
- [ ] Click "Joined ✓" button
- [ ] ✅ Button changes to "Join Event"
- [ ] ✅ Attendee count decreases
- [ ] ✅ User removed from attendees list

**Test Case 3.3.3: Join/Leave Validation**
- [ ] Try to join without being signed in
- [ ] ✅ Error: "Sign In Required"
- [ ] Join event, then try to join again
- [ ] ✅ No duplicate joins

---

## 4. Community/Posts

### 4.1 View Posts

**Test Case 4.1.1: View Community Feed**
- [ ] Navigate to Community tab
- [ ] ✅ Posts list loads
- [ ] ✅ Posts show title, content, author
- [ ] ✅ Posts show category badge
- [ ] ✅ Posts show like count

**Test Case 4.1.2: Filter by Category**
- [ ] Select a category filter
- [ ] ✅ Only posts in that category appear
- [ ] ✅ Filter persists when scrolling
- [ ] Select "All"
- [ ] ✅ All posts appear

**Test Case 4.1.3: View Post Details**
- [ ] Click on a post
- [ ] ✅ Post details screen opens
- [ ] ✅ Shows full content
- [ ] ✅ Shows replies
- [ ] ✅ Shows author information

---

### 4.2 Create Posts

**Test Case 4.2.1: Create Post**
- [ ] Click "Create Post" (if available)
- [ ] Fill in title and content
- [ ] Select category
- [ ] Submit
- [ ] ✅ Post is created
- [ ] ✅ Post appears in feed
- [ ] ✅ Post has correct category

**Test Case 4.2.2: Post Validation**
- [ ] Try to create post without title
- [ ] ✅ Validation error appears
- [ ] Try without content
- [ ] ✅ Validation error appears

---

### 4.3 Reply to Posts

**Test Case 4.3.1: Reply to Post**
- [ ] Open a post
- [ ] Click "Reply"
- [ ] Enter reply text
- [ ] Submit
- [ ] ✅ Reply appears in post
- [ ] ✅ Reply shows author name
- [ ] ✅ Reply has timestamp

**Test Case 4.3.2: Reply Restrictions**
- [ ] Open your own post
- [ ] ✅ "Reply" button is disabled/hidden
- [ ] ✅ Cannot reply to own posts

---

## 5. Profile & Settings

### 5.1 View Profile

**Test Case 5.1.1: View Own Profile**
- [ ] Navigate to Profile tab
- [ ] ✅ Profile information displays
- [ ] ✅ Name, email, major, year shown
- [ ] ✅ Avatar displays (if set)
- [ ] ✅ Can edit profile

**Test Case 5.1.2: Edit Profile**
- [ ] Click "Edit Profile"
- [ ] Update information
- [ ] Save
- [ ] ✅ Changes are saved
- [ ] ✅ Profile updates immediately
- [ ] ✅ Changes persist after app restart

---

## 6. Performance & Edge Cases

### 6.1 Network Handling

**Test Case 6.1.1: Offline Mode**
- [ ] Disable network connection
- [ ] Try to send message
- [ ] ✅ Appropriate error message
- [ ] ✅ Message queues for sending
- [ ] Re-enable network
- [ ] ✅ Queued messages send automatically

**Test Case 6.1.2: Slow Network**
- [ ] Use slow network (throttle in dev tools)
- [ ] Navigate through app
- [ ] ✅ Loading indicators appear
- [ ] ✅ App remains responsive
- [ ] ✅ No crashes or freezes

---

### 6.2 Error Handling

**Test Case 6.2.1: API Errors**
- [ ] Simulate API error (disconnect Supabase)
- [ ] Try to load data
- [ ] ✅ Error message appears
- [ ] ✅ App doesn't crash
- [ ] ✅ Can retry operation

**Test Case 6.2.2: Invalid Data**
- [ ] Try to submit invalid data
- [ ] ✅ Validation errors appear
- [ ] ✅ No data is saved
- [ ] ✅ Clear error messages

---

### 6.3 App State Management

**Test Case 6.3.1: Background/Foreground**
- [ ] Open app
- [ ] Background the app
- [ ] ✅ Presence updates correctly
- [ ] ✅ Subscriptions pause/resume
- [ ] Foreground the app
- [ ] ✅ Data refreshes
- [ ] ✅ Real-time features reconnect

**Test Case 6.3.2: App Restart**
- [ ] Use app
- [ ] Close app completely
- [ ] Reopen app
- [ ] ✅ User remains signed in
- [ ] ✅ Data loads correctly
- [ ] ✅ Real-time features reconnect

---

## 7. UI/UX Testing

### 7.1 Navigation

**Test Case 7.1.1: Tab Navigation**
- [ ] Navigate between all tabs
- [ ] ✅ Smooth transitions
- [ ] ✅ No lag or stuttering
- [ ] ✅ Correct screen loads
- [ ] ✅ Tab indicators work

**Test Case 7.1.2: Back Navigation**
- [ ] Navigate to detail screen
- [ ] Press back button
- [ ] ✅ Returns to previous screen
- [ ] ✅ State is preserved

---

### 7.2 Responsiveness

**Test Case 7.2.1: Different Screen Sizes**
- [ ] Test on different devices/screen sizes
- [ ] ✅ Layout adapts correctly
- [ ] ✅ No overflow or cut-off content
- [ ] ✅ Touch targets are accessible

**Test Case 7.2.2: Orientation**
- [ ] Rotate device (if supported)
- [ ] ✅ Layout adapts
- [ ] ✅ No crashes

---

### 7.3 Loading States

**Test Case 7.3.1: Loading Indicators**
- [ ] Perform actions that require loading
- [ ] ✅ Loading indicators appear
- [ ] ✅ Indicators disappear when done
- [ ] ✅ No infinite loading

---

## 8. Security Testing

### 8.1 Authentication Security

**Test Case 8.1.1: Session Management**
- [ ] Sign in
- [ ] ✅ Session persists correctly
- [ ] ✅ Session expires after timeout (if configured)
- [ ] ✅ Sign out clears session

**Test Case 8.1.2: Password Security**
- [ ] Try to view password in input field
- [ ] ✅ Password is hidden (secureTextEntry)
- [ ] ✅ Password is not logged in console

---

### 8.2 Data Security

**Test Case 8.2.1: User Data Access**
- [ ] Try to access another user's data
- [ ] ✅ Cannot access unauthorized data
- [ ] ✅ Proper error handling

---

## 9. Integration Testing

### 9.1 End-to-End Flows

**Test Case 9.1.1: Complete User Journey**
1. [ ] Sign up new account
2. [ ] Verify email
3. [ ] Sign in
4. [ ] Create event
5. [ ] Join event
6. [ ] Send message to event attendee
7. [ ] View messages
8. [ ] Create community post
9. [ ] Reply to post
10. [ ] Update profile
11. [ ] Sign out
- [ ] ✅ All steps complete successfully
- [ ] ✅ No errors throughout journey

**Test Case 9.1.2: Multi-User Interaction**
1. [ ] User A: Create event
2. [ ] User B: Join event
3. [ ] User A: See User B joined (real-time)
4. [ ] User B: Send message to User A
5. [ ] User A: Receive message (real-time)
6. [ ] User A: Reply to message
7. [ ] User B: See reply (real-time)
- [ ] ✅ All interactions work correctly
- [ ] ✅ Real-time updates work for both users

---

## 10. Browser/Platform Testing

### 10.1 Web Platform

**Test Case 10.1.1: Web Browser**
- [ ] Test in Chrome
- [ ] Test in Firefox
- [ ] Test in Safari
- [ ] ✅ All features work
- [ ] ✅ No browser-specific errors

---

### 10.2 Mobile Platforms

**Test Case 10.2.1: iOS (if available)**
- [ ] Test on iOS device/simulator
- [ ] ✅ All features work
- [ ] ✅ Native features work (notifications, etc.)

**Test Case 10.2.2: Android (if available)**
- [ ] Test on Android device/emulator
- [ ] ✅ All features work
- [ ] ✅ Native features work

---

## 11. Regression Testing

### 11.1 Previously Fixed Issues

**Test Case 11.1.1: Event Creation Fix**
- [ ] Create event
- [ ] ✅ Event is created successfully
- [ ] ✅ No "organizer_id" errors
- [ ] ✅ Event has time field

**Test Case 11.1.2: Password Reset Fix**
- [ ] Request password reset
- [ ] ✅ Link redirects to reset-password screen
- [ ] ✅ NOT redirected to web app main page

**Test Case 11.1.3: Duplicate Signup Fix**
- [ ] Try to sign up with existing email
- [ ] ✅ Error message appears
- [ ] ✅ Cannot create duplicate

---

## 12. Final Checklist

Before marking as complete, verify:

- [ ] All test cases above are checked
- [ ] No console errors (check browser console)
- [ ] No crashes or freezes
- [ ] All features work as expected
- [ ] Performance is acceptable
- [ ] UI is polished and consistent
- [ ] Error messages are clear and helpful
- [ ] Real-time features update correctly
- [ ] Data persists correctly
- [ ] Security measures work

---

## 🐛 Bug Reporting

If you find any issues:

1. **Document the issue:**
   - What you were doing
   - What you expected to happen
   - What actually happened
   - Steps to reproduce
   - Screenshots (if applicable)
   - Console errors (copy/paste)

2. **Priority levels:**
   - 🔴 **Critical**: App crashes, data loss, security issues
   - 🟡 **High**: Feature doesn't work, major UI issues
   - 🟢 **Medium**: Minor bugs, small UI issues
   - ⚪ **Low**: Cosmetic issues, minor improvements

---

## ✅ Sign-Off

**Tester Name:** _________________

**Date:** _________________

**Overall Status:**
- [ ] ✅ All tests passed - Ready for production
- [ ] ⚠️ Minor issues found - Fix and retest
- [ ] ❌ Major issues found - Needs significant fixes

**Notes:**
_________________________________________________
_________________________________________________
_________________________________________________

---

**Happy Testing! 🚀**

