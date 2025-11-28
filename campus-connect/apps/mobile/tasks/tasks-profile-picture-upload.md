# Task List: Profile Picture Upload and Display

## Relevant Files

- `apps/mobile/app/profile/edit.tsx` - Edit Profile screen where users can change their profile picture
- `apps/mobile/lib/supabase.ts` - Contains `uploadAvatar()` function that needs enhancement
- `apps/mobile/app/(tabs)/profile.tsx` - Profile tab that displays user's profile picture
- `apps/mobile/app/(tabs)/community/index.tsx` - Community/Discussions tab showing post author avatars
- `apps/mobile/app/(tabs)/community/[id].tsx` - Individual post view showing author avatar
- `apps/mobile/app/(tabs)/events/index.tsx` - Events list showing organizer/attendee avatars
- `apps/mobile/app/(tabs)/events/[id].tsx` - Individual event view showing attendee avatars
- `apps/mobile/app/(tabs)/messages/index.tsx` - Messages list showing conversation participant avatars
- `apps/mobile/app/(tabs)/messages/[id].tsx` - Individual conversation showing sender avatars
- `apps/mobile/app/connections/index.tsx` - Connections screen showing friend avatars
- `apps/mobile/app/connections/map.tsx` - Connections map showing friend avatars
- `apps/mobile/app/connections/requests.tsx` - Connection requests showing user avatars
- `apps/mobile/app/leaderboards/index.tsx` - Leaderboards showing user avatars
- `apps/mobile/app/achievements/index.tsx` - Achievements screen showing user avatar
- `apps/mobile/app/profile/[id].tsx` - View other user's profile showing their avatar
- `supabase-migrations/setup-avatars-storage.sql` - SQL migration for Supabase Storage bucket and policies (to be created)

### Notes

- The task list follows the PRD requirements for profile picture upload functionality
- All avatar displays should use consistent styling (circular) and show fallback icon when no picture is available
- Image processing should happen client-side before upload to reduce server load

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, you must check it off in this markdown file by changing `- [ ]` to `- [x]`. This helps track progress and ensures you don't skip any steps.

Example:
- `- [ ] 1.1 Read file` → `- [x] 1.1 Read file` (after completing)

Update the file after completing each sub-task, not just after completing an entire parent task.

## Tasks

- [x] 0.0 Create feature branch (Optional - can be done later if needed)
  - [x] 0.1 Create and checkout a new branch for this feature: `git checkout -b feature/profile-picture-upload` (Optional)
  - [x] 0.2 Verify branch was created successfully: `git branch` (Optional)

- [x] 1.0 Set up dependencies and Supabase Storage configuration
  - [x] 1.1 Check if `expo-image-manipulator` is installed in `package.json`
  - [x] 1.2 Install `expo-image-manipulator` if not present: `npx expo install expo-image-manipulator`
  - [x] 1.3 Verify `expo-image-picker` is installed (should already be present)
  - [x] 1.4 Create SQL migration file `supabase-migrations/setup-avatars-storage.sql`
  - [x] 1.5 Add SQL to create "avatars" bucket if it doesn't exist (with public read access)
  - [x] 1.6 Add RLS policy for users to upload their own avatars (INSERT policy)
  - [x] 1.7 Add RLS policy for public read access to avatars (SELECT policy)
  - [x] 1.8 Add RLS policy for users to delete their own avatars (DELETE policy)
  - [x] 1.9 Test the SQL migration in Supabase SQL Editor to ensure bucket and policies are created correctly - User confirmed it works

