# PRD: Profile Picture Upload and Display

## Introduction/Overview

Currently, the Edit Profile section allows users to select profile pictures from their gallery, but the implementation has several gaps:
- Only gallery selection is available (no camera capture)
- Image cropping functionality may not be working correctly
- Old profile pictures are not automatically deleted when new ones are uploaded
- Profile pictures may not be consistently displayed across all app sections (Discussions, Events, Messages, etc.)

This feature will re-implement the profile picture functionality to ensure users can add or change their profile picture using both camera and gallery, with proper image processing, storage management, and consistent display throughout the app.

**Goal:** Enable users to upload, update, and have their profile pictures consistently displayed across all sections of the app.

## Goals

1. Allow users to capture photos using the device camera or select from gallery
2. Provide basic image cropping (square/circle) before upload
3. Automatically resize images to optimal size during upload
4. Automatically delete old profile pictures when new ones are uploaded
5. Ensure profile pictures are consistently displayed in all app sections (Profile, Discussions, Events, Messages, Connections, Leaderboards, etc.)
6. Store profile pictures securely in Supabase Storage
7. Handle errors gracefully with user-friendly messages

## User Stories

1. **As a user**, I want to take a photo with my camera to use as my profile picture, so I don't have to use an existing photo from my gallery.

2. **As a user**, I want to select a photo from my gallery to use as my profile picture, so I can use a photo I already have.

3. **As a user**, I want to crop my profile picture to a square or circle before uploading, so my picture looks good and professional.

4. **As a user**, I want my profile picture to automatically resize to an appropriate size, so it doesn't take up too much storage or load slowly.

5. **As a user**, I want my old profile picture to be automatically deleted when I upload a new one, so I don't waste storage space.

6. **As a user**, I want my profile picture to appear consistently everywhere in the app (Discussions, Events, Messages, etc.), so other users can easily recognize me.

7. **As a user**, I want to see a clear error message if my profile picture upload fails, so I know what went wrong and can try again.

## Functional Requirements

### Image Selection
1. The system must provide a button/option to "Change Photo" in the Edit Profile screen.
2. When the user taps "Change Photo", the system must present options to:
   - Take a photo using the device camera
   - Select a photo from the device gallery
3. The system must request appropriate permissions (camera and/or photo library) before accessing these features.
4. The system must display a permission denied message if the user denies camera or photo library access.

### Image Cropping
5. After selecting or capturing an image, the system must present a cropping interface.
6. The cropping interface must allow users to:
   - Crop the image to a square aspect ratio (1:1)
   - Optionally crop to a circle (circular mask overlay)
7. The system must allow users to adjust the crop area before confirming.
8. The system must allow users to cancel the cropping operation and return to selection.

### Image Processing
9. The system must automatically resize uploaded images to a maximum dimension (recommended: 512x512 pixels or 1024x1024 pixels) while maintaining aspect ratio.
10. The system must compress images to reduce file size (recommended: quality 0.8 or 80%).
11. The system must support common image formats (JPEG, PNG).
12. The system must convert images to a consistent format (recommended: JPEG) before upload to reduce file size.

### Image Upload
13. The system must upload the processed image to Supabase Storage in the "avatars" bucket.
14. The system must generate a unique filename for each uploaded image (recommended format: `{user_id}_{timestamp}.jpg`).
15. The system must store the public URL of the uploaded image in the user's profile `avatar_url` field.
16. The system must handle upload errors gracefully and display user-friendly error messages.

