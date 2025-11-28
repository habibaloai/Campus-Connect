# Database Setup Instructions

## Error: Column 'bio' not found

If you're getting the error `could not find the 'bio' column of 'profiles' in the schema cache`, you need to add the missing columns to your Supabase database.

## Quick Fix

1. **Open Supabase Dashboard**
   - Go to your Supabase project
   - Navigate to SQL Editor

2. **Run the Migration Script**
   - Copy and paste the contents of `ADD_PROFILE_COLUMNS.sql` into the SQL Editor
   - Click "Run" to execute

3. **Verify Columns Added**
   - The script will show a query result confirming the columns exist
   - You should see: bio, nickname, interests, favorite_lecture, banner_url, availability_status

## Alternative: Run Individual Commands

If you prefer to run commands one at a time:

```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS nickname TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS interests TEXT[];
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS favorite_lecture TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS banner_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS availability_status TEXT CHECK (availability_status IN ('free', 'studying', 'busy', 'available', 'away'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS show_study_stats BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS study_hours INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS favorite_study_spots TEXT[];
```

## After Running the Migration

1. The error should disappear
2. Profile edit functionality will work correctly
3. You can now save bio, nickname, interests, and favorite_lecture

## Troubleshooting

If you still get errors after running the migration:

1. **Check RLS Policies**: Make sure you have UPDATE permission on profiles table
2. **Refresh Schema Cache**: Sometimes Supabase needs a moment to update the schema cache
3. **Check Column Names**: Verify the columns exist with:
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'profiles';
   ```

