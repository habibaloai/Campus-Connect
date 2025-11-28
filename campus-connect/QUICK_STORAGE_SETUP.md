# Quick Setup: Event Images Storage

## 🚀 Quick Steps (5 minutes)

### 1. Create Storage Bucket
- Go to: **Supabase Dashboard → Storage → New bucket**
- Name: `events` (exactly, lowercase)
- ✅ Check **"Public bucket"**
- File size: `5 MB`
- Click **"Create bucket"**

### 2. Add RLS Policies
Go to **Storage → events → Policies** and create these 4 policies:

#### Policy 1: Upload (INSERT)
- Name: `Allow authenticated users to upload event images`
- Operation: **INSERT**
- SQL:
```sql
(bucket_id = 'events'::text) AND (auth.role() = 'authenticated'::text)
```

#### Policy 2: Read (SELECT)
- Name: `Allow public read access to event images`
- Operation: **SELECT**
- SQL:
```sql
(bucket_id = 'events'::text)
```

#### Policy 3: Update (UPDATE)
- Name: `Allow authenticated users to update event images`
- Operation: **UPDATE**
- SQL:
```sql
(bucket_id = 'events'::text) AND (auth.role() = 'authenticated'::text)
```

#### Policy 4: Delete (DELETE)
- Name: `Allow authenticated users to delete event images`
- Operation: **DELETE**
- SQL:
```sql
(bucket_id = 'events'::text) AND (auth.role() = 'authenticated'::text)
```

**Note**: These policies allow any authenticated user to update/delete event images. If you want to restrict this to event organizers only, first run the migration to add `organizer_id` column (see EVENT_FEATURES_MIGRATION.sql), then use the organizer-specific policies in EVENT_IMAGES_SETUP_GUIDE.md.

### 3. Add Columns to Events Table
Go to **SQL Editor** and run:
```sql
-- Add image_url column for event images
ALTER TABLE events ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add is_private and organizer_id columns (required for event creation)
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false;

ALTER TABLE events 
ADD COLUMN IF NOT EXISTS organizer_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
```

**Note**: If you get an error about missing `is_private` or `organizer_id` columns when creating events, make sure you've run the second and third ALTER TABLE commands above.

### 4. Done! ✅
Your event images will now work. Try creating an event with a photo!

---

**Need detailed instructions?** See `EVENT_IMAGES_SETUP_GUIDE.md`

