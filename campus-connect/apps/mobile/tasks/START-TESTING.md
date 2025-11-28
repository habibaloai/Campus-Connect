# 🚀 Start Testing Now!

## Quick Start Guide

### Step 1: Start the App (if not already running)

**Option A: Using npm**
```bash
cd campus-connect/apps/mobile
npm start
```

**Option B: Using Expo directly**
```bash
cd campus-connect/apps/mobile
npx expo start --port 8081
```

**What you should see:**
- Expo DevTools opens in your browser
- QR code appears in terminal
- Server is running on port 8081

---

### Step 2: Open the App

**Choose one method:**

1. **Web Browser** (easiest for testing)
   - Click the web link in Expo output (usually `http://localhost:8081`)
   - Or press `w` in the Expo terminal

2. **Mobile Device (Expo Go)**
   - Scan QR code with Expo Go app
   - Or press `a` for Android / `i` for iOS simulator

3. **Emulator/Simulator**
   - Press `a` for Android emulator
   - Press `i` for iOS simulator

---

### Step 3: Login/Create Accounts

**You need TWO user accounts for testing:**

1. **User A** - First account
   - Login or create account
   - Remember the email/password

2. **User B** - Second account  
   - Login or create account
   - Remember the email/password

**Tip:** Use two different browser tabs/windows or two devices to test real-time features!

---

### Step 4: Start Testing! ✅

Follow the testing checklist in **TESTING-CHECKLIST.md**

Or test these quick features:

#### Quick Test 1: Online Status 🟢
1. User A opens Messages tab
2. Create/Open conversation with User B
3. **Check:** Do you see "Online" or "Offline" in the chat header?

#### Quick Test 2: Message Status 📬
1. User A sends a message to User B
2. **Check:** Does "Sent" appear below the message?
3. User B opens the conversation
4. **Check:** Does User A see status change to "Read"?

#### Quick Test 3: Typing Indicator ⌨️
1. User A and User B in same conversation
2. User B starts typing a message
3. **Check:** Does User A see "typing..." indicator?

#### Quick Test 4: Real-Time Updates 🔄
1. User A is on Messages list screen
2. User B sends a new message
3. **Check:** Does the message appear automatically without refresh?

#### Quick Test 5: Badge 🔴
1. User A has unread messages
2. **Check:** Does red badge appear on Messages tab?
3. Open and read messages
4. **Check:** Does badge disappear?

---

### Step 5: Check for Errors

**Open Browser Console:**
- Press `F12` (or right-click → Inspect)
- Go to "Console" tab
- Look for red error messages

**What to report:**
- ✅ No errors
- ❌ Errors found (copy the error message)

---

## What to Tell Me

After testing, let me know:

1. **✅ What worked:**
   - List features that work correctly

2. **❌ What didn't work:**
   - List features with issues
   - Describe what happened

3. **🐛 Errors:**
   - Copy any error messages from console

4. **📸 Screenshots:**
   - If possible, share screenshots of issues

---

## Need Help?

If you're stuck:
1. Check **TESTING-CHECKLIST.md** for detailed steps
2. Check **INTERACTIVE-TESTING.md** for test scenarios
3. Report the issue and I'll help debug!

---

**Ready? Let's test! 🚀**



