-- =============================================
-- FIX FRIEND REQUESTS: Allow resending after rejection
-- =============================================
-- 
-- Problem: The unique constraint on (requester_id, recipient_id) prevents
-- users from sending a new friend request after a previous one was rejected.
--
-- Solution: Create a partial unique index that only enforces uniqueness
-- for pending requests. This allows rejected/cancelled requests to exist
-- while preventing duplicate pending requests.
--
-- =============================================

-- Drop the existing unique constraint if it exists
-- Note: This constraint might be defined in the table creation, so we need to check
DO $$ 
BEGIN
    -- Try to drop the constraint if it exists
    IF EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'friend_requests_requests_requester_id_recipient_id_key'
    ) THEN
        ALTER TABLE friend_requests 
        DROP CONSTRAINT friend_requests_requests_requester_id_recipient_id_key;
    END IF;
END $$;

-- Create a partial unique index that only applies to pending requests
-- This allows multiple rejected/cancelled requests but only one pending request
CREATE UNIQUE INDEX IF NOT EXISTS friend_requests_unique_pending 
ON friend_requests (requester_id, recipient_id) 
WHERE status = 'pending';

-- Add a comment explaining the index
COMMENT ON INDEX friend_requests_unique_pending IS 
'Ensures only one pending friend request exists between two users, but allows multiple rejected/cancelled requests';


