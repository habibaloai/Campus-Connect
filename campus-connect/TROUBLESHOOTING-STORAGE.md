# Troubleshooting: Storage Bucket Access Issues

If you're seeing "bucket avatars not found" or permission errors, follow these steps:

## Step 1: Verify Bucket Exists and is Public

1. Go to **Supabase Dashboard** → **Storage**
2. Check if you see a bucket named **`avatars`** (exactly, lowercase)
3. Click on the bucket
4. Verify it's set to **Public** (should show "Public bucket" or similar)

## Step 2: Run/Re-run the SQL Migration

The RLS policies are critical. Run this in **Supabase SQL Editor**:

1. Go to **SQL Editor** in Supabase Dashboard
2. Open `supabase-migrations/setup-avatars-storage.sql`
3. Copy the **entire** SQL content
4. Paste into SQL Editor
5. Click **Run**

This will:
- Create the bucket if it doesn't exist
- Set up all necessary RLS policies
- Drop and recreate policies to avoid conflicts

## Step 3: Verify RLS Policies

1. Go to **Storage** → **avatars** bucket
2. Click on **Policies** tab
3. You should see these policies:
   - ✅ "Users can upload own avatars" (INSERT)
   - ✅ "Public avatar access" (SELECT)
   - ✅ "Users can delete own avatars" (DELETE)

If any are missing, re-run the SQL migration.

## Step 4: Check Authentication

Make sure you're signed in to the app:
- The upload requires `auth.uid()` to be set
- If you're not authenticated, uploads will fail with permission errors

## Step 5: Test with Simple SQL Query

Run this in SQL Editor to verify bucket access:

```sql
-- Check if bucket exists
SELECT id, name, public FROM storage.buckets WHERE id = 'avatars';

-- Check RLS policies
SELECT policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage';
```

## Common Issues

### Issue: "Bucket not found" but bucket exists
**Solution**: 
- Verify bucket name is exactly `avatars` (lowercase, no spaces)
- Check bucket is set to Public
- Re-run SQL migration

### Issue: "Permission denied" or "Row-level security policy violation"
**Solution**:
- Make sure you're signed in
- Re-run the SQL migration to ensure policies are created
- Check that policies allow INSERT for authenticated users

### Issue: Empty buckets list `[]`
**Solution**: 
- This is normal - `listBuckets()` requires admin permissions
- The app now tries to upload directly instead of checking first
- If upload fails, check the actual error message

### Issue: Upload succeeds but shows error
**Solution**: 
- This was a bug that's now fixed
- Old avatar deletion happens after upload
- Only real errors will show alerts now

## Manual Policy Creation

If SQL migration doesn't work, create policies manually:

1. Go to **Storage** → **avatars** → **Policies**
2. Click **New Policy**
3. For **INSERT** policy:
   - Name: "Users can upload own avatars"
   - Allowed operation: INSERT
   - Policy definition:
     ```sql
     bucket_id = 'avatars' 
     AND auth.uid() IS NOT NULL
     AND (name LIKE auth.uid()::text || '_%' OR name LIKE auth.uid()::text || '-%')
     ```
4. For **SELECT** policy:
   - Name: "Public avatar access"
   - Allowed operation: SELECT
   - Policy definition:
     ```sql
     bucket_id = 'avatars'
     ```
5. For **DELETE** policy:
   - Name: "Users can delete own avatars"
   - Allowed operation: DELETE
   - Policy definition:
     ```sql
     bucket_id = 'avatars'
     AND (name LIKE auth.uid()::text || '_%' OR name LIKE auth.uid()::text || '-%')
     ```

## Still Not Working?

1. Check browser/app console for detailed error messages
2. Verify Supabase project URL and anon key are correct
3. Try creating a test file manually in Storage to verify bucket works
4. Check Supabase project logs for server-side errors


