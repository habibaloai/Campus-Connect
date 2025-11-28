-- =============================================
-- GAMIFICATION & STREAKS SCHEMA
-- =============================================

-- User Stats (extend existing or create new)
CREATE TABLE IF NOT EXISTS user_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  total_points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Streaks (all types)
CREATE TABLE IF NOT EXISTS streaks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  streak_type TEXT NOT NULL CHECK (streak_type IN (
    'attendance', 'grade', 'submission', 'study_hours', 'early_bird',
    'event_attendance', 'workout', 'mensa', 'friend_meetup'
  )),
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  streak_start_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, streak_type)
);

-- Streak History (for tracking daily activities)
CREATE TABLE IF NOT EXISTS streak_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  streak_type TEXT NOT NULL,
  activity_date DATE NOT NULL,
  metadata JSONB, -- Additional data like study hours, grade, etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, streak_type, activity_date)
);

-- Achievements
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  category TEXT CHECK (category IN ('academic', 'social', 'wellness', 'special', 'streak')),
  points INTEGER DEFAULT 0,
  rarity TEXT CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')) DEFAULT 'common',
  requirement_type TEXT, -- e.g., 'streak_days', 'points', 'event_count'
  requirement_value INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Achievements (unlocked achievements)
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  progress INTEGER DEFAULT 0, -- For achievements with progress
  is_completed BOOLEAN DEFAULT false,
  UNIQUE(user_id, achievement_id)
);

-- Points Transactions
CREATE TABLE IF NOT EXISTS point_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  source TEXT NOT NULL, -- e.g., 'attendance', 'assignment', 'event', 'streak_milestone'
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leaderboards
CREATE TABLE IF NOT EXISTS leaderboards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('weekly', 'monthly', 'semester', 'course', 'challenge')),
  category TEXT, -- e.g., 'study_hours', 'points', 'attendance', 'social'
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE, -- For course-specific
  period_start DATE,
  period_end DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leaderboard Entries
CREATE TABLE IF NOT EXISTS leaderboard_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  leaderboard_id UUID REFERENCES leaderboards(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  rank INTEGER,
  score INTEGER DEFAULT 0,
  metadata JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(leaderboard_id, user_id)
);

-- Challenges
CREATE TABLE IF NOT EXISTS challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT CHECK (type IN ('study', 'fitness', 'social', 'academic', 'custom')),
  duration_days INTEGER,
  start_date DATE,
  end_date DATE,
  target_value INTEGER, -- Target to achieve
  target_type TEXT, -- e.g., 'study_hours', 'events', 'workouts'
  reward_points INTEGER DEFAULT 0,
  reward_achievement_id UUID REFERENCES achievements(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Challenge Participants
CREATE TABLE IF NOT EXISTS challenge_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  progress INTEGER DEFAULT 0,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  UNIQUE(challenge_id, user_id)
);

-- Streak Recovery (insurance)
CREATE TABLE IF NOT EXISTS streak_recoveries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  streak_type TEXT NOT NULL,
  used_at TIMESTAMPTZ DEFAULT NOW(),
  recovery_month DATE, -- Track which month it was used
  UNIQUE(user_id, recovery_month)
);

