# Supabase Storage Setup for Avatar Uploads

## Problem
The app is trying to upload avatar images to a Supabase Storage bucket named `avatars`, but the bucket doesn't exist, causing the error:
```
StorageApiError: Bucket not found
```

## Solution

### Step 1: Create the Storage Bucket

1. **Go to Supabase Dashboard**
   - Navigate to your project at [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Select your project

2. **Open Storage**
   - Click on **Storage** in the left sidebar
   - You should see an empty storage section

3. **Create New Bucket**
   - Click the **"New bucket"** button (or **"Create bucket"**)
   - Fill in the details:
     - **Name**: `avatars` (must match exactly)
     - **Public bucket**: ✅ **Yes** (check this box - needed for public avatar URLs)
     - **File size limit**: 5 MB (recommended)
     - **Allowed MIME types**: `image/*` (optional, but recommended)

4. **Click "Create bucket"**

### Step 2: Set Up Bucket Policies (RLS)

After creating the bucket, you need to set up Row Level Security (RLS) policies:

1. **Go to Storage Policies**
   - In the Storage section, click on the `avatars` bucket
   - Click on the **"Policies"** tab

2. **Create Upload Policy** (for authenticated users)
   - Click **"New Policy"**
   - Policy name: `Allow authenticated users to upload avatars`
   - Allowed operation: **INSERT**
   - Policy definition:
     ```sql
     (bucket_id = 'avatars'::text) AND (auth.role() = 'authenticated'::text)
     ```
   - Click **"Review"** then **"Save policy"**

3. **Create Read Policy** (for public access)
   - Click **"New Policy"**
   - Policy name: `Allow public read access to avatars`
   - Allowed operation: **SELECT**
   - Policy definition:
     ```sql
     (bucket_id = 'avatars'::text)
     ```
   - Click **"Review"** then **"Save policy"**

4. **Create Update Policy** (for users to update their own avatars)
   - Click **"New Policy"**
   - Policy name: `Allow users to update their own avatars`
   - Allowed operation: **UPDATE**
   - Policy definition:
     ```sql
     (bucket_id = 'avatars'::text) AND (auth.role() = 'authenticated'::text)
     ```
   - Click **"Review"** then **"Save policy"**

### Step 3: Verify Setup

1. **Test the bucket exists**
   - In Storage, you should see the `avatars` bucket listed
   - It should show as **Public**

2. **Test upload** (optional)
   - Try uploading an avatar in the app
   - Check the Storage → `avatars` bucket to see if the file appears

## Alternative: Quick Setup via SQL

If you prefer using SQL, you can create the bucket with this SQL command (run in Supabase SQL Editor):

```sql
-- Create the avatars bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5 MB in bytes
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Create policy for authenticated users to upload
CREATE POLICY "Allow authenticated users to upload avatars"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

-- Create policy for public read access
CREATE POLICY "Allow public read access to avatars"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Create policy for users to update their own avatars
CREATE POLICY "Allow users to update their own avatars"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars');
```

## Troubleshooting

### Error: "Bucket not found"
- ✅ Make sure the bucket name is exactly `avatars` (lowercase, no spaces)
- ✅ Check that the bucket was created successfully in Storage dashboard

### Error: "new row violates row-level security policy"
- ✅ Make sure you've created the RLS policies as described above
- ✅ Verify the user is authenticated (logged in)

### Error: "Upload failed"
- ✅ Check file size (should be under 5 MB)
- ✅ Check file type (should be an image: jpg, png, gif, webp)
- ✅ Check browser console for detailed error messages

### Avatar not displaying after upload
- ✅ Make sure the bucket is set to **Public**
- ✅ Check that the public URL is being generated correctly
- ✅ Verify the file was uploaded successfully in Storage dashboard

## Current Implementation

The app now handles missing buckets gracefully:
- ✅ Shows a user-friendly error message if bucket doesn't exist
- ✅ Still saves other profile data (bio, interests, etc.) even if avatar upload fails
- ✅ Provides clear instructions on what needs to be configured

After setting up the bucket, avatar uploads should work seamlessly!

