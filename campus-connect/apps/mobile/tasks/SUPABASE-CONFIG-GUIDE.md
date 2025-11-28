# Supabase Configuration Guide for Password Reset

## Issue: Password Reset Redirects to Web App Instead of Mobile App

### Problem
When users click the password reset link in their email, they're redirected to the web app's main page instead of the mobile app's reset password screen.

### Root Cause
Supabase uses the **Site URL** from the dashboard settings for email redirects, not the `redirectTo` parameter in the code. We need to configure Supabase properly.

---

## Solution: Configure Supabase Dashboard

### Step 1: Update Site URL

1. Go to **Supabase Dashboard** → **Project Settings** → **Authentication** → **URL Configuration**

2. **Site URL**: Set this to your mobile app's web URL:
   - **Development**: `http://localhost:8081`
   - **Production**: `https://campusconnect.app` (or your actual web URL)

3. **Redirect URLs**: Add these URLs (one per line):
   ```
   http://localhost:8081/auth/callback
   https://campusconnect.app/auth/callback
   exp://localhost:8081/--/auth/callback
   campusconnect://auth/callback
   ```

### Step 2: Verify Email Templates

1. Go to **Authentication** → **Email Templates** → **Reset Password**

2. Make sure the template includes the redirect URL properly:
   ```
   {{ .ConfirmationURL }}
   ```

3. The `redirectTo` parameter in code will be appended automatically.

---

## How It Works

### Flow:
1. User requests password reset → `auth.resetPassword(email)` is called
2. Code sets `redirectTo: 'http://localhost:8081/auth/callback?type=recovery'`
3. Supabase sends email with link containing tokens
4. User clicks link → Opens in browser/web view
5. Browser redirects to `/auth/callback?type=recovery&access_token=...&refresh_token=...`
6. Callback handler (`app/auth/callback.tsx`) processes tokens
7. If `type=recovery`, redirects to `/(auth)/reset-password`
8. User sets new password

---

## Testing

### Test Password Reset Flow:

1. **Request Reset**:
   - Go to Forgot Password screen
   - Enter email
   - Click "Send Reset Link"

2. **Check Email**:
   - Open email from Supabase
   - Click the reset link
   - Should open in browser/web view

3. **Verify Redirect**:
   - Should see "Password reset link verified! Redirecting..."
   - Should redirect to Reset Password screen
   - Should NOT redirect to web app main page

### If It Still Redirects to Web App:

1. **Check Supabase Dashboard**:
   - Verify Site URL is correct
   - Verify Redirect URLs include the callback URL
   - Save changes

2. **Check Email Link**:
   - The link should point to: `http://localhost:8081/auth/callback?type=recovery&...`
   - NOT to your web app's main page

3. **Clear Cache**:
   - Clear browser cache
   - Try the link again

---

## Alternative: Use Deep Links

If web redirects don't work, you can use deep links:

1. **Update redirectTo** in `lib/supabase.ts`:
   ```typescript
   const redirectTo = 'campusconnect://auth/callback?type=recovery';
   ```

2. **Configure Supabase**:
   - Add `campusconnect://auth/callback` to Redirect URLs

3. **Test**:
   - Link should open directly in the app
   - No browser redirect needed

---

## Current Configuration

**File**: `apps/mobile/lib/supabase.ts`

```typescript
const redirectTo = __DEV__
  ? 'http://localhost:8081/auth/callback?type=recovery'
  : 'https://campusconnect.app/auth/callback?type=recovery';
```

**Callback Handler**: `apps/mobile/app/auth/callback.tsx`
- Detects `type=recovery`
- Sets session with tokens
- Redirects to `/(auth)/reset-password`

---

## Quick Fix Checklist

- [ ] Supabase Site URL set to `http://localhost:8081` (dev) or your web URL (prod)
- [ ] Redirect URLs include `http://localhost:8081/auth/callback`
- [ ] Email template uses `{{ .ConfirmationURL }}`
- [ ] Test the reset link - should go to callback, then reset-password screen
- [ ] If still not working, check browser console for errors

---

**After configuring Supabase, test the password reset flow again!** 🚀


