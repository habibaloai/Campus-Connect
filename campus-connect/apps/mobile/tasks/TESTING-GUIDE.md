# Real-Time Messaging Features - Testing Guide

## Prerequisites Checklist

Before testing, ensure:
- [ ] Database migration has been run successfully (see SETUP-INSTRUCTIONS.md)
- [ ] You have access to Supabase Dashboard
- [ ] Your Expo app is running (`npx expo start`)
- [ ] You have at least 2 user accounts to test with (or use 2 devices)

---

## Test 1: Verify Database Migration ✅

### Steps:
1. Open **Supabase Dashboard** → **Database** → **Tables** → **messages**
2. Check the table structure:
   - [ ] Column `status` exists (type: TEXT)
   - [ ] Column `read_at` exists (type: TIMESTAMPTZ)
   - [ ] Both columns allow NULL values

### If Migration Failed:
- Check Supabase SQL Editor for error messages
- Verify you have permissions to alter the messages table
- Check if columns already exist (might show "already exists" error)

---

## Test 2: Verify API Functions Work 📡

### 2.1 Test Message Status Column
1. **Send a new message** through the app
2. Go to **Supabase Dashboard** → **Database** → **Table Editor** → **messages**
3. Find your newly sent message
4. Verify:
   - [ ] `status` column shows "sent"
   - [ ] `read_at` column is NULL (or empty)

### 2.2 Test Message Status Update
1. **Open the conversation** where you sent a message (as the recipient)
2. Go to **Supabase Dashboard** → **Database** → **Table Editor** → **messages**
3. Find the message
4. Verify:
   - [ ] `status` changed to "read"
   - [ ] `read_at` has a timestamp value
   - [ ] `read` boolean is `true`

### 2.3 Test API Functions in Code
1. Open your app's **browser console** or **Expo logs**
2. Look for any TypeScript/compilation errors related to:
   - `api.trackPresence`
   - `api.subscribeToPresence`
   - `api.sendTypingIndicator`
   - `api.updateMessageStatus`
   - `api.subscribeToConversations`

3. Check that there are **no errors** related to missing functions

---

## Test 3: Basic Real-Time Connection 🔌

### Steps:
1. **Open a conversation** in your app
2. Check **Expo logs** or **browser console** for:
   - Connection messages (should not show errors)
   - Any Supabase real-time errors

### Expected:
- No connection errors
- Real-time subscriptions should establish successfully

### If You See Errors:
- Verify Supabase real-time is enabled in your project settings
- Check your Supabase URL and anon key in `.env` file
- Ensure your network connection is stable

---

## Test 4: Current App Behavior (Baseline) 📱

Test how the app works NOW (before UI changes):

1. **Messages List:**
   - [ ] Messages list loads correctly
   - [ ] Conversations show last message
   - [ ] Unread counts display

2. **Individual Chat:**
   - [ ] Messages display correctly
   - [ ] Can send messages
   - [ ] Messages appear in real-time (if already working)

3. **What's Missing (Expected):**
   - ❌ No online status indicators
   - ❌ No message status (sent/delivered/read) shown
   - ❌ No typing indicators
   - ❌ Messages list might require manual refresh

---

## Common Issues & Solutions

### Issue: Migration shows "column already exists"
**Solution:** That's okay! The migration uses `IF NOT EXISTS`, so it's safe to run multiple times.

### Issue: API functions show TypeScript errors
**Solution:** 
- Restart your Expo dev server
- Clear cache: `npx expo start --clear`
- Check that all functions are properly exported

### Issue: Real-time subscriptions not connecting
**Solution:**
- Check Supabase Dashboard → Project Settings → API
- Verify real-time is enabled
- Check network tab in browser for WebSocket connections

### Issue: Status column not updating
**Solution:**
- Verify migration ran successfully
- Check that `markMessagesAsRead` is being called
- Check Supabase logs for update errors

---

## What to Report Back

After testing, please tell me:

1. ✅ **Migration Status**: Did the migration run successfully?
   - Yes / No
   - Any error messages?

2. ✅ **Database Check**: Can you see the new columns?
   - Status column: Yes / No
   - Read_at column: Yes / No

3. ✅ **Message Status**: Do new messages get status='sent'?
   - Yes / No
   - What value do you see?

4. ✅ **API Functions**: Any errors in console/logs?
   - No errors / List the errors

5. ✅ **Current Behavior**: Does the app work normally?
   - Yes, everything works / Issues found

---

## Next Steps After Testing

Once you've completed testing and confirmed everything works:

**Tell me:** "Ready to continue with UI implementation"

Then I'll proceed with implementing:
- Online status indicators
- Message status display
- Typing indicators
- Real-time updates
- Notification badges

---

## Quick Test Checklist Summary

Copy this and check off as you test:

```
[ ] Migration run successfully
[ ] status column exists in messages table
[ ] read_at column exists in messages table
[ ] New messages have status='sent'
[ ] Opening conversation updates status to 'read'
[ ] No TypeScript/compilation errors
[ ] No real-time connection errors
[ ] App functions normally
```

---

**After testing, come back and let me know the results!** 🚀



