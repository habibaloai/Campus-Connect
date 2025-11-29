# Fix: Friend Request After Unfriending

## Problem
When a user unfriends someone and then tries to send a friend request again, they get an error saying "You are already friends with this user" even though they already deleted them as a friend.

## Root Cause
When a friend request is accepted:
1. A friendship is created in the `friendships` table
2. The `friend_requests` record status is set to `'accepted'`

When a user unfriends someone:
1. The friendship is deleted from the `friendships` table ✅
2. **BUT** the `friend_requests` record with status `'accepted'` remains in the database ❌

When trying to send a new friend request:
1. The code finds the old `friend_requests` record with status `'accepted'`
2. It immediately returns "You are already friends with this user" error
3. It doesn't check if the friendship actually still exists!

## Solution
Updated the `sendFriendRequest` function in `lib/supabase.ts` to:

1. **Check if friendship actually exists**: When it finds a `friend_requests` record with status `'accepted'`, it now first checks if the friendship still exists in the `friendships` table.

2. **Reset request if no friendship**: If the `friend_requests` record says 'accepted' but there's no actual friendship (they were unfriended), it resets the request to 'pending' instead of showing an error.

3. **Only show error if truly friends**: Only returns "You are already friends" error if:
   - The `friend_requests` status is 'accepted' **AND**
   - A friendship actually exists in the `friendships` table

## Code Changes

```typescript
if (existingRequest.status === 'accepted') {
  // Check if they're actually still friends in the friendships table
  // because the friend_requests record might be outdated if they unfriended
  const { data: friendship, error: friendshipError } = await supabase
    .from('friendships')
    .select('id')
    .or(`and(user_id.eq.${requesterId}, friend_id.eq.${recipientId}), and(user_id.eq.${recipientId}, friend_id.eq.${requesterId})`)
    .maybeSingle();

  // If they're still actually friends, return error
  if (friendship) {
    return {
      data: null,
      error: {
        message: 'You are already friends with this user',
        code: 'ALREADY_FRIENDS',
      },
    };
  }

  // If friendship doesn't exist but request is 'accepted', update request to pending
  // This handles the case where they unfriended but the friend_requests record wasn't cleaned up
  const { data: updatedData, error: updateError } = await supabase
    .from('friend_requests')
    .update({
      status: 'pending',
      updated_at: new Date().toISOString(),
    })
    .eq('id', existingRequest.id)
    .select()
    .maybeSingle();

  return { data: updatedData, error: updateError || null };
}
```

## Testing
1. User A sends friend request to User B
2. User B accepts → friendship created
3. User A unfriends User B → friendship deleted
4. User A tries to send friend request again → Should now work! ✅
5. Request should be reset to 'pending' and User B should receive it

## Files Changed
- `campus-connect/apps/mobile/lib/supabase.ts` - Updated `sendFriendRequest` function

