-- Verify Event Setup
-- Run this to check if everything is set up correctly

-- Check events table columns
SELECT 
  'Events Table Columns' as check_type,
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns
WHERE table_name = 'events' 
AND column_name IN ('image_url', 'is_private', 'organizer_id')
ORDER BY column_name;

-- Check if event_photos table exists
SELECT 
  'Event Photos Table' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_name = 'event_photos'
    ) THEN '✅ EXISTS'
    ELSE '❌ MISSING - Run ADD_EVENT_PHOTOS_TABLE.sql'
  END as status;

-- Check event_photos table columns (if table exists)
SELECT 
  'Event Photos Columns' as check_type,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'event_photos'
ORDER BY ordinal_position;

-- Check event_photos RLS policies (if table exists)
SELECT 
  'Event Photos Policies' as check_type,
  policyname,
  cmd as operation
FROM pg_policies
WHERE tablename = 'event_photos'
ORDER BY policyname;

