# Interactive Testing Guide - Real-Time Messaging Features

## 🚀 Quick Start Testing

Let's test all the real-time features we just implemented!

---

## Step 1: Start the App

**Run this command:**
```bash
cd campus-connect/apps/mobile
npm start
```

Or if you prefer:
```bash
cd campus-connect/apps/mobile
npx expo start --port 8081
```

**Expected:** Expo dev server should start and show QR code

---

## Step 2: Test Checklist

As we test, check off each item:

### ✅ Feature Tests

- [ ] **Online Status Indicator**
  - [ ] Green dot appears when user is online
  - [ ] Gray dot appears when user is offline
  - [ ] Status updates when user goes online/offline

- [ ] **Message Status Indicators**
  - [ ] "Sent" appears below outgoing messages
  - [ ] "Delivered" appears after recipient receives message
  - [ ] "Read" appears after recipient opens conversation
  - [ ] Only highest status shown (hides "Sent" when "Delivered", etc.)

- [ ] **Typing Indicators**
  - [ ] "typing..." appears when other user is typing
  - [ ] Indicator disappears after 3 seconds
  - [ ] Indicator disappears when message is sent

- [ ] **Real-Time Messages List**
  - [ ] New messages appear automatically (no refresh needed)
  - [ ] Last message preview updates in real-time
  - [ ] Unread counts update automatically
  - [ ] Conversation order updates based on activity

- [ ] **Notification Badge**
  - [ ] Badge appears on Messages tab when unread messages exist
  - [ ] Badge count matches total unread conversations
  - [ ] Badge updates in real-time
  - [ ] Badge clears when all messages read

- [ ] **App State Management**
  - [ ] Status updates when app goes to background
  - [ ] Status reconnects when app comes to foreground
  - [ ] No memory leaks (cleanup works)

---

## Step 3: Detailed Test Scenarios

### Test Scenario 1: Online Status ✅

**Setup:**
1. User A opens conversation with User B
2. Both users should be in the conversation

**Test Steps:**
1. ✅ Check if online status appears in chat header
2. ✅ User B closes app/goes offline
3. ✅ Verify User A sees User B's status change to offline
4. ✅ User B reopens app
5. ✅ Verify User A sees User B's status change to online

**Expected Result:** Status indicator updates in real-time

---

### Test Scenario 2: Message Status ✅

**Setup:**
1. User A sends a message to User B

**Test Steps:**
1. ✅ User A sees "Sent" below the message immediately
2. ✅ User B's device receives message
3. ✅ User A sees status change to "Delivered"
4. ✅ User B opens the conversation
5. ✅ User A sees status change to "Read"

**Expected Result:** Status progresses: Sent → Delivered → Read

---

### Test Scenario 3: Typing Indicators ✅

**Setup:**
1. User A and User B in the same conversation

**Test Steps:**
1. ✅ User B starts typing
2. ✅ User A sees "typing..." indicator appear
3. ✅ User B stops typing for 3 seconds
4. ✅ User A sees indicator disappear
5. ✅ User B sends message
6. ✅ User A sees indicator disappear immediately

**Expected Result:** Typing indicator appears and disappears correctly

---

### Test Scenario 4: Real-Time Updates ✅

**Setup:**
1. User A is on messages list screen
2. User B sends a new message

**Test Steps:**
1. ✅ User A sees new message appear automatically
2. ✅ Conversation moves to top of list
3. ✅ Last message preview updates
4. ✅ Unread count badge updates
5. ✅ Time stamp updates

**Expected Result:** Everything updates without manual refresh

---

### Test Scenario 5: Notification Badge ✅

**Setup:**
1. User A has unread messages
2. User A is on Home or Events tab

**Test Steps:**
1. ✅ Badge shows correct count on Messages tab
2. ✅ New message arrives
3. ✅ Badge count increases
4. ✅ User A opens Messages tab and reads conversation
5. ✅ Badge count decreases
6. ✅ Badge disappears when all read

**Expected Result:** Badge accurately reflects unread count

---

## Step 4: Error Checking

While testing, watch for:

- [ ] **Console Errors**
  - Open browser console (F12) or Expo logs
  - Check for any red error messages
  - Report any errors found

- [ ] **Network Issues**
  - Check if WebSocket connections are established
  - Look for connection errors in console

- [ ] **Performance Issues**
  - Check if app feels slow
  - Check battery usage
  - Check memory usage

---

## Step 5: Report Results

After testing, tell me:

1. ✅ **What worked:** List all features that worked correctly
2. ❌ **What didn't work:** List any features that had issues
3. 🐛 **Bugs found:** Describe any bugs or unexpected behavior
4. 💡 **Suggestions:** Any improvements you'd like

---

## Quick Test (5 Minutes)

If you're short on time, test these critical features:

1. ✅ Send a message - does status appear?
2. ✅ Receive a message - does it appear automatically?
3. ✅ Type a message - does typing indicator show?
4. ✅ Check badge - does unread count appear?

---

## Need Help?

If something doesn't work:
1. Check the console/logs for errors
2. Verify database migration was run
3. Check Supabase real-time is enabled
4. Let me know what error you see!

---

**Ready to start testing? Let's begin! 🚀**


