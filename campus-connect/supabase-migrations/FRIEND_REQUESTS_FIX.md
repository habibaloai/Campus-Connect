# Friend Requests Fix: Allow Resending After Rejection

## Problem
When User A sends a friend request to User B and User B rejects it, User A cannot send another request. Attempting to do so results in:
```
duplicate key value violates unique constraint "friend_requests_requests_requester_id_recipient_id_key"
```

## Root Cause
The `friend_requests` table has a unique constraint on `(requester_id, recipient_id)`. When a request is rejected, the record remains in the database with `status='rejected'`. When User A tries to send a new request, the INSERT fails because a record with the same `(requester_id, recipient_id)` already exists.

## Solution

### Application-Level Fix (Primary Solution)
Updated `sendFriendRequest` function in `campus-connect/apps/mobile/lib/supabase.ts`:

1. **Check for existing request**: Before inserting, check if a request already exists between the two users
2. **Handle different statuses**:
   - If `pending`: Return error "Friend request already sent"
   - If `accepted`: Return error "You are already friends with this user"
   - If `rejected` or `cancelled`: **Update the existing record to `pending`** instead of inserting a new one
3. **Handle race conditions**: If a unique constraint error occurs (race condition), re-check and handle accordingly

### Database-Level Improvement (Optional)
Created migration `fix-friend-requests-rejected-constraint.sql` that:
- Drops the existing unique constraint
- Creates a partial unique index that only enforces uniqueness for `pending` requests
- This allows multiple `rejected`/`cancelled` requests but only one `pending` request

**Note**: The application-level fix works without this migration, but the migration provides better database-level enforcement.

## Files Changed

1. `campus-connect/apps/mobile/lib/supabase.ts`
   - Updated `sendFriendRequest` function to handle rejected requests

2. `campus-connect/apps/mobile/app/profile/[id].tsx`
   - Added error handling for friend request errors
   - Added Alert import

3. `campus-connect/supabase-migrations/fix-friend-requests-rejected-constraint.sql`
   - New migration file for optional database-level improvement

## Testing

### Test Case 1: Resend After Rejection
1. User A sends friend request to User B
2. User B rejects the request
3. User A tries to send another request
4. **Expected**: Request is successfully sent (existing rejected request is updated to pending)

### Test Case 2: Prevent Duplicate Pending Requests
1. User A sends friend request to User B
2. User A tries to send another request immediately
3. **Expected**: Error "Friend request already sent"

### Test Case 3: Prevent Request to Existing Friend
1. User A and User B are already friends
2. User A tries to send a friend request to User B
3. **Expected**: Error "You are already friends with this user"

## Migration Instructions

### Option 1: Application Fix Only (Recommended)
The application-level fix works immediately without any database changes. Just deploy the updated code.

### Option 2: Application Fix + Database Migration
1. Run the migration in Supabase:
   ```sql
   -- Run fix-friend-requests-rejected-constraint.sql
   ```
2. Deploy the updated application code

The database migration is optional but provides better database-level enforcement and prevents edge cases.


