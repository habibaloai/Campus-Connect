-- Create friend_requests table
create table if not exists public.friend_requests (
  id uuid default gen_random_uuid() primary key,
  requester_id uuid references public.profiles(id) on delete cascade not null,
  recipient_id uuid references public.profiles(id) on delete cascade not null,
  status text check (status in ('pending', 'accepted', 'rejected')) default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(requester_id, recipient_id)
);

-- Create friendships table (mutual)
create table if not exists public.friendships (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  friend_id uuid references public.profiles(id) on delete cascade not null,
  is_close_friend boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, friend_id)
);

-- Enable RLS
alter table public.friend_requests enable row level security;
alter table public.friendships enable row level security;

-- Policies for friend_requests

-- Users can view requests they sent or received
create policy "Users can view their own friend requests"
  on public.friend_requests for select
  using (auth.uid() = requester_id or auth.uid() = recipient_id);

-- Users can send friend requests
create policy "Users can send friend requests"
  on public.friend_requests for insert
  with check (auth.uid() = requester_id);

-- Users can update requests sent to them (accept/reject)
create policy "Users can update requests sent to them"
  on public.friend_requests for update
  using (auth.uid() = recipient_id);

-- Policies for friendships

-- Users can view their own friendships
create policy "Users can view their own friendships"
  on public.friendships for select
  using (auth.uid() = user_id);

-- Users can insert friendships (needed for the client-side accept logic)
-- Allowing insert if the user is part of the friendship
create policy "Users can insert their own friendships"
  on public.friendships for insert
  with check (auth.uid() = user_id or auth.uid() = friend_id);

-- Users can delete their own friendships
create policy "Users can delete their own friendships"
  on public.friendships for delete
  using (auth.uid() = user_id);

-- Indexes for performance
create index if not exists friend_requests_requester_id_idx on public.friend_requests(requester_id);
create index if not exists friend_requests_recipient_id_idx on public.friend_requests(recipient_id);
create index if not exists friendships_user_id_idx on public.friendships(user_id);
create index if not exists friendships_friend_id_idx on public.friendships(friend_id);
