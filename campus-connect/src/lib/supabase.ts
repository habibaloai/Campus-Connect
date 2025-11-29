import { createClient } from '@supabase/supabase-js';

// Get these from your Supabase project settings > API
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Site URL for redirects - uses NEXT_PUBLIC_SITE_URL in production, falls back to localhost
const getSiteUrl = () => {
  // Check for explicit site URL (used in production)
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }
  // Fallback for local development
  return 'http://localhost:3000';
};

export const siteUrl = getSiteUrl();

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// =============================================
// AUTH HELPERS
// =============================================
export const auth = {
  signUp: async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: `${siteUrl}/auth/callback`
      }
    });
    return { data, error };
  },

  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { data, error };
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  getUser: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  getSession: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  },

  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback);
  }
};

// =============================================
// DATABASE TYPES
// =============================================
export interface Profile {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  student_id?: string;
  major?: string;
  minor?: string;
  year?: string;
  enrollment_date?: string;
  expected_graduation?: string;
  gpa?: number;
  total_credits?: number;
  advisor?: string;
  phone?: string;
}

export interface Course {
  id: string;
  code: string;
  name: string;
  professor: string;
  professor_rating: number;
  credits: number;
  description?: string;
  prerequisites?: string[];
  difficulty: number;
  capacity: number;
  semester: string;
  category: string;
  schedules?: CourseSchedule[];
  enrolled_count?: number;
}

export interface CourseSchedule {
  id: string;
  course_id: string;
  day: string;
  time: string;
  location: string;
}

export interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  status: string;
  grade?: string;
  grade_points?: number;
  course?: Course;
}

export interface Assignment {
  id: string;
  course_id: string;
  title: string;
  description?: string;
  due_date: string;
  due_time: string;
  max_grade: number;
  weight: number;
  type: string;
  estimated_time?: number;
  course?: Course;
  submission?: AssignmentSubmission;
}

export interface AssignmentSubmission {
  id: string;
  assignment_id: string;
  user_id: string;
  status: string;
  grade?: number;
  submitted_at?: string;
}

export interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  description?: string;
  category: string;
  max_attendees: number;
  organizer?: string;
  organizer_id?: string;
  image_url?: string;
  attendee_count?: number;
  is_attending?: boolean;
}

export interface Post {
  id: string;
  user_id: string;
  title: string;
  content: string;
  category: string;
  tags?: string[];
  likes: number;
  created_at: string;
  author?: Profile;
  reply_count?: number;
  is_liked?: boolean;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: string;
  amount: number;
  description?: string;
  status: string;
  category?: string;
  created_at: string;
}

export interface FinancialSummary {
  id: string;
  user_id: string;
  tuition_balance: number;
  tuition_due?: string;
  meal_plan_balance: number;
  printing_credits: number;
  campus_card_balance: number;
  scholarships: number;
  financial_aid: number;
  monthly_budget: number;
}

export interface StudyRoom {
  id: string;
  name: string;
  building: string;
  floor: number;
  capacity: number;
  noise_level: string;
  equipment?: string[];
  amenities?: string[];
  current_occupancy?: number;
  is_available?: boolean;
  next_available?: string;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  type: string;
  location?: string;
  salary?: string;
  description?: string;
  requirements?: string[];
  posted_date: string;
  deadline?: string;
  is_saved?: boolean;
  is_applied?: boolean;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  action_url?: string;
  priority: string;
  created_at: string;
}

export interface Achievement {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  points: number;
  max_progress?: number;
  user_progress?: number;
  unlocked?: boolean;
  unlocked_at?: string;
}

export interface UserStats {
  id: string;
  user_id: string;
  total_points: number;
  level: number;
  streak: number;
}

export interface Conversation {
  id: string;
  type: 'direct' | 'group' | 'course';
  name?: string;
  created_at: string;
  participants?: Profile[];
  lastMessage?: Message;
  unreadCount?: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read: boolean;
  created_at: string;
  sender?: {
    id: string;
    name: string;
    avatar_url?: string;
  };
}

