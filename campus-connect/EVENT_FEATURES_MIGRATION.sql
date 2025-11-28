-- Migration for Event Privacy, Photos, Comments, Reactions, and Group Chat
-- Run this in your Supabase SQL Editor

-- 1. Add is_private and organizer_id to events table
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS organizer_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- 2. Create event_join_requests table for private events
CREATE TABLE IF NOT EXISTS event_join_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- 3. Create event_photos table for event photos with descriptions
CREATE TABLE IF NOT EXISTS event_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3a. Create photo_comments table for comments on specific photos
CREATE TABLE IF NOT EXISTS photo_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  photo_id UUID REFERENCES event_photos(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3b. Create photo_reactions table for reactions on specific photos
CREATE TABLE IF NOT EXISTS photo_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  photo_id UUID REFERENCES event_photos(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  reaction_type TEXT CHECK (reaction_type IN ('like', 'love', 'laugh', 'wow', 'sad', 'angry')) DEFAULT 'like',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(photo_id, user_id, reaction_type)
);

-- 3c. Create comment_reactions table for reactions on comments
CREATE TABLE IF NOT EXISTS comment_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  comment_id UUID REFERENCES photo_comments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

-- 3d. Create collections table for organizing photos
CREATE TABLE IF NOT EXISTS collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  cover_photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3e. Create collection_photos table (many-to-many)
CREATE TABLE IF NOT EXISTS collection_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  collection_id UUID REFERENCES collections(id) ON DELETE CASCADE,
  photo_id UUID REFERENCES event_photos(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(collection_id, photo_id)
);

-- 4. Create event_comments table
CREATE TABLE IF NOT EXISTS event_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create event_reactions table
CREATE TABLE IF NOT EXISTS event_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  reaction_type TEXT CHECK (reaction_type IN ('like', 'love', 'laugh', 'wow', 'sad', 'angry')) DEFAULT 'like',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, user_id, reaction_type)
);

-- 6. Create event_group_chat table for group chat messages
CREATE TABLE IF NOT EXISTS event_group_chat (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_event_join_requests_event_id ON event_join_requests(event_id);
CREATE INDEX IF NOT EXISTS idx_event_join_requests_user_id ON event_join_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_event_join_requests_status ON event_join_requests(status);
CREATE INDEX IF NOT EXISTS idx_event_photos_event_id ON event_photos(event_id);
CREATE INDEX IF NOT EXISTS idx_event_comments_event_id ON event_comments(event_id);
CREATE INDEX IF NOT EXISTS idx_event_reactions_event_id ON event_reactions(event_id);
CREATE INDEX IF NOT EXISTS idx_event_group_chat_event_id ON event_group_chat(event_id);
CREATE INDEX IF NOT EXISTS idx_photo_comments_photo_id ON photo_comments(photo_id);
CREATE INDEX IF NOT EXISTS idx_photo_reactions_photo_id ON photo_reactions(photo_id);
CREATE INDEX IF NOT EXISTS idx_comment_reactions_comment_id ON comment_reactions(comment_id);
CREATE INDEX IF NOT EXISTS idx_collections_user_id ON collections(user_id);
CREATE INDEX IF NOT EXISTS idx_collection_photos_collection_id ON collection_photos(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_photos_photo_id ON collection_photos(photo_id);

-- 8. Enable Row Level Security (RLS)
ALTER TABLE event_join_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_group_chat ENABLE ROW LEVEL SECURITY;

-- 9. RLS Policies for event_join_requests
-- Anyone can create a join request
CREATE POLICY "Users can create join requests" ON event_join_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Organizers can view all requests for their events
CREATE POLICY "Organizers can view join requests" ON event_join_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM events 
      WHERE events.id = event_join_requests.event_id 
      AND events.organizer_id = auth.uid()
    )
  );

-- Users can view their own requests
CREATE POLICY "Users can view their own requests" ON event_join_requests
  FOR SELECT USING (auth.uid() = user_id);

-- Organizers can update request status
CREATE POLICY "Organizers can update join requests" ON event_join_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM events 
      WHERE events.id = event_join_requests.event_id 
      AND events.organizer_id = auth.uid()
    )
  );

-- 10. RLS Policies for event_photos
-- Event attendees can view photos
CREATE POLICY "Attendees can view event photos" ON event_photos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM event_attendees 
      WHERE event_attendees.event_id = event_photos.event_id 
      AND event_attendees.user_id = auth.uid()
    )
  );

-- Event attendees can add photos
CREATE POLICY "Attendees can add photos" ON event_photos
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM event_attendees 
      WHERE event_attendees.event_id = event_photos.event_id 
      AND event_attendees.user_id = auth.uid()
    )
  );

-- Users can delete their own photos
CREATE POLICY "Users can delete their own photos" ON event_photos
  FOR DELETE USING (auth.uid() = user_id);

-- 11. RLS Policies for event_comments
-- Event attendees can view comments
CREATE POLICY "Attendees can view comments" ON event_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM event_attendees 
      WHERE event_attendees.event_id = event_comments.event_id 
      AND event_attendees.user_id = auth.uid()
    )
  );

-- Event attendees can add comments
CREATE POLICY "Attendees can add comments" ON event_comments
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM event_attendees 
      WHERE event_attendees.event_id = event_comments.event_id 
      AND event_attendees.user_id = auth.uid()
    )
  );

-- Users can update their own comments
CREATE POLICY "Users can update their own comments" ON event_comments
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own comments
CREATE POLICY "Users can delete their own comments" ON event_comments
  FOR DELETE USING (auth.uid() = user_id);

-- 12. RLS Policies for event_reactions
-- Event attendees can view reactions
CREATE POLICY "Attendees can view reactions" ON event_reactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM event_attendees 
      WHERE event_attendees.event_id = event_reactions.event_id 
      AND event_attendees.user_id = auth.uid()
    )
  );

-- Event attendees can add reactions
CREATE POLICY "Attendees can add reactions" ON event_reactions
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM event_attendees 
      WHERE event_attendees.event_id = event_reactions.event_id 
      AND event_attendees.user_id = auth.uid()
    )
  );

-- Users can delete their own reactions
CREATE POLICY "Users can delete their own reactions" ON event_reactions
  FOR DELETE USING (auth.uid() = user_id);

-- 13. RLS Policies for event_group_chat
-- Event attendees can view messages
CREATE POLICY "Attendees can view chat messages" ON event_group_chat
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM event_attendees 
      WHERE event_attendees.event_id = event_group_chat.event_id 
      AND event_attendees.user_id = auth.uid()
    )
  );

-- Event attendees can send messages
CREATE POLICY "Attendees can send messages" ON event_group_chat
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM event_attendees 
      WHERE event_attendees.event_id = event_group_chat.event_id 
      AND event_attendees.user_id = auth.uid()
    )
  );

-- Users can update their own messages
CREATE POLICY "Users can update their own messages" ON event_group_chat
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own messages
CREATE POLICY "Users can delete their own messages" ON event_group_chat
  FOR DELETE USING (auth.uid() = user_id);

