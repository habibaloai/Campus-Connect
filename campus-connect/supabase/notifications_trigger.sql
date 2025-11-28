-- =============================================
-- NOTIFICATION TRIGGERS
-- Run this in your Supabase SQL Editor
-- =============================================

-- 1. Trigger for PROFILES table (Legacy Array based)
CREATE OR REPLACE FUNCTION handle_interest_update_notification()
RETURNS TRIGGER AS $$
DECLARE
  matching_user RECORD;
BEGIN
  -- Check if interests have changed
  IF OLD.interests IS DISTINCT FROM NEW.interests THEN
    -- Find users with overlapping interests (excluding the user who updated)
    FOR matching_user IN
      SELECT id 
      FROM profiles 
      WHERE id != NEW.id 
      AND interests && NEW.interests
    LOOP
      -- Insert notification
      -- NOTE: Using 'message' column as per schema inference
      INSERT INTO notifications (
        user_id,
        type,
        title,
        message, 
        action_url,
        read,
        created_at
      ) VALUES (
        matching_user.id,
        'social', -- Using 'social' type as it is a valid enum value
        'Shared Interest Update',
        'Someone with similar interests updated their profile!',
        '/(tabs)/community',
        false,
        NOW()
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Trigger for USER_INTERESTS table (New Junction table based)
CREATE OR REPLACE FUNCTION handle_new_user_interest()
RETURNS TRIGGER AS $$
DECLARE
  matching_user RECORD;
  interest_name_val TEXT;
BEGIN
  -- Get the name of the interest
  SELECT name INTO interest_name_val FROM interests WHERE id = NEW.interest_id;

  -- Find other users who have this same interest
  FOR matching_user IN
    SELECT user_id 
    FROM user_interests 
    WHERE interest_id = NEW.interest_id 
    AND user_id != NEW.user_id
  LOOP
    -- Insert notification
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      action_url,
      read,
      created_at
    ) VALUES (
      matching_user.user_id,
      'social', -- Using 'social' type as it is a valid enum value
      'New Shared Interest',
      'Someone also likes ' || COALESCE(interest_name_val, 'one of your interests') || '!',
      '/(tabs)/community',
      false,
      NOW()
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create/Recreate Triggers

-- Trigger for profiles
DROP TRIGGER IF EXISTS on_interest_update ON profiles;
CREATE TRIGGER on_interest_update
  AFTER UPDATE OF interests ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_interest_update_notification();

-- Trigger for user_interests
DROP TRIGGER IF EXISTS on_user_interest_added ON user_interests;
CREATE TRIGGER on_user_interest_added
  AFTER INSERT ON user_interests
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user_interest();
