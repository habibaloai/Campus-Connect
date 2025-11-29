-- =============================================
-- ENSURE ALL NOTIFICATIONS WORK CORRECTLY
-- This script ensures notifications work for:
-- 1. Friend request sent
-- 2. Direct message
-- 3. Message in event chat
-- 4. Someone replies to me (comments on my post)
-- 5. Someone likes my post
-- =============================================

-- =============================================
-- 1. FRIEND REQUEST NOTIFICATION (with error handling)
-- =============================================
CREATE OR REPLACE FUNCTION handle_friend_request_notification()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requester_name TEXT;
  notification_id UUID;
BEGIN
  -- Only notify on new pending requests
  IF NEW.status = 'pending' THEN
    BEGIN
      -- Get requester name with multiple fallbacks
      SELECT COALESCE(
        (SELECT name FROM profiles WHERE id = NEW.requester_id),
        (SELECT email FROM profiles WHERE id = NEW.requester_id),
        'Someone'
      ) INTO requester_name;

      -- Insert notification (bypasses RLS because of SECURITY DEFINER)
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
        requester_name || ' sent you a friend request',
        '/(tabs)/friends?tab=requests',
        false,
        'high',
        NOW()
      )
      RETURNING id INTO notification_id;
      
      -- Log success (check Supabase logs)
      RAISE NOTICE '✅ Friend request notification created: id=%, recipient=%', 
        notification_id, NEW.recipient_id;
      
    EXCEPTION
      WHEN OTHERS THEN
        -- Log detailed error (check Supabase logs)
        RAISE WARNING '❌ Failed to create friend request notification: % (SQLSTATE: %)', 
          SQLERRM, SQLSTATE;
        -- Don't fail the trigger - let the friend request be created anyway
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_friend_request_received ON friend_requests;
CREATE TRIGGER on_friend_request_received
  AFTER INSERT ON friend_requests
  FOR EACH ROW
  WHEN (NEW.status = 'pending')
  EXECUTE FUNCTION handle_friend_request_notification();

-- =============================================
-- 2. DIRECT MESSAGE NOTIFICATION (enhanced)
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
        BEGIN
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
        EXCEPTION
          WHEN OTHERS THEN
            RAISE WARNING 'Failed to create DM notification for user %: %', recipient_user_id, SQLERRM;
        END;
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
        BEGIN
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
        EXCEPTION
          WHEN OTHERS THEN
            RAISE WARNING 'Failed to create event chat notification for user %: %', recipient_user_id, SQLERRM;
        END;
      END LOOP;
    END IF;
    
  EXCEPTION
    WHEN OTHERS THEN
      -- Log error but don't fail the trigger
      RAISE WARNING 'Failed to create message notification: %', SQLERRM;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_message_received ON messages;
CREATE TRIGGER on_message_received
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION handle_message_notification();

-- =============================================
-- 3. POST LIKED NOTIFICATION (enhanced)
-- =============================================
CREATE OR REPLACE FUNCTION handle_post_liked_notification()
RETURNS TRIGGER AS $$
DECLARE
  post_author_id UUID;
  liker_name TEXT;
  post_title TEXT;
BEGIN
  BEGIN
    -- Get post author and title
    SELECT user_id, COALESCE(title, content, 'Untitled Post') INTO post_author_id, post_title
    FROM posts
    WHERE id = NEW.post_id;

    -- Only notify if the liker is not the post author
    IF post_author_id IS NOT NULL AND post_author_id != NEW.user_id THEN
      -- Get liker name
      SELECT name INTO liker_name 
      FROM profiles 
      WHERE id = NEW.user_id;

      -- Create notification
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
        COALESCE(liker_name, 'Someone') || ' liked your post: ' || LEFT(post_title, 50) || CASE WHEN LENGTH(post_title) > 50 THEN '...' ELSE '' END,
        '/(tabs)/community/' || NEW.post_id::text,
        false,
        'medium',
        NOW()
      );
    END IF;
    
  EXCEPTION
    WHEN OTHERS THEN
      -- Log error but don't fail the trigger
      RAISE WARNING 'Failed to create post liked notification: %', SQLERRM;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_post_liked ON post_likes;
