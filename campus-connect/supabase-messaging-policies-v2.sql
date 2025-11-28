-- =============================================
-- MESSAGING RLS POLICIES V2 (Fixed for viewing participants)
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

-- Drop the helper function if it exists
DROP FUNCTION IF EXISTS is_participant_in_conversation(uuid, uuid);

-- =============================================
-- HELPER FUNCTION (Security definer to avoid recursion)
-- =============================================
CREATE OR REPLACE FUNCTION is_participant_in_conversation(conv_id uuid, uid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_id = conv_id AND user_id = uid
  );
$$;

-- =============================================
-- CONVERSATION_PARTICIPANTS POLICIES
-- =============================================

-- Users can see ALL participants in conversations they're part of
CREATE POLICY "Users can view conversation participants" 
  ON conversation_participants FOR SELECT 
  USING (is_participant_in_conversation(conversation_id, auth.uid()));

-- Users can add themselves or others to conversations
CREATE POLICY "Users can add conversation participants" 
  ON conversation_participants FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

-- =============================================
-- CONVERSATIONS POLICIES
-- =============================================

-- Users can view conversations they're part of
CREATE POLICY "Users can view own conversations" 
  ON conversations FOR SELECT 
  USING (is_participant_in_conversation(id, auth.uid()));

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
  USING (is_participant_in_conversation(conversation_id, auth.uid()));

-- Users can send messages (sender_id must match their uid)
CREATE POLICY "Users can send messages to own conversations" 
  ON messages FOR INSERT 
  WITH CHECK (sender_id = auth.uid());

-- Users can update messages in their conversations (for marking as read)
CREATE POLICY "Users can update messages in own conversations" 
  ON messages FOR UPDATE 
  USING (is_participant_in_conversation(conversation_id, auth.uid()));

-- =============================================
-- PROFILES POLICY (ensure users can see other profiles)
-- =============================================
-- Make sure this policy exists so users can see sender names
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);













