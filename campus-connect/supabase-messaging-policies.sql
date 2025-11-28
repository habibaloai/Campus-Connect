-- =============================================
-- MESSAGING RLS POLICIES
-- Run this in your Supabase SQL Editor
-- =============================================

-- Conversations: Users can view conversations they're part of
CREATE POLICY "Users can view own conversations" 
  ON conversations FOR SELECT 
  USING (
    id IN (
      SELECT conversation_id 
      FROM conversation_participants 
      WHERE user_id = auth.uid()
    )
  );

-- Conversations: Users can create conversations
CREATE POLICY "Users can create conversations" 
  ON conversations FOR INSERT 
  WITH CHECK (true);

-- Conversation Participants: Users can view participants in their conversations
CREATE POLICY "Users can view conversation participants" 
  ON conversation_participants FOR SELECT 
  USING (
    conversation_id IN (
      SELECT conversation_id 
      FROM conversation_participants 
      WHERE user_id = auth.uid()
    )
  );

-- Conversation Participants: Users can add participants to conversations they're in
CREATE POLICY "Users can add conversation participants" 
  ON conversation_participants FOR INSERT 
  WITH CHECK (
    conversation_id IN (
      SELECT conversation_id 
      FROM conversation_participants 
      WHERE user_id = auth.uid()
    ) OR user_id = auth.uid()
  );

-- Messages: Users can view messages in their conversations
CREATE POLICY "Users can view messages in own conversations" 
  ON messages FOR SELECT 
  USING (
    conversation_id IN (
      SELECT conversation_id 
      FROM conversation_participants 
      WHERE user_id = auth.uid()
    )
  );

-- Messages: Users can send messages to conversations they're part of
CREATE POLICY "Users can send messages to own conversations" 
  ON messages FOR INSERT 
  WITH CHECK (
    sender_id = auth.uid() AND
    conversation_id IN (
      SELECT conversation_id 
      FROM conversation_participants 
      WHERE user_id = auth.uid()
    )
  );

-- Messages: Users can update (mark as read) messages in their conversations
CREATE POLICY "Users can update messages in own conversations" 
  ON messages FOR UPDATE 
  USING (
    conversation_id IN (
      SELECT conversation_id 
      FROM conversation_participants 
      WHERE user_id = auth.uid()
    )
  );

-- Enable realtime for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

COMMIT;













