# Profile Edit Flow - Comprehensive Test Plan

## Test Flow

### 1. Initial State Check
- [ ] User has existing profile with:
  - bio: "Current description"
  - interests: ["Photography", "Reading"]
  - favorite_lecture: "Current Lecture"
  - avatar_url: (some URL or null)

### 2. Open Edit Profile Screen
**Expected Behavior:**
- Loading indicator shows briefly
- Form fields populate with current values:
  - Description field shows "Current description"
  - Interests show as tags: "Photography", "Reading"
  - Favorite lecture shows "Current Lecture"
  - Profile picture shows (or default icon)

**Console Logs to Check:**
```
[Edit Profile] Fetching profile data for user: <id>
[Edit Profile] Profile data loaded: { bio: 'Current description', ... }
```

### 3. Make Changes
- Change description to "New description"
- Remove "Photography" interest
- Add "Coding" interest
- Change favorite lecture to "New Lecture"

### 4. Save Changes
**Expected Behavior:**
- Save button shows loading indicator
- Console shows update process
- Navigates back to profile screen
- Profile screen shows updated values

**Console Logs to Check:**
```
[Edit Profile] Updating profile with: { "bio": "New description", ... }
[API] updateProfile called with: { userId: ..., updates: ... }
[API] Profile updated successfully: { ... }
[Edit Profile] Verified updated profile: { ... }
[Edit Profile] Refreshing profile context...
[AuthContext] Refreshing profile for user: ...
[Profile Screen] Screen focused, refreshing profile...
```

### 5. Verify on Profile Screen
**Expected:**
- Description shows "New description"
- Interests show: "Reading", "Coding"
- Favorite lecture shows "New Lecture"

## Common Issues & Fixes

### Issue 1: Fields Empty on Load
**Fix:** useEffect now properly fetches and loads data

### Issue 2: Save Not Working
**Possible Causes:**
- RLS policy blocking update
- Wrong data types (interests must be array)
- Database column missing

**Fix:** Enhanced error logging, proper array handling

### Issue 3: Changes Not Showing After Save
**Fix:** Added useFocusEffect to refresh on screen focus, direct profile fetch after update

