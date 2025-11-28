import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TextInput,
  Image,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, MapPin, Users, Clock, ChevronLeft, Share2, Check, X, MessageCircle, Image as ImageIcon, Heart, MessageSquare, Camera, Send, Smile, Plus, Bookmark, Edit, Trash2, UserPlus, Search } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useColorScheme } from '@/components/useColorScheme';
import { useAuth } from '@/providers';
import { api, supabase } from '@/lib/supabase';
import BackgroundImage from '@/components/BackgroundImage';

interface Event {
  id: string;
  title: string;
  description?: string;
  date: string;
  time?: string;
  location: string;
  category: string;
  attendee_count: number;
  max_attendees?: number;
  organizer_id?: string;
  organizer?: string;
  is_attending: boolean;
  created_at: string;
  is_private?: boolean;
}

interface Attendee {
  id: string;
  user_id: string;
  name: string;
  avatar_url?: string;
  major?: string;
}

interface Organizer {
  id: string;
  name: string;
  avatar_url?: string;
  major?: string;
}

const categoryColors: Record<string, { bg: string; text: string }> = {
  Career: { bg: '#dcfce7', text: '#16a34a' },
  Academic: { bg: '#e6f2ff', text: '#0066cc' },
  Sports: { bg: '#ffedd5', text: '#ea580c' },
  Social: { bg: '#d1fae5', text: '#059669' },
  Workshop: { bg: '#cffafe', text: '#0891b2' },
  career: { bg: '#dcfce7', text: '#16a34a' },
  academic: { bg: '#dbeafe', text: '#2563eb' },
  sports: { bg: '#ffedd5', text: '#ea580c' },
  social: { bg: '#d1fae5', text: '#059669' },
  workshop: { bg: '#cffafe', text: '#0891b2' },
};

