# How to Kill Process on Port 8081

## 🎯 Quick Solution

### Method 1: One-Line Command (Easiest)

Copy and paste this single command:

```powershell
Get-NetTCPConnection -LocalPort 8081 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
```

Press Enter. Done! ✅

---

### Method 2: Step-by-Step (If Method 1 doesn't work)

#### Step 1: Find the Process ID (PID)

```powershell
netstat -ano | findstr :8081
```

**What you'll see:**
```
TCP    0.0.0.0:8081           0.0.0.0:0              LISTENING       12345
TCP    [::]:8081              [::]:0                 LISTENING       12345
```

**The last number (e.g., `12345`) is the Process ID (PID)**

---

#### Step 2: Kill the Process

Replace `12345` with the PID you found:

```powershell
taskkill /PID 12345 /F
```

**Example:**
If PID is `12345`, run:
```powershell
taskkill /PID 12345 /F
```

The `/F` flag forces the process to close.

---

## 🔧 Alternative Methods

### Method 3: Using PowerShell (More Detailed)

```powershell
# Find the process
$process = Get-NetTCPConnection -LocalPort 8081 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique

# Kill it
if ($process) {
    Stop-Process -Id $process -Force
    Write-Host "Process killed successfully!"
} else {
    Write-Host "No process found on port 8081"
}
```

---

### Method 4: Kill All Node Processes (Nuclear Option)

⚠️ **Warning:** This kills ALL Node.js processes, not just the one on port 8081

```powershell
taskkill /F /IM node.exe
```

Only use this if nothing else works!

---

## ✅ Verify It's Killed

After killing the process, verify:

```powershell
netstat -ano | findstr :8081
```

**If nothing shows up, the port is free!** ✅

**If something still shows:**
- Try Method 3 (PowerShell)
- Or restart your computer (last resort)

---

## 🚀 After Killing the Process

Now you can start your app:

```powershell
cd "C:\Users\Ahmed Sameh\H project\campus-connect\apps\mobile"
npm start
```

---

## 📋 Quick Reference

**Kill port 8081 (one line):**
```powershell
Get-NetTCPConnection -LocalPort 8081 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
```

**Find PID:**
```powershell
netstat -ano | findstr :8081
```

**Kill by PID:**
```powershell
taskkill /PID <PID_NUMBER> /F
```

**Verify port is free:**
```powershell
netstat -ano | findstr :8081
```

---

## 🐛 Troubleshooting

### "Access Denied" Error

**Solution:** Run PowerShell as Administrator
1. Right-click PowerShell
2. Select "Run as Administrator"
3. Try the command again

---

### Process Keeps Coming Back

**Solution:** Find what's starting it
1. Check if Expo is running in another terminal
2. Close all terminal windows
3. Kill the process again
4. Check Task Manager for `node.exe` processes

---

### Port Still in Use After Killing

**Solution:**
1. Wait 10-20 seconds (port may take time to release)
2. Check again: `netstat -ano | findstr :8081`
3. If still in use, restart your computer

---

## 💡 Pro Tips

1. **Prevent this in the future:**
   - Always stop Expo properly (Ctrl+C in the terminal)
   - Don't close terminal windows without stopping Expo first

2. **Use a different port:**
   ```powershell
   npx expo start --port 8082
   ```

3. **Create an alias:**
   You can create a PowerShell function to kill port 8081 easily:
   ```powershell
   function Kill-Port8081 {
       Get-NetTCPConnection -LocalPort 8081 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
   }
   ```
   Then just run: `Kill-Port8081`

---

**Now try starting your app again!** 🚀



