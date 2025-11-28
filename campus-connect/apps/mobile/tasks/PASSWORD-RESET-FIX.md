# Password Reset Email Not Sending - Fix Guide

## Issue
Password reset link never gets sent when user requests password reset.

---

## Possible Causes

### 1. Supabase Email Not Configured
- Email provider not set up in Supabase
- SMTP settings not configured
- Email templates not enabled

### 2. Redirect URL Not Allowed
- `redirectTo` URL not in Supabase's allowed redirect URLs
- Site URL not configured correctly

### 3. Email Provider Issues
- Supabase's default email provider might be disabled
- Rate limiting
- Email service down

---

## Fix Steps

### Step 1: Check Supabase Email Configuration

1. **Go to Supabase Dashboard** → **Authentication** → **Email Templates**
2. **Check "Reset Password" template**:
   - Should be enabled
   - Should have content
   - Should include `{{ .ConfirmationURL }}`

3. **Go to** → **Project Settings** → **Auth** → **SMTP Settings**
   - Check if SMTP is configured
   - If not, Supabase uses their default email service (should work)

### Step 2: Configure Redirect URLs

1. **Go to** → **Authentication** → **URL Configuration**
2. **Site URL**: Set to:
   - Development: `http://localhost:8081`
   - Production: Your actual web URL

3. **Redirect URLs**: Add these (one per line):
   ```
   http://localhost:8081/auth/callback
   https://campusconnect.app/auth/callback
   exp://localhost:8081/--/auth/callback
   campusconnect://auth/callback
   ```

4. **Save** changes

### Step 3: Check Email Provider

1. **Go to** → **Project Settings** → **Auth**
2. **Check "Enable email confirmations"**:
   - Should be enabled for password reset to work
   - Or disabled if you want immediate password reset

3. **Check "Enable email change confirmations"**:
   - Should be enabled

### Step 4: Test Email Sending

1. **Go to** → **Authentication** → **Users**
2. **Click on a user**
3. **Click "Send password reset email"** (if available)
4. **Check if email is sent**

---

## Debugging

### Check Browser Console

When you click "Send Reset Link", check the console for:

```
Sending password reset email to: user@example.com
Using redirectTo: http://localhost:8081/auth/callback?type=recovery
Password reset error details: { message, status, name }
```

### Common Errors

**Error: "Invalid redirect URL"**
- **Fix**: Add redirect URL to Supabase allowed URLs

**Error: "Email rate limit exceeded"**
- **Fix**: Wait a few minutes, or increase rate limit in Supabase

**Error: "Email provider not configured"**
- **Fix**: Configure SMTP in Supabase settings

**No error, but no email sent**
- **Check**: Supabase email logs
- **Check**: Spam folder
- **Check**: Email provider status

---

## Code Changes Made

### 1. Enhanced Error Logging (`lib/supabase.ts`)
- Added detailed error logging
- Logs email and redirectTo URL
- Logs error details for debugging

### 2. Better Error Handling (`forgot-password.tsx`)
- Shows specific errors for rate limiting
- Shows validation errors
- Still maintains security (doesn't reveal if email exists)

---

## Testing

### Test Password Reset:

1. **Go to Forgot Password screen**
2. **Enter a valid email** (that has an account)
3. **Click "Send Reset Link"**
4. **Check browser console** (F12) for logs:
   - Should see: "Sending password reset email to: ..."
   - Should see: "Using redirectTo: ..."
   - Should see: "Password reset email sent successfully" OR error details

5. **Check email inbox** (and spam folder)
6. **If no email**:
   - Check Supabase Dashboard → Authentication → Email Templates
   - Check Supabase logs
   - Verify redirect URLs are configured

---

## Quick Fix Checklist

- [ ] Supabase email templates are enabled
- [ ] Redirect URLs are configured in Supabase
- [ ] Site URL is set correctly
- [ ] Email provider is configured (or using Supabase default)
- [ ] Check browser console for errors
- [ ] Check Supabase logs for email sending status
- [ ] Verify email isn't in spam folder

---

## If Still Not Working

1. **Check Supabase Logs**:
   - Go to **Logs** → **Auth Logs**
   - Look for password reset attempts
   - Check for errors

2. **Test with Supabase Dashboard**:
   - Try sending password reset from Dashboard
   - If that works, issue is with redirect URL
   - If that doesn't work, issue is with email configuration

3. **Check Email Provider**:
   - If using custom SMTP, verify credentials
   - If using Supabase default, check service status

4. **Verify Redirect URL Format**:
   - Must be a valid web URL (http:// or https://)
   - Must be in allowed redirect URLs
   - Must include the callback path

---

## Code Verification

The code now:
- ✅ Validates email format
- ✅ Logs detailed information
- ✅ Handles rate limiting errors
- ✅ Maintains security (doesn't reveal if email exists)
- ✅ Uses correct redirectTo format

---

**After configuring Supabase, test again and check the console logs!** 🔍



