# Real-Time Messaging Features - Setup Instructions

## Step 1: Run Database Migration (REQUIRED)

Before testing any of the new features, you must update your database schema.

### Instructions:
1. Open your **Supabase Dashboard**: https://supabase.com/dashboard
2. Select your project
3. Go to **SQL Editor** (in the left sidebar)
4. Click **"New Query"**
5. Copy and paste the contents of: `supabase-migrations/add-message-status.sql`
6. Click **"Run"** (or press Ctrl+Enter)
7. Verify success - you should see "Success. No rows returned" or similar

### Verify Migration:
- Go to **Database** → **Tables** → **messages**
- Check that the table now has these columns:
  - `status` (TEXT)
  - `read_at` (TIMESTAMP WITH TIME ZONE)

---

## Step 2: What's Already Done ✅

The following code changes have been completed:

1. ✅ **Database Migration File Created** - Ready to run in Supabase
2. ✅ **API Functions Added** - All real-time functions added to `lib/supabase.ts`:
   - `trackPresence()` - Track online status
   - `subscribeToPresence()` - Subscribe to online status changes
   - `sendTypingIndicator()` - Send typing status
   - `subscribeToTyping()` - Subscribe to typing indicators
   - `updateMessageStatus()` - Update message delivery status
   - `subscribeToMessageStatus()` - Subscribe to status updates
   - `subscribeToConversations()` - Real-time conversation updates
3. ✅ **Existing Functions Updated** - Message queries now include `status` and `read_at` fields

---

## Step 3: Next Steps - UI Implementation

After running the migration, the following UI tasks need to be completed:

### Task 3: Online Status Indicators
- Display online/offline status in chat screen header
- Show green/gray dot next to user name
- Real-time status updates

### Task 4: Message Status Indicators
- Show "Sent", "Delivered", "Read" below outgoing messages
- Real-time status updates

### Task 5: Real-Time Messages List
- Auto-update conversations list when new messages arrive
- Update last message preview and unread counts

### Task 6: Typing Indicators
- Show "typing..." when other user is typing
- Debounced typing detection

### Task 7: Notification Badges
- Auto-update badge count in real-time
- Sync across all app screens

### Task 8: App State Management
- Track app foreground/background
- Update presence when app state changes

### Task 9: Testing
- Test all features end-to-end
- Verify real-time updates work correctly

---

## Step 4: Testing After Migration

Once you've run the migration, you can test:

1. **Send a message** - It should automatically have `status='sent'`
2. **Check database** - Verify messages have status column populated
3. **Open conversation** - Messages should be marked as read

---

## Important Notes:

- ⚠️ **The migration MUST be run before any features will work**
- 🔄 **After migration, restart your Expo app** to pick up the new API functions
- 🧪 **Test incrementally** - Implement one feature at a time and test it
- 📱 **Use two devices/accounts** - Real-time features need multiple users to test properly

---

## Need Help?

- Check Supabase logs if migration fails
- Verify your Supabase project has real-time enabled
- Ensure you're connected to the correct Supabase project



