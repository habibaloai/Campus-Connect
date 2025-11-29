-- =============================================
-- FIX POST LIKES COUNT TRIGGER
-- This ensures the posts.likes count stays in sync with post_likes table
-- =============================================

-- Step 1: Create/update function to update likes count
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment likes count
    UPDATE posts
    SET likes = COALESCE(likes, 0) + 1
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement likes count (ensure it doesn't go below 0)
    UPDATE posts
    SET likes = GREATEST(COALESCE(likes, 0) - 1, 0)
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Step 2: Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trigger_update_likes_on_insert ON post_likes;
DROP TRIGGER IF EXISTS trigger_update_likes_on_delete ON post_likes;

-- Step 3: Create trigger for INSERT
CREATE TRIGGER trigger_update_likes_on_insert
  AFTER INSERT ON post_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_post_likes_count();

-- Step 4: Create trigger for DELETE
CREATE TRIGGER trigger_update_likes_on_delete
  AFTER DELETE ON post_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_post_likes_count();

-- Step 5: Verify triggers were created
SELECT 
  '✅ Triggers created successfully!' as status,
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE trigger_name IN (
  'trigger_update_likes_on_insert',
  'trigger_update_likes_on_delete'
)
ORDER BY trigger_name;

-- Step 6: Fix existing posts - update likes count to match actual post_likes
-- This ensures all existing posts have the correct count
UPDATE posts p
SET likes = COALESCE((
  SELECT COUNT(*)
  FROM post_likes pl
  WHERE pl.post_id = p.id
), 0)
WHERE p.likes IS NULL OR p.likes != COALESCE((
  SELECT COUNT(*)
  FROM post_likes pl
  WHERE pl.post_id = p.id
), 0);

-- Step 7: Verify the fix worked
SELECT 
  '✅ Likes count sync complete!' as status,
  COUNT(*) as total_posts,
  SUM(CASE WHEN p.likes = COALESCE(like_counts.actual_likes, 0) THEN 1 ELSE 0 END) as posts_with_correct_count,
  SUM(CASE WHEN p.likes != COALESCE(like_counts.actual_likes, 0) THEN 1 ELSE 0 END) as posts_with_incorrect_count
FROM posts p
LEFT JOIN (
  SELECT post_id, COUNT(*) as actual_likes
  FROM post_likes
  GROUP BY post_id
) like_counts ON like_counts.post_id = p.id;

