-- Quick Verification: Check if event_photos table is set up
-- Run this to verify everything worked

-- Check if table exists
SELECT 
  'Table Status' as check_item,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_name = 'event_photos'
    ) THEN '✅ event_photos table EXISTS'
    ELSE '❌ event_photos table MISSING'
  END as status;

-- Check table columns
SELECT 
  'Columns' as check_item,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'event_photos'
ORDER BY ordinal_position;

-- Check policies
SELECT 
  'Policies' as check_item,
  policyname as policy_name,
  cmd as operation
FROM pg_policies
WHERE tablename = 'event_photos'
ORDER BY policyname;