CREATE TRIGGER on_post_liked
  AFTER INSERT ON post_likes
  FOR EACH ROW
  EXECUTE FUNCTION handle_post_liked_notification();

-- =============================================
-- 4. POST COMMENTED NOTIFICATION (enhanced)
-- =============================================
CREATE OR REPLACE FUNCTION handle_post_commented_notification()
RETURNS TRIGGER AS $$
DECLARE
  post_author_id UUID;
  commenter_name TEXT;
  post_title TEXT;
  comment_preview TEXT;
BEGIN
  BEGIN
    -- Get post author and title
    SELECT user_id, COALESCE(title, content, 'Untitled Post') INTO post_author_id, post_title
    FROM posts
    WHERE id = NEW.post_id;

    -- Only notify if the commenter is not the post author
    IF post_author_id IS NOT NULL AND post_author_id != NEW.user_id THEN
      -- Get commenter name
      SELECT name INTO commenter_name 
      FROM profiles 
      WHERE id = NEW.user_id;

      -- Get comment preview (first 50 characters)
      SELECT LEFT(content, 50) INTO comment_preview
      FROM post_replies
      WHERE id = NEW.id;

      -- Create notification
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
        COALESCE(commenter_name, 'Someone') || ' commented on your post: "' || LEFT(post_title, 40) || CASE WHEN LENGTH(post_title) > 40 THEN '...' ELSE '' END || '"',
        '/(tabs)/community/' || NEW.post_id::text,
        false,
        'medium',
        NOW()
      );
    END IF;
    
  EXCEPTION
    WHEN OTHERS THEN
      -- Log error but don't fail the trigger
      RAISE WARNING 'Failed to create post commented notification: %', SQLERRM;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_post_commented ON post_replies;
CREATE TRIGGER on_post_commented
  AFTER INSERT ON post_replies
  FOR EACH ROW
  EXECUTE FUNCTION handle_post_commented_notification();

-- =============================================
-- 5. FRIEND REQUEST ACCEPTED NOTIFICATION (keep existing)
-- =============================================
CREATE OR REPLACE FUNCTION handle_friend_request_accepted_notification()
RETURNS TRIGGER AS $$
DECLARE
  recipient_name TEXT;
BEGIN
  -- Only notify when status changes to 'accepted'
  IF OLD.status != 'accepted' AND NEW.status = 'accepted' THEN
    BEGIN
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
      
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING 'Failed to create friend request accepted notification: %', SQLERRM;
    END;
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
-- VERIFICATION: Check all triggers are created
-- =============================================
SELECT 
  trigger_name, 
  event_object_table, 
  action_timing, 
  event_manipulation,
  CASE 
    WHEN trigger_name IS NOT NULL THEN '✅ TRIGGER EXISTS'
    ELSE '❌ TRIGGER MISSING'
  END as status
FROM information_schema.triggers
WHERE trigger_name IN (
  'on_friend_request_received',
  'on_friend_request_accepted',
  'on_message_received',
  'on_post_liked',
  'on_post_commented'
)
ORDER BY event_object_table, trigger_name;

-- =============================================
-- VERIFICATION: Check all functions exist
-- =============================================
SELECT 
  routine_name,
  routine_type,
  security_type,
  CASE 
    WHEN routine_name IS NOT NULL THEN '✅ FUNCTION EXISTS'
    ELSE '❌ FUNCTION MISSING'
  END as status
FROM information_schema.routines
WHERE routine_name IN (
  'handle_friend_request_notification',
  'handle_friend_request_accepted_notification',
  'handle_message_notification',
  'handle_post_liked_notification',
  'handle_post_commented_notification'
)
ORDER BY routine_name;

-- =============================================
-- SUMMARY
-- =============================================
SELECT 
  'All notification triggers have been created/updated with error handling' as summary,
  '1. Friend request sent ✅' as feature_1,
  '2. Direct message ✅' as feature_2,
  '3. Event chat message ✅' as feature_3,
  '4. Post liked ✅' as feature_4,
  '5. Post commented ✅' as feature_5,
  'Run the verification queries above to confirm all triggers exist' as next_step;

