# ⚡ Quick Kill Port 8081

## One-Line Command (Copy & Paste)

```powershell
Get-NetTCPConnection -LocalPort 8081 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
```

---

## Step-by-Step Method

### Step 1: Find PID
```powershell
netstat -ano | findstr :8081
```

### Step 2: Kill Process (replace 12345 with your PID)
```powershell
taskkill /PID 12345 /F
```

---

## Verify Port is Free

```powershell
netstat -ano | findstr :8081
```

If nothing shows up, the port is free! ✅

---

**That's it!** Now you can start your app with `npm start` 🚀


