# Complete Guide: Setting Up Event Images in Supabase

This guide will walk you through setting up Supabase Storage to enable event image uploads in your Campus Connect app.

## Prerequisites

- Access to your Supabase Dashboard
- Your Supabase project URL: `https://ojmkhimriptucfsulfzv.supabase.co`

## Step 1: Create the Storage Bucket

1. **Go to Supabase Dashboard**
   - Navigate to [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Select your project

2. **Open Storage Section**
   - Click on **"Storage"** in the left sidebar
   - You'll see a list of existing buckets (if any)

3. **Create New Bucket**
   - Click the **"New bucket"** button (or **"Create bucket"**)
   - Fill in the bucket details:
     - **Name**: `events` (must be exactly this name, lowercase)
     - **Public bucket**: ✅ **Check this box** (required for public image URLs)
     - **File size limit**: `5 MB` (recommended)
     - **Allowed MIME types**: `image/*` (optional, but recommended for security)
   - Click **"Create bucket"**

   ✅ **Important**: The bucket name must be exactly `events` (lowercase) for the app to work correctly.

## Step 2: Set Up Row Level Security (RLS) Policies

After creating the bucket, you need to set up policies so users can upload and view images.

### 2.1: Go to Storage Policies

1. In the Storage section, click on the `events` bucket you just created
2. Click on the **"Policies"** tab
3. You'll see a list of policies (initially empty)

### 2.2: Create Upload Policy (for authenticated users)

1. Click **"New Policy"**
2. Select **"Create a policy from scratch"** (or use template)
3. Configure the policy:
   - **Policy name**: `Allow authenticated users to upload event images`
   - **Allowed operation**: Select **INSERT**
   - **Policy definition**: Use this SQL:
     ```sql
     (bucket_id = 'events'::text) AND (auth.role() = 'authenticated'::text)
     ```
   - Click **"Review"** then **"Save policy"**

### 2.3: Create Read Policy (for public access)

1. Click **"New Policy"** again
2. Configure:
   - **Policy name**: `Allow public read access to event images`
   - **Allowed operation**: Select **SELECT**
   - **Policy definition**: Use this SQL:
     ```sql
     (bucket_id = 'events'::text)
     ```
   - Click **"Review"** then **"Save policy"**

### 2.4: Create Update Policy

**Option A: Simple (Works without organizer_id column)**
1. Click **"New Policy"** again
2. Configure:
   - **Policy name**: `Allow authenticated users to update event images`
   - **Allowed operation**: Select **UPDATE**
   - **Policy definition**: Use this SQL:
     ```sql
     (bucket_id = 'events'::text) AND (auth.role() = 'authenticated'::text)
     ```
   - Click **"Review"** then **"Save policy"**

**Option B: Advanced (Requires organizer_id column - run EVENT_FEATURES_MIGRATION.sql first)**
1. Click **"New Policy"** again
2. Configure:
   - **Policy name**: `Allow event organizers to update their event images`
   - **Allowed operation**: Select **UPDATE**
   - **Policy definition**: Use this SQL:
     ```sql
     (bucket_id = 'events'::text) AND (
       auth.uid() = (
         SELECT organizer_id 
         FROM events 
         WHERE id::text = split_part(name, '-', 2)
       )
     )
     ```
   - Click **"Review"** then **"Save policy"**

**💡 Recommendation**: Use Option A if you haven't run the EVENT_FEATURES_MIGRATION.sql yet. You can always update the policy later to Option B for better security.

### 2.5: Create Delete Policy

**Option A: Simple (Works without organizer_id column)**
1. Click **"New Policy"** again
2. Configure:
   - **Policy name**: `Allow authenticated users to delete event images`
   - **Allowed operation**: Select **DELETE**
   - **Policy definition**: Use this SQL:
     ```sql
     (bucket_id = 'events'::text) AND (auth.role() = 'authenticated'::text)
     ```
   - Click **"Review"** then **"Save policy"**

**Option B: Advanced (Requires organizer_id column - run EVENT_FEATURES_MIGRATION.sql first)**
1. Click **"New Policy"** again
2. Configure:
   - **Policy name**: `Allow event organizers to delete their event images`
   - **Allowed operation**: Select **DELETE**
   - **Policy definition**: Use this SQL:
     ```sql
     (bucket_id = 'events'::text) AND (
       auth.uid() = (
         SELECT organizer_id 
         FROM events 
         WHERE id::text = split_part(name, '-', 2)
       )
     )
     ```
   - Click **"Review"** then **"Save policy"**

**💡 Recommendation**: Use Option A if you haven't run the EVENT_FEATURES_MIGRATION.sql yet. You can always update the policy later to Option B for better security.

## Step 3: Add image_url Column to Events Table

1. **Go to SQL Editor**
   - Click on **"SQL Editor"** in the left sidebar
   - Click **"New query"**

2. **Run the SQL Command**
   - Paste this SQL command:
     ```sql
     ALTER TABLE events ADD COLUMN IF NOT EXISTS image_url TEXT;
     ```
   - Click **"Run"** (or press `Cmd+Enter` / `Ctrl+Enter`)
   - You should see a success message

3. **Verify the Column**
   - Go to **"Table Editor"** → **"events"** table
   - You should see the `image_url` column in the table structure

## Step 4: Verify the Setup

### Test Upload (Optional)

You can test if the bucket is working by:

1. Going to **Storage** → **events** bucket
2. Click **"Upload file"**
3. Upload a test image
4. If successful, you'll see the file in the bucket

### Test in the App

1. Open your Campus Connect app
2. Navigate to Events
3. Try creating a new event with an image
4. The image should upload successfully and display on the event card

## Troubleshooting

### Error: "Bucket not found"
- **Solution**: Make sure the bucket name is exactly `events` (lowercase, no spaces)
- Check that the bucket exists in Storage → Buckets

### Error: "Permission denied" or "Row Level Security policy violation"
- **Solution**: 
  - Verify all RLS policies are created correctly
  - Make sure the bucket is set to **Public**
  - Check that you're logged in as an authenticated user

### Images not displaying
- **Solution**:
  - Verify the `image_url` column exists in the `events` table
  - Check that the image URL is being saved correctly
  - Ensure the bucket is public (not private)

### Upload fails silently
- **Solution**:
  - Check the browser console for error messages
  - Verify file size is under 5 MB
  - Check that the file is a valid image format (jpg, png, etc.)

## Quick Reference: All SQL Commands

If you prefer to run everything via SQL Editor, here's a complete script:

```sql
-- 1. Add image_url column (if not exists)
ALTER TABLE events ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 2. Create storage policies (run these after creating the bucket)
-- Note: These need to be created via the Storage UI, but here's the SQL for reference:

-- Upload Policy
CREATE POLICY "Allow authenticated users to upload event images"
ON storage.objects FOR INSERT
TO authenticated
USING (bucket_id = 'events'::text);

-- Read Policy  
CREATE POLICY "Allow public read access to event images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'events'::text);

-- Update Policy
CREATE POLICY "Allow event organizers to update their event images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'events'::text AND
  auth.uid() = (
    SELECT organizer_id 
    FROM events 
    WHERE id::text = split_part(name, '-', 2)
  )
);

-- Delete Policy
CREATE POLICY "Allow event organizers to delete their event images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'events'::text AND
  auth.uid() = (
    SELECT organizer_id 
    FROM events 
    WHERE id::text = split_part(name, '-', 2)
  )
);
```

## After Setup

Once everything is set up:

✅ Events can be created with images  
✅ Images will display on event cards  
✅ Users can upload photos when creating events  
✅ Event images will be stored securely in Supabase Storage  

## Need Help?

If you encounter any issues:
1. Check the Supabase logs in the Dashboard → Logs
2. Verify all policies are active (green checkmark)
3. Ensure the bucket is public
4. Check that the `image_url` column exists in the events table

