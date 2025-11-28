import { createClient } from '@supabase/supabase-js';
import { supabaseStorageAdapter } from './storage';
import Constants from 'expo-constants';
import { readAsStringAsync } from 'expo-file-system/legacy';

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || Constants.expoConfig?.extra?.supabaseUrl || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || Constants.expoConfig?.extra?.supabaseAnonKey || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found. Please check your .env file.');
}

// Create Supabase client with React Native storage adapter
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: supabaseStorageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Disable for React Native
  },
});

// =============================================
// AUTH HELPERS
// =============================================
export const auth = {
  signUp: async (email: string, password: string, name: string) => {
    try {
      // Create the auth user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
        },
      });

      if (error) {
        return { data: null, error };
      }

      // If signup successful and we have a user, create their profile
      if (data?.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            name: name,
            email: email,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'id',
          });

        if (profileError) {
          console.warn('Profile creation warning:', profileError.message);
        }
      }

      return { data, error: null };
    } catch (err: any) {
      console.error('SignUp error:', err);
      return { data: null, error: { message: err.message || 'Signup failed' } };
    }
  },

  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  getUser: async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  },

  getSession: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session;
  },

  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback);
  },

  refreshSession: async () => {
    const { data, error } = await supabase.auth.refreshSession();
    return { data, error };
  },

  resetPassword: async (email: string) => {
    try {
      // Construct redirect URL for password reset
      // Supabase requires a web URL (https://) for email links
      // For development, use localhost web URL that can redirect to app
      // For production, use your app's web URL
      // The app will handle the deep link from the web redirect
      const redirectTo = __DEV__
        ? 'http://localhost:8081/auth/callback?type=recovery'
        : 'https://campusconnect.app/auth/callback?type=recovery'; // Update with your actual web URL

      console.log('Sending password reset email with redirectTo:', redirectTo);

      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });

      // Always return success (never reveal if email exists) for security
      if (error) {
        // Log error but don't expose it to user
        console.error('Password reset error:', error);
        // Still return success to prevent email enumeration
        return { data: null, error: null };
      }

      return { data, error: null };
    } catch (err: any) {
      console.error('Password reset error:', err);
      // Return success even on error to prevent email enumeration
      return { data: null, error: null };
    }
  },

  updatePassword: async (newPassword: string) => {
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        return { data: null, error };
      }

      // Sign out the user after successful password update
      await supabase.auth.signOut();

      return { data, error: null };
    } catch (err: any) {
      console.error('Update password error:', err);
      return { data: null, error: { message: err.message || 'Failed to update password' } };
    }
  },
};

// Re-export types from types file
export * from '@/types';

