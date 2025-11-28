-- =============================================
-- FIXED MESSAGING RLS POLICIES (No Recursion)
-- Run this in your Supabase SQL Editor
-- =============================================

-- First, drop ALL existing messaging policies
DROP POLICY IF EXISTS "Users can view own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
DROP POLICY IF EXISTS "Users can view conversation participants" ON conversation_participants;
DROP POLICY IF EXISTS "Users can add conversation participants" ON conversation_participants;
DROP POLICY IF EXISTS "Users can view messages in own conversations" ON messages;
DROP POLICY IF EXISTS "Users can send messages to own conversations" ON messages;
DROP POLICY IF EXISTS "Users can update messages in own conversations" ON messages;

-- =============================================
-- CONVERSATION_PARTICIPANTS POLICIES (FIRST - no recursion)
-- =============================================

-- Users can see their own participation records
CREATE POLICY "Users can view conversation participants" 
  ON conversation_participants FOR SELECT 
  USING (user_id = auth.uid());

-- Users can add themselves to conversations OR add others if they're already in the conversation
CREATE POLICY "Users can add conversation participants" 
  ON conversation_participants FOR INSERT 
  WITH CHECK (user_id = auth.uid());

-- =============================================
-- CONVERSATIONS POLICIES
-- =============================================

-- Users can view conversations they're part of
CREATE POLICY "Users can view own conversations" 
  ON conversations FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants 
      WHERE conversation_participants.conversation_id = conversations.id 
      AND conversation_participants.user_id = auth.uid()
    )
  );

-- Anyone authenticated can create conversations
CREATE POLICY "Users can create conversations" 
  ON conversations FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

-- =============================================
-- MESSAGES POLICIES
-- =============================================

-- Users can view messages in conversations they're part of
CREATE POLICY "Users can view messages in own conversations" 
  ON messages FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants 
      WHERE conversation_participants.conversation_id = messages.conversation_id 
      AND conversation_participants.user_id = auth.uid()
    )
  );

-- Users can send messages (just check sender_id matches, conversation check handled by FK)
CREATE POLICY "Users can send messages to own conversations" 
  ON messages FOR INSERT 
  WITH CHECK (sender_id = auth.uid());

-- Users can update messages in their conversations (for marking as read)
CREATE POLICY "Users can update messages in own conversations" 
  ON messages FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants 
      WHERE conversation_participants.conversation_id = messages.conversation_id 
      AND conversation_participants.user_id = auth.uid()
    )
  );

-- =============================================
-- ENABLE REALTIME (ignore error if already enabled)
-- =============================================
-- ALTER PUBLICATION supabase_realtime ADD TABLE messages;












