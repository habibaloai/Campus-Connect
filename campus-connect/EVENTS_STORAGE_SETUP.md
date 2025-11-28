# Events Storage Bucket Setup

## Problem
The app is trying to upload event images to a Supabase Storage bucket named `events`, but the bucket doesn't exist, causing the error:
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

3. **Create New Bucket**
   - Click the **"New bucket"** button (or **"Create bucket"**)
   - Fill in the details:
     - **Name**: `events` (must match exactly)
     - **Public bucket**: ✅ **Yes** (check this box - needed for public event image URLs)
     - **File size limit**: 10 MB (recommended for event images)
     - **Allowed MIME types**: `image/*` (optional, but recommended)

4. **Click "Create bucket"**

### Step 2: Set Up Bucket Policies (RLS)

After creating the bucket, you need to set up Row Level Security (RLS) policies:

1. **Go to Storage Policies**
   - In the Storage section, click on the `events` bucket
   - Click on the **"Policies"** tab

2. **Create Upload Policy** (for authenticated users)
   - Click **"New Policy"**
   - Policy name: `Allow authenticated users to upload event images`
   - Allowed operation: **INSERT**
   - Policy definition:
     ```sql
     (bucket_id = 'events'::text) AND (auth.role() = 'authenticated'::text)
     ```
   - Click **"Review"** then **"Save policy"**

3. **Create Read Policy** (for public access)
   - Click **"New Policy"**
   - Policy name: `Allow public read access to event images`
   - Allowed operation: **SELECT**
   - Policy definition:
     ```sql
     (bucket_id = 'events'::text)
     ```
   - Click **"Review"** then **"Save policy"**

4. **Create Update Policy** (for authenticated users)
   - Click **"New Policy"**
   - Policy name: `Allow authenticated users to update event images`
   - Allowed operation: **UPDATE**
   - Policy definition:
     ```sql
     (bucket_id = 'events'::text) AND (auth.role() = 'authenticated'::text)
     ```
   - Click **"Review"** then **"Save policy"**

   **Note**: This allows any authenticated user to update event images. If you want to restrict to event organizers only, you'll need to add the `organizer_id` column first (see EVENT_FEATURES_MIGRATION.sql).

5. **Create Delete Policy** (for authenticated users)
   - Click **"New Policy"**
   - Policy name: `Allow authenticated users to delete event images`
   - Allowed operation: **DELETE**
   - Policy definition:
     ```sql
     (bucket_id = 'events'::text) AND (auth.role() = 'authenticated'::text)
     ```
   - Click **"Review"** then **"Save policy"**

   **Note**: This allows any authenticated user to delete event images. If you want to restrict to event organizers only, you'll need to add the `organizer_id` column first (see EVENT_FEATURES_MIGRATION.sql).

### Step 3: Add image_url Column to Events Table

If the `image_url` column doesn't exist in your `events` table, run this SQL in the Supabase SQL Editor:

```sql
ALTER TABLE events ADD COLUMN IF NOT EXISTS image_url TEXT;
```

### After Setup

1. The error should disappear
2. Event image uploads will work correctly
3. Events can be created with or without images
4. If image upload fails, the event will still be created (just without an image)

## Troubleshooting

If you still get errors after setting up the bucket:

1. **Check Bucket Name**: Make sure the bucket is named exactly `events` (lowercase)
2. **Check Public Access**: Ensure the bucket is set to public
3. **Refresh Schema Cache**: Sometimes Supabase needs a moment to update
4. **Check Policies**: Verify all policies are saved and active