// =============================================
// API FUNCTIONS
// =============================================
export const api = {
  // Profile
  getProfile: async (userId: string) => {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
    return { data, error };
  },

  updateProfile: async (userId: string, updates: any) => {
    // Remove undefined values and ensure proper types
    const cleanUpdates: any = {};
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        // Handle interests array - ensure it's properly formatted for PostgreSQL
        if (key === 'interests' && value !== null) {
          cleanUpdates[key] = Array.isArray(value) ? value : [];
        } else {
          cleanUpdates[key] = value;
        }
      }
    });
    
    console.log('[API] updateProfile called with:', {
      userId,
      updates: cleanUpdates,
      updates_stringified: JSON.stringify(cleanUpdates),
    });
    
    const { data, error } = await supabase
      .from('profiles')
      .update(cleanUpdates)
      .eq('id', userId)
      .select()
      .single();
    
    if (error) {
      console.error('[API] Supabase update error:', error);
      console.error('[API] Error code:', error.code);
      console.error('[API] Error message:', error.message);
      console.error('[API] Error details:', error.details);
      console.error('[API] Error hint:', error.hint);
    } else {
      console.log('[API] Profile updated successfully:', data);
    }
    
    return { data, error };
  },

  // Courses
  getCourses: async () => {
    const { data, error } = await supabase
      .from('courses')
      .select(
        `
        *,
        schedules:course_schedules(*)
      `
      )
      .order('code');
    return { data, error };
  },

  getEnrollments: async (userId: string) => {
    const { data, error } = await supabase
      .from('enrollments')
      .select(
        `
        *,
        course:courses(*, schedules:course_schedules(*))
      `
      )
      .eq('user_id', userId);
    return { data, error };
  },

  // Assignments
  getAssignments: async (userId: string) => {
    const { data, error } = await supabase
      .from('assignments')
      .select(
        `
        *,
        course:courses(code, name),
        submission:assignment_submissions!left(*)
      `
      )
      .order('due_date');
    return { data, error };
  },

  // Events
  getEvents: async (userId?: string) => {
    let query = supabase
      .from('events')
      .select(
        `
        *,
        attendee_count:event_attendees(count)
      `
      )
      .gte('date', new Date().toISOString().split('T')[0])
      .order('date');

    const { data, error } = await query;

    if (data && userId) {
      const { data: attending } = await supabase.from('event_attendees').select('event_id').eq('user_id', userId);

      const attendingIds = new Set(attending?.map((a) => a.event_id) || []);
      data.forEach((event: any) => {
        event.is_attending = attendingIds.has(event.id);
        event.attendee_count = event.attendee_count?.[0]?.count || 0;
      });
    }

    return { data, error };
  },

  getEventById: async (eventId: string, userId?: string) => {
    const { data, error } = await supabase
      .from('events')
      .select(
        `
        *,
        attendee_count:event_attendees(count)
      `
      )
      .eq('id', eventId)
      .single();

    if (data && userId) {
      const { data: attending } = await supabase
        .from('event_attendees')
        .select('id')
        .eq('event_id', eventId)
        .eq('user_id', userId)
        .single();

      data.is_attending = !!attending;
      data.attendee_count = data.attendee_count?.[0]?.count || 0;
    }

    return { data, error };
  },

  joinEvent: async (eventId: string, userId: string) => {
    const { data, error } = await supabase
      .from('event_attendees')
      .insert({ event_id: eventId, user_id: userId })
      .select()
      .single();
    return { data, error };
  },

  leaveEvent: async (eventId: string, userId: string) => {
    const { error } = await supabase.from('event_attendees').delete().eq('event_id', eventId).eq('user_id', userId);
    return { error };
  },

  getEventAttendees: async (eventId: string) => {
    const { data, error } = await supabase
      .from('event_attendees')
      .select(`
        user_id,
        joined_at,
        profile:profiles(id, name, avatar_url, major, year)
      `)
      .eq('event_id', eventId)
      .order('joined_at', { ascending: false });
    return { data, error };
  },

  getEventOrganizer: async (organizerId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, avatar_url, major, year')
      .eq('id', organizerId)
      .single();
    return { data, error };
  },

  // Posts
  getPosts: async (userId?: string) => {
    const { data, error } = await supabase
      .from('posts')
      .select(
        `
        *,
        author:profiles(id, name, avatar_url, major, year),
        reply_count:post_replies(count)
      `
      )
      .order('created_at', { ascending: false });

    if (data && userId) {
      const { data: likes } = await supabase.from('post_likes').select('post_id').eq('user_id', userId);

      const likedIds = new Set(likes?.map((l) => l.post_id) || []);
      data.forEach((post: any) => {
        post.is_liked = likedIds.has(post.id);
        post.reply_count = post.reply_count?.[0]?.count || 0;
      });
    }

    return { data, error };
  },

  createPost: async (userId: string, post: { title: string; content: string; category: string; tags?: string[] }) => {
    const { data, error } = await supabase
      .from('posts')
      .insert({ ...post, user_id: userId })
      .select()
      .single();
    return { data, error };
  },

  // FAQs
  getFAQs: async () => {
    const { data, error } = await supabase.from('faqs').select('*').order('category');
    return { data, error };
  },

  // Financial
  getFinancialSummary: async (userId: string) => {
    const { data, error } = await supabase.from('financial_summary').select('*').eq('user_id', userId).single();
    return { data, error };
  },

  getTransactions: async (userId: string, limit = 20) => {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    return { data, error };
  },

  // Study Rooms
  getStudyRooms: async () => {
    const { data, error } = await supabase.from('study_rooms').select('*').order('name');
    return { data, error };
  },

  bookRoom: async (roomId: string, userId: string, startTime: string, endTime: string) => {
    const { data, error } = await supabase
      .from('room_bookings')
      .insert({
        room_id: roomId,
        user_id: userId,
        start_time: startTime,
        end_time: endTime,
      })
      .select()
      .single();
    return { data, error };
  },

  // Jobs
  getJobs: async (userId?: string) => {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .gte('deadline', new Date().toISOString().split('T')[0])
      .order('posted_date', { ascending: false });

    if (data && userId) {
      const [{ data: saved }, { data: applied }] = await Promise.all([
        supabase.from('saved_jobs').select('job_id').eq('user_id', userId),
        supabase.from('job_applications').select('job_id').eq('user_id', userId),
      ]);

      const savedIds = new Set(saved?.map((s) => s.job_id) || []);
      const appliedIds = new Set(applied?.map((a) => a.job_id) || []);

      data.forEach((job: any) => {
        job.is_saved = savedIds.has(job.id);
        job.is_applied = appliedIds.has(job.id);
      });
    }

    return { data, error };
  },

  // Notifications
  getNotifications: async (userId: string) => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    return { data, error };
  },

  markNotificationRead: async (notificationId: string) => {
    const { error } = await supabase.from('notifications').update({ read: true }).eq('id', notificationId);
    return { error };
  },

  // Achievements & Stats
  getUserStats: async (userId: string) => {
    const { data, error } = await supabase.from('user_stats').select('*').eq('user_id', userId).single();
    return { data, error };
  },

  getAchievements: async (userId: string) => {
    const { data: achievements, error } = await supabase.from('achievements').select('*');

    if (achievements && userId) {
      const { data: userAchievements } = await supabase.from('user_achievements').select('*').eq('user_id', userId);

      const userMap = new Map(userAchievements?.map((ua) => [ua.achievement_id, ua]) || []);

      achievements.forEach((achievement: any) => {
        const ua: any = userMap.get(achievement.id);
        achievement.user_progress = ua?.progress || 0;
        achievement.unlocked = ua?.unlocked || false;
        achievement.unlocked_at = ua?.unlocked_at;
      });
    }

    return { data: achievements, error };
  },

  // Messaging
  getConversations: async (userId: string) => {
    const { data: participations, error } = await supabase
      .from('conversation_participants')
      .select(
        `
        conversation_id,
        conversation:conversations(
          id,
          type,
          name,
          created_at
        )
      `
      )
      .eq('user_id', userId);

    if (error || !participations) return { data: [], error };

    const conversationsWithDetails = await Promise.all(
      participations.map(async (p: any) => {
        const conv = p.conversation;

        const { data: participants } = await supabase
          .from('conversation_participants')
          .select(
            `
            user:profiles(id, name, avatar_url)
          `
          )
          .eq('conversation_id', conv.id);

        const { data: lastMessages } = await supabase
          .from('messages')
          .select(
            `
            id,
            content,
            created_at,
            sender_id,
            sender:profiles(name)
          `
          )
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1);

        const { count: unreadCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conv.id)
          .eq('read', false)
          .neq('sender_id', userId);

        return {
          ...conv,
          participants: participants?.map((p: any) => p.user) || [],
          lastMessage: lastMessages?.[0] || null,
          unreadCount: unreadCount || 0,
        };
      })
    );

    conversationsWithDetails.sort((a, b) => {
      const aTime = a.lastMessage?.created_at || a.created_at;
      const bTime = b.lastMessage?.created_at || b.created_at;
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });

    return { data: conversationsWithDetails, error: null };
  },

  getMessages: async (conversationId: string, limit = 50) => {
    const { data, error } = await supabase
      .from('messages')
      .select(
        `
        id,
        conversation_id,
        content,
        created_at,
        read,
        status,
        read_at,
        sender_id,
        sender:profiles(id, name, avatar_url)
      `
      )
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(limit);

    const transformedData = data?.map((msg: any) => ({
      ...msg,
      sender: Array.isArray(msg.sender) ? msg.sender[0] : msg.sender,
    }));

    return { data: transformedData, error };
  },

  sendMessage: async (conversationId: string, senderId: string, content: string) => {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        content: content,
        status: 'sent', // Set initial status to 'sent'
      })
      .select(
        `
        id,
        conversation_id,
        content,
        created_at,
        read,
        status,
        read_at,
        sender_id,
        sender:profiles(id, name, avatar_url)
      `
      )
      .single();

    if (error) return { data: null, error };

    const transformedData = data
      ? {
          ...data,
          sender: Array.isArray(data.sender) ? data.sender[0] : data.sender,
        }
      : null;

    return { data: transformedData, error: null };
  },

  markMessagesAsRead: async (conversationId: string, userId: string) => {
    const { error } = await supabase
      .from('messages')
      .update({ 
        read: true,
        status: 'read',
        read_at: new Date().toISOString(),
      })
      .eq('conversation_id', conversationId)
      .neq('sender_id', userId)
      .eq('read', false);

    return { error };
  },

  // Search
  search: async (query: string) => {
    const q = query.toLowerCase();

    const [courses, events, jobs, faqs] = await Promise.all([
      supabase.from('courses').select('id, code, name, professor').ilike('name', `%${q}%`),
      supabase.from('events').select('id, title, date, location').ilike('title', `%${q}%`),
      supabase.from('jobs').select('id, title, company, type').ilike('title', `%${q}%`),
      supabase.from('faqs').select('id, question, category').ilike('question', `%${q}%`),
    ]);

    return {
      courses: courses.data || [],
      events: events.data || [],
      jobs: jobs.data || [],
      faqs: faqs.data || [],
    };
  },

  // Subscribe to messages (realtime)
  subscribeToMessages: (conversationId: string, callback: (message: any) => void) => {
    return supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          const { data } = await supabase
            .from('messages')
            .select(
              `
              id,
              conversation_id,
              content,
              created_at,
              read,
              status,
              read_at,
              sender_id,
              sender:profiles(id, name, avatar_url)
            `
            )
            .eq('id', payload.new.id)
            .single();

          if (data) {
            const transformedData = {
              ...data,
              sender: Array.isArray(data.sender) ? data.sender[0] : data.sender,
            };
            callback(transformedData);
          }
        }
      )
      .subscribe();
  },

  unsubscribeFromMessages: (conversationId: string) => {
    supabase.removeChannel(supabase.channel(`messages:${conversationId}`));
  },

  // Presence/Online Status
  trackPresence: (conversationId: string, userId: string) => {
    const channel = supabase.channel(`presence:${conversationId}`, {
      config: {
        presence: {
          key: userId,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        // Handle presence sync
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        // Handle user joining
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        // Handle user leaving
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: userId,
            online_at: new Date().toISOString(),
          });
        }
      });

    return channel;
  },

  subscribeToPresence: (
    conversationId: string,
    callback: (userId: string, isOnline: boolean) => void
  ) => {
    const channel = supabase.channel(`presence:${conversationId}`);

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        // Notify about all users in presence
        Object.keys(state).forEach((key) => {
          const presences = state[key];
          if (presences && presences.length > 0) {
            const presence = presences[0] as any;
            callback(presence.user_id, true);
          }
        });
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        newPresences.forEach((presence: any) => {
          callback(presence.user_id, true);
        });
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        leftPresences.forEach((presence: any) => {
          callback(presence.user_id, false);
        });
      })
      .subscribe();

    return channel;
  },

  leavePresence: (channel: any) => {
    if (channel) {
      channel.untrack();
      supabase.removeChannel(channel);
    }
  },

  // Typing Indicators
  sendTypingIndicator: async (
    conversationId: string,
    userId: string,
    isTyping: boolean
  ) => {
    // Get or create typing channel for this conversation
    const channelName = `typing:${conversationId}`;
    let channel = supabase.channel(channelName);
    
    // Ensure channel is subscribed before sending
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        channel.send({
          type: 'broadcast',
          event: 'typing',
          payload: { user_id: userId, is_typing: isTyping },
        });
      }
    });
  },

  getTypingChannel: (conversationId: string) => {
    return supabase.channel(`typing:${conversationId}`);
  },

  subscribeToTyping: (
    conversationId: string,
    callback: (userId: string, isTyping: boolean) => void
  ) => {
    const channel = supabase.channel(`typing:${conversationId}`);

    channel
      .on('broadcast', { event: 'typing' }, (payload) => {
        callback(payload.payload.user_id, payload.payload.is_typing);
      })
      .subscribe();

    return channel;
  },

  unsubscribeFromTyping: (channel: any) => {
    if (channel) {
      supabase.removeChannel(channel);
    }
  },

  // Message Status
  updateMessageStatus: async (
    messageId: string,
    status: 'sent' | 'delivered' | 'read'
  ) => {
    const updateData: any = { status };
    if (status === 'read') {
      updateData.read_at = new Date().toISOString();
      updateData.read = true;
    }

    const { data, error } = await supabase
      .from('messages')
      .update(updateData)
      .eq('id', messageId)
      .select()
      .single();

    return { data, error };
  },

  subscribeToMessageStatus: (
    conversationId: string,
    callback: (messageId: string, status: string) => void
  ) => {
    const channel = supabase
      .channel(`message-status:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          if (payload.new.status && payload.old.status !== payload.new.status) {
            callback(payload.new.id, payload.new.status);
          }
        }
      )
      .subscribe();

    return channel;
  },

  unsubscribeFromMessageStatus: (channel: any) => {
    if (channel) {
      supabase.removeChannel(channel);
    }
  },

  // Real-time Conversations List
  subscribeToConversations: (
    userId: string,
    callback: (conversation: any) => void
  ) => {
    const channel = supabase
      .channel(`conversations:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
        },
        async (payload) => {
          // Check if user is a participant
          const { data: participants } = await supabase
            .from('conversation_participants')
            .select('conversation_id')
            .eq('conversation_id', payload.new.id)
            .eq('user_id', userId);

          if (participants && participants.length > 0) {
            callback(payload.new);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        async (payload) => {
          // Check if message is in user's conversation
          const { data: participants } = await supabase
            .from('conversation_participants')
            .select('conversation_id')
            .eq('conversation_id', payload.new.conversation_id)
            .eq('user_id', userId);

          if (participants && participants.length > 0) {
            // Fetch updated conversation data
            const { data: conversation } = await supabase
              .from('conversations')
              .select('*')
              .eq('id', payload.new.conversation_id)
              .single();

            if (conversation) {
              callback(conversation);
            }
          }
        }
      )
      .subscribe();

    return channel;
  },

  unsubscribeFromConversations: (channel: any) => {
    if (channel) {
      supabase.removeChannel(channel);
    }
  },

  // Create a new direct conversation
  createDirectConversation: async (userId: string, otherUserId: string) => {
    try {
      console.log('Creating direct conversation between', userId, 'and', otherUserId);

      // Check if conversation already exists
      const { data: existingConvs, error: existingError } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', userId);

      if (existingError) {
        console.error('Error checking existing conversations:', existingError);
      }

      if (existingConvs && existingConvs.length > 0) {
        for (const conv of existingConvs) {
          const { data: otherParticipant } = await supabase
            .from('conversation_participants')
            .select('user_id')
            .eq('conversation_id', conv.conversation_id)
            .eq('user_id', otherUserId)
            .maybeSingle();

          if (otherParticipant) {
            // Check if it's a direct conversation
            const { data: convData } = await supabase
              .from('conversations')
              .select('*')
              .eq('id', conv.conversation_id)
              .eq('type', 'direct')
              .maybeSingle();

            if (convData) {
              console.log('Found existing conversation:', convData.id);
              return { data: convData, error: null, existing: true };
            }
          }
        }
      }

      console.log('Creating new conversation...');

      // Create new conversation
      const { data: newConv, error: convError } = await supabase
        .from('conversations')
        .insert({ type: 'direct' })
        .select()
        .single();

      if (convError) {
        console.error('Error creating conversation:', convError);
        return { data: null, error: convError, existing: false };
      }

      if (!newConv) {
        console.error('No conversation data returned');
        return { data: null, error: { message: 'Failed to create conversation' }, existing: false };
      }

      console.log('Conversation created:', newConv.id, 'Adding participants...');

      // Add participants
      const { error: partError } = await supabase
        .from('conversation_participants')
        .insert([
          { conversation_id: newConv.id, user_id: userId },
          { conversation_id: newConv.id, user_id: otherUserId },
        ]);

      if (partError) {
        console.error('Error adding participants:', partError);
        return { data: null, error: partError, existing: false };
      }

      console.log('Participants added successfully');
      return { data: newConv, error: null, existing: false };
    } catch (error: any) {
      console.error('Exception in createDirectConversation:', error);
      return { data: null, error: { message: error.message || 'Unknown error' }, existing: false };
    }
  },

  // Create a group conversation
  createGroupConversation: async (userId: string, name: string, memberIds: string[]) => {
    const { data: newConv, error: convError } = await supabase
      .from('conversations')
      .insert({ type: 'group', name })
      .select()
      .single();

    if (convError || !newConv) return { data: null, error: convError };

    // Add all participants including creator
    const participants = [userId, ...memberIds].map((id) => ({
      conversation_id: newConv.id,
      user_id: id,
    }));

    const { error: partError } = await supabase.from('conversation_participants').insert(participants);

    if (partError) return { data: null, error: partError };

    return { data: newConv, error: null };
  },

  // Add participants to an existing conversation
  addParticipantsToConversation: async (conversationId: string, userIds: string[]) => {
    const participants = userIds.map((id) => ({
      conversation_id: conversationId,
      user_id: id,
    }));

    const { error } = await supabase.from('conversation_participants').insert(participants);

    return { error };
  },

  // Search users for messaging
  searchUsers: async (query: string, currentUserId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, avatar_url, major, year')
      .neq('id', currentUserId)
      .ilike('name', `%${query}%`)
      .limit(10);

    return { data, error };
  },

  // =============================================
  // SOCIAL CONNECTIONS API
  // =============================================

  // Friend Requests
  sendFriendRequest: async (requesterId: string, recipientId: string) => {
    const { data, error } = await supabase
      .from('friend_requests')
      .insert({
        requester_id: requesterId,
        recipient_id: recipientId,
        status: 'pending',
      })
      .select()
      .single();

    return { data, error };
  },

  getFriendRequests: async (userId: string, type: 'sent' | 'received' = 'received') => {
    const column = type === 'sent' ? 'requester_id' : 'recipient_id';
    const { data, error } = await supabase
      .from('friend_requests')
      .select(`
        *,
        requester:profiles!friend_requests_requester_id_fkey(id, name, avatar_url, major, year),
        recipient:profiles!friend_requests_recipient_id_fkey(id, name, avatar_url, major, year)
      `)
      .eq(column, userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    return { data, error };
  },

  respondToFriendRequest: async (requestId: string, status: 'accepted' | 'rejected', userId: string) => {
    // First update the request
    const { data: request, error: requestError } = await supabase
      .from('friend_requests')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', requestId)
      .eq('recipient_id', userId)
      .select()
      .single();

    if (requestError || !request) return { data: null, error: requestError };

    // If accepted, create mutual friendship
    if (status === 'accepted') {
      const { error: friendshipError } = await supabase.from('friendships').insert([
        { user_id: request.requester_id, friend_id: request.recipient_id },
        { user_id: request.recipient_id, friend_id: request.requester_id },
      ]);

      if (friendshipError) return { data: null, error: friendshipError };
    }

    return { data: request, error: null };
  },

  cancelFriendRequest: async (requestId: string, userId: string) => {
    const { error } = await supabase
      .from('friend_requests')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', requestId)
      .eq('requester_id', userId);

    return { error };
  },

  // Friendships
  getFriends: async (userId: string, closeFriendsOnly: boolean = false) => {
    let query = supabase
      .from('friendships')
      .select(`
        *,
        friend:profiles!friendships_friend_id_fkey(*)
      `)
      .eq('user_id', userId);

    if (closeFriendsOnly) {
      query = query.eq('is_close_friend', true);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    return { data, error };
  },

  removeFriend: async (userId: string, friendId: string) => {
    // Remove both directions of friendship
    const { error } = await supabase
      .from('friendships')
      .delete()
      .or(`and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`);

    return { error };
  },

  toggleCloseFriend: async (userId: string, friendId: string, isCloseFriend: boolean) => {
    const { data, error } = await supabase
      .from('friendships')
      .update({ is_close_friend: isCloseFriend })
      .eq('user_id', userId)
      .eq('friend_id', friendId)
      .select()
      .single();

    return { data, error };
  },

  // Follows
  followUser: async (followerId: string, followingId: string) => {
    const { data, error } = await supabase
      .from('follows')
      .insert({
        follower_id: followerId,
        following_id: followingId,
      })
      .select()
      .single();

    return { data, error };
  },

  unfollowUser: async (followerId: string, followingId: string) => {
    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', followerId)
      .eq('following_id', followingId);

    return { error };
  },

  getFollowers: async (userId: string) => {
    const { data, error } = await supabase
      .from('follows')
      .select(`
        *,
        follower:profiles!follows_follower_id_fkey(*)
      `)
      .eq('following_id', userId)
      .order('created_at', { ascending: false });

    return { data, error };
  },

  getFollowing: async (userId: string) => {
    const { data, error } = await supabase
      .from('follows')
      .select(`
        *,
        following:profiles!follows_following_id_fkey(*)
      `)
      .eq('follower_id', userId)
      .order('created_at', { ascending: false });

    return { data, error };
  },

  checkFollowStatus: async (followerId: string, followingId: string) => {
    const { data, error } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', followerId)
      .eq('following_id', followingId)
      .maybeSingle();

    return { data: !!data, error };
  },

  // Connection Stories
  addConnectionStory: async (userId: string, connectedUserId: string, story: string, location?: string, context?: string) => {
    const { data, error } = await supabase
      .from('connection_stories')
      .insert({
        user_id: userId,
        connected_user_id: connectedUserId,
        story,
        location,
        context,
      })
      .select()
      .single();

    return { data, error };
  },

  getConnectionStories: async (userId: string) => {
    const { data, error } = await supabase
      .from('connection_stories')
      .select(`
        *,
        connected_user:profiles!connection_stories_connected_user_id_fkey(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    return { data, error };
  },

  // Course Classmates
  getCourseClassmates: async (userId: string, courseId?: string) => {
    let query = supabase
      .from('course_classmates')
      .select(`
        *,
        classmate:profiles!course_classmates_classmate_id_fkey(*),
        course:courses(*)
      `)
      .eq('user_id', userId);

    if (courseId) {
      query = query.eq('course_id', courseId);
    }

    const { data, error } = await query.order('discovered_at', { ascending: false });

    return { data, error };
  },

  // Mutual Connections
  getMutualConnections: async (userId: string, otherUserId: string) => {
    // Get mutual friends
    const { data: userFriends } = await supabase
      .from('friendships')
      .select('friend_id')
      .eq('user_id', userId);

    const { data: otherFriends } = await supabase
      .from('friendships')
      .select('friend_id')
      .eq('user_id', otherUserId);

    const userFriendIds = userFriends?.map((f) => f.friend_id) || [];
    const otherFriendIds = otherFriends?.map((f) => f.friend_id) || [];
    const mutualFriendIds = userFriendIds.filter((id) => otherFriendIds.includes(id));

    if (mutualFriendIds.length === 0) {
      return { data: [], error: null };
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .in('id', mutualFriendIds);

    return { data, error };
  },

  // Social Stats
  getSocialStats: async (userId: string) => {
    const [friends, followers, following] = await Promise.all([
      supabase.from('friendships').select('id', { count: 'exact' }).eq('user_id', userId),
      supabase.from('follows').select('id', { count: 'exact' }).eq('following_id', userId),
      supabase.from('follows').select('id', { count: 'exact' }).eq('follower_id', userId),
    ]);

    const closeFriends = await supabase
      .from('friendships')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .eq('is_close_friend', true);

    return {
      data: {
        friends_count: friends.count || 0,
        followers_count: followers.count || 0,
        following_count: following.count || 0,
        close_friends_count: closeFriends.count || 0,
      },
      error: null,
    };
  },

  // Friend Locations (for map)
  updateFriendLocation: async (userId: string, latitude: number, longitude: number, locationName?: string, isVisible: boolean = true) => {
    const { data, error } = await supabase
      .from('friend_locations')
      .upsert({
        user_id: userId,
        latitude,
        longitude,
        location_name: locationName,
        is_visible: isVisible,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    return { data, error };
  },

  getFriendLocations: async (userId: string) => {
    // Get locations of friends who have visibility enabled
    const { data: friends } = await supabase
      .from('friendships')
      .select('friend_id')
      .eq('user_id', userId);

    const friendIds = friends?.map((f) => f.friend_id) || [];

    if (friendIds.length === 0) {
      return { data: [], error: null };
    }

    const { data, error } = await supabase
      .from('friend_locations')
      .select(`
        *,
        user:profiles(*)
      `)
      .in('user_id', friendIds)
      .eq('is_visible', true);

    return { data, error };
  },

  // =============================================
  // GAMIFICATION & STREAKS API
  // =============================================

  // User Stats
  getUserStats: async (userId: string) => {
    const { data, error } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    // If no stats exist, create default
    if (!data && !error) {
      const { data: newStats, error: createError } = await supabase
        .from('user_stats')
        .insert({ user_id: userId })
        .select()
        .single();
      return { data: newStats, error: createError };
    }

    return { data, error };
  },

  updateUserStats: async (userId: string, updates: Partial<any>) => {
    const { data, error } = await supabase
      .from('user_stats')
      .upsert({
        user_id: userId,
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    return { data, error };
  },

  // Streaks
  getStreaks: async (userId: string) => {
    const { data, error } = await supabase
      .from('streaks')
      .select('*')
      .eq('user_id', userId)
      .order('current_streak', { ascending: false });

    return { data, error };
  },

  getStreak: async (userId: string, streakType: string) => {
    const { data, error } = await supabase
      .from('streaks')
      .select('*')
      .eq('user_id', userId)
      .eq('streak_type', streakType)
      .maybeSingle();

    return { data, error };
  },

  updateStreak: async (userId: string, streakType: string, activityDate?: string) => {
    // Get current streak
    const { data: currentStreak } = await supabase
      .from('streaks')
      .select('*')
      .eq('user_id', userId)
      .eq('streak_type', streakType)
      .maybeSingle();
    
    const today = activityDate || new Date().toISOString().split('T')[0];
    const yesterday = new Date(new Date(today).getTime() - 86400000).toISOString().split('T')[0];
    
    let newStreak = 1;
    let streakStartDate = today;

    if (currentStreak) {
      const lastActivity = currentStreak.last_activity_date;
      
      if (lastActivity === yesterday) {
        // Continue streak
        newStreak = currentStreak.current_streak + 1;
        streakStartDate = currentStreak.streak_start_date || today;
      } else if (lastActivity === today) {
        // Already logged today
        return { data: currentStreak, error: null };
      } else {
        // Streak broken, start new one
        newStreak = 1;
        streakStartDate = today;
      }
    }

    const longestStreak = currentStreak
      ? Math.max(currentStreak.longest_streak, newStreak)
      : newStreak;

    const { data, error } = await supabase
      .from('streaks')
      .upsert({
        user_id: userId,
        streak_type: streakType,
        current_streak: newStreak,
        longest_streak: longestStreak,
        last_activity_date: today,
        streak_start_date: streakStartDate,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    // Log activity
    await supabase.from('streak_activities').insert({
      user_id: userId,
      streak_type: streakType,
      activity_date: today,
    });

    // Award points for milestones
    if (newStreak === 7 || newStreak === 30 || newStreak === 100) {
      const points = newStreak === 7 ? 50 : newStreak === 30 ? 200 : 1000;
      await api.addPoints(userId, points, 'streak_milestone', `${newStreak}-day streak!`);
    }

    return { data, error };
  },

  // Streak Recovery
  useStreakRecovery: async (userId: string, streakType: string) => {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

    // Check if already used this month
    const { data: existing } = await supabase
      .from('streak_recoveries')
      .select('id')
      .eq('user_id', userId)
      .eq('recovery_month', currentMonth)
      .maybeSingle();

    if (existing) {
      return { data: null, error: { message: 'Streak recovery already used this month' } };
    }

    // Use recovery
    const { data, error } = await supabase
      .from('streak_recoveries')
      .insert({
        user_id: userId,
        streak_type: streakType,
        recovery_month: currentMonth,
      })
      .select()
      .single();

    // Restore streak (don't break it) - just mark as used, streak logic will handle continuation
    // The streak will continue from where it left off on next activity

    return { data, error };
  },

  // Points
  addPoints: async (userId: string, points: number, source: string, description?: string, metadata?: Record<string, any>) => {
    // Add transaction
    const { error: transError } = await supabase.from('point_transactions').insert({
      user_id: userId,
      points,
      source,
      description,
      metadata,
    });

    if (transError) return { error: transError };

    // Update user stats
    const { data: stats } = await api.getUserStats(userId);
    if (stats) {
      const newTotal = stats.total_points + points;
      const { data: levelConfig } = await api.getLevelForPoints(newTotal);
      
      await api.updateUserStats(userId, {
        total_points: newTotal,
        level: levelConfig?.level || stats.level,
      });
    }

    return { error: null };
  },

  getPointHistory: async (userId: string, limit: number = 50) => {
    const { data, error } = await supabase
      .from('point_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    return { data, error };
  },

  // Levels
  getLevelForPoints: async (points: number) => {
    const { data, error } = await supabase
      .from('level_config')
      .select('*')
      .lte('points_required', points)
      .order('level', { ascending: false })
      .limit(1)
      .single();

    return { data, error };
  },

  // Achievements
  getAchievements: async (category?: string) => {
    let query = supabase.from('achievements').select('*');
    
    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query.order('points', { ascending: false });

    return { data, error };
  },

  getUserAchievements: async (userId: string) => {
    const { data, error } = await supabase
      .from('user_achievements')
      .select(`
        *,
        achievement:achievements(*)
      `)
      .eq('user_id', userId)
      .order('unlocked_at', { ascending: false });

    return { data, error };
  },

  unlockAchievement: async (userId: string, achievementId: string) => {
    // Check if already unlocked
    const { data: existing } = await supabase
      .from('user_achievements')
      .select('id')
      .eq('user_id', userId)
      .eq('achievement_id', achievementId)
      .maybeSingle();

    if (existing) {
      return { data: existing, error: null };
    }

    // Get achievement details
    const { data: achievement } = await supabase
      .from('achievements')
      .select('*')
      .eq('id', achievementId)
      .single();

    // Unlock achievement
    const { data, error } = await supabase
      .from('user_achievements')
      .insert({
        user_id: userId,
        achievement_id: achievementId,
        is_completed: true,
      })
      .select()
      .single();

    // Award points
    if (!error && achievement) {
      await api.addPoints(userId, achievement.points, 'achievement', `Unlocked: ${achievement.name}`);
    }

    return { data, error };
  },

  // Leaderboards
  getLeaderboard: async (type: string, category?: string, courseId?: string) => {
    let query = supabase
      .from('leaderboards')
      .select('*')
      .eq('type', type)
      .eq('is_active', true);

    if (category) {
      query = query.eq('category', category);
    }
    if (courseId) {
      query = query.eq('course_id', courseId);
    }

    const { data: leaderboard } = await query.order('created_at', { ascending: false }).limit(1).maybeSingle();

    if (!leaderboard) {
      return { data: null, error: null };
    }

    const { data: entries, error } = await supabase
      .from('leaderboard_entries')
      .select(`
        *,
        user:profiles(id, name, avatar_url, major, year)
      `)
      .eq('leaderboard_id', leaderboard.id)
      .order('rank', { ascending: true })
      .limit(100);

    return { data: { ...leaderboard, entries }, error };
  },

  updateLeaderboardEntry: async (leaderboardId: string, userId: string, score: number) => {
    const { data, error } = await supabase
      .from('leaderboard_entries')
      .upsert({
        leaderboard_id: leaderboardId,
        user_id: userId,
        score,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    // Recalculate ranks
    const { data: allEntries } = await supabase
      .from('leaderboard_entries')
      .select('id, score')
      .eq('leaderboard_id', leaderboardId)
      .order('score', { ascending: false });

    if (allEntries) {
      const updates = allEntries.map((entry, index) => ({
        id: entry.id,
        rank: index + 1,
      }));

      for (const update of updates) {
        await supabase
          .from('leaderboard_entries')
          .update({ rank: update.rank })
          .eq('id', update.id);
      }
    }

    return { data, error };
  },

  // Challenges
  getChallenges: async (type?: string, activeOnly: boolean = true) => {
    let query = supabase.from('challenges').select('*');

    if (activeOnly) {
      query = query.eq('is_active', true);
    }
    if (type) {
      query = query.eq('type', type);
    }

    const { data, error } = await query
      .order('created_at', { ascending: false });

    return { data, error };
  },

  joinChallenge: async (userId: string, challengeId: string) => {
    const { data, error } = await supabase
      .from('challenge_participants')
      .insert({
        user_id: userId,
        challenge_id: challengeId,
      })
      .select()
      .single();

    return { data, error };
  },

  updateChallengeProgress: async (userId: string, challengeId: string, progress: number) => {
    const { data: challenge } = await supabase
      .from('challenges')
      .select('*')
      .eq('id', challengeId)
      .single();

    const { data, error } = await supabase
      .from('challenge_participants')
      .update({ progress })
      .eq('user_id', userId)
      .eq('challenge_id', challengeId)
      .select()
      .single();

    // Check if completed
    if (!error && challenge && progress >= challenge.target_value) {
      await supabase
        .from('challenge_participants')
        .update({ completed_at: new Date().toISOString() })
        .eq('id', data.id);

      // Award rewards
      if (challenge.reward_points > 0) {
        await api.addPoints(userId, challenge.reward_points, 'challenge', `Completed: ${challenge.name}`);
      }
      if (challenge.reward_achievement_id) {
        await api.unlockAchievement(userId, challenge.reward_achievement_id);
      }
    }

    return { data, error };
  },

  getUserChallenges: async (userId: string) => {
    const { data, error } = await supabase
      .from('challenge_participants')
      .select(`
        *,
        challenge:challenges(*)
      `)
      .eq('user_id', userId)
      .order('joined_at', { ascending: false });

    return { data, error };
  },

  // Surprise Rewards
  getSurpriseRewards: async (userId: string) => {
    const { data, error } = await supabase
      .from('surprise_rewards')
      .select(`
        *,
        achievement:achievements(*)
      `)
      .eq('user_id', userId)
      .eq('claimed', false)
      .order('created_at', { ascending: false });

    return { data, error };
  },

  claimSurpriseReward: async (rewardId: string, userId: string) => {
    const { data: reward } = await supabase
      .from('surprise_rewards')
      .select('*')
      .eq('id', rewardId)
      .eq('user_id', userId)
      .single();

    if (!reward || reward.claimed) {
      return { data: null, error: { message: 'Reward not found or already claimed' } };
    }

    const { data, error } = await supabase
      .from('surprise_rewards')
      .update({ claimed: true })
      .eq('id', rewardId)
      .select()
      .single();

    // Apply reward
    if (!error) {
      if (reward.reward_type === 'points' && reward.reward_value) {
        await api.addPoints(userId, reward.reward_value, 'surprise_reward', reward.message);
      } else if (reward.reward_type === 'achievement' && reward.achievement_id) {
        await api.unlockAchievement(userId, reward.achievement_id);
      }
    }

    return { data, error };
  },

  // =============================================
  // STORAGE HELPERS
  // =============================================
  uploadAvatar: async (userId: string, fileUri: string, fileExt: string = 'jpg'): Promise<{ url: string | null; error: any }> => {
    try {
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = fileName; // Store directly in bucket root, not in subfolder

      // Read file as base64 using legacy API (for compatibility)
      const base64 = await readAsStringAsync(fileUri, {
        encoding: 'base64',
      });

      // Convert base64 to Uint8Array for Supabase (React Native compatible)
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
      const lookup = new Uint8Array(256);
      for (let i = 0; i < chars.length; i++) {
        lookup[chars.charCodeAt(i)] = i;
      }

      let bufferLength = base64.length * 0.75;
      if (base64[base64.length - 1] === '=') {
        bufferLength--;
        if (base64[base64.length - 2] === '=') {
          bufferLength--;
        }
      }

      const bytes = new Uint8Array(bufferLength);
      let p = 0;
      for (let i = 0; i < base64.length; i += 4) {
        const encoded1 = lookup[base64.charCodeAt(i)];
        const encoded2 = lookup[base64.charCodeAt(i + 1)];
        const encoded3 = lookup[base64.charCodeAt(i + 2)];
        const encoded4 = lookup[base64.charCodeAt(i + 3)];

        bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
        bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
        bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
      }

      // Try to upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, bytes, {
          contentType: `image/${fileExt}`,
          upsert: true,
        });

      if (uploadError) {
        // Check if it's a bucket not found error
        if (uploadError.message?.includes('Bucket not found') || uploadError.message?.includes('bucket')) {
          console.warn('Storage bucket "avatars" not found. Please create it in Supabase Storage.');
          return {
            url: null,
            error: {
              message: 'Storage bucket not configured. Please create an "avatars" bucket in Supabase Storage.',
              code: 'BUCKET_NOT_FOUND',
            },
          };
        }
        console.error('Avatar upload error:', uploadError);
        return { url: null, error: uploadError };
      }

      // Get public URL
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
      return { url: urlData.publicUrl, error: null };
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      return {
        url: null,
        error: {
          message: error.message || 'Failed to upload avatar',
          code: 'UPLOAD_ERROR',
        },
      };
    }
  },
};





