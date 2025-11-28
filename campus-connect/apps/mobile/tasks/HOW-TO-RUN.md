# How to Run the App - Step by Step

## 🚀 Quick Start

### Step 1: Open Terminal/PowerShell

**Windows:**
- Press `Win + X`
- Select "Windows PowerShell" or "Terminal"
- Or search for "PowerShell" in Start menu

---

### Step 2: Navigate to App Directory

Copy and paste this command:

```powershell
cd "C:\Users\Ahmed Sameh\H project\campus-connect\apps\mobile"
```

Press Enter.

**Verify you're in the right place:**
```powershell
Get-Location
```

Should show: `C:\Users\Ahmed Sameh\H project\campus-connect\apps\mobile`

---

### Step 3: Check Prerequisites

**Check Node.js:**
```powershell
node --versionnp
```
Should show: `v18.x.x` or higher

**Check npm:**
```powershell
npm --version
```
Should show: `v9.x.x` or higher

**If not installed:** Download from https://nodejs.org/

---

### Step 4: Install Dependencies (if needed)

**Check if node_modules exists:**
```powershell
Test-Path node_modules
```

**If it says `False`, install:**
```powershell
npm install
```

Wait 2-5 minutes for installation to complete.

---

### Step 5: Start the App

**Option A: Using npm (Recommended)**
```powershell
npm start
```

**Option B: Using npx**
```powershell
npx expo start --port 8081
```

**Option C: For web browser**
```powershell
npm run web
```

---

### Step 6: Open the App

**After running `npm start`, you'll see:**

```
› Metro waiting on exp://192.168.x.x:8081
› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)

› Press a │ open Android
› Press i │ open iOS simulator
› Press w │ open web
```

**Choose one:**
- Press `w` to open in web browser
- Press `a` for Android emulator
- Press `i` for iOS simulator
- Or scan QR code with Expo Go app on your phone

---

## 🐛 Common Errors

### Error: "npm is not recognized"

**Fix:**
1. Install Node.js from https://nodejs.org/
2. Restart your terminal
3. Try again

---

### Error: "Cannot find module"

**Fix:**
```powershell
npm install
```

---

### Error: "Port 8081 already in use"

**Fix Option 1: Kill the process**
```powershell
netstat -ano | findstr :8081
taskkill /PID <PID_NUMBER> /F
```

**Fix Option 2: Use different port**
```powershell
npx expo start --port 8082
```

---

### Error: "Expo CLI not found"

**Fix:**
```powershell
npm install -g expo-cli
```

Or just use `npx expo start` (no installation needed)

---

## 📋 Complete Command Sequence

Copy and paste these commands one by one:

```powershell
# 1. Navigate to app
cd "C:\Users\Ahmed Sameh\H project\campus-connect\apps\mobile"

# 2. Check Node.js
node --version

# 3. Install dependencies (if needed)
npm install

# 4. Start the app
npm start

# 5. Press 'w' to open in browser
```

---

## ✅ Success Indicators

**When it's working, you'll see:**
- ✅ Metro bundler starts
- ✅ QR code appears
- ✅ "Metro waiting on..." message
- ✅ No red error messages

**Then:**
- Press `w` for web
- Or scan QR code for mobile

---

## 🆘 Still Having Issues?

**Tell me:**
1. What command did you run?
2. What error message did you see? (copy/paste it)
3. What step are you stuck on?

I'll help you fix it! 🚀

---

## Alternative: Use VS Code Terminal

1. Open VS Code
2. Open the project folder
3. Press `` Ctrl + ` `` (backtick) to open terminal
4. Run the commands above

---

## Quick Reference

- **Start app:** `npm start`
- **Web browser:** Press `w` after starting
- **Clear cache:** `npx expo start --clear`
- **Install deps:** `npm install`
- **Check location:** `Get-Location`


