-- =============================================
-- COMPLETE NOTIFICATION TRIGGERS
-- Run this in your Supabase SQL Editor
-- This creates triggers for all notification types:
-- 1. New event created
-- 2. Friend request received
-- 3. Friend request accepted
-- 4. Direct message received
-- 5. Post liked
-- 6. Post commented
-- =============================================

-- =============================================
-- 1. NOTIFICATION FOR NEW EVENT CREATED
-- Notify all users when a new event is created
-- =============================================
CREATE OR REPLACE FUNCTION handle_new_event_notification()
RETURNS TRIGGER AS $$
DECLARE
  organizer_name TEXT;
  user_record RECORD;
BEGIN
  -- Only notify if organizer_id is set and for public events (not private ones)
  IF NEW.organizer_id IS NOT NULL AND COALESCE(NEW.is_private, false) = false THEN
    -- Get organizer name
    SELECT name INTO organizer_name 
    FROM profiles 
    WHERE id = NEW.organizer_id;

    -- Notify all users except the organizer
    -- Note: You can modify this to only notify friends/followers if preferred
    FOR user_record IN
      SELECT id FROM profiles WHERE id != NEW.organizer_id
    LOOP
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      action_url,
      read,
      priority,
      created_at
    ) VALUES (
      user_record.id,
      'event',
      'New Event Created',
      COALESCE(organizer_name, 'Someone') || ' created a new event: ' || NEW.title,
      '/(tabs)/events/' || NEW.id::text,
      false,
      'medium',
      NOW()
    );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_event_created ON events;
CREATE TRIGGER on_event_created
  AFTER INSERT ON events
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_event_notification();

-- =============================================
-- 2. NOTIFICATION FOR FRIEND REQUEST RECEIVED
-- Notify recipient when they receive a friend request
-- =============================================
CREATE OR REPLACE FUNCTION handle_friend_request_notification()
RETURNS TRIGGER AS $$
DECLARE
  requester_name TEXT;
