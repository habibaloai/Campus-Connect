# How to Delete All Accounts from Supabase

## ⚠️ WARNING
**This will permanently delete ALL user accounts and their data!** Use with caution. This is typically done for:
- Testing/development cleanup
- Resetting a development database
- Starting fresh

---

## Method 1: Supabase Dashboard (Recommended)

### Step 1: Delete from Authentication

1. Go to **Supabase Dashboard** → **Authentication** → **Users**
2. You'll see a list of all users
3. **Option A: Delete One by One**
   - Click the three dots (⋯) next to each user
   - Click "Delete user"
   - Confirm deletion
   - Repeat for each user

4. **Option B: Delete Multiple (if available)**
   - Select multiple users using checkboxes
   - Click "Delete selected"
   - Confirm deletion

### Step 2: Delete from Profiles Table

1. Go to **Supabase Dashboard** → **Database** → **Table Editor**
2. Select the **profiles** table
3. **Option A: Delete All Rows**
   - Click "Delete" button (if available)
   - Or select all rows and delete

4. **Option B: Use SQL Editor** (see Method 2 below)

---

## Method 2: SQL Editor (Faster for Many Users)

### Step 1: Delete All Users via SQL

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Click **New Query**
3. Copy and paste this SQL:

```sql
-- Delete all user profiles first (due to foreign key constraints)
DELETE FROM profiles;

-- Delete all auth users
-- Note: This requires admin access and may need to be done via Supabase Dashboard
-- The auth.users table is protected, so use the Dashboard method for auth users
```

**Important**: The `auth.users` table is protected and cannot be deleted via SQL directly. You must use the Dashboard.

### Step 2: Delete Auth Users via Dashboard

After deleting profiles, go back to **Authentication** → **Users** and delete all users manually.

---

## Method 3: Complete Database Reset (Nuclear Option)

⚠️ **This deletes EVERYTHING - use only for development!**

### Option A: Reset Database via Dashboard

1. Go to **Supabase Dashboard** → **Settings** → **Database**
2. Scroll to **Danger Zone**
3. Click **Reset Database** (if available)
4. ⚠️ This will delete ALL tables and data!

### Option B: Drop and Recreate Tables

1. Go to **SQL Editor**
2. Run this (⚠️ **DELETES EVERYTHING**):

```sql
-- Drop all tables (in correct order to handle foreign keys)
DROP TABLE IF EXISTS event_attendees CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS post_replies CASCADE;
DROP TABLE IF EXISTS post_likes CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversation_participants CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
-- Add other tables as needed

-- Then delete all auth users via Dashboard
```

---

## Method 4: Delete Specific Users Only

If you only want to delete certain users:

### Via SQL:

```sql
-- Delete specific user's profile (replace 'user-id-here' with actual user ID)
DELETE FROM profiles WHERE id = 'user-id-here';

-- Then delete from Dashboard: Authentication → Users
```

### Via Dashboard:

1. Go to **Authentication** → **Users**
2. Search for the user
3. Click three dots (⋯) → **Delete user**
4. Confirm

---

## Method 5: Automated Script (For Development)

If you need to delete all users frequently during development:

### Create a SQL Function:

```sql
-- This function deletes all profiles
-- Auth users must still be deleted via Dashboard
CREATE OR REPLACE FUNCTION delete_all_profiles()
RETURNS void AS $$
BEGIN
  DELETE FROM profiles;
END;
$$ LANGUAGE plpgsql;

-- Run it:
SELECT delete_all_profiles();
```

---

## Step-by-Step: Complete Cleanup

### For Testing/Development:

1. **Delete Profiles**:
   ```sql
   DELETE FROM profiles;
   ```

2. **Delete Auth Users**:
   - Go to **Authentication** → **Users**
   - Delete all users manually

3. **Delete Related Data** (optional):
   ```sql
   DELETE FROM event_attendees;
   DELETE FROM events;
   DELETE FROM messages;
   DELETE FROM conversations;
   DELETE FROM posts;
   -- Add other tables as needed
   ```

4. **Verify**:
   - Check **Authentication** → **Users** (should be empty)
   - Check **Database** → **Table Editor** → **profiles** (should be empty)

---

## Important Notes

### Foreign Key Constraints

Some tables have foreign keys to `profiles`:
- Delete child records first (e.g., `event_attendees`, `messages`)
- Then delete parent records (e.g., `profiles`)

### Cascade Deletes

If your schema has `ON DELETE CASCADE`:
- Deleting from `profiles` will automatically delete related records
- Check your schema to see which tables cascade

### Auth Users vs Profiles

- **auth.users**: Managed by Supabase Auth (delete via Dashboard)
- **profiles**: Your custom table (can delete via SQL)

**Always delete profiles first, then auth users!**

---

## Quick Reference

### Delete All Profiles:
```sql
DELETE FROM profiles;
```

### Delete All Events:
```sql
DELETE FROM event_attendees;
DELETE FROM events;
```

### Delete All Messages:
```sql
DELETE FROM messages;
DELETE FROM conversation_participants;
DELETE FROM conversations;
```

### Delete All Posts:
```sql
DELETE FROM post_replies;
DELETE FROM post_likes;
DELETE FROM posts;
```

---

## Verification

After deletion, verify:

1. **Authentication** → **Users**: Should show 0 users
2. **Database** → **Table Editor** → **profiles**: Should be empty
3. **Database** → **Table Editor** → Check other tables: Should be empty (if you deleted related data)

---

## Troubleshooting

### Error: "Cannot delete user"
- Make sure you delete from `profiles` table first
- Check for foreign key constraints
- Delete related data first

### Error: "Foreign key constraint"
- Delete child records first
- Check the order of deletion
- Use `CASCADE` if needed

### Users still appear
- Refresh the Dashboard
- Check if you deleted from both `auth.users` and `profiles`
- Clear browser cache

---

## Safety Tips

1. **Backup First**: Export data before deleting (if needed)
2. **Test Environment**: Only do this in development/test
3. **Double Check**: Verify you're in the right project
4. **One at a Time**: For production, delete users individually

---

**Need help? Check Supabase documentation or contact support!** 🚀



