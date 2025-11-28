-- =============================================
-- INTERESTS SCHEMA
-- Run this in your Supabase SQL Editor
-- =============================================

-- 1. Create interests table
CREATE TABLE IF NOT EXISTS interests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create junction table for user interests
CREATE TABLE IF NOT EXISTS user_interests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  interest_id UUID REFERENCES interests(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, interest_id)
);

-- 3. Enable RLS
ALTER TABLE interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_interests ENABLE ROW LEVEL SECURITY;

-- 4. Policies

-- Interests: Everyone can read
CREATE POLICY "Interests viewable by everyone" ON interests FOR SELECT USING (true);
-- Users can insert new interests (needed if we allow users to add custom tags)
CREATE POLICY "Users can create interests" ON interests FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- User Interests: Everyone can read (to connect people)
CREATE POLICY "User interests viewable by everyone" ON user_interests FOR SELECT USING (true);
-- Users can manage their own interests
CREATE POLICY "Users can insert own interests" ON user_interests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own interests" ON user_interests FOR DELETE USING (auth.uid() = user_id);

-- 5. Helper Function to Update User Interests
-- This function takes a user_id and a list of interest names.
-- It handles creating new interests if they don't exist, and updating the user's links.
CREATE OR REPLACE FUNCTION update_user_interests(p_user_id UUID, p_interests TEXT[])
RETURNS VOID AS $$
DECLARE
  interest_name TEXT;
  interest_record_id UUID;
BEGIN
  -- Check if the user is updating their own profile
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- 1. Delete existing interests for the user
  -- We delete all and re-insert to handle removals. 
  -- (Alternatively, we could diff, but this is simpler for small lists)
  DELETE FROM user_interests WHERE user_id = p_user_id;

  -- 2. Loop through provided interests
  IF p_interests IS NOT NULL THEN
    FOREACH interest_name IN ARRAY p_interests
    LOOP
      -- Trim whitespace and skip empty
      interest_name := TRIM(interest_name);
      
      IF length(interest_name) > 0 THEN
        -- Insert interest if not exists, get ID
        -- We use ON CONFLICT DO UPDATE to ensure we get the ID back even if it exists
        INSERT INTO interests (name)
        VALUES (interest_name)
        ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
        RETURNING id INTO interest_record_id;
        
        -- Link user to interest
        INSERT INTO user_interests (user_id, interest_id)
        VALUES (p_user_id, interest_record_id)
        ON CONFLICT DO NOTHING;
      END IF;
    END LOOP;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
