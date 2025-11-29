-- =============================================
-- UPDATE MESSAGE NOTIFICATION TRIGGER FOR EVENT CHAT
-- This updates the notification trigger to handle event chat messages
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

  -- Handle direct messages
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

  -- Handle event chat messages
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

-- Verify the trigger was updated
SELECT 
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE trigger_name = 'on_message_received';

