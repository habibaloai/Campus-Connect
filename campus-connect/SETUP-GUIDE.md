# Profile Picture Upload - Setup Guide

This guide will help you set up the profile picture upload feature in your app.

## Prerequisites

- Supabase project with database access
- Supabase Storage enabled
- Admin access to Supabase Dashboard

## Step 1: Create Supabase Storage Bucket

1. **Open Supabase Dashboard**
   - Go to your Supabase project dashboard
   - Navigate to **Storage** in the left sidebar

2. **Create the "avatars" Bucket**
   - Click **"New bucket"** or **"Create bucket"**
   - Bucket name: `avatars`
   - **Important**: Make it **Public** (toggle "Public bucket" to ON)
   - Click **"Create bucket"**

## Step 2: Run SQL Migration

1. **Open SQL Editor**
   - In Supabase Dashboard, go to **SQL Editor** in the left sidebar
   - Click **"New query"**

2. **Run the Migration**
   - Open the file: `supabase-migrations/setup-avatars-storage.sql`
   - Copy the entire SQL content
   - Paste it into the SQL Editor
   - Click **"Run"** or press `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)

   This will:
   - Create the "avatars" bucket if it doesn't exist
   - Set up Row Level Security (RLS) policies for:
     - Users can upload their own avatars (INSERT)
     - Public read access (SELECT)
     - Users can delete their own avatars (DELETE)

## Step 3: Verify Setup

1. **Check Storage Bucket**
   - Go to **Storage** → **avatars**
   - Verify the bucket exists and is public

2. **Check RLS Policies**
   - Go to **Storage** → **avatars** → **Policies**
   - You should see 3 policies:
     - "Users can upload own avatars" (INSERT)
     - "Public avatar access" (SELECT)
     - "Users can delete own avatars" (DELETE)

3. **Test Upload (Optional)**
   - Open your app
   - Go to Profile → Edit Profile
   - Try uploading a profile picture
   - Check Storage → avatars to see if the file appears

## Step 4: Verify App Configuration

1. **Check Dependencies**
   - Ensure `expo-image-picker` is installed (should already be present)
   - The app uses built-in ImagePicker editing (no need for `expo-image-manipulator` rebuild)

2. **Check Permissions**
   - iOS: Add to `app.json` or `Info.plist`:
     ```json
     "ios": {
       "infoPlist": {
         "NSCameraUsageDescription": "We need access to your camera to take profile pictures.",
         "NSPhotoLibraryUsageDescription": "We need access to your photo library to select profile pictures."
       }
     }
     ```
   - Android: Add to `app.json`:
     ```json
     "android": {
       "permissions": [
         "CAMERA",
         "READ_EXTERNAL_STORAGE",
         "WRITE_EXTERNAL_STORAGE"
       ]
     }
     ```

## Troubleshooting

### Error: "Storage bucket not configured"
- **Solution**: Make sure you've created the "avatars" bucket in Supabase Storage
- Verify the bucket name is exactly `avatars` (lowercase)
- Ensure the bucket is set to **Public**

### Error: "Permission denied"
- **Solution**: Check that RLS policies are correctly set up
- Run the SQL migration again if needed
- Verify the user is authenticated

### Error: "Failed to upload avatar"
- **Solution**: 
  - Check your internet connection
  - Verify Supabase Storage is enabled in your project
  - Check browser console for detailed error messages

### Images not displaying
- **Solution**:
  - Verify the bucket is **Public**
  - Check that `avatar_url` in the `profiles` table is being updated correctly
  - Clear app cache and restart the app

## File Structure

The following files are involved in the profile picture upload feature:

- `apps/mobile/app/profile/edit.tsx` - Edit Profile screen with image picker
- `apps/mobile/lib/supabase.ts` - `uploadAvatar()` function
- `apps/mobile/components/ui/Avatar.tsx` - Reusable Avatar component
- `supabase-migrations/setup-avatars-storage.sql` - Storage bucket and RLS policies

## Features Implemented

✅ Camera capture with square crop
✅ Gallery selection with square crop
✅ Image compression (80% quality)
✅ Automatic old avatar deletion
✅ Error handling with user-friendly messages
✅ Loading states during upload
✅ Success feedback
✅ Consistent avatar display across all app sections

## Next Steps

After setup is complete:
1. Test the feature on a physical device (camera doesn't work in simulator)
2. Verify avatars display correctly in:
   - Profile tab
   - Community/Discussions posts
   - Events attendees
   - Messages conversations
   - Connections
   - Leaderboards
   - Achievements

## Support

If you encounter any issues:
1. Check the browser/app console for error messages
2. Verify all setup steps were completed
3. Check Supabase Dashboard for bucket and policy configuration
4. Review the error handling messages in the app for specific guidance


