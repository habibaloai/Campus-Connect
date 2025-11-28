# Testing Profile Save Functionality

## Prerequisites

1. **Database Schema**: Ensure the `favorite_lecture` column exists in your Supabase `profiles` table:
   ```sql
   ALTER TABLE profiles ADD COLUMN IF NOT EXISTS favorite_lecture TEXT;
   ```
   Run this in your Supabase SQL Editor if you haven't already.

2. **Storage Bucket**: Ensure you have an `avatars` storage bucket in Supabase Storage with proper RLS policies.

## Test Steps

1. **Open the Edit Profile Screen**:
   - Navigate to Profile tab
   - Click "Edit Profile" button (between interests and gamification section)

2. **Verify Current Values Load**:
   - ✅ Profile picture should display (or default icon)
   - ✅ Description/bio should show current value (or placeholder)
   - ✅ Interests should show current tags (or default ones)
   - ✅ Favorite lecture should show current value (or default)

3. **Make Changes**:
   - Change the description text
   - Add/remove interests (max 5)
   - Change favorite lecture text
   - Optionally change profile picture

4. **Save Changes**:
   - Click "Save" button in header
   - Watch console logs for:
     - "Updating profile with: {...}"
     - "Profile updated successfully: {...}"
     - "Profile refreshed successfully"

5. **Verify Changes Saved**:
   - Should navigate back to profile screen automatically
   - Profile should show updated values:
     - New description
     - Updated interests
     - New favorite lecture
     - New profile picture (if changed)

## Debugging

If save doesn't work, check:

1. **Console Logs**: Look for error messages in the console
2. **Network Tab**: Check if the Supabase API call is successful
3. **Database**: Verify the column exists:
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'profiles' AND column_name = 'favorite_lecture';
   ```
4. **RLS Policies**: Ensure you have UPDATE permission on profiles table
5. **Storage**: If image upload fails, check storage bucket permissions

## Expected Console Output

```
Updating profile with: {
  "bio": "Your new bio",
  "interests": ["Photography", "Reading"],
  "favorite_lecture": "Introduction to Computer Science",
  "updated_at": "2024-01-01T12:00:00.000Z",
  "avatar_url": "https://..."
}
Profile updated successfully: { id: "...", bio: "...", ... }
Profile refreshed successfully
```

## Common Issues

1. **Column doesn't exist**: Run the ALTER TABLE command above
2. **RLS blocking update**: Check Supabase RLS policies
3. **Image upload fails**: Check storage bucket exists and has proper permissions
4. **Profile not refreshing**: Check refreshProfile function in AuthContext