BEGIN
  -- Only notify on new pending requests
  IF NEW.status = 'pending' THEN
    -- Get requester name (use email if name is not available)
    SELECT COALESCE(name, email, 'Someone') INTO requester_name 
    FROM profiles 
    WHERE id = NEW.requester_id;

    -- Notify the recipient
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      action_url,
      read,
      priority,
      created_at
    ) VALUES (
      NEW.recipient_id,
      'social',
      'New Friend Request',
      COALESCE(requester_name, 'Someone') || ' sent you a friend request',
      '/(tabs)/friends?tab=requests',
      false,
      'high',
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_friend_request_received ON friend_requests;
CREATE TRIGGER on_friend_request_received
  AFTER INSERT ON friend_requests
  FOR EACH ROW
  EXECUTE FUNCTION handle_friend_request_notification();

-- =============================================
-- 3. NOTIFICATION FOR FRIEND REQUEST ACCEPTED
-- Notify requester when their friend request is accepted
-- =============================================
CREATE OR REPLACE FUNCTION handle_friend_request_accepted_notification()
RETURNS TRIGGER AS $$
DECLARE
  recipient_name TEXT;
BEGIN
  -- Only notify when status changes to 'accepted'
  IF OLD.status != 'accepted' AND NEW.status = 'accepted' THEN
    -- Get recipient name (the one who accepted)
    SELECT name INTO recipient_name 
    FROM profiles 
    WHERE id = NEW.recipient_id;

    -- Notify the requester (the one who sent the request)
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      action_url,
      read,
      priority,
      created_at
    ) VALUES (
      NEW.requester_id,
      'social',
      'Friend Request Accepted',
      COALESCE(recipient_name, 'Someone') || ' accepted your friend request',
      '/(tabs)/friends?tab=requests',
      false,
      'medium',
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_friend_request_accepted ON friend_requests;
CREATE TRIGGER on_friend_request_accepted
  AFTER UPDATE ON friend_requests
  FOR EACH ROW
  EXECUTE FUNCTION handle_friend_request_accepted_notification();

-- =============================================
-- 4. NOTIFICATION FOR DIRECT MESSAGE RECEIVED
-- Notify recipients when they receive a message
-- =============================================
CREATE OR REPLACE FUNCTION handle_message_notification()
RETURNS TRIGGER AS $$
DECLARE
  sender_name TEXT;
  recipient_user_id UUID;
  conversation_type TEXT;
  event_id_val UUID;
  event_title TEXT;
BEGIN
  -- Get sender name
  SELECT name INTO sender_name 
  FROM profiles 
  WHERE id = NEW.sender_id;

  -- Get conversation type and event_id if applicable
  SELECT type, event_id INTO conversation_type, event_id_val
  FROM conversations
  WHERE id = NEW.conversation_id;

  -- For direct messages, notify all participants except sender
  IF conversation_type = 'direct' THEN
    FOR recipient_user_id IN
      SELECT user_id 
      FROM conversation_participants 
      WHERE conversation_id = NEW.conversation_id 
      AND user_id != NEW.sender_id
    LOOP
      INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        action_url,
        read,
        priority,
        created_at
      ) VALUES (
        recipient_user_id,
        'social',
        'New Message',
        COALESCE(sender_name, 'Someone') || ': ' || LEFT(NEW.content, 100) || CASE WHEN LENGTH(NEW.content) > 100 THEN '...' ELSE '' END,
        '/(tabs)/messages/' || NEW.conversation_id::text,
        false,
        'high',
        NOW()
      );
    END LOOP;
  END IF;

  -- For event chat messages, notify all event attendees except sender
  IF conversation_type = 'event' AND event_id_val IS NOT NULL THEN
    -- Get event title for the notification
    SELECT title INTO event_title
    FROM events
    WHERE id = event_id_val;

    -- Notify all event attendees except the sender
    FOR recipient_user_id IN
      SELECT user_id 
      FROM event_attendees 
      WHERE event_id = event_id_val 
      AND user_id != NEW.sender_id
    LOOP
      INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        action_url,
        read,
        priority,
        created_at
      ) VALUES (
        recipient_user_id,
        'social',
        'New Event Chat Message',
        COALESCE(sender_name, 'Someone') || ' in "' || COALESCE(event_title, 'Event') || '": ' || LEFT(NEW.content, 80) || CASE WHEN LENGTH(NEW.content) > 80 THEN '...' ELSE '' END,
        '/(tabs)/events/' || event_id_val::text || '?tab=chat',
        false,
        'medium',
        NOW()
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_message_received ON messages;
CREATE TRIGGER on_message_received
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION handle_message_notification();

-- =============================================
-- 5. NOTIFICATION FOR POST LIKED
-- Notify post author when someone likes their post
-- =============================================
CREATE OR REPLACE FUNCTION handle_post_liked_notification()
RETURNS TRIGGER AS $$
DECLARE
  post_author_id UUID;
  liker_name TEXT;
  post_title TEXT;
BEGIN
  -- Get post author and title
  SELECT user_id, title INTO post_author_id, post_title
  FROM posts
  WHERE id = NEW.post_id;

  -- Only notify if the liker is not the post author
  IF post_author_id IS NOT NULL AND post_author_id != NEW.user_id THEN
    -- Get liker name
    SELECT name INTO liker_name 
    FROM profiles 
    WHERE id = NEW.user_id;

    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      action_url,
      read,
      priority,
      created_at
    ) VALUES (
      post_author_id,
      'social',
      'Post Liked',
      COALESCE(liker_name, 'Someone') || ' liked your post: ' || COALESCE(post_title, 'Untitled'),
      '/(tabs)/community/' || NEW.post_id::text,
      false,
      'medium',
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_post_liked ON post_likes;
CREATE TRIGGER on_post_liked
  AFTER INSERT ON post_likes
  FOR EACH ROW
  EXECUTE FUNCTION handle_post_liked_notification();

-- =============================================
-- 6. NOTIFICATION FOR POST COMMENTED
-- Notify post author when someone comments on their post
-- =============================================
CREATE OR REPLACE FUNCTION handle_post_commented_notification()
RETURNS TRIGGER AS $$
DECLARE
  post_author_id UUID;
  commenter_name TEXT;
  post_title TEXT;
BEGIN
  -- Get post author and title
  SELECT user_id, title INTO post_author_id, post_title
  FROM posts
  WHERE id = NEW.post_id;

  -- Only notify if the commenter is not the post author
  IF post_author_id IS NOT NULL AND post_author_id != NEW.user_id THEN
    -- Get commenter name
    SELECT name INTO commenter_name 
    FROM profiles 
    WHERE id = NEW.user_id;

    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      action_url,
      read,
      priority,
      created_at
    ) VALUES (
      post_author_id,
      'social',
      'New Comment',
      COALESCE(commenter_name, 'Someone') || ' commented on your post: ' || COALESCE(post_title, 'Untitled'),
      '/(tabs)/community/' || NEW.post_id::text,
      false,
      'medium',
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_post_commented ON post_replies;
CREATE TRIGGER on_post_commented
  AFTER INSERT ON post_replies
  FOR EACH ROW
  EXECUTE FUNCTION handle_post_commented_notification();

-- =============================================
-- VERIFICATION QUERIES
-- Run these to verify triggers were created
-- =============================================

-- Check all triggers
SELECT 
  trigger_name, 
  event_object_table, 
  action_timing, 
  event_manipulation
FROM information_schema.triggers
WHERE trigger_name IN (
  'on_event_created',
  'on_friend_request_received',
  'on_friend_request_accepted',
  'on_message_received',
  'on_post_liked',
  'on_post_commented'
)
ORDER BY event_object_table, trigger_name;

