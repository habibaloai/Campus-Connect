# 🚨 URGENT: Fix Friend Request Notifications

## Problem
Friend request notifications are not working - when someone sends a friend request, no notification is created.

## Immediate Fix

**Run this SQL script in Supabase SQL Editor RIGHT NOW:**
```
campus-connect/supabase-migrations/FIX_FRIEND_REQUEST_NOTIFICATIONS_NOW.sql
```

This script will:
1. ✅ Ensure notifications table exists
2. ✅ Enable real-time for notifications
3. ✅ Create/update the trigger function with proper permissions
4. ✅ Recreate the trigger
5. ✅ Backfill missing notifications for recent requests
6. ✅ Verify everything is working

## What Was Wrong

The trigger function needs:
- `SECURITY DEFINER` - to bypass RLS (Row Level Security)
- `SET search_path = public` - to ensure it can access tables
- Better error handling - to log issues in Supabase logs

## After Running the Fix

1. **Check Supabase Logs**:
   - Go to Supabase Dashboard → Logs
   - Look for messages starting with "✅" (success) or "❌" (errors)
   - This will tell you if notifications are being created

2. **Test It**:
   - Have someone send you a friend request
   - You should receive a notification immediately
   - Check the notifications screen in the app

3. **If Still Not Working**:
   - Run the diagnostic script: `DIAGNOSE_AND_FIX_FRIEND_REQUEST_NOTIFICATIONS.sql`
   - Check the Supabase logs for error messages
   - Verify real-time subscription is working in the app (check browser console)

## Real-Time Subscription

The app already has real-time subscriptions configured. After the trigger is fixed, notifications should appear instantly.

Check browser console for:
- `✅ Successfully subscribed to notifications real-time updates`
- `New notification received: {...}`

## Next Steps

After fixing friend requests, also run:
```
campus-connect/supabase-migrations/ensure-all-notifications-work.sql
```

This ensures ALL notification types work (messages, likes, comments, etc.)