### Old Image Deletion
17. Before uploading a new profile picture, the system must check if the user has an existing `avatar_url` in their profile.
18. If an existing `avatar_url` exists, the system must extract the filename from the URL.
19. The system must delete the old image file from Supabase Storage before uploading the new one.
20. The system must handle deletion errors gracefully (log but don't block upload if deletion fails).
21. The system must update the user's profile `avatar_url` field with the new image URL after successful upload.

### Display Consistency
22. The system must display the user's profile picture in the Edit Profile screen.
23. The system must display the user's profile picture in the Profile tab.
24. The system must display the user's profile picture in Discussion/Community posts (author avatars).
25. The system must display the user's profile picture in Events (organizer/attendee avatars).
26. The system must display the user's profile picture in Messages/Conversations (sender avatars).
27. The system must display the user's profile picture in Connections/Friends lists.
28. The system must display the user's profile picture in Leaderboards.
29. The system must display a default avatar icon (User icon) when:
   - The user has no profile picture (`avatar_url` is null or empty)
   - The profile picture fails to load
   - The profile picture URL is invalid
30. All profile picture displays must use consistent styling (circular, same size where appropriate).

### Error Handling
31. The system must display an error message if camera permission is denied.
32. The system must display an error message if photo library permission is denied.
33. The system must display an error message if image upload fails (network error, storage error, etc.).
34. The system must display an error message if the Supabase Storage bucket is not configured.
35. The system must allow users to retry failed uploads.
36. The system must not prevent other profile updates from saving if only the avatar upload fails.

### Storage Configuration
37. The system must verify that the "avatars" bucket exists in Supabase Storage.
38. The system must ensure the "avatars" bucket has proper RLS (Row Level Security) policies:
   - Users can upload their own avatars
   - All users can read/view avatars (public read access)
   - Users can delete their own avatars
39. The system must provide clear error messages if the storage bucket is not properly configured.

## Non-Goals (Out of Scope)

1. **Advanced Image Editing**: This feature will NOT include filters, brightness/contrast adjustments, stickers, or other advanced editing features. Only basic cropping is included.

2. **Multiple Profile Pictures**: Users can only have one profile picture at a time. No support for multiple pictures or picture galleries.

3. **Profile Picture History**: The system will not keep a history of previously uploaded profile pictures. Old pictures are deleted immediately.

4. **Profile Picture Privacy Settings**: All profile pictures are public and visible to all users. No privacy controls for profile pictures.

5. **Profile Picture Animated GIFs**: Only static images (JPEG, PNG) are supported. Animated GIFs are not supported.

6. **Profile Picture from URL**: Users cannot set their profile picture by entering a URL. Only camera capture and gallery selection are supported.

7. **Batch Upload**: Users cannot upload multiple images at once. Only one image at a time.

8. **Image Format Conversion UI**: Users cannot choose the output format. The system automatically converts to JPEG.

## Design Considerations

### UI Components
- **Edit Profile Screen**: The existing "Change Photo" button should be enhanced to show a modal/action sheet with "Take Photo" and "Choose from Gallery" options.
- **Image Cropper**: Use `expo-image-manipulator` or a similar library to provide cropping functionality with a square/circle overlay.
- **Loading States**: Show a loading indicator during image upload.
- **Error Messages**: Display error messages in a user-friendly Alert or Toast component.

### Visual Consistency
- Profile pictures should be displayed as circles throughout the app.
- Default avatar size: 48x48 pixels (small), 96x96 pixels (medium), 128x128 pixels (large) depending on context.
- Use consistent placeholder/fallback icon (User icon from lucide-react-native) when no picture is available.

### Current Implementation Reference
- The Edit Profile screen is located at: `apps/mobile/app/profile/edit.tsx`
- Current image picker uses `expo-image-picker` (gallery only)
- Upload function exists at: `api.uploadAvatar()` in `lib/supabase.ts`
- Profile picture is stored in `profiles.avatar_url` field

## Technical Considerations

### Dependencies
- **expo-image-picker**: Already installed, needs to be configured for camera access
- **expo-image-manipulator**: May need to be installed for image cropping and resizing
- **@supabase/supabase-js**: Already installed for storage operations

### Supabase Storage Setup
1. Ensure "avatars" bucket exists in Supabase Storage
2. Configure bucket with public read access
3. Set up RLS policies:
   ```sql
   -- Policy: Users can upload their own avatars
   CREATE POLICY "Users can upload own avatars" ON storage.objects
   FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
   
   -- Policy: Public read access
   CREATE POLICY "Public avatar access" ON storage.objects
   FOR SELECT USING (bucket_id = 'avatars');
   
   -- Policy: Users can delete their own avatars
   CREATE POLICY "Users can delete own avatars" ON storage.objects
   FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
   ```

### Image Processing Flow
1. User selects/captures image → Returns local file URI
2. Crop image (if needed) → Returns cropped image URI
3. Resize image to max 512x512 or 1024x1024 → Returns resized image
4. Compress image (quality 0.8) → Returns compressed image
5. Convert to JPEG format → Returns final image
6. Delete old avatar from storage (if exists)
7. Upload new image to Supabase Storage
8. Update profile `avatar_url` field with new URL
9. Refresh profile context to update UI

### Files to Modify
- `apps/mobile/app/profile/edit.tsx`: Enhance image picker to support camera and gallery, add cropping
- `apps/mobile/lib/supabase.ts`: Enhance `uploadAvatar()` function to:
  - Delete old avatar before uploading new one
  - Handle image resizing/compression
  - Better error handling
- All screens displaying avatars: Ensure they consistently use `avatar_url` from profile and show fallback icon

### Files to Review for Display Consistency
- `apps/mobile/app/(tabs)/profile.tsx`
- `apps/mobile/app/(tabs)/community/index.tsx`
- `apps/mobile/app/(tabs)/community/[id].tsx`
- `apps/mobile/app/(tabs)/events/index.tsx`
- `apps/mobile/app/(tabs)/events/[id].tsx`
- `apps/mobile/app/(tabs)/messages/index.tsx`
- `apps/mobile/app/(tabs)/messages/[id].tsx`
- `apps/mobile/app/connections/index.tsx`
- `apps/mobile/app/connections/map.tsx`
- `apps/mobile/app/connections/requests.tsx`
- `apps/mobile/app/leaderboards/index.tsx`
- `apps/mobile/app/achievements/index.tsx`
- `apps/mobile/app/profile/[id].tsx`

## Success Metrics

1. **Functionality**: 100% of users can successfully upload a profile picture using either camera or gallery
2. **Performance**: Profile picture uploads complete within 5 seconds for images under 5MB
3. **Consistency**: Profile pictures appear correctly in 100% of app sections where user avatars are displayed
4. **Storage Efficiency**: Old profile pictures are deleted in 100% of cases when new ones are uploaded
5. **Error Handling**: All upload errors are caught and displayed with user-friendly messages (0% silent failures)

## Open Questions

1. **Image Size Limit**: What should be the maximum file size for uploaded images? (Recommended: 5MB before processing, 500KB after compression)
2. **Crop Shape Default**: Should the default crop shape be square or circle? (Recommended: Square, with option to apply circular mask in display)
3. **Upload Progress**: Should we show upload progress percentage, or is a simple loading indicator sufficient?
4. **Retry Logic**: How many times should the system automatically retry a failed upload before showing an error? (Recommended: 0 - show error immediately, let user retry manually)
5. **Image Caching**: Should we implement image caching to improve load times, or rely on Supabase CDN?
6. **Fallback Avatar**: Should we use a default colored avatar with user initials, or just a generic user icon?


