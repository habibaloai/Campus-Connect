-- =============================================
-- ALLOW REQUESTERS TO UPDATE THEIR OWN FRIEND REQUESTS
-- =============================================
-- 
-- Problem: The current RLS policy only allows recipients to update friend requests.
-- When a requester tries to resend a rejected request, the update is blocked.
--
-- Solution: Add a policy that allows requesters to update their own requests,
-- specifically to change status from 'rejected' or 'cancelled' back to 'pending'.
--
-- =============================================

-- Policy: Requesters can update their own friend requests (to resend rejected/cancelled requests)
-- This allows requesters to update requests they sent, specifically to change status to 'pending'
DROP POLICY IF EXISTS "Requesters can update their own friend requests" ON public.friend_requests;

CREATE POLICY "Requesters can update their own friend requests"
  ON public.friend_requests
  FOR UPDATE
  USING (auth.uid() = requester_id)
  WITH CHECK (
    auth.uid() = requester_id
    AND status = 'pending'  -- Only allow updating to pending status
  );

-- Add a comment explaining the policy
COMMENT ON POLICY "Requesters can update their own friend requests" ON public.friend_requests IS 
'Allows requesters to resend friend requests that were previously rejected or cancelled by updating the status back to pending';

