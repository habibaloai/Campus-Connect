import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';
import { supabaseStorageAdapter } from './storage';
import Constants from 'expo-constants';
import { readAsStringAsync } from 'expo-file-system/legacy';

// Get Supabase credentials from environment variables
// Try EXPO_PUBLIC_ first (recommended for Expo), then NEXT_PUBLIC_, then Constants.expoConfig.extra
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || Constants.expoConfig?.extra?.supabaseUrl;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || Constants.expoConfig?.extra?.supabaseAnonKey;

// Validate credentials - throw error if missing (required for Supabase)
if (!supabaseUrl || !supabaseUrl.trim()) {
  throw new Error('supabaseUrl is required. Please add EXPO_PUBLIC_SUPABASE_URL to your .env.local file in apps/mobile/');
}

if (!supabaseAnonKey || !supabaseAnonKey.trim()) {
  throw new Error('supabaseAnonKey is required. Please add EXPO_PUBLIC_SUPABASE_ANON_KEY to your .env.local file in apps/mobile/');
}

// Create Supabase client with React Native storage adapter
export const supabase = createClient(supabaseUrl.trim(), supabaseAnonKey.trim(), {
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
      // First, check if a profile with this email already exists
      // This prevents duplicate signups even if Supabase doesn't return an error
      const normalizedEmail = email.toLowerCase().trim();

      // Try to check for existing profile, but don't fail if check fails (RLS might prevent it)
      let existingProfile = null;
      try {
        const { data: profileData, error: checkError } = await supabase
          .from('profiles')
          .select('id, email')
          .eq('email', normalizedEmail)
          .maybeSingle();

        if (!checkError && profileData) {
          existingProfile = profileData;
        } else if (checkError) {
          // If check fails (e.g., RLS policy), log but continue - Supabase will catch duplicates
          console.warn('Could not check for existing profile (may be RLS restriction):', checkError.message);
        }
      } catch (err) {
        // If check throws an error, continue with signup - Supabase will handle duplicates
        console.warn('Error checking for existing profile:', err);
      }

      if (existingProfile) {
        // User already exists
        console.log('Duplicate signup attempt detected for email:', normalizedEmail);
        return {
          data: null,
          error: {
            message: 'An account with this email already exists. Please sign in instead.',
            status: 400
          }
        };
      }

      // Construct redirect URL for email verification
      // This ensures verification links go to the app, not the web app
      const emailRedirectTo = __DEV__
        ? 'http://localhost:8081/auth/callback?type=signup'
        : 'https://campusconnect.app/auth/callback?type=signup'; // Update with your actual web URL

      // Create the auth user
      console.log('Attempting to sign up user with email:', normalizedEmail);
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: { name },
          emailRedirectTo,
        },
      });

      console.log('SignUp response:', {
        hasUser: !!data?.user,
        hasSession: !!data?.session,
        hasError: !!error,
        errorMessage: error?.message
      });

      if (error) {
        // Check if error is due to user already existing
        // Supabase returns different error messages for duplicate users
        const errorMessage = error.message?.toLowerCase() || '';
        const isDuplicateUser =
          errorMessage.includes('already registered') ||
          errorMessage.includes('user already registered') ||
          errorMessage.includes('email address is already registered') ||
          errorMessage.includes('user with this email already exists') ||
          errorMessage.includes('email already exists') ||
          error.status === 422 ||
          error.status === 400;

        if (isDuplicateUser) {
          return {
            data: null,
            error: {
              message: 'An account with this email already exists. Please sign in instead.',
              status: error.status || 400
            }
          };
        }
        return { data: null, error };
      }

      // If signup successful and we have a user, create their profile
      if (data?.user) {
        // Create/update profile
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            name: name,
            email: normalizedEmail,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'id',
          });

        if (profileError) {
          // If profile upsert fails due to duplicate email constraint, user already exists
          // Only fail if it's specifically an email unique constraint violation
          const errorMsg = profileError.message?.toLowerCase() || '';
          const isEmailDuplicate =
            profileError.code === '23505' &&
            (errorMsg.includes('email') || errorMsg.includes('profiles_email_key') || errorMsg.includes('profiles_email'));

          if (isEmailDuplicate) {
            console.log('Profile duplicate email error detected:', profileError.message);
            return {
              data: null,
              error: {
                message: 'An account with this email already exists. Please sign in instead.',
                status: 400
              }
            };
          }
          // Other profile errors are warnings, not failures
          console.warn('Profile creation warning (non-critical):', profileError.message);
          // Don't fail signup if profile creation has issues - user can still sign in
        }
      }

      // Return success - Supabase signUp succeeded
      // Note: data.user might exist even without session if email confirmation is required
      // This is normal behavior, not an error
      return { data, error: null };
    } catch (err: any) {
      console.error('SignUp error:', err);

      // Check for duplicate user error in catch block
      const errorMessage = err.message?.toLowerCase() || '';
      const isDuplicateUser =
        errorMessage.includes('already registered') ||
        errorMessage.includes('user already registered') ||
        errorMessage.includes('email address is already registered') ||
        err.status === 422;

      if (isDuplicateUser) {
        return {
          data: null,
          error: {
            message: 'An account with this email already exists. Please sign in instead.',
            status: 400
          }
        };
      }

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
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        console.error('Invalid email format:', email);
        return {
          data: null,
          error: {
            message: 'Please enter a valid email address',
            status: 400
          }
        };
      }

      // Construct redirect URL for password reset
      // Supabase sends emails with web URLs, so we need to use a web URL
      // that will redirect to the mobile app's reset password screen
      // The callback handler will process the tokens and redirect to reset-password screen
      const redirectTo = __DEV__
        ? 'http://localhost:8081/auth/callback?type=recovery'
        : 'https://campusconnect.app/auth/callback?type=recovery'; // Update with your actual web URL

      console.log('Sending password reset email to:', email);
      console.log('Using redirectTo:', redirectTo);

      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });

      if (error) {
        // Log the actual error for debugging
        console.error('Password reset error details:', {
          message: error.message,
          status: error.status,
          name: error.name,
        });

        // Check for specific errors that we should handle
        if (error.message?.includes('rate limit') || error.message?.includes('too many requests')) {
          return {
            data: null,
            error: {
              message: 'Too many requests. Please wait a few minutes before trying again.',
              status: 429,
            },
          };
        }

        // For other errors, still return success to prevent email enumeration
        // But log the error so we can debug
        console.warn('Password reset failed but returning success for security:', error.message);
        return { data: null, error: null };
      }

      console.log('Password reset email sent successfully');
      return { data, error: null };
    } catch (err: any) {
      console.error('Password reset exception:', err);
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

    // 1. Update the profiles table (Legacy/Backup)
    const { data, error } = await supabase
      .from('profiles')
      .update(cleanUpdates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('[API] Supabase update error:', error);
      return { data, error };
    } else {
      console.log('[API] Profile updated successfully:', data);
    }

    // 2. Update the user_interests table (New Schema)
    // We do this if 'interests' is part of the update
    if (cleanUpdates.interests !== undefined) {
      console.log('[API] Syncing interests to user_interests table...');
      const { error: rpcError } = await supabase.rpc('update_user_interests', {
        p_user_id: userId,
        p_interests: cleanUpdates.interests || []
      });

      if (rpcError) {
        console.error('[API] Error syncing user_interests:', rpcError);
        // We don't fail the whole operation if this fails, but we log it
      } else {
        console.log('[API] user_interests synced successfully');
      }
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

    if (data) {
      // Ensure is_private defaults to false if not set
      if (data.is_private === undefined || data.is_private === null) {
        data.is_private = false;
      }

      if (userId) {
        // Check if user is attending
        const { data: attending, error: attendingError } = await supabase
          .from('event_attendees')
          .select('id')
          .eq('event_id', eventId)
          .eq('user_id', userId)
          .limit(1)
          .maybeSingle();

        // Check if user has a pending join request
        const { data: pendingRequest, error: requestError } = await supabase
          .from('event_join_requests')
          .select('id')
          .eq('event_id', eventId)
          .eq('user_id', userId)
          .eq('status', 'pending')
          .limit(1)
          .maybeSingle();

        data.is_attending = !attendingError && !!attending;
        data.has_pending_request = !requestError && !!pendingRequest;
        data.attendee_count = data.attendee_count?.[0]?.count || 0;
      } else {
        data.attendee_count = data.attendee_count?.[0]?.count || 0;
      }
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

  // Event Join Requests
  requestToJoinEvent: async (eventId: string, userId: string) => {
    // First, check if user is the organizer
    const { data: event } = await supabase
      .from('events')
      .select('organizer_id')
      .eq('id', eventId)
      .single();

    if (event && event.organizer_id === userId) {
      return {
        data: null,
        error: { message: 'You cannot request to join your own event', code: 'IS_ORGANIZER' },
      };
    }

    // Check if user is already an attendee
    const { data: existingAttendee } = await supabase
      .from('event_attendees')
      .select('id')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle();

    if (existingAttendee) {
      return {
        data: null,
        error: { message: 'You are already attending this event', code: 'ALREADY_ATTENDING' },
      };
    }

    // Check if there's already a pending request
    const { data: existingRequest } = await supabase
      .from('event_join_requests')
      .select('id')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .eq('status', 'pending')
      .maybeSingle();

    if (existingRequest) {
      return {
        data: existingRequest,
        error: null,
      };
    }

    // Create new join request
    const { data, error } = await supabase
      .from('event_join_requests')
      .insert({
        event_id: eventId,
        user_id: userId,
        status: 'pending',
      })
      .select(`
        *,
        event:events(id, title, organizer_id)
      `)
      .single();

    // Notify event organizer about join request
    if (data && !error) {
      const event = Array.isArray(data.event) ? data.event[0] : data.event;
      if (event?.organizer_id) {
        const { data: requesterProfile } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', userId)
          .single();

        api.createNotification(
          event.organizer_id,
          'event_join_request',
          'New Join Request',
          `${requesterProfile?.name || 'Someone'} wants to join ${event.title}`,
          `/(tabs)/events/${eventId}?tab=requests`
        ).catch((err) => console.warn('Failed to send notification:', err));
      }
    }

    return { data, error };
  },

  getEventJoinRequests: async (eventId: string) => {
    const { data, error } = await supabase
      .from('event_join_requests')
      .select(`
        *,
        profile:profiles(id, name, avatar_url, major, year)
      `)
      .eq('event_id', eventId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (data) {
      // Transform profile data
      const transformedData = data.map((request: any) => ({
        ...request,
        profile: Array.isArray(request.profile) ? request.profile[0] : request.profile,
      }));
      return { data: transformedData, error: null };
    }

    return { data, error };
  },

  respondToJoinRequest: async (requestId: string, accept: boolean) => {
    // Get the request
    const { data: request, error: fetchError } = await supabase
      .from('event_join_requests')
      .select('*, event:events(id, organizer_id)')
      .eq('id', requestId)
      .single();

    if (fetchError || !request) {
      return { data: null, error: fetchError || { message: 'Join request not found' } };
    }

    if (accept) {
      // Update request status
      const { error: updateError } = await supabase
        .from('event_join_requests')
        .update({ status: 'accepted', updated_at: new Date().toISOString() })
        .eq('id', requestId);

      if (updateError) {
        return { data: null, error: updateError };
      }

      // Add user to event attendees
      const { error: attendeeError } = await supabase
        .from('event_attendees')
        .insert({
          event_id: request.event_id,
          user_id: request.user_id,
        });

      if (attendeeError) {
        // If adding attendee fails, revert request status
        await supabase
          .from('event_join_requests')
          .update({ status: 'pending' })
          .eq('id', requestId);
        return { data: null, error: attendeeError };
      }

      // Notify user that their request was approved
      const { data: eventData } = await supabase
        .from('events')
        .select('title')
        .eq('id', request.event_id)
        .single();

      if (eventData) {
        api.createNotification(
          request.user_id,
          'event_join_approved',
          'Join Request Approved',
          `Your request to join ${eventData.title} has been approved!`,
          `/(tabs)/events/${request.event_id}`
        ).catch((err) => console.warn('Failed to send notification:', err));
      }

      return { data: { ...request, status: 'accepted' }, error: null };
    } else {
      // Delete the request (rejected)
      const { error: deleteError } = await supabase
        .from('event_join_requests')
        .delete()
        .eq('id', requestId);

      // Notify user that their request was declined
      const { data: eventData } = await supabase
        .from('events')
        .select('title')
        .eq('id', request.event_id)
        .single();

      if (eventData && !deleteError) {
        api.createNotification(
          request.user_id,
          'event_join_rejected',
          'Join Request Declined',
          `Your request to join ${eventData.title} was declined`,
          `/(tabs)/events`
        ).catch((err) => console.warn('Failed to send notification:', err));
      }

      return { data: null, error: deleteError };
    }
  },

  uploadEventImage: async (eventId: string, fileUri: string, fileExt: string = 'jpg') => {
    try {
      const fileName = `${eventId}_${Date.now()}.${fileExt}`;
      const filePath = `${eventId}/${fileName}`;

      const base64 = await readAsStringAsync(fileUri, { encoding: 'base64' });
      const bytes = new Uint8Array(
        atob(base64)
          .split('')
          .map((char) => char.charCodeAt(0))
      );

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('event-covers')
        .upload(filePath, bytes, {
          contentType: `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`,
          upsert: true,
        });

      if (uploadError) {
        return {
          url: null,
          error: {
            message: uploadError.message || 'Failed to upload event image',
            code: uploadError.message?.toLowerCase().includes('bucket') ? 'BUCKET_NOT_FOUND' : 'UPLOAD_ERROR',
          },
        };
      }

      const { data: urlData } = supabase.storage.from('event-covers').getPublicUrl(filePath);
      return { url: urlData.publicUrl, error: null };
    } catch (error: any) {
      return {
        url: null,
        error: {
          message: error.message || 'Failed to upload event image',
          code: 'UPLOAD_ERROR',
        },
      };
    }
  },

  // Event Photo Management
  uploadEventPhoto: async (eventId: string, userId: string, fileUri: string, fileExt: string = 'jpg') => {
    try {
      // Verify user is an attendee
      const { data: attendee, error: attendeeError } = await supabase
        .from('event_attendees')
        .select('id')
        .eq('event_id', eventId)
        .eq('user_id', userId)
        .limit(1)
        .maybeSingle();

      if (attendeeError || !attendee) {
        return {
          data: null,
          error: {
            message: 'You must be attending this event to upload photos',
            code: 'NOT_ATTENDEE',
          },
        };
      }

      // Generate unique photo ID using timestamp and random number
      // React Native doesn't have crypto.randomUUID(), so we use a combination approach
      const photoId = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      const fileName = `${photoId}.${fileExt}`;
      const filePath = `${eventId}/${fileName}`;

      // Upload to storage
      const base64 = await readAsStringAsync(fileUri, { encoding: 'base64' });
      const bytes = new Uint8Array(
        atob(base64)
          .split('')
          .map((char) => char.charCodeAt(0))
      );

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('event-photos')
        .upload(filePath, bytes, {
          contentType: `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`,
          upsert: false,
        });

      if (uploadError) {
        return {
          data: null,
          error: {
            message: uploadError.message || 'Failed to upload photo',
            code: uploadError.message?.toLowerCase().includes('bucket') ? 'BUCKET_NOT_FOUND' : 'UPLOAD_ERROR',
          },
        };
      }

      // Get public URL
      const { data: urlData } = supabase.storage.from('event-photos').getPublicUrl(filePath);
      const photoUrl = urlData.publicUrl;

      // Create database record
      const { data: photoData, error: dbError } = await supabase
        .from('event_photos')
        .insert({
          event_id: eventId,
          user_id: userId,
          photo_url: photoUrl,
        })
        .select(`
          *,
          user:profiles(id, name, avatar_url)
        `)
        .single();

      if (dbError) {
        // If DB insert fails, try to delete uploaded file
        await supabase.storage.from('event-photos').remove([filePath]);
        return { data: null, error: dbError };
      }

      // Transform user data
      const transformedData = {
        ...photoData,
        user: Array.isArray(photoData.user) ? photoData.user[0] : photoData.user,
      };

      return { data: transformedData, error: null };
    } catch (error: any) {
      return {
        data: null,
        error: {
          message: error.message || 'Failed to upload photo',
          code: 'UPLOAD_ERROR',
        },
      };
    }
  },

  getEventPhotos: async (eventId: string, userId?: string) => {
    // Verify user is an attendee if userId is provided
    if (userId) {
      const { data: attendee } = await supabase
        .from('event_attendees')
        .select('id')
        .eq('event_id', eventId)
        .eq('user_id', userId)
        .limit(1)
        .maybeSingle();

      if (!attendee) {
        return {
          data: null,
          error: { message: 'You must be attending this event to view photos', code: 'NOT_ATTENDEE' },
        };
      }
    }

    const { data, error } = await supabase
      .from('event_photos')
      .select(`
        *,
        user:profiles(id, name, avatar_url),
        likes:event_photo_likes(count),
        comments:event_photo_comments(count)
      `)
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    if (error) {
      return { data: null, error };
    }

    // Get user's likes if userId provided
    let userLikes = new Set<string>();
    if (userId && data) {
      const photoIds = data.map((p: any) => p.id);
      const { data: likes } = await supabase
        .from('event_photo_likes')
        .select('photo_id')
        .eq('user_id', userId)
        .in('photo_id', photoIds);

      if (likes) {
        userLikes = new Set(likes.map((l) => l.photo_id));
      }
    }

    // Transform data
    const transformedData = data?.map((photo: any) => ({
      ...photo,
      user: Array.isArray(photo.user) ? photo.user[0] : photo.user,
      likes_count: photo.likes?.[0]?.count || 0,
      comments_count: photo.comments?.[0]?.count || 0,
      is_liked: userId ? userLikes.has(photo.id) : false,
    }));

    return { data: transformedData, error: null };
  },

  deleteEventPhoto: async (photoId: string, userId: string, isCreator: boolean = false) => {
    // Get photo info
    const { data: photo, error: fetchError } = await supabase
      .from('event_photos')
      .select('*, event:events(id, organizer_id)')
      .eq('id', photoId)
      .single();

    if (fetchError || !photo) {
      return { error: fetchError || { message: 'Photo not found' } };
    }

    // Check permissions
    const canDelete = photo.user_id === userId || (isCreator && photo.event?.organizer_id === userId);
    if (!canDelete) {
      return { error: { message: 'You do not have permission to delete this photo', code: 'PERMISSION_DENIED' } };
    }

    // Extract file path from photo_url
    const photoUrl = photo.photo_url;
    const urlParts = photoUrl.split('/');
    const fileName = urlParts[urlParts.length - 1].split('?')[0];
    const eventId = photo.event_id;
    const filePath = `${eventId}/${fileName}`;

    // Delete from database (cascade will handle comments and likes)
    const { error: deleteError } = await supabase.from('event_photos').delete().eq('id', photoId);

    if (deleteError) {
      return { error: deleteError };
    }

    // Delete from storage (non-blocking)
    supabase.storage
      .from('event-photos')
      .remove([filePath])
      .catch((err) => {
        console.warn('Failed to delete photo from storage:', err);
      });

    return { error: null };
  },

  likeEventPhoto: async (photoId: string, userId: string) => {
    // Check if already liked
    const { data: existingLike } = await supabase
      .from('event_photo_likes')
      .select('id')
      .eq('photo_id', photoId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existingLike) {
      // Unlike: delete the like
      const { error } = await supabase.from('event_photo_likes').delete().eq('id', existingLike.id);
      return { data: { liked: false }, error };
    } else {
      // Like: create new like
      const { data, error } = await supabase
        .from('event_photo_likes')
        .insert({
          photo_id: photoId,
          user_id: userId,
        })
        .select()
        .single();

      // Get photo info to notify uploader
      const { data: photo } = await supabase
        .from('event_photos')
        .select('user_id, event:events(id, title)')
        .eq('id', photoId)
        .single();

      // Notify photo uploader about like (if not liking own photo)
      // Note: Consider batching likes to avoid spam
      if (photo && photo.user_id !== userId && data) {
        const event = Array.isArray(photo.event) ? photo.event[0] : photo.event;
        api.createNotification(
          photo.user_id,
          'photo_like',
          'Photo Liked',
          'Someone liked your photo',
          `/(tabs)/events/${event?.id}?tab=photos`
        ).catch((err) => console.warn('Failed to send notification:', err));
      }

      return { data: { liked: true, like: data }, error };
    }
  },

  commentOnPhoto: async (photoId: string, userId: string, content: string) => {
    if (!content || content.trim().length === 0) {
      return {
        data: null,
        error: { message: 'Comment cannot be empty', code: 'INVALID_INPUT' },
      };
    }

    const { data, error } = await supabase
      .from('event_photo_comments')
      .insert({
        photo_id: photoId,
        user_id: userId,
        content: content.trim(),
      })
      .select(`
        *,
        user:profiles(id, name, avatar_url)
      `)
      .single();

    if (data) {
      const transformedData = {
        ...data,
        user: Array.isArray(data.user) ? data.user[0] : data.user,
      };

      // Get photo info to notify uploader
      const { data: photo } = await supabase
        .from('event_photos')
        .select('user_id, event:events(id, title)')
        .eq('id', photoId)
        .single();

      // Notify photo uploader about comment (if not commenting on own photo)
      if (photo && photo.user_id !== userId) {
        const event = Array.isArray(photo.event) ? photo.event[0] : photo.event;
        api.createNotification(
          photo.user_id,
          'photo_comment',
          'New Comment on Your Photo',
          `${transformedData.user?.name || 'Someone'} commented on your photo`,
          `/(tabs)/events/${event?.id}?tab=photos`
        ).catch((err) => console.warn('Failed to send notification:', err));
      }

      return { data: transformedData, error: null };
    }

    return { data, error };
  },

  getPhotoComments: async (photoId: string) => {
    const { data, error } = await supabase
      .from('event_photo_comments')
      .select(`
        *,
        user:profiles(id, name, avatar_url)
      `)
      .eq('photo_id', photoId)
      .order('created_at', { ascending: true });

    if (data) {
      const transformedData = data.map((comment: any) => ({
        ...comment,
        user: Array.isArray(comment.user) ? comment.user[0] : comment.user,
      }));
      return { data: transformedData, error: null };
    }

    return { data, error };
  },

  deletePhotoComment: async (commentId: string, userId: string) => {
    // Verify user owns the comment
    const { data: comment } = await supabase
      .from('event_photo_comments')
      .select('user_id')
      .eq('id', commentId)
      .single();

    if (!comment || comment.user_id !== userId) {
      return { error: { message: 'You can only delete your own comments', code: 'PERMISSION_DENIED' } };
    }

    const { error } = await supabase.from('event_photo_comments').delete().eq('id', commentId);
    return { error };
  },

  // Real-time Subscriptions for Events
  subscribeToEventPhotos: (eventId: string, callback: (photo: any) => void) => {
    return supabase
      .channel(`event-photos:${eventId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'event_photos',
          filter: `event_id=eq.${eventId}`,
        },
        async (payload) => {
          // Fetch full photo data with user info
          const { data } = await supabase
            .from('event_photos')
            .select(`
              *,
              user:profiles(id, name, avatar_url)
            `)
            .eq('id', payload.new.id)
            .single();

          if (data) {
            const transformedData = {
              ...data,
              user: Array.isArray(data.user) ? data.user[0] : data.user,
              likes_count: 0,
              comments_count: 0,
              is_liked: false,
            };
            callback(transformedData);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'event_photos',
          filter: `event_id=eq.${eventId}`,
        },
        (payload) => {
          callback({ id: payload.old.id, deleted: true });
        }
      )
      .subscribe();
  },

  unsubscribeFromEventPhotos: (eventId: string) => {
    supabase.removeChannel(supabase.channel(`event-photos:${eventId}`));
  },

  subscribeToPhotoComments: (photoId: string, callback: (comment: any) => void) => {
    return supabase
      .channel(`photo-comments:${photoId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'event_photo_comments',
          filter: `photo_id=eq.${photoId}`,
        },
        async (payload) => {
          const { data } = await supabase
            .from('event_photo_comments')
            .select(`
              *,
              user:profiles(id, name, avatar_url)
            `)
            .eq('id', payload.new.id)
            .single();

          if (data) {
            const transformedData = {
              ...data,
              user: Array.isArray(data.user) ? data.user[0] : data.user,
            };
            callback(transformedData);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'event_photo_comments',
          filter: `photo_id=eq.${photoId}`,
        },
        (payload) => {
          callback({ id: payload.old.id, deleted: true });
        }
      )
      .subscribe();
  },

  unsubscribeFromPhotoComments: (photoId: string) => {
    supabase.removeChannel(supabase.channel(`photo-comments:${photoId}`));
  },

  subscribeToPhotoLikes: (photoId: string, callback: (like: any) => void) => {
    return supabase
      .channel(`photo-likes:${photoId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'event_photo_likes',
          filter: `photo_id=eq.${photoId}`,
        },
        (payload) => {
          callback({
            photo_id: photoId,
            action: payload.eventType,
            like: payload.new || payload.old,
          });
        }
      )
      .subscribe();
  },

  unsubscribeFromPhotoLikes: (photoId: string) => {
    supabase.removeChannel(supabase.channel(`photo-likes:${photoId}`));
  },

  subscribeToEventJoinRequests: (eventId: string, callback: (request: any) => void) => {
    return supabase
      .channel(`event-join-requests:${eventId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'event_join_requests',
          filter: `event_id=eq.${eventId}`,
        },
        async (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const { data } = await supabase
              .from('event_join_requests')
              .select(`
                *,
                profile:profiles(id, name, avatar_url, major, year)
              `)
              .eq('id', payload.new.id)
              .single();

            if (data) {
              const transformedData = {
                ...data,
                profile: Array.isArray(data.profile) ? data.profile[0] : data.profile,
              };
              callback({ action: payload.eventType, request: transformedData });
            }
          } else if (payload.eventType === 'DELETE') {
            callback({ action: 'DELETE', request: { id: payload.old.id } });
          }
        }
      )
      .subscribe();
  },

  unsubscribeFromEventJoinRequests: (eventId: string) => {
    supabase.removeChannel(supabase.channel(`event-join-requests:${eventId}`));
  },

  subscribeToEventUpdates: (eventId: string, callback: (event: any) => void) => {
    return supabase
      .channel(`event-updates:${eventId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'events',
          filter: `id=eq.${eventId}`,
        },
        async (payload) => {
          const { data } = await supabase
            .from('events')
            .select('*')
            .eq('id', eventId)
            .single();

          if (data) {
            callback(data);
          }
        }
      )
      .subscribe();
  },

  unsubscribeFromEventUpdates: (eventId: string) => {
    supabase.removeChannel(supabase.channel(`event-updates:${eventId}`));
  },

  // Event Management Functions
  updateEvent: async (eventId: string, userId: string, updates: {
    title?: string;
    description?: string;
    location?: string;
    category?: string;
    max_attendees?: number;
  }) => {
    // Verify user is the organizer
    const { data: event } = await supabase
      .from('events')
      .select('organizer_id')
      .eq('id', eventId)
      .single();

    if (!event || event.organizer_id !== userId) {
      return {
        data: null,
        error: { message: 'You can only edit events you created', code: 'PERMISSION_DENIED' },
      };
    }

    const { data, error } = await supabase
      .from('events')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', eventId)
      .select()
      .single();

    // Notify all attendees about significant changes (title, location)
    if (data && !error && (updates.title || updates.location)) {
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
              'event_updated',
              'Event Updated',
              `${data.title} has been updated`,
              `/(tabs)/events/${eventId}`
            )
          );

        Promise.all(notificationPromises).catch((err) => console.warn('Failed to send some notifications:', err));
      }
    }

    return { data, error };
  },

  changeEventPrivacy: async (eventId: string, userId: string, isPrivate: boolean) => {
    // Verify user is the organizer
    const { data: event } = await supabase
      .from('events')
      .select('organizer_id, is_private')
      .eq('id', eventId)
      .single();

    if (!event || event.organizer_id !== userId) {
      return {
        data: null,
        error: { message: 'You can only change privacy of events you created', code: 'PERMISSION_DENIED' },
      };
    }

    const { data, error } = await supabase
      .from('events')
      .update({
        is_private: isPrivate,
        updated_at: new Date().toISOString(),
      })
      .eq('id', eventId)
      .select()
      .single();

    // Notify all attendees about privacy change
    if (data && !error) {
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
              'event_privacy_changed',
              'Event Privacy Changed',
              `${data.title} is now ${isPrivate ? 'private' : 'public'}`,
              `/(tabs)/events/${eventId}`
            )
          );

        Promise.all(notificationPromises).catch((err) => console.warn('Failed to send some notifications:', err));
      }
    }

    return { data, error };
  },

  rescheduleEvent: async (eventId: string, userId: string, newDate: string, newTime?: string) => {
    // Verify user is the organizer
    const { data: event } = await supabase
      .from('events')
      .select('organizer_id, date, time')
      .eq('id', eventId)
      .single();

    if (!event || event.organizer_id !== userId) {
      return {
        data: null,
        error: { message: 'You can only reschedule events you created', code: 'PERMISSION_DENIED' },
      };
    }

    const updateData: any = {
      date: newDate,
      updated_at: new Date().toISOString(),
    };

    if (newTime) {
      updateData.time = newTime;
    }

    const { data, error } = await supabase
      .from('events')
      .update(updateData)
      .eq('id', eventId)
      .select()
      .single();

    // Notify all attendees about reschedule
    if (data && !error) {
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
              'event_rescheduled',
              'Event Rescheduled',
              `${data.title} has been rescheduled to ${newDate}${newTime ? ` at ${newTime}` : ''}`,
              `/(tabs)/events/${eventId}`
            )
          );

        Promise.all(notificationPromises).catch((err) => console.warn('Failed to send some notifications:', err));
      }
    }

    return { data, error };
  },

  changeEventCoverPhoto: async (eventId: string, userId: string, fileUri: string, fileExt: string = 'jpg') => {
    // Verify user is the organizer
    const { data: event } = await supabase
      .from('events')
      .select('organizer_id, image_url')
      .eq('id', eventId)
      .single();

    if (!event || event.organizer_id !== userId) {
      return {
        url: null,
        error: { message: 'You can only change cover photo of events you created', code: 'PERMISSION_DENIED' },
      };
    }

    // Upload new cover photo
    const { url: newUrl, error: uploadError } = await api.uploadEventImage(eventId, fileUri, fileExt);

    if (uploadError || !newUrl) {
      return { url: null, error: uploadError };
    }

    // Update event with new image URL
    const { error: updateError } = await supabase
      .from('events')
      .update({
        image_url: newUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', eventId);

    if (updateError) {
      return { url: null, error: updateError };
    }

    // Delete old cover photo if it exists (non-blocking)
    if (event.image_url) {
      const urlParts = event.image_url.split('/');
      const fileName = urlParts[urlParts.length - 1].split('?')[0];
      const filePath = `${eventId}/${fileName}`;
      supabase.storage
        .from('event-covers')
        .remove([filePath])
        .catch((err) => {
          console.warn('Failed to delete old cover photo:', err);
        });
    }

    return { url: newUrl, error: null };
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
            `/(tabs)/events`
          )
        );

      Promise.all(notificationPromises).catch((err) => console.warn('Failed to send some notifications:', err));
    }

    return { error: null };
  },

  // Posts
  getPosts: async (userId?: string) => {
    // First, get all posts
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching posts:', error);
      return { data: null, error };
    }

    if (!data || data.length === 0) {
      return { data: [], error: null };
    }

    // Get author profiles for all posts
    const userIds = [...new Set(data.map((post: any) => post.user_id))];
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name, avatar_url, major, year')
      .in('id', userIds);

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
    }

    // Create a map of user_id -> profile
    const profileMap = new Map();
    if (profiles) {
      profiles.forEach((profile: any) => {
        profileMap.set(profile.id, profile);
      });
    }

    // Get reply counts for all posts
    const postIds = data.map((post: any) => post.id);
    let replyCounts: Record<string, number> = {};

    if (postIds.length > 0) {
      const { data: replies, error: repliesError } = await supabase
        .from('post_replies')
        .select('post_id')
        .in('post_id', postIds);

      if (!repliesError && replies) {
        // Count replies per post
        replies.forEach((reply: any) => {
          replyCounts[reply.post_id] = (replyCounts[reply.post_id] || 0) + 1;
        });
      }
    }

    // Get likes for the user if userId is provided
    let likedIds = new Set<string>();
    if (userId) {
      const { data: likes } = await supabase
        .from('post_likes')
        .select('post_id')
        .eq('user_id', userId);

      if (likes) {
        likedIds = new Set(likes.map((l) => l.post_id));
      }
    }

    // Combine all data
    const postsWithCounts = data.map((post: any) => ({
      ...post,
      author: profileMap.get(post.user_id) || null,
      reply_count: replyCounts[post.id] || 0,
      is_liked: userId ? likedIds.has(post.id) : false,
    }));

    return { data: postsWithCounts, error: null };
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
  createNotification: async (userId: string, type: string, title: string, message: string, actionUrl?: string) => {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        title,
        message,
        action_url: actionUrl,
        read: false,
      })
      .select()
      .single();
    return { data, error };
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
          if (payload.new && 'id' in payload.new && payload.new.id) {
            const { data: participants } = await supabase
              .from('conversation_participants')
              .select('conversation_id')
              .eq('conversation_id', payload.new.id)
              .eq('user_id', userId);

            if (participants && participants.length > 0) {
              callback(payload.new);
            }
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
          friend: profiles!friendships_friend_id_fkey(*)
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
      .or(`and(user_id.eq.${userId}, friend_id.eq.${friendId}), and(user_id.eq.${friendId}, friend_id.eq.${userId})`);

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
      follower: profiles!follows_follower_id_fkey(*)
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
        following: profiles!follows_following_id_fkey(*)
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
          connected_user: profiles!connection_stories_connected_user_id_fkey(*)
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
            classmate: profiles!course_classmates_classmate_id_fkey(*),
              course: courses(*)
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
                user: profiles(*)
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
      await api.addPoints(userId, points, 'streak_milestone', `${newStreak} -day streak!`);
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
      achievement: achievements(*)
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
      await api.addPoints(userId, achievement.points, 'achievement', `Unlocked: ${achievement.name} `);
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
      user: profiles(id, name, avatar_url, major, year)
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
        await api.addPoints(userId, challenge.reward_points, 'challenge', `Completed: ${challenge.name} `);
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
      challenge: challenges(*)
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
        achievement: achievements(*)
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

  // Extract filename from Supabase Storage URL
  extractFilenameFromUrl: (url: string): string | null => {
    try {
      // Supabase Storage URLs typically look like:
      // https://[project].supabase.co/storage/v1/object/public/avatars/[filename]
      const urlParts = url.split('/');
      const filename = urlParts[urlParts.length - 1];
      return filename || null;
    } catch (error) {
      console.error('Error extracting filename from URL:', error);
      return null;
    }
  },

  // Delete old avatar from storage
  deleteOldAvatar: async (userId: string, oldAvatarUrl: string | null): Promise<void> => {
    if (!oldAvatarUrl) return;

    try {
      const filename = api.extractFilenameFromUrl(oldAvatarUrl);
      if (!filename) {
        console.warn('Could not extract filename from old avatar URL:', oldAvatarUrl);
        return;
      }

      // Verify the filename belongs to this user (security check)
      if (!filename.startsWith(userId + '-') && !filename.startsWith(userId + '_')) {
        console.warn('Filename does not match user ID, skipping deletion:', filename);
        return;
      }

      const { error: deleteError } = await supabase.storage
        .from('avatars')
        .remove([filename]);

      if (deleteError) {
        // Log but don't throw - deletion failure shouldn't block upload
        console.warn('Error deleting old avatar (non-blocking):', deleteError);
      } else {
        console.log('Old avatar deleted successfully:', filename);
      }
    } catch (error) {
      // Log but don't throw - deletion failure shouldn't block upload
      console.warn('Error deleting old avatar (non-blocking):', error);
    }
  },

  uploadAvatar: async (userId: string, fileUri: string, fileExt: string = 'jpg', oldAvatarUrl?: string | null): Promise<{ url: string | null; error: any }> => {
    try {
      // Debug: Log Supabase configuration (without exposing full keys)
      console.log('[Avatar Upload] Supabase URL:', supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'NOT SET');
      console.log('[Avatar Upload] User ID:', userId);
      console.log('[Avatar Upload] Attempting to upload to bucket: avatars');

      const fileName = `${userId}_${Date.now()}.${fileExt} `;
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

      // Try to upload to Supabase Storage first (verify bucket exists)
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, bytes, {
          contentType: `image / ${fileExt === 'jpg' ? 'jpeg' : fileExt} `,
          upsert: false, // Don't upsert - we want unique filenames
        });

      if (uploadError) {
        // Check if it's a bucket not found or permission error
        const errorMessage = (uploadError.message || '').toLowerCase();
        const statusCode = (uploadError as any)?.statusCode || (uploadError as any)?.status || undefined;

        console.error('[Avatar Upload] Upload error details:', {
          message: uploadError.message,
          statusCode: statusCode,
          error: uploadError,
        });

        // Check for bucket not found (404) or permission denied (403)
        if (statusCode === 404 || errorMessage.includes('bucket') || errorMessage.includes('not found')) {
          return {
            url: null,
            error: {
              message: 'Storage bucket "avatars" not found or not accessible. Please verify:\n1. Bucket exists in Supabase Storage\n2. Bucket is set to Public\n3. RLS policies are configured correctly',
              code: 'BUCKET_NOT_FOUND',
              originalError: uploadError,
            },
          };
        }

        // Check for permission errors (403)
        if (statusCode === 403 || errorMessage.includes('permission') || errorMessage.includes('policy') || errorMessage.includes('row-level security')) {
          return {
            url: null,
            error: {
              message: 'Permission denied. Please check:\n1. You are signed in\n2. RLS policies allow uploads\n3. Run the SQL migration to set up policies',
              code: 'PERMISSION_ERROR',
              originalError: uploadError,
            },
          };
        }

        // Check for network errors
        if (uploadError.message?.includes('network') || uploadError.message?.includes('Network')) {
          console.error('Network error during avatar upload:', uploadError);
          return {
            url: null,
            error: {
              message: 'Network error. Please check your connection and try again.',
              code: 'NETWORK_ERROR',
            },
          };
        }

        // Check for permission errors
        if (uploadError.message?.includes('permission') || uploadError.message?.includes('Permission')) {
          console.error('Permission error during avatar upload:', uploadError);
          return {
            url: null,
            error: {
              message: 'Storage error. Please try again or contact support.',
              code: 'PERMISSION_ERROR',
            },
          };
        }

        console.error('Avatar upload error:', uploadError);
        return {
          url: null,
          error: {
            message: uploadError.message || 'Storage error. Please try again or contact support.',
            code: 'UPLOAD_ERROR',
          },
        };
      }

      // Get public URL
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const publicUrl = urlData.publicUrl;

      // Only delete old avatar AFTER successful upload
      if (oldAvatarUrl && publicUrl) {
        // Delete old avatar in background (don't block or fail if this errors)
        api.deleteOldAvatar(userId, oldAvatarUrl).catch((err) => {
          // Silently log - deletion failure shouldn't affect the upload success
          console.log('[Avatar Upload] Old avatar deletion failed (non-critical):', err);
        });
      }

      return { url: publicUrl, error: null };
    } catch (error: any) {
      console.error('Error uploading avatar:', error);

      // Check for network errors in catch block
      if (error.message?.includes('network') || error.message?.includes('Network') || error.message?.includes('fetch')) {
        return {
          url: null,
          error: {
            message: 'Network error. Please check your connection and try again.',
            code: 'NETWORK_ERROR',
          },
        };
      }

      return {
        url: null,
        error: {
          message: error.message || 'Failed to upload avatar. Please try again.',
          code: 'UPLOAD_ERROR',
        },
      };
    }
  },
};