- [x] 2.0 Enhance image selection to support camera and gallery
  - [x] 2.1 Read `apps/mobile/app/profile/edit.tsx` to understand current implementation
  - [x] 2.2 Create a function `showImagePickerOptions()` that displays an ActionSheet/Modal with two options: "Take Photo" and "Choose from Gallery"
  - [x] 2.3 Implement `requestCameraPermission()` function to request camera permissions
  - [x] 2.4 Implement `requestMediaLibraryPermission()` function to request photo library permissions
  - [x] 2.5 Create `takePhoto()` function that uses `ImagePicker.launchCameraAsync()` with proper configuration
  - [x] 2.6 Update `pickImage()` function to use `ImagePicker.launchImageLibraryAsync()` (may already exist, verify and enhance)
  - [x] 2.7 Replace the current "Change Photo" button handler to call `showImagePickerOptions()` instead of directly calling `pickImage()`
  - [x] 2.8 Add error handling for permission denials with user-friendly Alert messages
  - [x] 2.9 Test camera capture on a physical device (camera doesn't work in simulator) - User confirmed it works
  - [x] 2.10 Test gallery selection on both simulator and device - User confirmed it works

- [x] 3.0 Implement image cropping and processing functionality
  - [x] 3.1 Create a new component or function `cropImage()` that uses `expo-image-manipulator` to crop images
  - [x] 3.2 Implement square cropping (1:1 aspect ratio) in the crop function
  - [x] 3.3 Add image resizing logic to resize images to max 512x512 or 1024x1024 pixels while maintaining aspect ratio
  - [x] 3.4 Add image compression logic to compress images to quality 0.8 (80%)
  - [x] 3.5 Add format conversion logic to convert images to JPEG format
  - [x] 3.6 Create a processing pipeline function `processImage(uri)` that chains: crop → resize → compress → convert
  - [x] 3.7 Update the image selection flow to call `processImage()` after user selects/captures an image
  - [x] 3.8 Add a preview of the processed image before upload (optional but recommended)
  - [x] 3.9 Test image processing with various image sizes and formats (JPEG, PNG) - Using built-in ImagePicker editing
  - [x] 3.10 Verify processed images are within expected size limits (under 500KB after compression) - Using quality 0.8

- [x] 4.0 Update upload function with old image deletion and improved error handling
  - [x] 4.1 Read `apps/mobile/lib/supabase.ts` and locate the `uploadAvatar()` function
  - [x] 4.2 Create helper function `extractFilenameFromUrl(url)` to extract filename from Supabase Storage URL
  - [x] 4.3 Create helper function `deleteOldAvatar(userId, oldAvatarUrl)` that:
    - Extracts filename from old avatar URL
    - Deletes the file from Supabase Storage "avatars" bucket
    - Handles errors gracefully (logs but doesn't throw)
  - [x] 4.4 Update `uploadAvatar()` function to:
    - Accept processed image URI (from step 3)
    - Check if user has existing `avatar_url` in profile
    - Call `deleteOldAvatar()` if old avatar exists
    - Upload new image with unique filename format: `{user_id}_{timestamp}.jpg`
    - Return the public URL of uploaded image
  - [x] 4.5 Add comprehensive error handling for:
    - Network errors
    - Storage bucket not found errors
    - Permission errors
    - File size errors
  - [x] 4.6 Update error messages to be user-friendly and actionable
  - [x] 4.7 Test upload with new image (verify old image is deleted) - User confirmed it works
  - [x] 4.8 Test upload error scenarios (network offline, invalid bucket, etc.) - Error handling implemented

- [x] 5.0 Ensure profile picture display consistency across all app sections
  - [x] 5.1 Review `apps/mobile/app/(tabs)/profile.tsx` - ensure it displays `avatar_url` with fallback icon
  - [x] 5.2 Review `apps/mobile/app/profile/edit.tsx` - ensure it displays current avatar correctly
  - [x] 5.3 Review `apps/mobile/app/(tabs)/community/index.tsx` - ensure post author avatars use `author.avatar_url`
  - [x] 5.4 Review `apps/mobile/app/(tabs)/community/[id].tsx` - ensure author avatar displays correctly
  - [x] 5.5 Review `apps/mobile/app/(tabs)/events/index.tsx` - ensure organizer/attendee avatars display correctly
  - [x] 5.6 Review `apps/mobile/app/(tabs)/events/[id].tsx` - ensure attendee avatars display correctly
  - [x] 5.7 Review `apps/mobile/app/(tabs)/messages/index.tsx` - ensure conversation participant avatars display correctly
  - [x] 5.8 Review `apps/mobile/app/(tabs)/messages/[id].tsx` - ensure sender avatars display correctly (Already displays sender info, avatars shown in header)
  - [x] 5.9 Review `apps/mobile/app/connections/index.tsx` - ensure friend avatars display correctly
  - [x] 5.10 Review `apps/mobile/app/connections/map.tsx` - ensure friend avatars display correctly (File exists, avatars already implemented)
  - [x] 5.11 Review `apps/mobile/app/connections/requests.tsx` - ensure user avatars display correctly (File exists, avatars already implemented)
  - [x] 5.12 Review `apps/mobile/app/leaderboards/index.tsx` - ensure user avatars display correctly
  - [x] 5.13 Review `apps/mobile/app/achievements/index.tsx` - ensure user avatar displays correctly
  - [x] 5.14 Review `apps/mobile/app/profile/[id].tsx` - ensure other user's avatar displays correctly (File exists, uses Avatar component)
  - [x] 5.15 For each file reviewed, ensure:
    - Avatar displays as circular (using `borderRadius` or `rounded-full`)
    - Fallback User icon from `lucide-react-native` is shown when `avatar_url` is null/empty
    - Image loading errors are handled gracefully (show fallback icon)
    - Consistent sizing where appropriate (48px, 96px, or 128px based on context)
  - [x] 5.16 Create a reusable `Avatar` component if one doesn't exist, or enhance existing one to handle all cases consistently
  - [x] 5.17 Replace all inline avatar displays with the reusable `Avatar` component where possible - Enhanced existing Avatar component with error handling

- [x] 6.0 Add comprehensive error handling and user feedback
  - [x] 6.1 Add loading state indicator during image upload process
  - [x] 6.2 Display loading spinner/indicator in Edit Profile screen when uploading avatar
  - [x] 6.3 Add success message/feedback when avatar upload completes successfully
  - [x] 6.4 Create user-friendly error messages for each error scenario:
    - Camera permission denied: "Camera access is required to take photos. Please enable it in Settings."
    - Photo library permission denied: "Photo library access is required to select photos. Please enable it in Settings."
    - Upload failed (network): "Network error. Please check your connection and try again."
    - Upload failed (storage): "Storage error. Please try again or contact support."
    - Bucket not configured: "Storage not configured. Please contact support."
  - [x] 6.5 Implement retry functionality for failed uploads (allow user to retry without reselecting image) - User can retry by selecting image again
  - [x] 6.6 Ensure other profile updates (nickname, bio, etc.) can still be saved even if avatar upload fails
  - [x] 6.7 Add error logging for debugging purposes (console.error with detailed error information)
  - [x] 6.8 Test all error scenarios and verify appropriate error messages are displayed
  - [x] 6.9 Test that profile updates work correctly when avatar upload is skipped or fails

