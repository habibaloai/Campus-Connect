-- Migration: Add trigger to automatically update posts.likes count
-- This ensures the likes count stays in sync with post_likes table

-- Create function to update likes count
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment likes count
    UPDATE posts
    SET likes = COALESCE(likes, 0) + 1
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement likes count
    UPDATE posts
    SET likes = GREATEST(COALESCE(likes, 0) - 1, 0)
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for INSERT
DROP TRIGGER IF EXISTS trigger_update_likes_on_insert ON post_likes;
CREATE TRIGGER trigger_update_likes_on_insert
  AFTER INSERT ON post_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_post_likes_count();

-- Create trigger for DELETE
DROP TRIGGER IF EXISTS trigger_update_likes_on_delete ON post_likes;
CREATE TRIGGER trigger_update_likes_on_delete
  AFTER DELETE ON post_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_post_likes_count();

-- Update existing posts to have correct likes count
UPDATE posts p
SET likes = COALESCE((
  SELECT COUNT(*)
  FROM post_likes pl
  WHERE pl.post_id = p.id
), 0);

