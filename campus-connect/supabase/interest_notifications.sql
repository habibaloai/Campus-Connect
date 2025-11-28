-- =============================================
-- INTEREST NOTIFICATIONS TRIGGER
-- Run this in your Supabase SQL Editor
-- =============================================

-- Function to handle new interest notifications
CREATE OR REPLACE FUNCTION handle_new_interest_notification()
RETURNS TRIGGER AS $$
DECLARE
  interest_name TEXT;
  matching_user RECORD;
  current_user_name TEXT;
BEGIN
  -- 1. Get the name of the inserted interest
  SELECT name INTO interest_name FROM interests WHERE id = NEW.interest_id;
  
  -- 2. Get the name of the current user (who added the interest)
  SELECT name INTO current_user_name FROM profiles WHERE id = NEW.user_id;

  -- 3. Find other users who have the same interest (case-insensitive match)
  -- We join user_interests -> interests to find matches
  FOR matching_user IN
    SELECT ui.user_id
    FROM user_interests ui
    JOIN interests i ON ui.interest_id = i.id
    WHERE 
      LOWER(i.name) = LOWER(interest_name) -- Case-insensitive match
      AND ui.user_id != NEW.user_id -- Exclude the current user
  LOOP
    -- 4. Insert notification for each matching user
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      priority,
      action_url
    ) VALUES (
      matching_user.user_id,
      'social',
      'New Interest Match!',
      current_user_name || ' is also interested in ' || interest_name || '!',
      'medium',
      '/profile/' || NEW.user_id -- Link to the user's profile
    );
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS on_interest_added ON user_interests;
CREATE TRIGGER on_interest_added
  AFTER INSERT ON user_interests
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_interest_notification();
