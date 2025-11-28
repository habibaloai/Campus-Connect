-- =============================================
-- ADD MISSING PROFILE COLUMNS
-- Run this in your Supabase SQL Editor
-- =============================================

-- Add all missing columns for profile editing
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS banner_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS nickname TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS interests TEXT[];
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS favorite_lecture TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS availability_status TEXT CHECK (availability_status IN ('free', 'studying', 'busy', 'available', 'away'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS show_study_stats BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS study_hours INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS favorite_study_spots TEXT[];

-- Verify columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('bio', 'nickname', 'interests', 'favorite_lecture', 'banner_url', 'availability_status')
ORDER BY column_name;