export default function EventDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [event, setEvent] = useState<Event | null>(null);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [organizer, setOrganizer] = useState<Organizer | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingAttendees, setLoadingAttendees] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'photos' | 'comments' | 'chat' | 'requests'>('photos');
  const [photos, setPhotos] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [reactions, setReactions] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const [messageText, setMessageText] = useState('');
  const [photoDescription, setPhotoDescription] = useState('');
  const [selectedPhotoUri, setSelectedPhotoUri] = useState<string | null>(null);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<any | null>(null);
  const [showCommentsScreen, setShowCommentsScreen] = useState(false);
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [showCreateCollectionModal, setShowCreateCollectionModal] = useState(false);
  const [collections, setCollections] = useState<any[]>([]);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [photoComments, setPhotoComments] = useState<Record<string, any[]>>({});
  const [photoReactions, setPhotoReactions] = useState<Record<string, any[]>>({});
  const [commentReactions, setCommentReactions] = useState<Record<string, any[]>>({});
  const [showDeletePhotoConfirm, setShowDeletePhotoConfirm] = useState(false);
  const [deletingPhoto, setDeletingPhoto] = useState(false);
  
  // Join request states
  const [userJoinRequest, setUserJoinRequest] = useState<any | null>(null);
  const [joinRequests, setJoinRequests] = useState<any[]>([]);
  const [loadingJoinRequests, setLoadingJoinRequests] = useState(false);
  
  // Event management states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [searchUsers, setSearchUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [editingEvent, setEditingEvent] = useState(false);
  const [deletingEvent, setDeletingEvent] = useState(false);
  
  // Edit event form state
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    category: 'social',
    max_attendees: '',
  });

  // Fetch user's join request status
  const fetchUserJoinRequest = useCallback(async () => {
    if (!id || !user?.id) {
      setUserJoinRequest(null);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('event_join_requests')
        .select('*')
        .eq('event_id', id)
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .maybeSingle(); // Use maybeSingle instead of single to avoid errors when no row exists

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching join request:', error);
        setUserJoinRequest(null);
      } else if (data) {
        console.log('Fetched join request:', data);
        // Ensure status is set correctly
        const requestData = {
          ...data,
          status: data.status || 'pending',
        };
        console.log('Setting userJoinRequest from fetch:', requestData);
        setUserJoinRequest(requestData);
      } else {
        console.log('No join request found for user');
        setUserJoinRequest(null);
      }
    } catch (err) {
      console.error('Error:', err);
      setUserJoinRequest(null);
    }
  }, [id, user?.id]);

  // Fetch join requests (for organizers)
  const fetchJoinRequests = useCallback(async () => {
    if (!id) {
      setJoinRequests([]);
      return;
    }

    // Check if user is organizer by checking event.organizer_id
    // We'll check this inside the function to ensure it's up-to-date
    if (!event?.organizer_id || event.organizer_id !== user?.id) {
      setJoinRequests([]);
      return;
    }

    setLoadingJoinRequests(true);
    try {
      console.log('Fetching join requests for event:', id, 'Organizer ID:', event.organizer_id, 'User ID:', user?.id);
      const { data, error } = await api.getEventJoinRequests(id);
      if (error) {
        console.error('Error fetching join requests:', error);
        setJoinRequests([]);
      } else {
        console.log('Fetched join requests:', data);
        setJoinRequests(data || []);
      }
    } catch (err) {
      console.error('Error fetching join requests:', err);
      setJoinRequests([]);
    } finally {
      setLoadingJoinRequests(false);
    }
  }, [id, event?.organizer_id, user?.id]);

  // Fetch event details
  const fetchEvent = useCallback(async () => {
    if (!id) return;

    try {
      setError(null);
      const { data, error } = await api.getEventById(id, user?.id);

      if (error) {
        console.error('Error fetching event:', error);
        setError('Failed to load event details');
        return;
      }

      setEvent(data);
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to load event details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id, user?.id]);

  // Fetch attendees
  const fetchAttendees = useCallback(async () => {
    if (!id) return;

    setLoadingAttendees(true);
    try {
      const { data, error } = await api.getEventAttendees(id);
      if (error) {
        console.error('Error fetching attendees:', error);
      } else if (data) {
        const attendeesList = data.map((a: any) => {
          const profile = Array.isArray(a.profile) ? a.profile[0] : a.profile;
          return {
            id: profile?.id || a.user_id,
            user_id: a.user_id,
            name: profile?.name || 'Anonymous',
            avatar_url: profile?.avatar_url,
            major: profile?.major,
          };
        });
        setAttendees(attendeesList);
      }
    } catch (err) {
      console.error('Error fetching attendees:', err);
    } finally {
      setLoadingAttendees(false);
    }
  }, [id]);

  // Fetch organizer
  const fetchOrganizer = useCallback(async (organizerId: string) => {
    try {
      const { data, error } = await api.getEventOrganizer(organizerId);
      if (!error && data) {
        setOrganizer(data);
      }
    } catch (err) {
      console.error('Error fetching organizer:', err);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  // Fetch photos
  const fetchPhotos = useCallback(async () => {
    if (!id) return;
    setLoadingPhotos(true);
    try {
      const { data, error } = await api.getEventPhotos(id);
      if (!error && data) {
        setPhotos(data);
        // Fetch comments and reactions for each photo
        for (const photo of data) {
          const { data: photoComments } = await api.getPhotoComments(photo.id);
          const { data: photoReactions } = await api.getPhotoReactions(photo.id);
          if (photoComments) {
            setPhotoComments(prev => ({ ...prev, [photo.id]: photoComments }));
          }
          if (photoReactions) {
            setPhotoReactions(prev => ({ ...prev, [photo.id]: photoReactions }));
          }
        }
      }
    } catch (err) {
      console.error('Error fetching photos:', err);
    } finally {
      setLoadingPhotos(false);
    }
  }, [id, event?.is_attending]);

  // Fetch photo comments
  const fetchPhotoComments = useCallback(async (photoId: string) => {
    try {
      const { data, error } = await api.getPhotoComments(photoId);
      if (!error && data) {
        setPhotoComments(prev => ({ ...prev, [photoId]: data }));
        // Fetch reactions for each comment
        for (const comment of data) {
          const { data: reactions } = await api.getCommentReactions(comment.id);
          if (reactions) {
            setCommentReactions(prev => ({ ...prev, [comment.id]: reactions }));
          }
        }
      }
    } catch (err) {
      console.error('Error fetching photo comments:', err);
    }
  }, []);

  // Fetch photo reactions
  const fetchPhotoReactions = useCallback(async (photoId: string) => {
    try {
      const { data, error } = await api.getPhotoReactions(photoId);
      if (!error && data) {
        setPhotoReactions(prev => ({ ...prev, [photoId]: data }));
      }
    } catch (err) {
      console.error('Error fetching photo reactions:', err);
    }
  }, []);

  // Fetch collections
  const fetchCollections = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await api.getCollections(user.id);
      if (!error && data) {
        setCollections(data);
      }
    } catch (err) {
      console.error('Error fetching collections:', err);
    }
  }, [user?.id]);

  // Fetch comments
  const fetchComments = useCallback(async () => {
    if (!id || !event?.is_attending) return;
    setLoadingComments(true);
    try {
      const { data, error } = await api.getEventComments(id);
      if (!error && data) {
        setComments(data);
      }
    } catch (err) {
      console.error('Error fetching comments:', err);
    } finally {
      setLoadingComments(false);
    }
  }, [id, event?.is_attending]);

  // Fetch reactions
  const fetchReactions = useCallback(async () => {
    if (!id || !event?.is_attending) return;
    try {
      const { data, error } = await api.getEventReactions(id);
      if (!error && data) {
        setReactions(data);
      }
    } catch (err) {
      console.error('Error fetching reactions:', err);
    }
  }, [id, event?.is_attending]);

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    if (!id || !event?.is_attending) return;
    setLoadingMessages(true);
    try {
      const { data, error } = await api.getEventMessages(id);
      if (!error && data) {
        setMessages(data);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  }, [id, event?.is_attending]);

  // Fetch attendees when event is loaded
  useEffect(() => {
    if (event?.id) {
      fetchAttendees();
      if (event.organizer_id) {
        fetchOrganizer(event.organizer_id);
      }
      if (event.is_attending) {
        fetchPhotos();
        fetchComments();
        fetchReactions();
        fetchMessages();
      }
      // Always fetch user's join request status (for both private and public events)
      fetchUserJoinRequest();
      // Fetch join requests if organizer (check directly instead of using isOrganizer variable)
      if (event.organizer_id && event.organizer_id === user?.id) {
        console.log('User is organizer, fetching join requests...', 'Organizer ID:', event.organizer_id, 'User ID:', user?.id);
        fetchJoinRequests();
      }
    }
  }, [event?.id, event?.organizer_id, event?.is_attending, event?.is_private, user?.id, fetchAttendees, fetchOrganizer, fetchPhotos, fetchComments, fetchReactions, fetchMessages, fetchUserJoinRequest, fetchJoinRequests]);

  // Fetch collections when user is available
  useEffect(() => {
    if (user?.id) {
      fetchCollections();
    }
  }, [user?.id, fetchCollections]);

  // Refetch join request when user changes
  useEffect(() => {
    if (user?.id && event?.id) {
      fetchUserJoinRequest();
    }
  }, [user?.id, event?.id, fetchUserJoinRequest]);

  // Real-time subscription for join requests (for organizers)
  useEffect(() => {
    if (!id || !event?.organizer_id || event.organizer_id !== user?.id) return;

    console.log('Setting up real-time subscription for join requests...', 'Event ID:', id, 'Organizer ID:', event.organizer_id, 'User ID:', user?.id);
    const channel = supabase
      .channel(`event-join-requests-${id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'event_join_requests',
          filter: `event_id=eq.${id}`,
        },
        (payload) => {
          console.log('Join request change detected:', payload);
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE' || payload.eventType === 'DELETE') {
            fetchJoinRequests();
            // Also refresh user's own request status if they have one
            if (user?.id) {
              fetchUserJoinRequest();
            }
          }
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up real-time subscription...');
      supabase.removeChannel(channel);
    };
  }, [id, event?.organizer_id, user?.id, fetchJoinRequests, fetchUserJoinRequest]);

  // Real-time subscription for user's own request status
  useEffect(() => {
    if (!id || !user?.id) return;

    console.log('Setting up real-time subscription for user join request...');
    const channel = supabase
      .channel(`user-join-request-${id}-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'event_join_requests',
          filter: `event_id=eq.${id} AND user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('User join request change detected:', payload);
          if (payload.eventType === 'UPDATE' || payload.eventType === 'DELETE') {
            fetchUserJoinRequest();
            // If request was accepted, refresh event to update is_attending status
            if (payload.eventType === 'UPDATE' && payload.new?.status === 'accepted') {
              fetchEvent();
              fetchAttendees();
            }
          }
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up user join request subscription...');
      supabase.removeChannel(channel);
    };
  }, [id, user?.id, fetchUserJoinRequest, fetchEvent, fetchAttendees]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchEvent();
    if (event?.id) {
      await fetchAttendees();
    }
  }, [fetchEvent, fetchAttendees, event?.id]);

  // Handle RSVP
  const handleRSVP = async () => {
    if (!event || !user?.id || rsvpLoading) return;

    setRsvpLoading(true);

    try {
      if (event.is_attending) {
        // Cancel RSVP
        const { error } = await api.leaveEvent(event.id, user.id);
        if (error) {
          Alert.alert('Error', 'Failed to cancel RSVP');
        } else {
          setEvent((prev) =>
            prev ? { ...prev, is_attending: false, attendee_count: prev.attendee_count - 1 } : null
          );
          // Refresh attendees list
          fetchAttendees();
        }
      } else if (userJoinRequest?.status === 'pending') {
        // Cancel join request
        const { error } = await api.cancelJoinRequest(event.id, user.id);
        if (error) {
          Alert.alert('Error', error.message || 'Failed to cancel request');
        } else {
          setUserJoinRequest(null);
          Alert.alert('Request Cancelled', 'Your join request has been cancelled.');
        }
      } else {
        // Check if it's a private event
        if (event.is_private) {
          // Send join request for private events
          const { error, data } = await api.requestToJoinEvent(event.id, user.id);
          if (error) {
            console.error('Request error:', error);
            Alert.alert('Error', error.message || 'Failed to send join request');
          } else {
            // Immediately update the button state with the returned data
            if (data) {
              console.log('Setting join request:', data);
              // Ensure status is explicitly set to 'pending' and all required fields are present
              const requestData = {
                ...data,
                status: data.status || 'pending',
                event_id: data.event_id || event.id,
                user_id: data.user_id || user.id,
              };
              console.log('Setting userJoinRequest state with:', requestData);
              setUserJoinRequest(requestData);
              // Force a re-render by logging the state
              console.log('Button should now show "Requested". Current userJoinRequest state:', requestData);
            } else {
              // Fallback: fetch the request
              console.log('No data returned, fetching...');
              await fetchUserJoinRequest();
            }
            // Show success feedback without blocking UI
            // The button state change provides visual feedback
          }
        } else {
          // RSVP to public event
          if (event.max_attendees && event.attendee_count >= event.max_attendees) {
            Alert.alert('Event Full', 'This event has reached its maximum capacity.');
            return;
          }

          const { error } = await api.joinEvent(event.id, user.id);
          if (error) {
            Alert.alert('Error', 'Failed to RSVP to event');
          } else {
            setEvent((prev) =>
              prev ? { ...prev, is_attending: true, attendee_count: prev.attendee_count + 1 } : null
            );
            // Refresh attendees list
            fetchAttendees();
          }
        }
      }
    } catch (err) {
      console.error('RSVP error:', err);
      Alert.alert('Error', 'Something went wrong');
    } finally {
      setRsvpLoading(false);
    }
  };

  // Handle respond to join request (accept/reject)
  const handleRespondToRequest = async (requestId: string, accept: boolean, userId: string) => {
    if (!event?.id || !user?.id) return;

    try {
      const { error } = await api.respondToJoinRequest(requestId, accept, event.id, userId);
      if (error) {
        Alert.alert('Error', error.message || 'Failed to respond to request');
        return;
      }

      if (accept) {
        Alert.alert('Success', 'User has been added to the event');
      } else {
        Alert.alert('Success', 'Request has been rejected');
      }

      await fetchJoinRequests();
      await fetchAttendees();
      await fetchEvent(); // Refresh event to update attendee count
    } catch (err: any) {
      console.error('Error responding to request:', err);
      Alert.alert('Error', 'Failed to respond to request');
    }
  };

  // Handle message user
  const handleMessageUser = async (userId: string, userName: string) => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to message users');
      return;
    }

    if (userId === user.id) {
      Alert.alert('Cannot Message', 'You cannot message yourself');
      return;
    }

    // Navigate to messages with this user
    router.push(`/(tabs)/messages?userId=${userId}`);
  };

  // Handle pick photo
  const handlePickPhoto = async () => {
    if (!user?.id || !event?.is_attending) {
      Alert.alert('Error', 'You must be attending the event to add photos');
      return;
    }

    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera roll permissions');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedPhotoUri(result.assets[0].uri);
        setPhotoDescription('');
      }
    } catch (err) {
      console.error('Error picking photo:', err);
      Alert.alert('Error', 'Failed to pick photo');
    }
  };

  // Handle add photo
  const handleAddPhoto = async () => {
    if (!selectedPhotoUri || !user?.id || !event?.id) return;

    try {
      const fileExt = selectedPhotoUri.split('.').pop() || 'jpg';
      const { url, error: uploadError } = await api.uploadEventImage(event.id, selectedPhotoUri, fileExt);

      if (uploadError || !url) {
        console.error('Upload error:', uploadError);
        if (uploadError?.code === 'BUCKET_NOT_FOUND') {
          Alert.alert(
            'Storage Not Configured',
            'The storage bucket for event photos is not set up. Please create an "events" bucket in your Supabase Storage. See QUICK_STORAGE_SETUP.md for instructions.'
          );
        } else {
          Alert.alert('Upload Error', uploadError?.message || 'Failed to upload photo. Please try again.');
        }
        return;
      }

      const { error } = await api.addEventPhoto(event.id, user.id, url, photoDescription);
      if (error) {
        console.error('Add photo error:', error);
        // Check if error is due to missing table
        if (error.message?.includes('event_photos') || error.message?.includes('relation') || error.message?.includes('does not exist') || error.message?.includes('schema cache')) {
          Alert.alert(
            'Database Table Missing',
            'The event_photos table is missing. Please run this SQL in your Supabase SQL Editor:\n\n' +
            'See ADD_EVENT_PHOTOS_TABLE.sql file for the complete script.\n\n' +
            'Or run EVENT_FEATURES_MIGRATION.sql for all event features.',
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert('Error', error.message || 'Failed to add photo. Please try again.');
        }
        return;
      }

      setSelectedPhotoUri(null);
      setPhotoDescription('');
      await fetchPhotos();
      Alert.alert('Success', 'Photo added successfully');
    } catch (err: any) {
      console.error('Error adding photo:', err);
      Alert.alert('Error', err?.message || 'Failed to add photo. Please try again.');
    }
  };

  // Handle add comment (for event or photo)
  const handleAddComment = async (photoId?: string) => {
    const text = commentText.trim();
    if (!text || !user?.id || !event?.id || !event.is_attending) return;

    try {
      if (photoId) {
        // Add comment to photo
        const { error } = await api.addPhotoComment(photoId, user.id, text);
        if (error) {
          Alert.alert('Error', 'Failed to add comment');
          return;
        }
        await fetchPhotoComments(photoId);
      } else {
        // Add comment to event
        const { error } = await api.addEventComment(event.id, user.id, text);
        if (error) {
          Alert.alert('Error', 'Failed to add comment');
          return;
        }
        await fetchComments();
      }
      setCommentText('');
    } catch (err) {
      console.error('Error adding comment:', err);
      Alert.alert('Error', 'Failed to add comment');
    }
  };

  // Handle toggle photo reaction
  const handleTogglePhotoReaction = async (photoId: string, reactionType: string = 'like') => {
    if (!user?.id || !event?.is_attending) return;
    try {
      await api.togglePhotoReaction(photoId, user.id, reactionType);
      await fetchPhotoReactions(photoId);
    } catch (err) {
      console.error('Error toggling photo reaction:', err);
    }
  };

  // Handle toggle comment reaction
  const handleToggleCommentReaction = async (commentId: string) => {
    if (!user?.id || !event?.is_attending) return;
    try {
      await api.toggleCommentReaction(commentId, user.id);
      // Refresh comment reactions
      const { data: reactions } = await api.getCommentReactions(commentId);
      if (reactions) {
        setCommentReactions(prev => ({ ...prev, [commentId]: reactions }));
      }
    } catch (err) {
      console.error('Error toggling comment reaction:', err);
    }
  };

  // Handle save to collection
  const handleSaveToCollection = async (collectionId: string, photoId: string) => {
    try {
      const { error } = await api.addPhotoToCollection(collectionId, photoId);
      if (error) {
        Alert.alert('Error', 'Failed to save to collection');
        return;
      }
      setShowCollectionModal(false);
      Alert.alert('Success', 'Photo saved to collection');
    } catch (err) {
      console.error('Error saving to collection:', err);
      Alert.alert('Error', 'Failed to save to collection');
    }
  };

  // Handle create collection
  const handleCreateCollection = async () => {
    if (!newCollectionName.trim() || !user?.id) return;
    try {
      const { data, error } = await api.createCollection(user.id, newCollectionName.trim());
      if (error) {
        Alert.alert('Error', 'Failed to create collection');
        return;
      }
      setNewCollectionName('');
      setShowCreateCollectionModal(false);
      await fetchCollections();
      if (data && selectedPhoto) {
        await handleSaveToCollection(data.id, selectedPhoto.id);
      }
    } catch (err) {
      console.error('Error creating collection:', err);
      Alert.alert('Error', 'Failed to create collection');
    }
  };

  // Handle toggle reaction
  const handleToggleReaction = async (reactionType: string = 'like') => {
    if (!user?.id || !event?.id || !event.is_attending) return;

    try {
      await api.toggleEventReaction(event.id, user.id, reactionType);
      await fetchReactions();
    } catch (err) {
      console.error('Error toggling reaction:', err);
    }
  };

  // Handle send message
  const handleSendMessage = async () => {
    if (!messageText.trim() || !user?.id || !event?.id || !event.is_attending) return;

    try {
      const { error } = await api.sendEventMessage(event.id, user.id, messageText.trim());
      if (error) {
        Alert.alert('Error', 'Failed to send message');
        return;
      }

      setMessageText('');
      await fetchMessages();
    } catch (err) {
      console.error('Error sending message:', err);
      Alert.alert('Error', 'Failed to send message');
    }
  };

  // Format date/time helper
  const formatDateTime = (date: string, time?: string) => {
    try {
      const dateObj = new Date(date);
      const formattedDate = dateObj.toLocaleDateString('en-US', {
        month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
      if (time) {
        return `${formattedDate} at ${time}`;
      }
      return formattedDate;
    } catch {
      return date;
    }
  };

  // Get initials helper
  const getInitials = (name: string) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  };

  if (loading) {
    return (
      <BackgroundImage overlayOpacity={isDark ? 0.7 : 0.4}>
        <SafeAreaView className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#1a73e8" />
          <Text className={`mt-4 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Loading event...</Text>
      </SafeAreaView>
      </BackgroundImage>
    );
  }

  if (error || !event) {
    return (
      <BackgroundImage overlayOpacity={isDark ? 0.7 : 0.4}>
        <SafeAreaView className="flex-1 items-center justify-center px-6">
          <Calendar size={48} color={isDark ? '#9ca3af' : '#64748b'} />
          <Text className={`mt-4 text-center ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
          {error || 'Event not found'}
        </Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4 bg-blue-500 px-6 py-2 rounded-lg">
          <Text className="text-white font-medium">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
      </BackgroundImage>
    );
  }

  const categoryStyle = categoryColors[event.category] || { bg: '#f1f5f9', text: '#64748b' };
  const organizerName = organizer?.name || event.organizer || 'Event Organizer';
  const isOrganizer = event?.organizer_id === user?.id;
  
  // Debug logging
  if (event?.id) {
    console.log('Event details:', {
      eventId: event.id,
      organizerId: event.organizer_id,
      userId: user?.id,
      isOrganizer: isOrganizer,
      userJoinRequest: userJoinRequest,
      joinRequestsCount: joinRequests.length,
    });
  }

  // Handle edit event
  const handleEditEvent = async () => {
    if (!event?.id || !user?.id) return;
    
    setEditingEvent(true);
    try {
      const { error } = await api.updateEvent(event.id, {
        title: editForm.title.trim(),
        description: editForm.description.trim(),
        date: editForm.date,
        time: editForm.time,
        location: editForm.location.trim(),
        category: editForm.category,
        max_attendees: editForm.max_attendees ? parseInt(editForm.max_attendees) : null,
      });

      if (error) {
        Alert.alert('Error', error.message || 'Failed to update event');
        return;
      }

      setShowEditModal(false);
      await fetchEvent();
      Alert.alert('Success', 'Event updated successfully');
    } catch (err: any) {
      console.error('Error updating event:', err);
      Alert.alert('Error', 'Failed to update event');
    } finally {
      setEditingEvent(false);
    }
  };

  // Handle delete event
  const handleDeleteEvent = async () => {
    if (!event?.id || !user?.id) return;
    
    setDeletingEvent(true);
    try {
      const { error } = await api.deleteEvent(event.id);

      if (error) {
        console.error('Delete event error:', error);
        Alert.alert('Error', error.message || 'Failed to delete event');
        setDeletingEvent(false);
        setShowDeleteConfirm(false);
        return;
      }

      // Navigate back immediately
      router.back();
      
      // Show success message after a brief delay
      setTimeout(() => {
        Alert.alert('Success', 'Event deleted successfully');
      }, 500);
    } catch (err: any) {
      console.error('Error deleting event:', err);
      Alert.alert('Error', err?.message || 'Failed to delete event');
    } finally {
      setDeletingEvent(false);
      setShowDeleteConfirm(false);
    }
  };

  // Handle search users for invite
  const handleSearchUsers = async (term: string) => {
    if (!term.trim() || term.length < 2) {
      setSearchUsers([]);
      return;
    }

    setSearchingUsers(true);
    try {
      const { data, error } = await api.searchUsers(term);
      if (!error && data) {
        // Filter out users who are already attendees
        const attendeeIds = attendees.map(a => a.user_id);
        setSearchUsers(data.filter((u: any) => !attendeeIds.includes(u.id) && u.id !== user?.id));
      }
    } catch (err) {
      console.error('Error searching users:', err);
    } finally {
      setSearchingUsers(false);
    }
  };

  // Handle invite user
  const handleInviteUser = async (userId: string) => {
    if (!event?.id || !userId) return;

    try {
      const { error } = await api.joinEvent(event.id, userId);
      if (error) {
        Alert.alert('Error', error.message || 'Failed to invite user');
        return;
      }

      await fetchAttendees();
      setSearchTerm('');
      setSearchUsers([]);
      Alert.alert('Success', 'User invited successfully');
    } catch (err: any) {
      console.error('Error inviting user:', err);
      Alert.alert('Error', 'Failed to invite user');
    }
  };

  // Handle delete photo
  const handleDeletePhoto = async () => {
    if (!selectedPhoto || !user?.id) return;

    setDeletingPhoto(true);
    try {
      const { error } = await api.deleteEventPhoto(selectedPhoto.id);
      if (error) {
        Alert.alert('Error', error.message || 'Failed to delete photo');
        return;
      }

      setSelectedPhoto(null);
      setShowDeletePhotoConfirm(false);
      await fetchPhotos();
      Alert.alert('Success', 'Photo deleted successfully');
    } catch (err: any) {
      console.error('Error deleting photo:', err);
      Alert.alert('Error', 'Failed to delete photo');
    } finally {
      setDeletingPhoto(false);
    }
  };

  // Handle remove attendee
  const handleRemoveAttendee = async (userId: string, userName: string) => {
    if (!event?.id || !userId) return;

    Alert.alert(
      'Remove Attendee',
      `Are you sure you want to remove ${userName} from this event?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await api.removeAttendee(event.id, userId);
              if (error) {
                Alert.alert('Error', error.message || 'Failed to remove attendee');
                return;
              }

              await fetchAttendees();
              Alert.alert('Success', 'Attendee removed successfully');
            } catch (err: any) {
              console.error('Error removing attendee:', err);
              Alert.alert('Error', 'Failed to remove attendee');
            }
          }
        }
      ]
    );
  };

  return (
    <BackgroundImage overlayOpacity={isDark ? 0.7 : 0.4}>
      <SafeAreaView className="flex-1" edges={['bottom']}>
      <Stack.Screen
        options={{
          title: '',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} className="p-2">
              <ChevronLeft size={24} color={isDark ? '#FFFFFF' : '#374151'} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {isOrganizer && (
                <>
                  <TouchableOpacity 
                    onPress={() => setShowEditModal(true)}
                    className="p-2"
                  >
                    <Edit size={20} color={isDark ? '#FFFFFF' : '#374151'} />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => setShowDeleteConfirm(true)}
                    className="p-2"
                  >
                    <Trash2 size={20} color={isDark ? '#ef4444' : '#dc2626'} />
                  </TouchableOpacity>
                </>
              )}
              <TouchableOpacity className="p-2">
                <Share2 size={20} color={isDark ? '#FFFFFF' : '#374151'} />
              </TouchableOpacity>
            </View>
          ),
          headerStyle: { backgroundColor: isDark ? '#1f2937' : '#ffffff' },
          headerShadowVisible: false,
        }}
      />

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1a73e8" />
        }
      >
          {/* Event Details Card - Only show if details tab */}
          {activeTab === 'details' && (
        <View className={`mx-4 mt-2 mb-4 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          {/* Event Title */}
          <View className="px-5 pt-5">
            <Text className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {event.title}
            </Text>
            
            {/* Description */}
            <Text className={`mt-2 text-base ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {event.description || 'Join this event and meet fellow students!'}
            </Text>
          </View>

          {/* Meta Info Row */}
          <View className="flex-row flex-wrap items-center px-5 mt-4 gap-3">
            <View className="flex-row items-center">
              <Calendar size={16} color={isDark ? '#9ca3af' : '#6b7280'} />
              <Text className={`ml-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {formatDateTime(event.date, event.time)}
              </Text>
            </View>
            <View className="flex-row items-center">
              <MapPin size={16} color={isDark ? '#9ca3af' : '#6b7280'} />
              <Text className={`ml-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {event.location}
              </Text>
            </View>
            <View className="flex-row items-center">
              <Users size={16} color={isDark ? '#9ca3af' : '#6b7280'} />
              <Text className={`ml-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {event.attendee_count} attendees
              </Text>
            </View>
          </View>

          {/* Category Badge */}
          <View className="px-5 mt-4">
            <View
              className="px-3 py-1 rounded-full self-start"
              style={{ backgroundColor: categoryStyle.bg }}
            >
              <Text className="text-sm font-medium capitalize" style={{ color: categoryStyle.text }}>
                {event.category}
              </Text>
            </View>
          </View>

          {/* Divider */}
          <View className={`h-px mx-5 my-5 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`} />

          {/* Organized by Section */}
          <View className="px-5">
            <Text className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Organized by
            </Text>
            <View 
              className={`flex-row items-center mt-3 p-3 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}
              style={{ borderWidth: 1, borderColor: isDark ? '#374151' : '#e5e7eb' }}
            >
              <View className="w-10 h-10 rounded-full bg-[#14b8a6] items-center justify-center">
                <Text className="text-white font-semibold text-base">
                  {getInitials(organizerName)}
                </Text>
              </View>
              <View className="ml-3 flex-1">
                <Text className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {organizerName}
                </Text>
                <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Event organizer
                </Text>
              </View>
            </View>
          </View>

          {/* Attendees Section */}
          <View className="px-5 mt-5">
            <View className="flex-row items-center justify-between mb-3">
              <Text className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Attendees ({event.attendee_count})
              </Text>
              {isOrganizer && (
                <TouchableOpacity
                  onPress={() => setShowInviteModal(true)}
                  className="flex-row items-center gap-1"
                >
                  <UserPlus size={16} color="#0066cc" />
                  <Text className="text-blue-500 text-sm font-medium">Invite</Text>
                </TouchableOpacity>
              )}
            </View>
            
            <View className="mt-3">
              {loadingAttendees ? (
                <View className="flex-row items-center justify-center py-4">
                  <ActivityIndicator size="small" color="#1a73e8" />
                  <Text className={`ml-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Loading attendees...
                  </Text>
                </View>
              ) : attendees.length > 0 ? (
                attendees.map((attendee) => (
                  <View 
                    key={attendee.id}
                    className={`flex-row items-center justify-between py-3 ${isDark ? 'border-gray-700' : 'border-gray-100'}`}
                    style={{ borderBottomWidth: 1, borderBottomColor: isDark ? '#374151' : '#f3f4f6' }}
                  >
                    {/* Avatar */}
                    <View className="w-10 h-10 rounded-full bg-[#14b8a6] items-center justify-center">
                      <Text className="text-white font-semibold text-base">
                        {getInitials(attendee.name)}
                      </Text>
                    </View>
                    
                    {/* Info */}
                    <View className="ml-3 flex-1">
                      <Text className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {attendee.name}
                      </Text>
                      <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {attendee.major || 'Student'}
                      </Text>
                    </View>
                    
                    {/* Status Badge */}
                    <View className="px-3 py-1 rounded-full border mr-2"
                      style={{ borderColor: isDark ? '#4b5563' : '#e5e7eb' }}
                    >
                      <Text className={`text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        going
                      </Text>
                    </View>
                    
                    {/* Action Buttons */}
                    <View className="flex-row items-center gap-2">
                      {/* Message Button (only for other users) */}
                      {user && attendee.id !== user.id && (
                        <TouchableOpacity
                          onPress={() => handleMessageUser(attendee.id, attendee.name)}
                          className={`w-9 h-9 rounded-full items-center justify-center ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}
                        >
                          <MessageCircle size={18} color={isDark ? '#9ca3af' : '#6b7280'} />
                        </TouchableOpacity>
                      )}
                      {/* Remove Button (only for organizers) */}
                      {isOrganizer && attendee.user_id !== user?.id && (
                        <TouchableOpacity
                          onPress={() => handleRemoveAttendee(attendee.user_id, attendee.name)}
                          className={`w-9 h-9 rounded-full items-center justify-center ${isDark ? 'bg-red-900/30' : 'bg-red-50'}`}
                        >
                          <X size={18} color="#ef4444" />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                ))
              ) : (
                <View className="flex-row items-center justify-center py-6">
                  <Users size={24} color={isDark ? '#6b7280' : '#9ca3af'} />
                  <Text className={`ml-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    No attendees yet. Be the first to join!
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Join Button - Hide for organizers (they're automatically attending) */}
          {!isOrganizer && (
            <View className="px-5 py-5">
              <TouchableOpacity
                onPress={handleRSVP}
                disabled={rsvpLoading}
                className={`py-4 rounded-xl items-center flex-row justify-center ${
                  event.is_attending 
                    ? 'bg-gray-200' 
                    : userJoinRequest?.status === 'pending'
                    ? 'bg-yellow-500'
                    : 'bg-[#14b8a6]'
                }`}
                activeOpacity={0.8}
              >
                {rsvpLoading ? (
                  <ActivityIndicator size="small" color={event.is_attending ? '#374151' : '#ffffff'} />
                ) : (
                  <>
                    {event.is_attending && <Check size={20} color="#374151" style={{ marginRight: 8 }} />}
                    <Text
                      className={`font-semibold text-base ${
                        event.is_attending 
                          ? 'text-gray-700' 
                          : userJoinRequest?.status === 'pending'
                          ? 'text-white'
                          : 'text-white'
                      }`}
                    >
                      {(() => {
                        // Debug: Log button state
                        const buttonState = event.is_attending 
                          ? 'Leave Event' 
                          : userJoinRequest?.status === 'pending'
                          ? 'Requested'
                          : 'Join Event';
                        if (userJoinRequest) {
                          console.log('Button render - userJoinRequest:', userJoinRequest, 'Button text:', buttonState);
                        }
                        return buttonState;
                      })()}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
          )}

          {/* Tab Navigation */}
          {(
            <View className={`mx-4 mb-4 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              <View className="flex-row border-b" style={{ borderBottomColor: isDark ? '#374151' : '#e5e7eb' }}>
                {[
                  { id: 'details', label: 'Details', icon: Calendar },
                  { id: 'photos', label: 'Photos', icon: ImageIcon },
                  { id: 'comments', label: 'Comments', icon: MessageSquare },
                  { id: 'chat', label: 'Chat', icon: MessageCircle },
                  ...(event?.organizer_id === user?.id ? [{ id: 'requests', label: 'Requests', icon: Users, badge: joinRequests.length }] : []),
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  const hasBadge = 'badge' in tab && typeof tab.badge === 'number' && tab.badge > 0;
                  return (
                    <TouchableOpacity
                      key={tab.id}
                      onPress={() => setActiveTab(tab.id as any)}
                      className="flex-1 py-3 items-center"
                      style={{
                        borderBottomWidth: isActive ? 2 : 0,
                        borderBottomColor: '#0066cc',
                      }}
                    >
                      <View style={{ position: 'relative' }}>
                        <Icon size={18} color={isActive ? '#0066cc' : (isDark ? '#9ca3af' : '#6b7280')} />
                        {hasBadge && (
                          <View style={{
                            position: 'absolute',
                            top: -6,
                            right: -8,
                            backgroundColor: '#ef4444',
                            borderRadius: 10,
                            minWidth: 20,
                            height: 20,
                            alignItems: 'center',
                            justifyContent: 'center',
                            paddingHorizontal: 4,
                          }}>
                            <Text style={{ color: '#ffffff', fontSize: 10, fontWeight: 'bold' }}>
                              {String(tab.badge)}
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text
                        className={`text-xs mt-1 ${isActive ? 'text-blue-600 font-semibold' : isDark ? 'text-gray-400' : 'text-gray-500'}`}
                      >
                        {tab.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Tab Content */}
              <View className="p-4">
                {/* Photos Tab */}
                {activeTab === 'photos' && (
                  <View>
                    {/* Add Photo Button - Only show if attending */}
                    {event.is_attending && (
                      <TouchableOpacity
                        onPress={handlePickPhoto}
                        className={`flex-row items-center justify-center py-3 rounded-xl mb-4 ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}
                      >
                        <Camera size={20} color={isDark ? '#9ca3af' : '#6b7280'} />
                        <Text className={`ml-2 font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          Add Photo
                        </Text>
                      </TouchableOpacity>
                    )}

                    {/* Photo Upload Modal */}
                    {selectedPhotoUri && (
                      <View className={`p-4 rounded-xl mb-4 ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                        <Image source={{ uri: selectedPhotoUri }} style={{ width: '100%', height: 200, borderRadius: 12 }} resizeMode="cover" />
                        <TextInput
                          className={`mt-3 px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-200 text-gray-900'}`}
                          placeholder="Add a description (optional)"
                          placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                          value={photoDescription}
                          onChangeText={setPhotoDescription}
                          multiline
                        />
                        <View className="flex-row gap-2 mt-3">
                          <TouchableOpacity
                            onPress={handleAddPhoto}
                            className="flex-1 py-2 bg-blue-500 rounded-lg items-center"
                          >
                            <Text className="text-white font-medium">Upload</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => setSelectedPhotoUri(null)}
                            className="flex-1 py-2 bg-gray-300 rounded-lg items-center"
                          >
                            <Text className="text-gray-700 font-medium">Cancel</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}

                    {/* Photos Grid - Instagram-style feed */}
                    {loadingPhotos ? (
                      <View className="py-8 items-center">
                        <ActivityIndicator size="small" color="#0066cc" />
                      </View>
                    ) : photos.length > 0 ? (
                      <View className="flex-row flex-wrap" style={{ gap: 2 }}>
                        {photos.map((photo) => {
                          const photoReactionsList = photoReactions[photo.id] || [];
                          const likeCount = photoReactionsList.filter(r => r.reaction_type === 'like').length;
                          const isLiked = photoReactionsList.some(r => r.user_id === user?.id && r.reaction_type === 'like');
                          return (
                            <TouchableOpacity
                              key={photo.id}
                              onPress={() => {
                                setSelectedPhoto(photo);
                                fetchPhotoComments(photo.id);
                                fetchPhotoReactions(photo.id);
                              }}
                              className="w-[32.5%]"
                              style={{ aspectRatio: 1, marginBottom: 2 }}
                            >
                              <Image 
                                source={{ uri: photo.photo_url }} 
                                style={{ width: '100%', height: '100%', borderRadius: 4 }} 
                                resizeMode="cover" 
                              />
                              {likeCount > 0 && (
                                <View style={{ 
                                  position: 'absolute', 
                                  bottom: 4, 
                                  left: 4, 
                                  flexDirection: 'row', 
                                  alignItems: 'center',
                                  backgroundColor: 'rgba(0,0,0,0.5)',
                                  paddingHorizontal: 6,
                                  paddingVertical: 2,
                                  borderRadius: 12,
                                }}>
                                  <Heart size={12} color="#ffffff" fill={isLiked ? "#ffffff" : "none"} />
                                  <Text style={{ color: '#ffffff', fontSize: 10, marginLeft: 4 }}>{likeCount}</Text>
                                </View>
                              )}
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    ) : (
                      <View className="py-8 items-center">
                        <ImageIcon size={48} color={isDark ? '#6b7280' : '#9ca3af'} />
                        <Text className={`mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          No photos yet. Be the first to add one!
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                {/* Comments Tab */}
                {activeTab === 'comments' && (
                  <View>
                    {/* Reactions Bar */}
                    <View className="flex-row items-center justify-center gap-4 py-4 border-b mb-4" style={{ borderBottomColor: isDark ? '#374151' : '#e5e7eb' }}>
                      {['like', 'love', 'laugh'].map((reaction) => {
                        const count = reactions.filter(r => r.reaction_type === reaction).length;
                        const userReaction = reactions.find(r => r.user_id === user?.id && r.reaction_type === reaction);
                        return (
                          <TouchableOpacity
                            key={reaction}
                            onPress={() => handleToggleReaction(reaction)}
                            className="flex-row items-center gap-2"
                          >
                            <Text style={{ fontSize: 24 }}>
                              {reaction === 'like' ? '👍' : reaction === 'love' ? '❤️' : '😂'}
                            </Text>
                            <Text className={`font-medium ${userReaction ? 'text-blue-600' : isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              {count}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    {/* Comments List */}
                    {loadingComments ? (
                      <View className="py-8 items-center">
                        <ActivityIndicator size="small" color="#0066cc" />
                      </View>
                    ) : comments.length > 0 ? (
                      <View className="gap-4">
                        {comments.map((comment) => (
                          <View key={comment.id} className="flex-row gap-3">
                            <View className="w-8 h-8 rounded-full bg-blue-500 items-center justify-center">
                              <Text className="text-white text-xs font-semibold">
                                {getInitials(comment.user?.name || 'U')}
                              </Text>
                            </View>
                            <View className="flex-1">
                              <Text className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {comment.user?.name || 'Unknown'}
                              </Text>
                              <Text className={`mt-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                {comment.content}
                              </Text>
                              <Text className={`mt-1 text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                {new Date(comment.created_at).toLocaleDateString()}
                              </Text>
                            </View>
                          </View>
                        ))}
                      </View>
                    ) : (
                      <View className="py-8 items-center">
                        <MessageSquare size={48} color={isDark ? '#6b7280' : '#9ca3af'} />
                        <Text className={`mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          No comments yet. Start the conversation!
                        </Text>
                      </View>
                    )}

                    {/* Add Comment Input */}
                    <View className={`mt-4 flex-row gap-2 p-3 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      <TextInput
                        className={`flex-1 ${isDark ? 'text-white' : 'text-gray-900'}`}
                        placeholder="Add a comment..."
                        placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                        value={commentText}
                        onChangeText={setCommentText}
                        multiline
                      />
                      <TouchableOpacity
                        onPress={handleAddComment}
                        disabled={!commentText.trim()}
                        className={`w-10 h-10 rounded-full items-center justify-center ${commentText.trim() ? 'bg-blue-500' : 'bg-gray-400'}`}
                      >
                        <Send size={18} color="#ffffff" />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* Requests Tab (Organizers only) */}
                {activeTab === 'requests' && isOrganizer && (
                  <View>
                    <Text className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Join Requests ({joinRequests.length})
                    </Text>
                    
                    {loadingJoinRequests ? (
                      <View className="py-8 items-center">
                        <ActivityIndicator size="small" color="#0066cc" />
                      </View>
                    ) : joinRequests.length > 0 ? (
                      <View className="gap-3">
                        {joinRequests.map((request: any) => (
                          <View 
                            key={request.id}
                            className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}
                          >
                            <View className="flex-row items-center justify-between">
                              <View className="flex-row items-center flex-1">
                                <View className="w-12 h-12 rounded-full bg-blue-500 items-center justify-center">
                                  <Text className="text-white font-semibold text-base">
                                    {getInitials(request.user?.name || 'U')}
                                  </Text>
                                </View>
                                <View className="ml-3 flex-1">
                                  <Text className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    {request.user?.name || 'Unknown User'}
                                  </Text>
                                  {request.user?.major && (
                                    <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                      {request.user.major}
                                    </Text>
                                  )}
                                  <Text className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                    {new Date(request.created_at).toLocaleDateString()}
                                  </Text>
                                </View>
                              </View>
                              <View className="flex-row gap-2">
                                <TouchableOpacity
                                  onPress={() => handleRespondToRequest(request.id, true, request.user_id)}
                                  className="px-4 py-2 bg-green-500 rounded-lg"
                                >
                                  <Text className="text-white font-semibold text-sm">Accept</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                  onPress={() => handleRespondToRequest(request.id, false, request.user_id)}
                                  className="px-4 py-2 bg-red-500 rounded-lg"
                                >
                                  <Text className="text-white font-semibold text-sm">Reject</Text>
                                </TouchableOpacity>
                              </View>
                            </View>
                          </View>
                        ))}
                      </View>
                    ) : (
                      <View className="py-8 items-center">
                        <Users size={48} color={isDark ? '#6b7280' : '#9ca3af'} />
                        <Text className={`mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          No pending requests
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                {/* Chat Tab */}
                {activeTab === 'chat' && (
                  <View style={{ height: 400 }}>
                    {/* Messages List */}
                    {loadingMessages ? (
                      <View className="py-8 items-center">
                        <ActivityIndicator size="small" color="#0066cc" />
                      </View>
                    ) : messages.length > 0 ? (
                      <ScrollView className="flex-1 mb-4">
                        {messages.map((message) => {
                          const isOwnMessage = message.user_id === user?.id;
                          return (
                            <View
                              key={message.id}
                              className={`mb-3 ${isOwnMessage ? 'items-end' : 'items-start'}`}
                            >
                              <View
                                className={`max-w-[80%] p-3 rounded-2xl ${
                                  isOwnMessage
                                    ? 'bg-blue-500'
                                    : isDark
                                    ? 'bg-gray-700'
                                    : 'bg-gray-200'
                                }`}
                              >
                                <Text className={`text-xs mb-1 ${isOwnMessage ? 'text-blue-100' : isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                  {message.user?.name || 'Unknown'}
                                </Text>
                                <Text className={isOwnMessage ? 'text-white' : isDark ? 'text-white' : 'text-gray-900'}>
                                  {message.message}
                                </Text>
                                <Text className={`text-xs mt-1 ${isOwnMessage ? 'text-blue-100' : isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                  {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </Text>
                              </View>
                            </View>
                          );
                        })}
      </ScrollView>
                    ) : (
                      <View className="py-8 items-center">
                        <MessageCircle size={48} color={isDark ? '#6b7280' : '#9ca3af'} />
                        <Text className={`mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          No messages yet. Start the conversation!
                        </Text>
                      </View>
                    )}

                    {/* Message Input */}
                    <View className={`flex-row gap-2 p-3 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      <TextInput
                        className={`flex-1 ${isDark ? 'text-white' : 'text-gray-900'}`}
                        placeholder="Type a message..."
                        placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                        value={messageText}
                        onChangeText={setMessageText}
                        multiline
                      />
                      <TouchableOpacity
                        onPress={handleSendMessage}
                        disabled={!messageText.trim()}
                        className={`w-10 h-10 rounded-full items-center justify-center ${messageText.trim() ? 'bg-blue-500' : 'bg-gray-400'}`}
                      >
                        <Send size={18} color="#ffffff" />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Full-Screen Photo View Modal */}
      <Modal
        visible={!!selectedPhoto}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setSelectedPhoto(null)}
        statusBarTranslucent={true}
      >
        <StatusBar hidden={true} />
        <View style={{ flex: 1, backgroundColor: isDark ? '#000000' : '#ffffff' }}>
          <SafeAreaView style={{ flex: 1 }}>
            {/* Simple Header with Back Button and Delete (if owner) */}
            <View style={{ 
              flexDirection: 'row', 
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 16,
              paddingTop: 12,
              paddingBottom: 8,
            }}>
              <TouchableOpacity 
                onPress={() => setSelectedPhoto(null)}
                style={{ padding: 8, marginLeft: -8 }}
              >
                <ChevronLeft size={28} color={isDark ? '#ffffff' : '#000000'} />
              </TouchableOpacity>
              {selectedPhoto && selectedPhoto.user_id === user?.id && (
                <TouchableOpacity 
                  onPress={() => setShowDeletePhotoConfirm(true)}
                  style={{ padding: 8, marginRight: -8 }}
                >
                  <Trash2 size={24} color="#ef4444" />
                </TouchableOpacity>
              )}
            </View>

            {/* User Info and Timestamp */}
            {selectedPhoto && (
              <View style={{ 
                paddingHorizontal: 16, 
                paddingBottom: 12,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
              }}>
                <View style={{ 
                  width: 40, 
                  height: 40, 
                  borderRadius: 20, 
                  backgroundColor: '#0066cc',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '600' }}>
                    {selectedPhoto.user ? getInitials(selectedPhoto.user.name || 'U') : 'U'}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ 
                    fontSize: 15, 
                    fontWeight: '600',
                    color: isDark ? '#ffffff' : '#000000',
                  }}>
                    {selectedPhoto.user?.name || 'Unknown User'}
                  </Text>
                  <Text style={{ 
                    fontSize: 12,
                    color: isDark ? '#9ca3af' : '#6b7280',
                    marginTop: 2,
                  }}>
                    {(() => {
                      const date = new Date(selectedPhoto.created_at);
                      const now = new Date();
                      const diff = now.getTime() - date.getTime();
                      const minutes = Math.floor(diff / 60000);
                      if (minutes < 1) return 'Just now';
                      if (minutes < 60) return `${minutes} min${minutes > 1 ? 's' : ''} ago`;
                      const hours = Math.floor(minutes / 60);
                      if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
                      const days = Math.floor(hours / 24);
                      if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
                      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                    })()}
                  </Text>
                </View>
              </View>
            )}

            {/* Large Photo */}
            {selectedPhoto && (
              <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                <Image 
                  source={{ uri: selectedPhoto.photo_url }} 
                  style={{ width: Dimensions.get('window').width, aspectRatio: 1 }} 
                  resizeMode="cover" 
                />

                {/* Description */}
                {selectedPhoto.description && (
                  <View style={{ padding: 16 }}>
                    <Text style={{ 
                      fontSize: 14,
                      color: isDark ? '#e5e7eb' : '#374151',
                      lineHeight: 20,
                    }}>
                      {selectedPhoto.description}
                    </Text>
                  </View>
                )}

                {/* Like and Comment Actions */}
                <View style={{ 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  gap: 24,
                  borderTopWidth: 1,
                  borderTopColor: isDark ? '#1f2937' : '#e5e7eb',
                }}>
                  <TouchableOpacity
                    onPress={() => {
                      if (selectedPhoto) {
                        handleTogglePhotoReaction(selectedPhoto.id, 'like');
                      }
                    }}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
                  >
                    {(() => {
                      const reactions = photoReactions[selectedPhoto.id] || [];
                      const isLiked = reactions.some(r => r.user_id === user?.id && r.reaction_type === 'like');
                      const likeCount = reactions.filter(r => r.reaction_type === 'like').length;
                      return (
                        <>
                          <Heart size={24} color={isLiked ? '#ef4444' : (isDark ? '#ffffff' : '#000000')} fill={isLiked ? '#ef4444' : 'none'} />
                          {likeCount > 0 && (
                            <Text style={{ 
                              fontSize: 15,
                              fontWeight: '500',
                              color: isLiked ? '#ef4444' : (isDark ? '#ffffff' : '#000000'),
                            }}>
                              {likeCount}
                            </Text>
                          )}
                        </>
                      );
                    })()}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
                  >
                    <MessageSquare size={24} color={isDark ? '#ffffff' : '#000000'} />
                    {photoComments[selectedPhoto.id] && photoComments[selectedPhoto.id].length > 0 && (
                      <Text style={{ 
                        fontSize: 15,
                        fontWeight: '500',
                        color: isDark ? '#ffffff' : '#000000',
                      }}>
                        {photoComments[selectedPhoto.id].length}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Comments Section */}
                <View style={{ padding: 16 }}>
                  <Text style={{ 
                    fontSize: 16, 
                    fontWeight: '600', 
                    marginBottom: 12,
                    color: isDark ? '#ffffff' : '#000000',
                  }}>
                    Comments
                  </Text>

                  {/* Comments List */}
                  {photoComments[selectedPhoto.id] && photoComments[selectedPhoto.id].length > 0 ? (
                    <View style={{ gap: 16, marginBottom: 16 }}>
                      {photoComments[selectedPhoto.id].map((comment: any) => {
                        return (
                          <View key={comment.id} style={{ flexDirection: 'row', gap: 12 }}>
                            <View style={{ 
                              width: 32, 
                              height: 32, 
                              borderRadius: 16, 
                              backgroundColor: '#0066cc',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}>
                              <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '600' }}>
                                {getInitials(comment.user?.name || 'U')}
                              </Text>
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={{ 
                                fontWeight: '600', 
                                marginBottom: 4,
                                color: isDark ? '#ffffff' : '#000000',
                              }}>
                                {comment.user?.name || 'Unknown'}
                              </Text>
                              <Text style={{ 
                                marginBottom: 4,
                                color: isDark ? '#e5e7eb' : '#374151',
                                fontSize: 14,
                              }}>
                                {comment.content}
                              </Text>
                              <Text style={{ 
                                fontSize: 12,
                                color: isDark ? '#9ca3af' : '#6b7280',
                              }}>
                                {(() => {
                                  const date = new Date(comment.created_at);
                                  const now = new Date();
                                  const diff = now.getTime() - date.getTime();
                                  const minutes = Math.floor(diff / 60000);
                                  if (minutes < 1) return 'Just now';
                                  if (minutes < 60) return `${minutes} min${minutes > 1 ? 's' : ''} ago`;
                                  const hours = Math.floor(minutes / 60);
                                  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
                                  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                                })()}
                              </Text>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  ) : (
                    <Text style={{ 
                      color: isDark ? '#9ca3af' : '#6b7280',
                      marginBottom: 16,
                      fontSize: 14,
                    }}>
                      No comments yet. Be the first to comment!
                    </Text>
                  )}

                  {/* Add Comment Input */}
                  {event?.is_attending && (
                    <View style={{ 
                      flexDirection: 'row', 
                      alignItems: 'center', 
                      gap: 8,
                      paddingTop: 12,
                      borderTopWidth: 1,
                      borderTopColor: isDark ? '#1f2937' : '#e5e7eb',
                    }}>
                      <View style={{ 
                        width: 32, 
                        height: 32, 
                        borderRadius: 16, 
                        backgroundColor: '#0066cc',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '600' }}>
                          {user ? getInitials(user.email?.split('@')[0] || 'U') : 'U'}
                        </Text>
                      </View>
                      <TextInput
                        style={{ 
                          flex: 1,
                          paddingVertical: 10,
                          paddingHorizontal: 14,
                          borderRadius: 20,
                          backgroundColor: isDark ? '#1f2937' : '#f3f4f6',
                          color: isDark ? '#ffffff' : '#000000',
                          fontSize: 14,
                        }}
                        placeholder="Add a comment..."
                        placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                        value={commentText}
                        onChangeText={setCommentText}
                        onSubmitEditing={() => {
                          if (selectedPhoto && commentText.trim()) {
                            handleAddComment(selectedPhoto.id);
                          }
                        }}
                        multiline
                      />
                      <TouchableOpacity
                        onPress={() => {
                          if (selectedPhoto && commentText.trim()) {
                            handleAddComment(selectedPhoto.id);
                          }
                        }}
                        disabled={!commentText.trim()}
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 18,
                          backgroundColor: commentText.trim() ? '#0066cc' : (isDark ? '#374151' : '#d1d5db'),
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Send size={18} color="#ffffff" />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </ScrollView>
            )}
    </SafeAreaView>
        </View>
      </Modal>

      {/* Comments Screen Modal */}
      <Modal
        visible={showCommentsScreen}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowCommentsScreen(false)}
      >
        <View style={{ flex: 1, backgroundColor: isDark ? '#000000' : '#ffffff' }}>
          <SafeAreaView style={{ flex: 1 }}>
            {/* Header */}
            <View style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: isDark ? '#1f2937' : '#e5e7eb',
            }}>
              <TouchableOpacity onPress={() => setShowCommentsScreen(false)}>
                <ChevronLeft size={24} color={isDark ? '#ffffff' : '#000000'} />
              </TouchableOpacity>
              
              <Text style={{ 
                fontSize: 18, 
                fontWeight: '600',
                color: isDark ? '#ffffff' : '#000000',
              }}>
                Comments
              </Text>
              
              <TouchableOpacity>
                <Edit size={20} color={isDark ? '#ffffff' : '#000000'} />
              </TouchableOpacity>
            </View>

            {/* Comments List */}
            {selectedPhoto && photoComments[selectedPhoto.id] ? (
              <ScrollView style={{ flex: 1, padding: 16 }}>
                {photoComments[selectedPhoto.id].map((comment: any) => {
                  const commentReactionsList = commentReactions[comment.id] || [];
                  const reactionCount = commentReactionsList.length;
                  const isReacted = commentReactionsList.some((r: any) => r.user_id === user?.id);
                  return (
                    <View key={comment.id} style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
                      <View style={{ 
                        width: 40, 
                        height: 40, 
                        borderRadius: 20, 
                        backgroundColor: '#0066cc',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '600' }}>
                          {getInitials(comment.user?.name || 'U')}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ 
                          fontWeight: '600', 
                          marginBottom: 4,
                          color: isDark ? '#ffffff' : '#000000',
                        }}>
                          {comment.user?.name || 'Unknown'}
                        </Text>
                        <Text style={{ 
                          marginBottom: 8,
                          color: isDark ? '#e5e7eb' : '#374151',
                        }}>
                          {comment.content}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                          <Text style={{ 
                            fontSize: 12,
                            color: isDark ? '#9ca3af' : '#6b7280',
                          }}>
                            {(() => {
                              const date = new Date(comment.created_at);
                              const now = new Date();
                              const diff = now.getTime() - date.getTime();
                              const minutes = Math.floor(diff / 60000);
                              if (minutes < 1) return 'Just now';
                              if (minutes < 60) return `${minutes} min${minutes > 1 ? 's' : ''} ago`;
                              const hours = Math.floor(minutes / 60);
                              if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
                              return date.toLocaleDateString();
                            })()}
                          </Text>
                          <TouchableOpacity
                            onPress={() => handleToggleCommentReaction(comment.id)}
                            style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                          >
                            <Text style={{ 
                              fontSize: 14,
                              color: isReacted ? '#0066cc' : (isDark ? '#9ca3af' : '#6b7280'),
                              fontWeight: '500',
                            }}>
                              Like
                            </Text>
                            {reactionCount > 0 && (
                              <>
                                <Heart size={14} color={isReacted ? '#0066cc' : (isDark ? '#9ca3af' : '#6b7280')} fill={isReacted ? '#0066cc' : 'none'} />
                                <Text style={{ 
                                  fontSize: 14,
                                  color: isReacted ? '#0066cc' : (isDark ? '#9ca3af' : '#6b7280'),
                                  fontWeight: '500',
                                }}>
                                  {reactionCount.toString().padStart(2, '0')}
                                </Text>
                              </>
                            )}
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
            ) : (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>
                  No comments yet
                </Text>
              </View>
            )}

            {/* Input Field */}
            <KeyboardAvoidingView 
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
              <View style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                padding: 16,
                borderTopWidth: 1,
                borderTopColor: isDark ? '#1f2937' : '#e5e7eb',
                backgroundColor: isDark ? '#000000' : '#ffffff',
              }}>
                <TextInput
                  style={{ 
                    flex: 1,
                    paddingVertical: 10,
                    paddingHorizontal: 16,
                    borderRadius: 20,
                    backgroundColor: isDark ? '#1f2937' : '#f3f4f6',
                    color: isDark ? '#ffffff' : '#000000',
                    marginRight: 8,
                  }}
                  placeholder="Type something"
                  placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                  value={commentText}
                  onChangeText={setCommentText}
                />
                <TouchableOpacity
                  onPress={() => selectedPhoto && handleAddComment(selectedPhoto.id)}
                  disabled={!commentText.trim()}
                  style={{
                    paddingVertical: 10,
                    paddingHorizontal: 20,
                    borderRadius: 20,
                    backgroundColor: commentText.trim() ? '#0066cc' : '#9ca3af',
                  }}
                >
                  <Text style={{ color: '#ffffff', fontWeight: '600' }}>Post</Text>
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </SafeAreaView>
        </View>
      </Modal>

      {/* Save to Collection Modal */}
      <Modal
        visible={showCollectionModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCollectionModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ 
            backgroundColor: isDark ? '#1f2937' : '#ffffff',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: 20,
            maxHeight: '80%',
          }}>
            {/* Header */}
            <View style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              marginBottom: 20,
            }}>
              <Text style={{ 
                fontSize: 18, 
                fontWeight: '600',
                color: isDark ? '#ffffff' : '#000000',
              }}>
                Save to collection
              </Text>
              <TouchableOpacity onPress={() => setShowCollectionModal(false)}>
                <X size={24} color={isDark ? '#ffffff' : '#000000'} />
              </TouchableOpacity>
            </View>

            {/* New Collection Button */}
            <TouchableOpacity
              onPress={() => {
                setShowCollectionModal(false);
                setShowCreateCollectionModal(true);
              }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 16,
                backgroundColor: '#0066cc',
                borderRadius: 12,
                marginBottom: 20,
              }}
            >
              <Text style={{ color: '#ffffff', fontWeight: '600' }}>New Collection</Text>
              <Plus size={20} color="#ffffff" />
            </TouchableOpacity>

            {/* Collections Grid */}
            <Text style={{ 
              fontSize: 14, 
              fontWeight: '500',
              marginBottom: 12,
              color: isDark ? '#9ca3af' : '#6b7280',
            }}>
              Your Collections
            </Text>
            
            {collections.length > 0 ? (
              <View style={{ 
                flexDirection: 'row', 
                flexWrap: 'wrap', 
                gap: 12,
              }}>
                {collections.map((collection) => (
                  <TouchableOpacity
                    key={collection.id}
                    onPress={() => {
                      if (selectedPhoto) {
                        handleSaveToCollection(collection.id, selectedPhoto.id);
                      }
                    }}
                    style={{ width: '47%' }}
                  >
                    <View style={{
                      aspectRatio: 1,
                      borderRadius: 12,
                      backgroundColor: isDark ? '#374151' : '#f3f4f6',
                      overflow: 'hidden',
                      marginBottom: 8,
                    }}>
                      {collection.cover_photo_url ? (
                        <Image 
                          source={{ uri: collection.cover_photo_url }} 
                          style={{ width: '100%', height: '100%' }}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={{ 
                          flex: 1, 
                          alignItems: 'center', 
                          justifyContent: 'center',
                        }}>
                          <Bookmark size={32} color={isDark ? '#6b7280' : '#9ca3af'} />
                        </View>
                      )}
                    </View>
                    <Text style={{ 
                      fontSize: 12,
                      fontWeight: '500',
                      color: isDark ? '#ffffff' : '#000000',
                      textAlign: 'center',
                    }} numberOfLines={1}>
                      {collection.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <Bookmark size={48} color={isDark ? '#6b7280' : '#9ca3af'} />
                <Text style={{ 
                  marginTop: 12,
                  color: isDark ? '#9ca3af' : '#6b7280',
                }}>
                  No collections yet
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Create Collection Modal */}
      <Modal
        visible={showCreateCollectionModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateCollectionModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ 
            backgroundColor: isDark ? '#1f2937' : '#ffffff',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: 20,
          }}>
            {/* Header */}
            <View style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              marginBottom: 24,
            }}>
              <Text style={{ 
                fontSize: 18, 
                fontWeight: '600',
                color: isDark ? '#ffffff' : '#000000',
              }}>
                Create new collection
              </Text>
              <TouchableOpacity onPress={() => setShowCreateCollectionModal(false)}>
                <X size={24} color={isDark ? '#ffffff' : '#000000'} />
              </TouchableOpacity>
            </View>

            {/* Input Field */}
            <TextInput
              style={{
                padding: 16,
                borderRadius: 12,
                backgroundColor: isDark ? '#374151' : '#f3f4f6',
                color: isDark ? '#ffffff' : '#000000',
                fontSize: 16,
                marginBottom: 20,
              }}
              placeholder="Type name"
              placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
              value={newCollectionName}
              onChangeText={setNewCollectionName}
              autoFocus
            />

            {/* Create Button */}
            <TouchableOpacity
              onPress={handleCreateCollection}
              disabled={!newCollectionName.trim()}
              style={{
                padding: 16,
                borderRadius: 12,
                backgroundColor: newCollectionName.trim() ? '#0066cc' : '#9ca3af',
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#ffffff', fontWeight: '600', fontSize: 16 }}>
                CREATE COLLECTION
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Edit Event Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ width: '100%' }}
          >
            <View style={{ 
              backgroundColor: isDark ? '#1f2937' : '#ffffff',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 20,
              maxHeight: '90%',
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: isDark ? '#ffffff' : '#000000' }}>
                  Edit Event
                </Text>
                <TouchableOpacity onPress={() => setShowEditModal(false)}>
                  <X size={24} color={isDark ? '#94a3b8' : '#64748b'} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <TextInput
                  style={{
                    padding: 15,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: isDark ? '#334155' : '#e2e8f0',
                    backgroundColor: isDark ? '#1f2937' : '#f1f5f9',
                    color: isDark ? '#e2e8f0' : '#1e293b',
                    fontSize: 16,
                    marginBottom: 15,
                  }}
                  placeholder="Event Title"
                  placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                  value={editForm.title}
                  onChangeText={(text) => setEditForm({ ...editForm, title: text })}
                />

                <TextInput
                  style={{
                    padding: 15,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: isDark ? '#334155' : '#e2e8f0',
                    backgroundColor: isDark ? '#1f2937' : '#f1f5f9',
                    color: isDark ? '#e2e8f0' : '#1e293b',
                    fontSize: 16,
                    marginBottom: 15,
                    minHeight: 100,
                    textAlignVertical: 'top',
                  }}
                  placeholder="Description"
                  placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                  value={editForm.description}
                  onChangeText={(text) => setEditForm({ ...editForm, description: text })}
                  multiline
                />

                <TextInput
                  style={{
                    padding: 15,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: isDark ? '#334155' : '#e2e8f0',
                    backgroundColor: isDark ? '#1f2937' : '#f1f5f9',
                    color: isDark ? '#e2e8f0' : '#1e293b',
                    fontSize: 16,
                    marginBottom: 15,
                  }}
                  placeholder="Location"
                  placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                  value={editForm.location}
                  onChangeText={(text) => setEditForm({ ...editForm, location: text })}
                />

                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 15 }}>
                  <TextInput
                    style={{
                      flex: 1,
                      padding: 15,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: isDark ? '#334155' : '#e2e8f0',
                      backgroundColor: isDark ? '#1f2937' : '#f1f5f9',
                      color: isDark ? '#e2e8f0' : '#1e293b',
                      fontSize: 16,
                    }}
                    placeholder="Date (YYYY-MM-DD)"
                    placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                    value={editForm.date}
                    onChangeText={(text) => setEditForm({ ...editForm, date: text })}
                  />
                  <TextInput
                    style={{
                      flex: 1,
                      padding: 15,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: isDark ? '#334155' : '#e2e8f0',
                      backgroundColor: isDark ? '#1f2937' : '#f1f5f9',
                      color: isDark ? '#e2e8f0' : '#1e293b',
                      fontSize: 16,
                    }}
                    placeholder="Time (HH:MM)"
                    placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                    value={editForm.time}
                    onChangeText={(text) => setEditForm({ ...editForm, time: text })}
                  />
                </View>

                <TouchableOpacity
                  onPress={handleEditEvent}
                  disabled={editingEvent || !editForm.title.trim()}
                  style={{
                    padding: 15,
                    borderRadius: 12,
                    backgroundColor: (editingEvent || !editForm.title.trim()) ? (isDark ? '#374151' : '#cbd5e1') : '#0066cc',
                    alignItems: 'center',
                    marginTop: 10,
                  }}
                >
                  {editingEvent ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 16 }}>
                      Save Changes
                    </Text>
                  )}
                </TouchableOpacity>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteConfirm}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowDeleteConfirm(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ 
            backgroundColor: isDark ? '#1f2937' : '#ffffff',
            borderRadius: 20,
            padding: 24,
            width: '100%',
            maxWidth: 400,
          }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: isDark ? '#ffffff' : '#000000', marginBottom: 12 }}>
              Delete Event
            </Text>
            <Text style={{ fontSize: 16, color: isDark ? '#94a3b8' : '#64748b', marginBottom: 24 }}>
              Are you sure you want to delete "{event?.title}"? This action cannot be undone.
            </Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                onPress={() => setShowDeleteConfirm(false)}
                style={{
                  flex: 1,
                  padding: 15,
                  borderRadius: 12,
                  backgroundColor: isDark ? '#374151' : '#f1f5f9',
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: isDark ? '#ffffff' : '#1e293b', fontWeight: '600' }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleDeleteEvent}
                disabled={deletingEvent}
                style={{
                  flex: 1,
                  padding: 15,
                  borderRadius: 12,
                  backgroundColor: '#ef4444',
                  alignItems: 'center',
                }}
              >
                {deletingEvent ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={{ color: '#ffffff', fontWeight: '600' }}>
                    Delete
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Invite Users Modal */}
      <Modal
        visible={showInviteModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowInviteModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ 
            backgroundColor: isDark ? '#1f2937' : '#ffffff',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: 20,
            maxHeight: '80%',
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: isDark ? '#ffffff' : '#000000' }}>
                Invite People
              </Text>
              <TouchableOpacity onPress={() => {
                setShowInviteModal(false);
                setSearchTerm('');
                setSearchUsers([]);
              }}>
                <X size={24} color={isDark ? '#94a3b8' : '#64748b'} />
              </TouchableOpacity>
            </View>

            <View style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              padding: 12,
              borderRadius: 12,
              backgroundColor: isDark ? '#1f2937' : '#f1f5f9',
              marginBottom: 16,
            }}>
              <Search size={20} color={isDark ? '#6b7280' : '#9ca3af'} />
              <TextInput
                style={{
                  flex: 1,
                  marginLeft: 10,
                  color: isDark ? '#e2e8f0' : '#1e293b',
                  fontSize: 16,
                }}
                placeholder="Search by name or email..."
                placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                value={searchTerm}
                onChangeText={(text) => {
                  setSearchTerm(text);
                  handleSearchUsers(text);
                }}
                autoFocus
              />
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {searchingUsers ? (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <ActivityIndicator size="small" color="#0066cc" />
                </View>
              ) : searchUsers.length > 0 ? (
                <View style={{ gap: 12 }}>
                  {searchUsers.map((userResult: any) => (
                    <TouchableOpacity
                      key={userResult.id}
                      onPress={() => handleInviteUser(userResult.id)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        padding: 12,
                        borderRadius: 12,
                        backgroundColor: isDark ? '#1f2937' : '#f1f5f9',
                      }}
                    >
                      <View style={{ 
                        width: 40, 
                        height: 40, 
                        borderRadius: 20, 
                        backgroundColor: '#0066cc',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 12,
                      }}>
                        <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '600' }}>
                          {getInitials(userResult.name || 'U')}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ 
                          fontSize: 16, 
                          fontWeight: '600',
                          color: isDark ? '#ffffff' : '#000000',
                        }}>
                          {userResult.name || 'Unknown'}
                        </Text>
                        {userResult.major && (
                          <Text style={{ 
                            fontSize: 14,
                            color: isDark ? '#94a3b8' : '#64748b',
                            marginTop: 2,
                          }}>
                            {userResult.major}
                          </Text>
                        )}
                      </View>
                      <UserPlus size={20} color="#0066cc" />
                    </TouchableOpacity>
                  ))}
                </View>
              ) : searchTerm.length >= 2 ? (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <Text style={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                    No users found
                  </Text>
                </View>
              ) : (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <Text style={{ color: isDark ? '#94a3b8' : '#64748b', textAlign: 'center' }}>
                    Start typing to search for users to invite
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Delete Photo Confirmation Modal */}
      <Modal
        visible={showDeletePhotoConfirm}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowDeletePhotoConfirm(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ 
            backgroundColor: isDark ? '#1f2937' : '#ffffff',
            borderRadius: 20,
            padding: 24,
            width: '100%',
            maxWidth: 400,
          }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: isDark ? '#ffffff' : '#000000', marginBottom: 12 }}>
              Delete Photo
            </Text>
            <Text style={{ fontSize: 16, color: isDark ? '#94a3b8' : '#64748b', marginBottom: 24 }}>
              Are you sure you want to delete this photo? This action cannot be undone.
            </Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                onPress={() => setShowDeletePhotoConfirm(false)}
                style={{
                  flex: 1,
                  padding: 15,
                  borderRadius: 12,
                  backgroundColor: isDark ? '#374151' : '#f1f5f9',
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: isDark ? '#ffffff' : '#1e293b', fontWeight: '600' }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleDeletePhoto}
                disabled={deletingPhoto}
                style={{
                  flex: 1,
                  padding: 15,
                  borderRadius: 12,
                  backgroundColor: '#ef4444',
                  alignItems: 'center',
                }}
              >
                {deletingPhoto ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={{ color: '#ffffff', fontWeight: '600' }}>
                    Delete
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
    </BackgroundImage>
  );
}

