-- =============================================
-- SOCIAL PROFILES & CONNECTIONS SCHEMA
-- =============================================

-- Extend profiles table with social features
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS banner_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS nickname TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS interests TEXT[];
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS favorite_lecture TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS availability_status TEXT CHECK (availability_status IN ('free', 'studying', 'busy', 'available', 'away'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS show_study_stats BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS study_hours INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS favorite_study_spots TEXT[];

-- Friend Requests
CREATE TABLE IF NOT EXISTS friend_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(requester_id, recipient_id),
  CHECK (requester_id != recipient_id)
);

-- Friendships (mutual connections)
CREATE TABLE IF NOT EXISTS friendships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  friend_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  is_close_friend BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, friend_id),
  CHECK (user_id != friend_id)
);

-- Follows (one-way connections)
CREATE TABLE IF NOT EXISTS follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Connection Stories (how you met)
CREATE TABLE IF NOT EXISTS connection_stories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  connected_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  story TEXT NOT NULL,
  location TEXT,
  context TEXT, -- e.g., "Biology Lab, Week 3"
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, connected_user_id),
  CHECK (user_id != connected_user_id)
);

-- Course Classmates (auto-discovered)
CREATE TABLE IF NOT EXISTS course_classmates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  classmate_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  semester TEXT,
  discovered_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, classmate_id, course_id),
  CHECK (user_id != classmate_id)
);

-- Friend Locations (for friend map - opt-in)
CREATE TABLE IF NOT EXISTS friend_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  location_name TEXT,
  is_visible BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_friend_requests_requester ON friend_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_recipient ON friend_requests(recipient_id);
CREATE INDEX IF NOT EXISTS idx_friendships_user ON friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend ON friendships(friend_id);
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);
CREATE INDEX IF NOT EXISTS idx_connection_stories_user ON connection_stories(user_id);
CREATE INDEX IF NOT EXISTS idx_course_classmates_user ON course_classmates(user_id);
CREATE INDEX IF NOT EXISTS idx_course_classmates_course ON course_classmates(course_id);

-- RLS Policies for friend_requests
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own friend requests"
  ON friend_requests FOR SELECT
  USING (auth.uid() = requester_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can create friend requests"
  ON friend_requests FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can update their received friend requests"
  ON friend_requests FOR UPDATE
  USING (auth.uid() = recipient_id);

-- RLS Policies for friendships
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own friendships"
  ON friendships FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can create friendships"
  ON friendships FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own friendships"
  ON friendships FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own friendships"
  ON friendships FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for follows
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all follows"
  ON follows FOR SELECT
  USING (true);

CREATE POLICY "Users can create their own follows"
  ON follows FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can delete their own follows"
  ON follows FOR DELETE
  USING (auth.uid() = follower_id);

-- RLS Policies for connection_stories
ALTER TABLE connection_stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view connection stories"
  ON connection_stories FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = connected_user_id);

CREATE POLICY "Users can create their own connection stories"
  ON connection_stories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own connection stories"
  ON connection_stories FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for course_classmates
ALTER TABLE course_classmates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view course classmates"
  ON course_classmates FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = classmate_id);

-- RLS Policies for friend_locations
ALTER TABLE friend_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view visible friend locations"
  ON friend_locations FOR SELECT
  USING (is_visible = true OR auth.uid() = user_id);

CREATE POLICY "Users can manage their own location"
  ON friend_locations FOR ALL
  USING (auth.uid() = user_id);

