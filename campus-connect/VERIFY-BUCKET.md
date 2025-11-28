# Verify Bucket Setup - Step by Step

The "Bucket not found" error means Supabase can't find the "avatars" bucket. Follow these steps:

## Step 1: Verify You're Using the Correct Supabase Project

1. **Check your app's Supabase URL:**
   - Look at your `.env` file or `app.config.ts`
   - Note the Supabase project URL (e.g., `https://xxxxx.supabase.co`)

2. **Open Supabase Dashboard:**
   - Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Make sure you're logged into the **same project** that your app is using
   - Check the project URL in Settings → API - it should match your app's URL

## Step 2: Verify Bucket Exists

1. In Supabase Dashboard, go to **Storage** (left sidebar)
2. Look for a bucket named **`avatars`** (exactly, lowercase)
3. If you DON'T see it:
   - Click **"New bucket"** or **"Create bucket"**
   - Name: `avatars` (lowercase, no spaces)
   - **Toggle "Public bucket" to ON** (very important!)
   - Click **"Create bucket"**

## Step 3: Verify Bucket is Public

1. Click on the **`avatars`** bucket
2. Check the settings - it should say **"Public bucket"** or have a toggle that's ON
3. If it's not public:
   - Click the settings/gear icon
   - Toggle **"Public bucket"** to ON
   - Save

## Step 4: Verify RLS Policies

1. Still in the **`avatars`** bucket, click on **"Policies"** tab
2. You should see 4 policies:
   - ✅ "Users can upload own avatars" (INSERT)
   - ✅ "Public avatar access" (SELECT)
   - ✅ "Users can delete own avatars" (DELETE)
   - ✅ "Users can update own avatars" (UPDATE)

3. If policies are missing:
   - Go to **SQL Editor**
   - Run the SQL from `supabase-migrations/setup-avatars-storage.sql`
   - This will create the bucket and policies

## Step 5: Test Bucket Access Manually

1. In Supabase Dashboard → Storage → `avatars`
2. Try uploading a test file manually:
   - Click **"Upload file"**
   - Upload any small image
   - If this works, the bucket is accessible
   - If this fails, there's a permissions issue

## Step 6: Check App Configuration

Make sure your app is using the correct Supabase credentials:

1. Check your `.env` file (if using Expo, might be `.env.local` or in `app.config.ts`):
   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

2. Or check `app.config.ts`:
   ```typescript
   extra: {
     supabaseUrl: "https://your-project.supabase.co",
     supabaseAnonKey: "your-anon-key"
   }
   ```

3. **Verify the URL matches** the one in Supabase Dashboard → Settings → API

## Step 7: Common Issues

### Issue: Bucket exists but still getting 404
**Possible causes:**
- App is using wrong Supabase project URL
- Bucket name has a typo (should be exactly `avatars`, lowercase)
- Bucket is in a different Supabase project

**Solution:**
- Double-check the Supabase URL in your app matches the dashboard
- Verify bucket name is exactly `avatars` (no capital letters, no spaces)

### Issue: "Permission denied" instead of "Bucket not found"
**Solution:**
- Re-run the SQL migration to set up RLS policies
- Make sure you're signed in to the app when testing

### Issue: Bucket is private
**Solution:**
- Make sure the bucket is set to **Public**
- Public buckets are required for the app to access them

## Step 8: Quick Test Query

Run this in Supabase SQL Editor to verify bucket exists:

```sql
SELECT id, name, public, created_at 
FROM storage.buckets 
WHERE id = 'avatars';
```

If this returns a row, the bucket exists. If it returns nothing, the bucket doesn't exist.

## Still Not Working?

If you've verified all the above and it still doesn't work:

1. **Check the exact error message** - it might give more clues
2. **Try creating the bucket manually** in the dashboard (not via SQL)
3. **Check if you have multiple Supabase projects** - make sure you're using the right one
4. **Restart your app** after making changes to ensure new config is loaded