// =============================================
// API FUNCTIONS
// =============================================
export const api = {
  // Profile
  getProfile: async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    return { data, error };
  },

  updateProfile: async (userId: string, updates: Partial<Profile>) => {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    return { data, error };
  },

  // Courses
  getCourses: async () => {
    const { data, error } = await supabase
      .from('courses')
      .select(`
        *,
        schedules:course_schedules(*)
      `)
      .order('code');
    return { data, error };
  },

  getEnrollments: async (userId: string) => {
    const { data, error } = await supabase
      .from('enrollments')
      .select(`
        *,
        course:courses(*, schedules:course_schedules(*))
      `)
      .eq('user_id', userId);
    return { data, error };
  },

  enrollInCourse: async (userId: string, courseId: string) => {
    const { data, error } = await supabase
      .from('enrollments')
      .insert({ user_id: userId, course_id: courseId })
      .select()
      .single();
    return { data, error };
  },

  // Assignments
  getAssignments: async (userId: string) => {
    const { data, error } = await supabase
      .from('assignments')
      .select(`
        *,
        course:courses(code, name),
        submission:assignment_submissions!left(*)
      `)
      .order('due_date');
    return { data, error };
  },

  submitAssignment: async (assignmentId: string, userId: string) => {
    const { data, error } = await supabase
      .from('assignment_submissions')
      .upsert({
        assignment_id: assignmentId,
        user_id: userId,
        status: 'submitted',
        submitted_at: new Date().toISOString()
      })
      .select()
      .single();
    return { data, error };
  },

  // Events
  getEvents: async (userId?: string) => {
    let query = supabase
      .from('events')
      .select(`
        *,
        attendee_count:event_attendees(count)
      `)
      .gte('date', new Date().toISOString().split('T')[0])
      .order('date');

    const { data, error } = await query;
    
    if (data && userId) {
      // Check which events user is attending
      const { data: attending } = await supabase
        .from('event_attendees')
        .select('event_id')
        .eq('user_id', userId);
      
      const attendingIds = new Set(attending?.map(a => a.event_id) || []);
      data.forEach(event => {
        event.is_attending = attendingIds.has(event.id);
        event.attendee_count = event.attendee_count?.[0]?.count || 0;
      });
    }
    
    return { data, error };
  },

  getEventById: async (eventId: string, userId?: string) => {
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        attendee_count:event_attendees(count)
      `)
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
    const { error } = await supabase
      .from('event_attendees')
      .delete()
      .eq('event_id', eventId)
      .eq('user_id', userId);
    return { error };
  },

  createEvent: async (eventData: {
    title: string;
    date: string;
    time: string;
    location: string;
    description?: string;
    category: string;
    max_attendees?: number;
    organizer?: string;
  }) => {
    const { data, error } = await supabase
      .from('events')
      .insert(eventData)
      .select()
      .single();
    return { data, error };
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

  deleteEvent: async (eventId: string, userId: string) => {
    // Verify user is the organizer and get event title for notifications
    const { data: event } = await supabase
      .from('events')
      .select('organizer_id, image_url, title')
      .eq('id', eventId)
      .single();

    if (!event || event.organizer_id !== userId) {
      return {
        error: { message: 'You can only delete events you created', code: 'PERMISSION_DENIED' },
      };
    }

    // Get all photos for this event to delete from storage
    const { data: photos } = await supabase
      .from('event_photos')
      .select('photo_url')
      .eq('event_id', eventId);

    // Delete event (cascade will handle related records)
    const { error: deleteError } = await supabase.from('events').delete().eq('id', eventId);

    if (deleteError) {
      return { error: deleteError };
    }

    // Delete cover photo from storage (non-blocking)
    if (event.image_url) {
      const urlParts = event.image_url.split('/');
      const fileName = urlParts[urlParts.length - 1].split('?')[0];
      const filePath = `${eventId}/${fileName}`;
      supabase.storage
        .from('event-covers')
        .remove([filePath])
        .catch((err) => {
          console.warn('Failed to delete cover photo:', err);
        });
    }

    // Delete all photos from storage (non-blocking)
    if (photos && photos.length > 0) {
      const filePaths = photos.map((photo) => {
        const urlParts = photo.photo_url.split('/');
        const fileName = urlParts[urlParts.length - 1].split('?')[0];
        return `${eventId}/${fileName}`;
      });
      supabase.storage
        .from('event-photos')
        .remove(filePaths)
        .catch((err) => {
          console.warn('Failed to delete event photos:', err);
        });
    }

    // Notify all attendees about event deletion
    const { data: attendees } = await supabase
      .from('event_attendees')
      .select('user_id')
      .eq('event_id', eventId);

    if (attendees) {
      const notificationPromises = attendees
        .filter((a) => a.user_id !== userId) // Don't notify the organizer
        .map((attendee) =>
          api.createNotification(
            attendee.user_id,
            'event_deleted',
            'Event Cancelled',
            `${event.title || 'Event'} has been cancelled`,
            `/event`
          )
        );

      Promise.all(notificationPromises).catch((err) => console.warn('Failed to send some notifications:', err));
    }

    return { error: null };
  },

  // Posts
  getPosts: async (userId?: string) => {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        author:profiles(id, name, avatar_url, major, year),
        reply_count:post_replies(count)
      `)
      .order('created_at', { ascending: false });

    if (data && userId) {
      const { data: likes } = await supabase
        .from('post_likes')
        .select('post_id')
        .eq('user_id', userId);
      
      const likedIds = new Set(likes?.map(l => l.post_id) || []);
      data.forEach(post => {
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

  likePost: async (postId: string, userId: string) => {
    // Check if user already liked
    const { data: existingLike } = await supabase
      .from('post_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existingLike) {
      return { data: null, error: { message: 'Post already liked', code: 'ALREADY_LIKED' } };
    }

    // Insert like (trigger will update posts.likes count)
    const { data, error } = await supabase
      .from('post_likes')
      .insert({ post_id: postId, user_id: userId })
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    // Get post author to send notification
    const { data: post } = await supabase
      .from('posts')
      .select('user_id, title')
      .eq('id', postId)
      .single();

    if (post && post.user_id !== userId) {
      // Send notification to post author
      api.createNotification(
        post.user_id,
        'post_liked',
        'Post Liked',
        `Someone liked your post: ${post.title}`,
        `/dashboard/community/${postId}`
      ).catch((err) => console.warn('Failed to send like notification:', err));
    }

    return { data, error: null };
  },

  unlikePost: async (postId: string, userId: string) => {
    const { error } = await supabase
      .from('post_likes')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', userId);

    return { data: null, error };
  },

  getPostLikes: async (postId: string) => {
    const { data, error } = await supabase
      .from('post_likes')
      .select(`
        *,
        user:profiles(id, name, avatar_url)
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: false });

    return { data, error };
  },

  // Post Comments
  addComment: async (postId: string, userId: string, content: string) => {
    // Validate content
    if (!content.trim() || content.trim().length === 0) {
      return { data: null, error: { message: 'Comment cannot be empty', code: 'VALIDATION_ERROR' } };
    }

    if (content.length > 5000) {
      return { data: null, error: { message: 'Comment is too long (max 5000 characters)', code: 'VALIDATION_ERROR' } };
    }

    // Insert comment
    const { data, error } = await supabase
      .from('post_replies')
      .insert({
        post_id: postId,
        user_id: userId,
        content: content.trim(),
      })
      .select(`
        *,
        author:profiles!user_id(id, name, avatar_url, major, year)
      `)
      .single();

    if (error) {
      return { data: null, error };
    }

    // Get post author to send notification
    const { data: post } = await supabase
      .from('posts')
      .select('user_id, title')
      .eq('id', postId)
      .single();

    if (post && post.user_id !== userId) {
      // Send notification to post author
      api.createNotification(
        post.user_id,
        'post_comment',
        'New Comment',
        `Someone commented on your post: ${post.title}`,
        `/dashboard/community/${postId}`
      ).catch((err) => console.warn('Failed to send comment notification:', err));
    }

    // Transform author from array to single object
    const transformedData = data
      ? {
          ...data,
          author: Array.isArray(data.author) ? data.author[0] : data.author,
        }
      : null;

    return { data: transformedData, error: null };
  },

  getComments: async (postId: string) => {
    const { data, error } = await supabase
      .from('post_replies')
      .select(`
        *,
        author:profiles!user_id(id, name, avatar_url, major, year)
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true }); // Oldest first for conversation flow

    if (error) {
      return { data: null, error };
    }

    // Transform authors from arrays to single objects
    const transformedData = data?.map((comment: any) => ({
      ...comment,
      author: Array.isArray(comment.author) ? comment.author[0] : comment.author,
    }));

    return { data: transformedData, error: null };
  },

  deleteComment: async (commentId: string, userId: string) => {
    // Verify user is the comment author
    const { data: comment } = await supabase
      .from('post_replies')
      .select('user_id')
      .eq('id', commentId)
      .single();

    if (!comment) {
      return { data: null, error: { message: 'Comment not found', code: 'NOT_FOUND' } };
    }

    if (comment.user_id !== userId) {
      return { data: null, error: { message: 'You can only delete your own comments', code: 'PERMISSION_DENIED' } };
    }

    const { error } = await supabase.from('post_replies').delete().eq('id', commentId);

    return { data: null, error };
  },

  // FAQs
  getFAQs: async () => {
    const { data, error } = await supabase
      .from('faqs')
      .select('*')
      .order('category');
    return { data, error };
  },

  // Financial
  getFinancialSummary: async (userId: string) => {
    const { data, error } = await supabase
      .from('financial_summary')
      .select('*')
      .eq('user_id', userId)
      .single();
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
    const { data, error } = await supabase
      .from('study_rooms')
      .select('*')
      .order('name');
    return { data, error };
  },

  bookRoom: async (roomId: string, userId: string, startTime: string, endTime: string) => {
    const { data, error } = await supabase
      .from('room_bookings')
      .insert({
        room_id: roomId,
        user_id: userId,
        start_time: startTime,
        end_time: endTime
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
        supabase.from('job_applications').select('job_id').eq('user_id', userId)
      ]);

      const savedIds = new Set(saved?.map(s => s.job_id) || []);
      const appliedIds = new Set(applied?.map(a => a.job_id) || []);

      data.forEach(job => {
        job.is_saved = savedIds.has(job.id);
        job.is_applied = appliedIds.has(job.id);
      });
    }

    return { data, error };
  },

  saveJob: async (jobId: string, userId: string) => {
    const { error } = await supabase
      .from('saved_jobs')
      .insert({ job_id: jobId, user_id: userId });
    return { error };
  },

  unsaveJob: async (jobId: string, userId: string) => {
    const { error } = await supabase
      .from('saved_jobs')
      .delete()
      .eq('job_id', jobId)
      .eq('user_id', userId);
    return { error };
  },

  applyToJob: async (jobId: string, userId: string) => {
    const { data, error } = await supabase
      .from('job_applications')
      .insert({ job_id: jobId, user_id: userId })
      .select()
      .single();
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
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);
    return { error };
  },

  markAllNotificationsRead: async (userId: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId);
    return { error };
  },

  // Achievements & Stats
  getUserStats: async (userId: string) => {
    const { data, error } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single();
    return { data, error };
  },

  getAchievements: async (userId: string) => {
    const { data: achievements, error } = await supabase
      .from('achievements')
      .select('*');

    if (achievements && userId) {
      const { data: userAchievements } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', userId);

      const userMap = new Map(userAchievements?.map(ua => [ua.achievement_id, ua]) || []);
      
      achievements.forEach(achievement => {
        const ua = userMap.get(achievement.id);
        achievement.user_progress = ua?.progress || 0;
        achievement.unlocked = ua?.unlocked || false;
        achievement.unlocked_at = ua?.unlocked_at;
      });
    }

    return { data: achievements, error };
  },

  // Wellness
  logMood: async (userId: string, mood: number, note?: string) => {
    const { data, error } = await supabase
      .from('mood_entries')
      .insert({ user_id: userId, mood, note })
      .select()
      .single();
    return { data, error };
  },

  logSleep: async (userId: string, hours: number) => {
    const { data, error } = await supabase
      .from('sleep_entries')
      .insert({ user_id: userId, hours })
      .select()
      .single();
    return { data, error };
  },

  getWellnessData: async (userId: string, days = 7) => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [{ data: moods }, { data: sleep }] = await Promise.all([
      supabase
        .from('mood_entries')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false }),
      supabase
        .from('sleep_entries')
        .select('*')
        .eq('user_id', userId)
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: false })
    ]);

    return { moods, sleep };
  },

  // Search
  search: async (query: string) => {
    const q = query.toLowerCase();
    
    const [courses, events, jobs, faqs] = await Promise.all([
      supabase.from('courses').select('id, code, name, professor').ilike('name', `%${q}%`),
      supabase.from('events').select('id, title, date, location').ilike('title', `%${q}%`),
      supabase.from('jobs').select('id, title, company, type').ilike('title', `%${q}%`),
      supabase.from('faqs').select('id, question, category').ilike('question', `%${q}%`)
    ]);

    return {
      courses: courses.data || [],
      events: events.data || [],
      jobs: jobs.data || [],
      faqs: faqs.data || []
    };
  },

  // =============================================
  // MESSAGING
  // =============================================
  
  // Get all conversations for a user
  getConversations: async (userId: string) => {
    const { data: participations, error } = await supabase
      .from('conversation_participants')
      .select(`
        conversation_id,
        conversation:conversations(
          id,
          type,
          name,
          created_at
        )
      `)
      .eq('user_id', userId);

    if (error || !participations) return { data: [], error };

    // Get additional data for each conversation
    const conversationsWithDetails = await Promise.all(
      participations.map(async (p: any) => {
        const conv = p.conversation;
        
        // Get participants
        const { data: participants } = await supabase
          .from('conversation_participants')
          .select(`
            user:profiles(id, name, avatar_url)
          `)
          .eq('conversation_id', conv.id);

        // Get last message
        const { data: lastMessages } = await supabase
          .from('messages')
          .select(`
            id,
            content,
            created_at,
            sender_id,
            sender:profiles(name)
          `)
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1);

        // Get unread count
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
          unreadCount: unreadCount || 0
        };
      })
    );

    // Sort by last message time
    conversationsWithDetails.sort((a, b) => {
      const aTime = a.lastMessage?.created_at || a.created_at;
      const bTime = b.lastMessage?.created_at || b.created_at;
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });

    return { data: conversationsWithDetails, error: null };
  },

  // Get messages for a conversation
  getMessages: async (conversationId: string, limit = 50) => {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        id,
        conversation_id,
        content,
        created_at,
        read,
        sender_id,
        sender:profiles(id, name, avatar_url)
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(limit);

    // Transform sender from array to single object
    const transformedData = data?.map(msg => ({
      ...msg,
      sender: Array.isArray(msg.sender) ? msg.sender[0] : msg.sender
    }));

    return { data: transformedData, error };
  },

  // Send a message
  sendMessage: async (conversationId: string, senderId: string, content: string) => {
    console.log('API sendMessage:', { conversationId, senderId, content: content.substring(0, 20) });
    
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: senderId,
          content: content
        })
        .select(`
          id,
          conversation_id,
          content,
          created_at,
          read,
          sender_id,
          sender:profiles(id, name, avatar_url)
        `)
        .single();

      if (error) {
        console.error('Supabase sendMessage error:', error);
        return { data: null, error };
      }

      // Transform sender from array to single object
      const transformedData = data ? {
        ...data,
        sender: Array.isArray(data.sender) ? data.sender[0] : data.sender
      } : null;

      console.log('Message sent successfully:', transformedData?.id);
      return { data: transformedData, error: null };
    } catch (err: any) {
      console.error('Exception in sendMessage:', err);
      return { data: null, error: { message: err.message || 'Unknown error' } };
    }
  },

  // Mark messages as read
  markMessagesAsRead: async (conversationId: string, userId: string) => {
    const { error } = await supabase
      .from('messages')
      .update({ read: true })
      .eq('conversation_id', conversationId)
      .neq('sender_id', userId)
      .eq('read', false);

    return { error };
  },

  // Create a new conversation (direct message)
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
          { conversation_id: newConv.id, user_id: otherUserId }
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
    const participants = [userId, ...memberIds].map(id => ({
      conversation_id: newConv.id,
      user_id: id
    }));

    const { error: partError } = await supabase
      .from('conversation_participants')
      .insert(participants);

    if (partError) return { data: null, error: partError };

    return { data: newConv, error: null };
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

  // Subscribe to new messages in a conversation
  subscribeToMessages: (conversationId: string, callback: (message: any) => void) => {
    return supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        async (payload) => {
          // Fetch the full message with sender info
          const { data } = await supabase
            .from('messages')
            .select(`
              id,
              conversation_id,
              content,
              created_at,
              read,
              sender_id,
              sender:profiles(id, name, avatar_url)
            `)
            .eq('id', payload.new.id)
            .single();
          
          if (data) {
            // Transform sender from array to single object
            const transformedData = {
              ...data,
              sender: Array.isArray(data.sender) ? data.sender[0] : data.sender
            };
            callback(transformedData);
          }
        }
      )
      .subscribe();
  },

  // Unsubscribe from messages
  unsubscribeFromMessages: (conversationId: string) => {
    supabase.removeChannel(supabase.channel(`messages:${conversationId}`));
  }
};
