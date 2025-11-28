# 🎨 Visual Guide: Setting Up Event Images Storage

## Overview
This guide will help you set up Supabase Storage so users can upload images when creating events.

---

## 📍 Step 1: Create Storage Bucket

### Where to Go:
```
Supabase Dashboard → Storage → New bucket
```

### What to Fill:
```
┌─────────────────────────────────────┐
│ Create new bucket                   │
├─────────────────────────────────────┤
│ Name: events                        │ ← Must be exactly this
│                                     │
│ ☑ Public bucket                    │ ← CHECK THIS!
│                                     │
│ File size limit: 5 MB               │
│ Allowed MIME types: image/*         │
│                                     │
│         [Create bucket]             │
└─────────────────────────────────────┘
```

**✅ After clicking "Create bucket", you should see `events` in your bucket list**

---

## 🔒 Step 2: Create Security Policies

### Where to Go:
```
Storage → events bucket → Policies tab
```

### Policy 1: Upload Policy
```
┌─────────────────────────────────────┐
│ New Policy                          │
├─────────────────────────────────────┤
│ Policy name:                        │
│ Allow authenticated users to        │
│ upload event images                  │
│                                     │
│ Allowed operation: INSERT           │
│                                     │
│ Policy definition:                   │
│ (bucket_id = 'events'::text) AND     │
│ (auth.role() = 'authenticated'::text)│
│                                     │
│         [Save policy]               │
└─────────────────────────────────────┘
```

### Policy 2: Read Policy
```
┌─────────────────────────────────────┐
│ New Policy                          │
├─────────────────────────────────────┤
│ Policy name:                        │
│ Allow public read access to         │
│ event images                        │
│                                     │
│ Allowed operation: SELECT           │
│                                     │
│ Policy definition:                   │
│ (bucket_id = 'events'::text)        │
│                                     │
│         [Save policy]               │
└─────────────────────────────────────┘
```

### Policy 3: Update Policy
```
┌─────────────────────────────────────┐
│ New Policy                          │
├─────────────────────────────────────┤
│ Policy name:                        │
│ Allow authenticated users to        │
│ update event images                 │
│                                     │
│ Allowed operation: UPDATE           │
│                                     │
│ Policy definition:                  │
│ (bucket_id = 'events'::text) AND    │
│ (auth.role() = 'authenticated'::text)│
│                                     │
│         [Save policy]               │
└─────────────────────────────────────┘
```

**Note**: This simple policy works without needing the `organizer_id` column. For organizer-only restrictions, see EVENT_IMAGES_SETUP_GUIDE.md.

### Policy 4: Delete Policy
```
┌─────────────────────────────────────┐
│ New Policy                          │
├─────────────────────────────────────┤
│ Policy name:                        │
│ Allow authenticated users to        │
│ delete event images                 │
│                                     │
│ Allowed operation: DELETE           │
│                                     │
│ Policy definition:                  │
│ (bucket_id = 'events'::text) AND    │
│ (auth.role() = 'authenticated'::text)│
│                                     │
│         [Save policy]               │
└─────────────────────────────────────┘
```

**Note**: This simple policy works without needing the `organizer_id` column. For organizer-only restrictions, see EVENT_IMAGES_SETUP_GUIDE.md.

**✅ After creating all 4 policies, you should see them listed in the Policies tab**

---

## 🗄️ Step 3: Add Column to Database

### Where to Go:
```
SQL Editor → New query
```

### What to Type:
```sql
ALTER TABLE events ADD COLUMN IF NOT EXISTS image_url TEXT;
```

### How to Run:
1. Paste the SQL above
2. Click **"Run"** button (or press `Cmd+Enter`)
3. You should see: ✅ "Success. No rows returned"

### Verify:
```
Table Editor → events table → Check columns
```
You should see `image_url` in the list of columns.

---

## ✅ Step 4: Verify Setup

### Checklist:
- [ ] Bucket `events` exists in Storage
- [ ] Bucket is set to **Public** ✅
- [ ] 4 policies are created and active
- [ ] `image_url` column exists in events table

### Test:
1. Open your app
2. Create a new event
3. Add a photo
4. The image should upload and display! 🎉

---

## 🆘 Common Issues

### Issue: "Bucket not found"
**Fix**: 
- Check bucket name is exactly `events` (lowercase)
- Verify bucket exists in Storage → Buckets

### Issue: "Permission denied"
**Fix**:
- Make sure bucket is **Public**
- Verify all 4 policies are created
- Check policies are active (green checkmark)

### Issue: Images don't display
**Fix**:
- Verify `image_url` column exists
- Check bucket is public
- Refresh the app

---

## 📚 More Help

- **Detailed instructions**: `STEP_BY_STEP_STORAGE_SETUP.md`
- **Quick reference**: `QUICK_STORAGE_SETUP.md`
- **Full guide**: `EVENT_IMAGES_SETUP_GUIDE.md`

