-- =============================================
-- PROFILE UPDATE SCHEMA
-- Add missing fields for profile editing
-- =============================================

-- Add favorite_lecture column if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS favorite_lecture TEXT;

-- Verify the column exists
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'profiles' AND column_name = 'favorite_lecture';

