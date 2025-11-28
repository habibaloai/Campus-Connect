# 📸 Step-by-Step: Event Images Storage Setup

Follow these steps exactly to enable event image uploads in your app.

---

## ✅ Step 1: Create the Storage Bucket

### 1.1 Navigate to Storage
1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project (the one with URL: `ojmkhimriptucfsulfzv.supabase.co`)
3. Click **"Storage"** in the left sidebar (it has a folder icon)

### 1.2 Create New Bucket
1. Click the **"New bucket"** button (usually at the top right)
2. Fill in the form:
   ```
   Name: events
   Public bucket: ✅ (CHECK THIS BOX - Very Important!)
   File size limit: 5 MB
   Allowed MIME types: image/*
   ```
3. Click **"Create bucket"**

**⚠️ Important**: The bucket name must be exactly `events` (lowercase, no spaces, no capital letters)

---

## ✅ Step 2: Set Up Security Policies (RLS)

### 2.1 Open Policies Tab
1. Click on the `events` bucket you just created
2. Click on the **"Policies"** tab (next to "Files" tab)

### 2.2 Create Policy 1: Upload (INSERT)
1. Click **"New Policy"**
2. Select **"Create a policy from scratch"**
3. Fill in:
   - **Policy name**: `Allow authenticated users to upload event images`
   - **Allowed operation**: Select **INSERT** from dropdown
   - **Policy definition**: Copy and paste this:
     ```sql
     (bucket_id = 'events'::text) AND (auth.role() = 'authenticated'::text)
     ```
4. Click **"Review"** → **"Save policy"**

### 2.3 Create Policy 2: Read (SELECT)
1. Click **"New Policy"** again
2. Select **"Create a policy from scratch"**
3. Fill in:
   - **Policy name**: `Allow public read access to event images`
   - **Allowed operation**: Select **SELECT** from dropdown
   - **Policy definition**: Copy and paste this:
     ```sql
     (bucket_id = 'events'::text)
     ```
4. Click **"Review"** → **"Save policy"**

### 2.4 Create Policy 3: Update (UPDATE)
1. Click **"New Policy"** again
2. Select **"Create a policy from scratch"**
3. Fill in:
   - **Policy name**: `Allow authenticated users to update event images`
   - **Allowed operation**: Select **UPDATE** from dropdown
   - **Policy definition**: Copy and paste this:
     ```sql
     (bucket_id = 'events'::text) AND (auth.role() = 'authenticated'::text)
     ```
4. Click **"Review"** → **"Save policy"**

**Note**: This allows any authenticated user to update event images. If you want to restrict this to event organizers only, you'll need to first add the `organizer_id` column to your events table (see EVENT_FEATURES_MIGRATION.sql), then use a more restrictive policy.

### 2.5 Create Policy 4: Delete (DELETE)
1. Click **"New Policy"** again
2. Select **"Create a policy from scratch"**
3. Fill in:
   - **Policy name**: `Allow authenticated users to delete event images`
   - **Allowed operation**: Select **DELETE** from dropdown
   - **Policy definition**: Copy and paste this:
     ```sql
     (bucket_id = 'events'::text) AND (auth.role() = 'authenticated'::text)
     ```
4. Click **"Review"** → **"Save policy"**

**Note**: This allows any authenticated user to delete event images. If you want to restrict this to event organizers only, you'll need to first add the `organizer_id` column to your events table (see EVENT_FEATURES_MIGRATION.sql), then use a more restrictive policy.

**✅ You should now have 4 policies listed in the Policies tab**

---

## ✅ Step 3: Add image_url Column to Events Table

### 3.1 Open SQL Editor
1. Click **"SQL Editor"** in the left sidebar (has a code icon)
2. Click **"New query"** button

### 3.2 Run the SQL Command
1. In the SQL editor, paste this command:
   ```sql
   ALTER TABLE events ADD COLUMN IF NOT EXISTS image_url TEXT;
   ```
2. Click **"Run"** button (or press `Cmd+Enter` on Mac / `Ctrl+Enter` on Windows)
3. You should see: ✅ "Success. No rows returned"

### 3.3 Verify the Column Was Added
1. Click **"Table Editor"** in the left sidebar
2. Click on the **"events"** table
3. Scroll through the columns - you should see `image_url` listed
4. If you see it, you're done! ✅

---

## ✅ Step 4: Test It!

### 4.1 Test in Your App
1. Open your Campus Connect mobile app
2. Go to the **Events** tab
3. Click the **"+"** button to create a new event
4. Fill in the event details
5. Click **"Add Photo"** and select an image
6. Create the event

### 4.2 What Should Happen
- ✅ The image should upload successfully
- ✅ The event should be created
- ✅ The image should display on the event card
- ✅ No error messages should appear

### 4.3 If It Works
🎉 **Congratulations!** Event images are now fully set up!

---

## 🐛 Troubleshooting

### Problem: "Bucket not found" error
**Solution**: 
- Double-check the bucket name is exactly `events` (lowercase)
- Make sure you created the bucket (check Storage → Buckets list)

### Problem: "Permission denied" error
**Solution**:
- Verify all 4 policies are created and active (green checkmark)
- Make sure the bucket is set to **Public**
- Check that you're logged in to the app

### Problem: Images upload but don't display
**Solution**:
- Verify `image_url` column exists in events table
- Check that the bucket is **Public** (not private)
- Refresh the app

### Problem: Can't create policies
**Solution**:
- Make sure you're using the correct SQL syntax
- Try creating policies one at a time
- Check for typos in the policy SQL

---

## 📋 Quick Checklist

Before testing, make sure you have:

- [ ] Created bucket named `events` (exactly, lowercase)
- [ ] Set bucket to **Public** ✅
- [ ] Created 4 RLS policies (INSERT, SELECT, UPDATE, DELETE)
- [ ] Added `image_url` column to events table
- [ ] Verified column exists in Table Editor

---

## 🎯 What Happens After Setup

✅ **Events can be created with images**  
✅ **Images display on event cards**  
✅ **Users can upload photos when creating events**  
✅ **Event images are stored securely in Supabase**  
✅ **Images are publicly accessible (for display)**  

---

## 📞 Need More Help?

- **Detailed Guide**: See `EVENT_IMAGES_SETUP_GUIDE.md`
- **Quick Reference**: See `QUICK_STORAGE_SETUP.md`
- **Check Supabase Logs**: Dashboard → Logs (for error details)