-- Levels Configuration
CREATE TABLE IF NOT EXISTS level_config (
  level INTEGER PRIMARY KEY,
  level_name TEXT NOT NULL, -- e.g., 'Freshman', 'Sophomore', 'Junior', 'Senior', 'Graduate', 'Legend'
  points_required INTEGER NOT NULL,
  rewards JSONB, -- Rewards for reaching this level
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Surprise Rewards (random drops)
CREATE TABLE IF NOT EXISTS surprise_rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  reward_type TEXT CHECK (reward_type IN ('points', 'achievement', 'badge', 'perk')),
  reward_value INTEGER,
  achievement_id UUID REFERENCES achievements(id),
  message TEXT,
  claimed BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_streaks_user ON streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_streaks_type ON streaks(streak_type);
CREATE INDEX IF NOT EXISTS idx_streak_activities_user ON streak_activities(user_id, activity_date);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_point_transactions_user ON point_transactions(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_leaderboard_entries_leaderboard ON leaderboard_entries(leaderboard_id, rank);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_challenge ON challenge_participants(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_user ON challenge_participants(user_id);

-- RLS Policies
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE streak_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE streak_recoveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE surprise_rewards ENABLE ROW LEVEL SECURITY;

-- User Stats Policies
CREATE POLICY "Users can view all stats"
  ON user_stats FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own stats"
  ON user_stats FOR ALL
  USING (auth.uid() = user_id);

-- Streaks Policies
CREATE POLICY "Users can view all streaks"
  ON streaks FOR SELECT
  USING (true);

CREATE POLICY "Users can manage their own streaks"
  ON streaks FOR ALL
  USING (auth.uid() = user_id);

-- Streak Activities Policies
CREATE POLICY "Users can view all activities"
  ON streak_activities FOR SELECT
  USING (true);

CREATE POLICY "Users can manage their own activities"
  ON streak_activities FOR ALL
  USING (auth.uid() = user_id);

-- User Achievements Policies
CREATE POLICY "Users can view all achievements"
  ON user_achievements FOR SELECT
  USING (true);

CREATE POLICY "Users can manage their own achievements"
  ON user_achievements FOR ALL
  USING (auth.uid() = user_id);

-- Point Transactions Policies
CREATE POLICY "Users can view all transactions"
  ON point_transactions FOR SELECT
  USING (true);

CREATE POLICY "System can create transactions"
  ON point_transactions FOR INSERT
  WITH CHECK (true);

-- Leaderboard Entries Policies
CREATE POLICY "Users can view all leaderboard entries"
  ON leaderboard_entries FOR SELECT
  USING (true);

-- Challenge Participants Policies
CREATE POLICY "Users can view all participants"
  ON challenge_participants FOR SELECT
  USING (true);

CREATE POLICY "Users can join challenges"
  ON challenge_participants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
  ON challenge_participants FOR UPDATE
  USING (auth.uid() = user_id);

-- Streak Recoveries Policies
CREATE POLICY "Users can view their own recoveries"
  ON streak_recoveries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can use recoveries"
  ON streak_recoveries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Surprise Rewards Policies
CREATE POLICY "Users can view their own rewards"
  ON surprise_rewards FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can claim their rewards"
  ON surprise_rewards FOR UPDATE
  USING (auth.uid() = user_id);

-- Insert default level configuration
INSERT INTO level_config (level, level_name, points_required) VALUES
  (1, 'Freshman', 0),
  (2, 'Sophomore', 100),
  (3, 'Junior', 500),
  (4, 'Senior', 1500),
  (5, 'Graduate', 3000),
  (6, 'Master', 6000),
  (7, 'Doctor', 12000),
  (8, 'Legend', 25000)
ON CONFLICT (level) DO NOTHING;

-- Insert default achievements
INSERT INTO achievements (name, description, category, points, rarity, requirement_type, requirement_value) VALUES
  -- Streak Achievements
  ('Week Warrior', '7-day attendance streak', 'streak', 50, 'common', 'streak_days', 7),
  ('Month Master', '30-day attendance streak', 'streak', 200, 'rare', 'streak_days', 30),
  ('Century Club', '100-day attendance streak', 'streak', 1000, 'legendary', 'streak_days', 100),
  ('Early Bird', 'Arrive to class 10 minutes early', 'academic', 25, 'common', 'streak_days', 1),
  ('Study Master', 'Log 100 study hours', 'academic', 150, 'rare', 'study_hours', 100),
  ('Social Butterfly', 'Attend 10 campus events', 'social', 100, 'common', 'event_count', 10),
  ('Fitness Fanatic', '30-day workout streak', 'wellness', 200, 'rare', 'streak_days', 30),
  ('Mensa Regular', 'Eat in cafeteria 20 times', 'wellness', 75, 'common', 'mensa_count', 20),
  ('Friend Connector', 'Meet with friends 5 days in a row', 'social', 100, 'common', 'streak_days', 5),
  ('Perfect Student', 'Submit all assignments on time', 'academic', 150, 'rare', 'submission_streak', 10),
  ('Semester MVP', 'Most engaged student of the semester', 'special', 500, 'epic', 'mvp', 1)
ON CONFLICT DO NOTHING;

