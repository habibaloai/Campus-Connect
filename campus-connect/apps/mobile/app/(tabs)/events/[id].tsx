import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Keyboard,
} from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Calendar, MapPin, Users, Clock, ChevronLeft, Share2, Check, X, MessageCircle, Image as ImageIcon, Heart, MessageSquare, Camera, Send, Smile, Plus, Bookmark, Edit, Trash2, UserPlus, Search, Megaphone } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useColorScheme } from '@/components/useColorScheme';
import { useAuth } from '@/providers';
import { api, supabase } from '@/lib/supabase';
import BackgroundImage from '@/components/BackgroundImage';
import { Avatar } from '@/components/ui/Avatar';
import { PhotoGallery } from '@/components/ui/PhotoGallery';

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
  image_url?: string;
  has_pending_request?: boolean;
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
  const params = useLocalSearchParams<{ id: string; tab?: string }>();
  const { id } = params;
  const { user, profile } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();

  const [event, setEvent] = useState<Event | null>(null);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [organizer, setOrganizer] = useState<Organizer | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingAttendees, setLoadingAttendees] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Initialize activeTab from URL params if provided, otherwise default to 'details'
  const [activeTab, setActiveTab] = useState<'details' | 'photos' | 'announcements' | 'chat' | 'requests'>(
    (params?.tab as any) || 'details'
  );
  
  // Update activeTab when params change (e.g., when navigating from notification)
  useEffect(() => {
    if (params?.tab && ['details', 'photos', 'announcements', 'chat', 'requests'].includes(params.tab)) {
      setActiveTab(params.tab as any);
    }
  }, [params?.tab]);
  const [photos, setPhotos] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [reactions, setReactions] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [announcementText, setAnnouncementText] = useState('');
  const [messageText, setMessageText] = useState('');
  const [eventConversationId, setEventConversationId] = useState<string | null>(null);
  const [loadingChat, setLoadingChat] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const messageSubscriptionRef = useRef<any>(null);
  const chatScrollViewRef = useRef<ScrollView>(null);
  const [photoDescription, setPhotoDescription] = useState('');
  const [selectedPhotoUri, setSelectedPhotoUri] = useState<string | null>(null);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(false);
  const [sendingAnnouncement, setSendingAnnouncement] = useState(false);
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
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching join request:', error);
        setUserJoinRequest(null);
      } else if (data) {
        setUserJoinRequest(data);
      } else {
        setUserJoinRequest(null);
      }
    } catch (err) {
      console.error('Error:', err);
      setUserJoinRequest(null);
    }
  }, [id, user?.id]);

  // Fetch join requests (for organizers)
  const fetchJoinRequests = useCallback(async () => {
    if (!id || !event?.organizer_id || event.organizer_id !== user?.id) {
      setJoinRequests([]);
      return;
    }

    setLoadingJoinRequests(true);
    try {
      const { data, error } = await api.getEventJoinRequests(id);
      if (error) {
        console.error('Error fetching join requests:', error);
        setJoinRequests([]);
      } else {
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

      // Ensure is_private is properly set (default to false if null/undefined)
      if (data) {
        data.is_private = data.is_private ?? false;
        // Set has_pending_request from the fetched data
        if (data.has_pending_request !== undefined) {
          setUserJoinRequest(data.has_pending_request ? { id: 'pending' } : null);
        }
      }
      
      setEvent(data);
      
      // Populate edit form when event is loaded
      if (data) {
        setEditForm({
          title: data.title || '',
          description: data.description || '',
          date: data.date || '',
          time: data.time || '',
          location: data.location || '',
          category: data.category || 'social',
          max_attendees: data.max_attendees?.toString() || '',
        });
      }
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

  // Subscribe to real-time updates for this specific event
  useEffect(() => {
    if (!id) return;

    const eventChannel = supabase
      .channel(`event:${id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'events',
          filter: `id=eq.${id}`,
        },
        async (payload) => {
          // Event updated - fetch full event details to get all updated data
          console.log('Event updated via real-time:', payload.new);
          await fetchEvent();
          // Also update edit form if modal is open
          const updatedEvent = payload.new as any;
          if (showEditModal) {
            setEditForm({
              title: updatedEvent.title || '',
              description: updatedEvent.description || '',
              date: updatedEvent.date || '',
              time: updatedEvent.time || '',
              location: updatedEvent.location || '',
              category: updatedEvent.category || 'social',
              max_attendees: updatedEvent.max_attendees?.toString() || '',
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'events',
          filter: `id=eq.${id}`,
        },
        async () => {
          // Event deleted - show message and redirect
          setEvent(null);
          setError('This event has been deleted');
          Alert.alert('Event Deleted', 'This event has been cancelled.', [
            {
              text: 'Go Back',
              onPress: () => router.back(),
            },
          ]);
          // Auto-redirect after 3 seconds
          setTimeout(() => {
            router.back();
          }, 3000);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'event_attendees',
          filter: `event_id=eq.${id}`,
        },
        async () => {
          // Attendee joined - refresh full event data and attendees list
          await fetchEvent();
          await fetchAttendees();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'event_attendees',
          filter: `event_id=eq.${id}`,
        },
        async () => {
          // Attendee left - refresh full event data and attendees list
          await fetchEvent();
          await fetchAttendees();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(eventChannel);
    };
  }, [id, showEditModal, fetchEvent, fetchAttendees]);

  // Fetch related data when event is loaded
  useEffect(() => {
    if (event?.id) {
      fetchAttendees();
      if (event.organizer_id) {
        fetchOrganizer(event.organizer_id);
      }
      fetchUserJoinRequest();
      if (event.organizer_id === user?.id) {
        fetchJoinRequests();
      }
    }
  }, [event?.id, event?.organizer_id, user?.id, fetchAttendees, fetchOrganizer, fetchUserJoinRequest, fetchJoinRequests]);

  const onRefresh = useCallback(async () => {
    if (!id) {
      console.log('onRefresh: No id, skipping');
      return;
    }
    console.log('onRefresh: Starting refresh for event', id);
    setRefreshing(true);
    try {
      // Fetch event first
      const { data: eventData, error: eventError } = await api.getEventById(id, user?.id);
      
      if (eventError) {
        console.error('Error fetching event:', eventError);
        setError('Failed to refresh event');
        setRefreshing(false);
        return;
      }

      if (eventData) {
        // Update event state
        eventData.is_private = eventData.is_private ?? false;
        if (eventData.has_pending_request !== undefined) {
          setUserJoinRequest(eventData.has_pending_request ? { id: 'pending' } : null);
        }
        setEvent(eventData);
        
        // Update edit form
        setEditForm({
          title: eventData.title || '',
          description: eventData.description || '',
          date: eventData.date || '',
          time: eventData.time || '',
          location: eventData.location || '',
          category: eventData.category || 'social',
          max_attendees: eventData.max_attendees?.toString() || '',
        });

        // Fetch all related data in parallel
        const promises = [
          fetchAttendees(),
          fetchUserJoinRequest(),
        ];
        
        if (eventData.organizer_id) {
          promises.push(fetchOrganizer(eventData.organizer_id));
          if (eventData.organizer_id === user?.id) {
            promises.push(fetchJoinRequests());
      }
    }
        
        await Promise.all(promises);
      }
    } catch (err) {
      console.error('Error refreshing event:', err);
      setError('Failed to refresh event');
    } finally {
      console.log('onRefresh: Setting refreshing to false');
      setRefreshing(false);
    }
  }, [id, user?.id, fetchAttendees, fetchUserJoinRequest, fetchOrganizer, fetchJoinRequests]);

  // Real-time subscription for event updates
  useEffect(() => {
    if (!event?.id) return;

    const channel = api.subscribeToEventUpdates(event.id, (updatedEvent) => {
      setEvent((prev) => (prev ? { ...prev, ...updatedEvent } : null));
    });

    return () => {
      api.unsubscribeFromEventUpdates(event.id);
    };
  }, [event?.id]);

  // Event chat functions
  const fetchEventChat = useCallback(async () => {
    if (!event?.id || !user?.id || !event.is_attending) {
      setEventConversationId(null);
      setMessages([]);
      return;
    }

    setLoadingChat(true);
    try {
      // Get or create event conversation
      const { data: conversation, error: convError } = await api.getOrCreateEventConversation(event.id, user.id);
      
      if (convError || !conversation) {
        console.error('Error getting/creating event conversation:', convError);
        setEventConversationId(null);
        setMessages([]);
        return;
      }

      setEventConversationId(conversation.id);

      // Fetch messages
      const { data: messagesData, error: messagesError } = await api.getMessages(conversation.id);
      
      if (messagesError) {
        console.error('Error fetching messages:', messagesError);
      } else {
        setMessages(messagesData || []);
      }

      // Mark messages as read
      await api.markMessagesAsRead(conversation.id, user.id);
    } catch (err) {
      console.error('Error fetching event chat:', err);
    } finally {
      setLoadingChat(false);
    }
  }, [event?.id, event?.is_attending, user?.id]);

  // Subscribe to real-time messages when conversation is loaded
  useEffect(() => {
    if (!eventConversationId || !user?.id) {
      // Cleanup subscription if conversation is cleared
      if (messageSubscriptionRef.current) {
        api.unsubscribeFromMessages(eventConversationId!);
        messageSubscriptionRef.current = null;
      }
      return;
    }

    // Subscribe to new messages
    const channel = api.subscribeToMessages(eventConversationId, async (newMessage) => {
      setMessages((prev) => {
        // Avoid duplicates
        if (prev.some((m) => m.id === newMessage.id)) return prev;
        return [...prev, newMessage];
      });
      
      // Scroll to bottom when new message arrives
      setTimeout(() => {
        chatScrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
      
      // Mark as read if not from current user
      if (newMessage.sender_id !== user.id) {
        await api.markMessagesAsRead(eventConversationId, user.id);
      }
    });

    messageSubscriptionRef.current = channel;

    return () => {
      api.unsubscribeFromMessages(eventConversationId);
      messageSubscriptionRef.current = null;
    };
  }, [eventConversationId, user?.id]);

  // Fetch event announcements
  const fetchEventAnnouncements = useCallback(async () => {
    if (!event?.id) return;

    setLoadingAnnouncements(true);
    try {
      const { data, error } = await api.getEventAnnouncements(event.id);
      
      if (error) {
        console.error('Error fetching announcements:', error);
        setAnnouncements([]);
      } else {
        setAnnouncements(data || []);
      }
    } catch (err) {
      console.error('Error:', err);
      setAnnouncements([]);
    } finally {
      setLoadingAnnouncements(false);
    }
  }, [event?.id]);

  // Load announcements when announcements tab is active
  useEffect(() => {
    if (activeTab === 'announcements') {
      fetchEventAnnouncements();
    }
  }, [activeTab, fetchEventAnnouncements]);

  // Post announcement (only for event creator)
  const handlePostAnnouncement = async () => {
    if (!announcementText.trim() || !event?.id || !user?.id || !isOrganizer || sendingAnnouncement) return;

    setSendingAnnouncement(true);
    const content = announcementText.trim();
    setAnnouncementText('');

    try {
      const { data, error } = await api.createEventAnnouncement(event.id, user.id, content);
      
      if (error) {
        console.error('Error posting announcement:', error);
        const errorMessage = error.message || 'Failed to post announcement. Please try again.';
        
        // Check if table doesn't exist
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          Alert.alert(
            'Database Error',
            'The announcements table has not been created yet. Please run the database migration first.',
            [{ text: 'OK' }]
          );
        } else if (error.code === 'PERMISSION_DENIED') {
          Alert.alert('Permission Denied', errorMessage);
        } else {
          Alert.alert('Error', errorMessage);
        }
        setAnnouncementText(content); // Restore text on error
      } else if (data) {
        // Add to local state
        setAnnouncements((prev) => [data, ...prev]);
      } else {
        Alert.alert('Error', 'Failed to post announcement. No data returned.');
        setAnnouncementText(content);
      }
    } catch (err: any) {
      console.error('Error:', err);
      const errorMessage = err?.message || 'Failed to post announcement. Please try again.';
      
      if (err?.code === '42P01' || err?.message?.includes('does not exist')) {
        Alert.alert(
          'Database Error',
          'The announcements table has not been created yet. Please run the database migration first.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', errorMessage);
      }
      setAnnouncementText(content);
    } finally {
      setSendingAnnouncement(false);
    }
  };

  const handleDeleteAnnouncement = async (announcementId: string) => {
    if (!user?.id) return;

    Alert.alert(
      'Delete Announcement',
      'Are you sure you want to delete this announcement? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await api.deleteEventAnnouncement(announcementId, user.id);
              
              if (error) {
                const errorMessage = error.message || 'Failed to delete announcement';
                console.error('Error deleting announcement:', error);
                
                if (error.code === 'PERMISSION_DENIED') {
                  Alert.alert('Permission Denied', errorMessage);
                } else if (error.code === '42P01') {
                  Alert.alert(
                    'Database Error',
                    'The announcements table has not been created yet. Please run the database migration first.',
                    [{ text: 'OK' }]
                  );
                } else {
                  Alert.alert('Error', errorMessage);
                }
              } else {
                // Remove from local state
                setAnnouncements((prev) => prev.filter((a) => a.id !== announcementId));
              }
            } catch (err: any) {
              console.error('Error:', err);
              const errorMessage = err?.message || 'Failed to delete announcement';
              Alert.alert('Error', errorMessage);
            }
          },
        },
      ]
    );
  };

  // Load chat when chat tab is active and user is attending
  useEffect(() => {
    if (activeTab === 'chat' && event?.is_attending) {
      fetchEventChat();
    } else if (activeTab !== 'chat') {
      // Cleanup when switching away from chat tab
      if (messageSubscriptionRef.current) {
        api.unsubscribeFromMessages(eventConversationId!);
        messageSubscriptionRef.current = null;
      }
    }
  }, [activeTab, event?.is_attending, fetchEventChat, eventConversationId]);

  // Send message in event chat
  const sendChatMessage = async () => {
    if (!messageText.trim() || !eventConversationId || !user?.id || sendingMessage) return;

    setSendingMessage(true);
    const content = messageText.trim();
    setMessageText('');

    try {
      const { data, error } = await api.sendMessage(eventConversationId, user.id, content);
      
      if (error) {
        console.error('Error sending message:', error);
        setMessageText(content); // Restore message on error
      } else if (data) {
        // Add to local state (real-time subscription should also handle this)
        setMessages((prev) => {
          if (prev.some((m) => m.id === data.id)) return prev;
          return [...prev, data];
        });
        // Scroll to bottom after sending
        setTimeout(() => {
          chatScrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    } catch (err) {
      console.error('Error:', err);
      setMessageText(content);
    } finally {
      setSendingMessage(false);
    }
  };

  // Format time for messages
  const formatMessageTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  // Real-time subscription for join requests (for organizers)
  useEffect(() => {
    if (!event?.id || event.organizer_id !== user?.id) return;

    const channel = api.subscribeToEventJoinRequests(event.id, (update) => {
      if (update.action === 'INSERT') {
        setJoinRequests((prev) => [update.request, ...prev]);
      } else if (update.action === 'UPDATE') {
        setJoinRequests((prev) =>
          prev.map((req) => (req.id === update.request.id ? update.request : req))
        );
        // If request was accepted, refresh attendees
        if (update.request.status === 'accepted') {
          fetchAttendees();
          fetchEvent();
        }
      } else if (update.action === 'DELETE') {
        setJoinRequests((prev) => prev.filter((req) => req.id !== update.request.id));
      }
    });

    return () => {
      api.unsubscribeFromEventJoinRequests(event.id);
    };
  }, [event?.id, event?.organizer_id, user?.id, fetchAttendees, fetchEvent]);

  // Keyboard listeners for chat input
  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
      }
    );
    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  // Handle RSVP
  const handleRSVP = async () => {
    if (!event || !user?.id || rsvpLoading) return;

    // Prevent organizers from joining their own events
    if (isOrganizer) {
      Alert.alert('Cannot Join', 'You are the organizer of this event');
      return;
    }

    setRsvpLoading(true);

    try {
      if (event.is_attending) {
        const { error } = await api.leaveEvent(event.id, user.id);
        if (error) {
          Alert.alert('Error', 'Failed to cancel RSVP');
        } else {
          setEvent((prev) =>
            prev ? { ...prev, is_attending: false, attendee_count: prev.attendee_count - 1 } : null
          );
          fetchAttendees();
        }
      } else {
        if (event.is_private === true) {
          // Send join request for private events
          const { error } = await api.requestToJoinEvent(event.id, user.id);
          if (error) {
            Alert.alert('Error', error.message || 'Failed to send join request');
          } else {
            Alert.alert('Request Sent', 'Your request to join this private event has been sent to the organizer.');
            // Update local state to show pending request
            setEvent((prev) => (prev ? { ...prev, has_pending_request: true } : null));
            setUserJoinRequest({ id: 'pending' });
            fetchUserJoinRequest();
          }
        } else {
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
            fetchAttendees();
          }
        }
      }
    } catch (err) {
      console.error('Error:', err);
      Alert.alert('Error', 'Something went wrong');
    } finally {
      setRsvpLoading(false);
    }
  };

  // Handle join request approval/rejection
  const handleJoinRequest = async (requestId: string, approve: boolean) => {
    try {
      const { error } = await api.respondToJoinRequest(requestId, approve);
      if (error) {
        Alert.alert('Error', error.message || 'Failed to respond to request');
      } else {
        if (approve) {
          Alert.alert('Request Approved', 'The user has been added to the event attendees.');
        } else {
          Alert.alert('Request Rejected', 'The join request has been declined.');
        }
        fetchJoinRequests();
        fetchAttendees();
        fetchEvent();
      }
    } catch (err) {
      console.error('Error:', err);
      Alert.alert('Error', 'Something went wrong');
    }
  };

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Format time
  const formatTime = (timeStr?: string) => {
    if (!timeStr) return '';
    return timeStr;
  };

  if (loading) {
    return (
      <BackgroundImage overlayOpacity={isDark ? 0.7 : 0.4}>
        <SafeAreaView style={{ flex: 1 }}>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" color="#0066cc" />
            <Text style={{ marginTop: 16, color: isDark ? '#ffffff' : '#1e293b' }}>Loading event...</Text>
          </View>
        </SafeAreaView>
      </BackgroundImage>
    );
  }

  if (error || !event) {
    return (
      <BackgroundImage overlayOpacity={isDark ? 0.7 : 0.4}>
        <SafeAreaView style={{ flex: 1 }}>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <Calendar size={48} color={isDark ? '#6b7280' : '#9ca3af'} />
            <Text style={{ marginTop: 16, color: isDark ? '#ffffff' : '#1e293b', textAlign: 'center' }}>
              {error || 'Event not found'}
            </Text>
            <TouchableOpacity
              onPress={() => router.back()}
              style={{
                marginTop: 24,
                paddingHorizontal: 24,
                paddingVertical: 12,
                backgroundColor: '#0066cc',
                borderRadius: 8,
              }}
            >
              <Text style={{ color: '#ffffff', fontWeight: '600' }}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </BackgroundImage>
    );
  }

  const categoryColor = categoryColors[event.category] || categoryColors.social;
  const isOrganizer = event.organizer_id === user?.id;
  const hasPendingRequest = userJoinRequest !== null;

  return (
    <BackgroundImage overlayOpacity={isDark ? 0.7 : 0.4}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh} 
              tintColor="#14b8a6"
              colors={['#14b8a6']}
              enabled={true}
            />
          }
          nestedScrollEnabled={true}
          scrollEnabled={true}
          bounces={true}
          alwaysBounceVertical={true}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 20,
              paddingVertical: 16,
              backgroundColor: isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            }}
          >
            <TouchableOpacity onPress={() => router.back()}>
              <ChevronLeft size={24} color={isDark ? '#ffffff' : '#1e293b'} />
            </TouchableOpacity>
            <Text style={{ fontSize: 18, fontWeight: '600', color: isDark ? '#ffffff' : '#1e293b' }}>
              Event Details
            </Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Event Image */}
          {event.image_url && (
            <Image
              source={{ uri: event.image_url }}
              style={{ width: '100%', height: 200 }}
              resizeMode="cover"
            />
          )}

          {/* Event Info Card */}
          <View
            style={{
              margin: 20,
              padding: 20,
              borderRadius: 16,
              backgroundColor: isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: isDark ? 0.3 : 0.1,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            {/* Title and Category */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: isDark ? '#ffffff' : '#1e293b', flex: 1 }}>
                {event.title}
              </Text>
              {isOrganizer && (
                <TouchableOpacity
                  onPress={() => setShowEditModal(true)}
                  style={{ marginLeft: 12, padding: 8 }}
                >
                  <Edit size={20} color={isDark ? '#9ca3af' : '#6b7280'} />
                </TouchableOpacity>
              )}
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              <View
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 20,
                  backgroundColor: categoryColor.bg,
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '600', color: categoryColor.text }}>
                  {event.category.charAt(0).toUpperCase() + event.category.slice(1)}
                </Text>
              </View>
              {/* Privacy Indicator */}
              {event.is_private !== undefined && (
                <View
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 20,
                    backgroundColor: event.is_private ? '#fef3c7' : '#d1fae5',
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '600', color: event.is_private ? '#f59e0b' : '#10b981' }}>
                    {event.is_private ? '🔒 Private' : '🌐 Public'}
                  </Text>
                </View>
              )}
            </View>

            {/* Date and Time */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <Calendar size={18} color={isDark ? '#9ca3af' : '#6b7280'} />
              <Text style={{ marginLeft: 8, fontSize: 14, color: isDark ? '#e2e8f0' : '#475569' }}>
                {formatDate(event.date)}
              </Text>
            </View>

            {event.time && (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <Clock size={18} color={isDark ? '#9ca3af' : '#6b7280'} />
                <Text style={{ marginLeft: 8, fontSize: 14, color: isDark ? '#e2e8f0' : '#475569' }}>
                  {formatTime(event.time)}
                </Text>
              </View>
            )}

            {/* Location */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <MapPin size={18} color={isDark ? '#9ca3af' : '#6b7280'} />
              <Text style={{ marginLeft: 8, fontSize: 14, color: isDark ? '#e2e8f0' : '#475569', flex: 1 }}>
                {event.location}
              </Text>
            </View>

            {/* Description */}
            {event.description && (
              <Text style={{ fontSize: 14, lineHeight: 20, color: isDark ? '#e2e8f0' : '#475569', marginBottom: 16 }}>
                {event.description}
              </Text>
            )}

            {/* Attendee Count */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <Users size={18} color={isDark ? '#9ca3af' : '#6b7280'} />
              <Text style={{ marginLeft: 8, fontSize: 14, color: isDark ? '#e2e8f0' : '#475569' }}>
                {event.attendee_count} {event.max_attendees ? `/ ${event.max_attendees}` : ''} attending
              </Text>
            </View>

            {/* Organizer */}
            {organizer && (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                <Avatar source={organizer.avatar_url} name={organizer.name} size="sm" />
                <View style={{ marginLeft: 12 }}>
                  <Text style={{ fontSize: 12, color: isDark ? '#9ca3af' : '#6b7280' }}>Organized by</Text>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: isDark ? '#ffffff' : '#1e293b' }}>
                    {organizer.name}
                  </Text>
                </View>
              </View>
            )}

            {/* RSVP Button - Hidden for organizers */}
            {user && !isOrganizer && (
              <TouchableOpacity
                onPress={handleRSVP}
                disabled={rsvpLoading || hasPendingRequest}
                style={{
                  paddingVertical: 14,
                  borderRadius: 12,
                  backgroundColor: event.is_attending
                    ? isDark
                      ? 'rgba(239, 68, 68, 0.2)'
                      : '#fee2e2'
                    : hasPendingRequest
                    ? isDark
                      ? 'rgba(251, 191, 36, 0.2)'
                      : '#fef3c7'
                    : '#0066cc',
                  alignItems: 'center',
                }}
              >
                {rsvpLoading ? (
                  <ActivityIndicator color={event.is_attending || hasPendingRequest ? '#ef4444' : '#ffffff'} />
                ) : (
                  <Text
                    style={{
                      color: event.is_attending
                        ? '#ef4444'
                        : hasPendingRequest
                        ? '#f59e0b'
                        : '#ffffff',
                      fontSize: 16,
                      fontWeight: '600',
                    }}
                  >
                    {event.is_attending
                      ? 'Cancel RSVP'
                      : hasPendingRequest
                      ? 'Request Pending'
                      : (event.is_private === true)
                      ? 'Request to Join'
                      : 'RSVP'}
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* Tabs - Scrollable */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{
              marginBottom: 16,
              borderBottomWidth: 1,
              borderBottomColor: isDark ? '#374151' : '#e5e7eb',
            }}
            contentContainerStyle={{
              paddingHorizontal: 20,
            }}
          >
            {['details', 'photos', 'announcements', 'chat', ...(isOrganizer ? ['requests'] : [])].map((tab) => {
              const isRequestsTab = tab === 'requests';
              const requestCount = isRequestsTab ? joinRequests.length : 0;
              
              return (
                <TouchableOpacity
                  key={tab}
                  onPress={() => setActiveTab(tab as any)}
                  style={{
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    marginRight: 8,
                    borderBottomWidth: activeTab === tab ? 2 : 0,
                    borderBottomColor: '#0066cc',
                    flexDirection: 'row',
                    alignItems: 'center',
                    position: 'relative',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: activeTab === tab ? '600' : '400',
                      color: activeTab === tab ? '#0066cc' : isDark ? '#9ca3af' : '#6b7280',
                      textTransform: 'capitalize',
                    }}
                  >
                    {tab === 'announcements' ? 'Announcements' : tab}
                  </Text>
                  {isRequestsTab && requestCount > 0 && (
                    <View
                      style={{
                        marginLeft: 6,
                        minWidth: 20,
                        height: 20,
                        borderRadius: 10,
                        backgroundColor: '#ef4444',
                        alignItems: 'center',
                        justifyContent: 'center',
                        paddingHorizontal: 6,
                      }}
                    >
                      <Text style={{ color: '#ffffff', fontSize: 11, fontWeight: '600' }}>
                        {requestCount}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Tab Content */}
          {activeTab === 'details' && (
            <View style={{ paddingHorizontal: 20, paddingBottom: 40 }}>
              {/* Attendees List */}
              <Text style={{ fontSize: 18, fontWeight: '600', color: isDark ? '#ffffff' : '#1e293b', marginBottom: 16 }}>
                Attendees ({event.attendee_count})
              </Text>
              {loadingAttendees ? (
                <ActivityIndicator size="small" color="#0066cc" />
              ) : attendees.length > 0 ? (
                <View style={{ gap: 12 }}>
                  {attendees.map((attendee) => (
                    <View
                      key={attendee.id}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        padding: 12,
                        borderRadius: 12,
                        backgroundColor: isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(255, 255, 255, 0.5)',
                      }}
                    >
                      <Avatar source={attendee.avatar_url} name={attendee.name} size="md" />
                      <View style={{ marginLeft: 12, flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: isDark ? '#ffffff' : '#1e293b' }}>
                          {attendee.name}
                        </Text>
                        {attendee.major && (
                          <Text style={{ fontSize: 12, color: isDark ? '#9ca3af' : '#6b7280' }}>
                            {attendee.major}
                          </Text>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>No attendees yet</Text>
              )}
            </View>
          )}

          {activeTab === 'photos' && (
            <View style={{ paddingBottom: 40 }}>
              <PhotoGallery
                eventId={event.id}
                isAttending={event.is_attending || false}
                isCreator={isOrganizer}
                onRefresh={onRefresh}
              />
            </View>
          )}

          {activeTab === 'announcements' && (
            <View style={{ flex: 1, paddingHorizontal: 20, paddingBottom: 40 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <Text style={{ fontSize: 18, fontWeight: '600', color: isDark ? '#ffffff' : '#1e293b' }}>
                  Announcements
              </Text>
                {isOrganizer && (
                  <TouchableOpacity
                    onPress={() => {
                      if (announcementText.trim()) {
                        handlePostAnnouncement();
                      }
                    }}
                    disabled={!announcementText.trim() || sendingAnnouncement}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 8,
                      backgroundColor: announcementText.trim() && !sendingAnnouncement ? '#0066cc' : isDark ? 'rgba(31, 41, 55, 0.9)' : 'rgba(229, 231, 235, 0.9)',
                    }}
                  >
                    {sendingAnnouncement ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <>
                        <Megaphone size={16} color={announcementText.trim() ? '#ffffff' : isDark ? '#6b7280' : '#9ca3af'} />
                        <Text
                          style={{
                            marginLeft: 6,
                            color: announcementText.trim() ? '#ffffff' : isDark ? '#6b7280' : '#9ca3af',
                            fontWeight: '600',
                            fontSize: 14,
                          }}
                        >
                          Post
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>

              {isOrganizer && (
                <View
                  style={{
                    marginBottom: 16,
                    padding: 12,
                    borderRadius: 12,
                    backgroundColor: isDark ? 'rgba(31, 41, 55, 0.5)' : 'rgba(255, 255, 255, 0.5)',
                    borderWidth: 1,
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                  }}
                >
                  <TextInput
                    style={{
                      minHeight: 80,
                      color: isDark ? '#ffffff' : '#1e293b',
                      fontSize: 16,
                      textAlignVertical: 'top',
                    }}
                    placeholder="Write an announcement..."
                    placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                    value={announcementText}
                    onChangeText={setAnnouncementText}
                    multiline
                    editable={!sendingAnnouncement}
                  />
                </View>
              )}

              {loadingAnnouncements ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 }}>
                  <ActivityIndicator size="large" color="#0066cc" />
                </View>
              ) : announcements.length === 0 ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 }}>
                  <Megaphone size={48} color={isDark ? '#6b7280' : '#9ca3af'} />
                  <Text style={{ marginTop: 16, fontSize: 16, color: isDark ? '#9ca3af' : '#6b7280', textAlign: 'center' }}>
                    {isOrganizer ? 'No announcements yet. Post one to keep attendees informed!' : 'No announcements yet.'}
                  </Text>
                </View>
              ) : (
                <ScrollView showsVerticalScrollIndicator={false}>
                  {announcements.map((announcement) => (
                    <View
                      key={announcement.id}
                      style={{
                        marginBottom: 16,
                        padding: 16,
                        borderRadius: 12,
                        backgroundColor: isDark ? 'rgba(31, 41, 55, 0.5)' : 'rgba(255, 255, 255, 0.5)',
                        borderLeftWidth: 3,
                        borderLeftColor: '#0066cc',
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                        <Megaphone size={16} color="#0066cc" />
                        <Text
                          style={{
                            marginLeft: 8,
                            fontSize: 12,
                            fontWeight: '600',
                            color: '#0066cc',
                            textTransform: 'uppercase',
                          }}
                        >
                          Announcement
                        </Text>
                        <View style={{ marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                          <Text
                            style={{
                              fontSize: 12,
                              color: isDark ? '#6b7280' : '#9ca3af',
                            }}
                          >
                            {new Date(announcement.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </Text>
                          {announcement.organizer_id === user?.id && (
                            <TouchableOpacity
                              onPress={() => handleDeleteAnnouncement(announcement.id)}
                              style={{
                                backgroundColor: '#ef4444',
                                padding: 6,
                                borderRadius: 6,
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <Trash2 size={14} color="#ffffff" />
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                      <Text style={{ fontSize: 16, color: isDark ? '#ffffff' : '#1e293b', lineHeight: 24 }}>
                        {announcement.content}
                      </Text>
                      {announcement.organizer && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
                          <Avatar source={announcement.organizer.avatar_url} name={announcement.organizer.name} size="sm" />
                          <Text
                            style={{
                              marginLeft: 8,
                              fontSize: 12,
                              color: isDark ? '#9ca3af' : '#6b7280',
                            }}
                          >
                            {announcement.organizer.name}
                          </Text>
                        </View>
                      )}
                    </View>
                  ))}
                </ScrollView>
              )}
            </View>
          )}

          {activeTab === 'chat' && (
            <View style={{ flex: 1, paddingHorizontal: 20, paddingBottom: 40 }}>
              {!event?.is_attending ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 }}>
                  <MessageCircle size={48} color={isDark ? '#6b7280' : '#9ca3af'} />
                  <Text style={{ marginTop: 16, fontSize: 16, color: isDark ? '#9ca3af' : '#6b7280', textAlign: 'center' }}>
                    Join the event to participate in the chat
                  </Text>
                </View>
              ) : loadingChat ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 }}>
                  <ActivityIndicator size="large" color="#0066cc" />
                  <Text style={{ marginTop: 16, fontSize: 16, color: isDark ? '#9ca3af' : '#6b7280' }}>
                    Loading chat...
                  </Text>
                </View>
              ) : (
                <KeyboardAvoidingView
                  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                  style={{ flex: 1 }}
                  keyboardVerticalOffset={Platform.OS === 'ios' ? 120 : 0}
                >
                  <ScrollView
                    ref={chatScrollViewRef}
                    style={{ flex: 1 }}
                    contentContainerStyle={{ 
                      paddingVertical: 16, 
                      flexGrow: 1,
                      paddingBottom: keyboardHeight > 0 ? 20 : 16,
                    }}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="interactive"
                    onContentSizeChange={() => {
                      // Auto-scroll to bottom when content size changes
                      if (keyboardHeight > 0) {
                      setTimeout(() => {
                        chatScrollViewRef.current?.scrollToEnd({ animated: true });
                      }, 100);
                      }
                    }}
                  >
                    {messages.length === 0 ? (
                      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 }}>
                        <MessageCircle size={48} color={isDark ? '#6b7280' : '#9ca3af'} />
                        <Text style={{ marginTop: 16, fontSize: 16, color: isDark ? '#9ca3af' : '#6b7280', textAlign: 'center' }}>
                          No messages yet. Start the conversation!
                        </Text>
                      </View>
                    ) : (
                      messages.map((message) => {
                        const isOwnMessage = message.sender_id === user?.id;
                        return (
                          <View
                            key={message.id}
                            style={{
                              marginBottom: 12,
                              flexDirection: 'row',
                              alignItems: 'flex-end',
                              justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
                            }}
                          >
                            {!isOwnMessage && (
                              <View style={{ marginRight: 8, marginBottom: 2 }}>
                                <Avatar
                                  source={message.sender?.avatar_url}
                                  name={message.sender?.name}
                                  size="sm"
                                />
                              </View>
                            )}
                            <View style={{ maxWidth: '75%', alignItems: isOwnMessage ? 'flex-end' : 'flex-start' }}>
                              {!isOwnMessage && message.sender?.name && (
                                <Text style={{ fontSize: 12, color: isDark ? '#9ca3af' : '#6b7280', marginBottom: 4, marginLeft: 4 }}>
                                  {message.sender.name}
                                </Text>
                              )}
                              <View
                                style={{
                                  maxWidth: '100%',
                                  paddingHorizontal: 16,
                                  paddingVertical: 12,
                                  borderRadius: 16,
                                  borderBottomRightRadius: isOwnMessage ? 4 : 16,
                                  borderBottomLeftRadius: isOwnMessage ? 16 : 4,
                                  backgroundColor: isOwnMessage
                                    ? '#3b82f6'
                                    : isDark
                                    ? 'rgba(31, 41, 55, 0.9)'
                                    : 'rgba(255, 255, 255, 0.9)',
                                }}
                              >
                                <Text
                                  style={{
                                    fontSize: 16,
                                    color: isOwnMessage ? '#ffffff' : isDark ? '#ffffff' : '#1e293b',
                                  }}
                                >
                                  {message.content}
                                </Text>
                              </View>
                              <Text
                                style={{
                                  fontSize: 11,
                                  color: isDark ? '#6b7280' : '#9ca3af',
                                  marginTop: 4,
                                  marginHorizontal: 4,
                                }}
                              >
                                {formatMessageTime(message.created_at)}
                              </Text>
                            </View>
                            {isOwnMessage && (
                              <View style={{ marginLeft: 8, marginBottom: 2 }}>
                                <Avatar
                                  source={profile?.avatar_url}
                                  name={profile?.name || user?.email}
                                  size="sm"
                                />
                              </View>
                            )}
                          </View>
                        );
                      })
                    )}
                  </ScrollView>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'flex-end',
                      paddingTop: 12,
                      paddingBottom: Math.max(insets.bottom, 12),
                      borderTopWidth: 1,
                      borderTopColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                    }}
                  >
                    <TextInput
                      style={{
                        flex: 1,
                        maxHeight: 100,
                        paddingHorizontal: 16,
                        paddingVertical: 12,
                        borderRadius: 24,
                        backgroundColor: isDark ? 'rgba(31, 41, 55, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                        color: isDark ? '#ffffff' : '#1e293b',
                        fontSize: 16,
                        marginRight: 8,
                      }}
                      placeholder="Type a message..."
                      placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                      value={messageText}
                      onChangeText={setMessageText}
                      onFocus={() => {
                        // Scroll to bottom when input is focused
                        setTimeout(() => {
                          chatScrollViewRef.current?.scrollToEnd({ animated: true });
                        }, 300);
                      }}
                      multiline
                      textAlignVertical="center"
                      editable={!sendingMessage}
                    />
                    <TouchableOpacity
                      onPress={sendChatMessage}
                      disabled={!messageText.trim() || sendingMessage}
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 24,
                        backgroundColor: messageText.trim() && !sendingMessage ? '#3b82f6' : isDark ? 'rgba(31, 41, 55, 0.9)' : 'rgba(229, 231, 235, 0.9)',
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                      activeOpacity={0.8}
                    >
                      {sendingMessage ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <Send
                          size={20}
                          color={messageText.trim() ? '#ffffff' : isDark ? '#6b7280' : '#9ca3af'}
                        />
                      )}
                    </TouchableOpacity>
                  </View>
                </KeyboardAvoidingView>
              )}
            </View>
          )}

          {activeTab === 'requests' && isOrganizer && (
            <View style={{ paddingHorizontal: 20, paddingBottom: 40 }}>
              <Text style={{ fontSize: 18, fontWeight: '600', color: isDark ? '#ffffff' : '#1e293b', marginBottom: 16 }}>
                Join Requests ({joinRequests.length})
              </Text>
              {loadingJoinRequests ? (
                <ActivityIndicator size="small" color="#0066cc" />
              ) : joinRequests.length > 0 ? (
                <View style={{ gap: 12 }}>
                  {joinRequests.map((request) => (
                    <View
                      key={request.id}
                      style={{
                        padding: 16,
                        borderRadius: 12,
                        backgroundColor: isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(255, 255, 255, 0.5)',
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                        <Avatar source={request.profile?.avatar_url} name={request.profile?.name} size="md" />
                        <View style={{ marginLeft: 12, flex: 1 }}>
                          <Text style={{ fontSize: 14, fontWeight: '600', color: isDark ? '#ffffff' : '#1e293b' }}>
                            {request.profile?.name || 'Anonymous'}
                          </Text>
                          {request.profile?.major && (
                            <Text style={{ fontSize: 12, color: isDark ? '#9ca3af' : '#6b7280' }}>
                              {request.profile.major}
                            </Text>
                          )}
                        </View>
                      </View>
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        <TouchableOpacity
                          onPress={() => handleJoinRequest(request.id, true)}
                          style={{
                            flex: 1,
                            paddingVertical: 10,
                            borderRadius: 8,
                            backgroundColor: '#10b981',
                            alignItems: 'center',
                          }}
                        >
                          <Text style={{ color: '#ffffff', fontWeight: '600' }}>Approve</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleJoinRequest(request.id, false)}
                          style={{
                            flex: 1,
                            paddingVertical: 10,
                            borderRadius: 8,
                            backgroundColor: '#ef4444',
                            alignItems: 'center',
                          }}
                        >
                          <Text style={{ color: '#ffffff', fontWeight: '600' }}>Reject</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>No pending requests</Text>
              )}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>

      {/* Edit Event Modal */}
      <Modal visible={showEditModal} animationType="slide" transparent={true} onRequestClose={() => setShowEditModal(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View
            style={{
              backgroundColor: isDark ? 'rgba(30, 41, 59, 0.98)' : 'rgba(255, 255, 255, 0.98)',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 20,
              maxHeight: '90%',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: isDark ? '#ffffff' : '#1e293b' }}>
                Edit Event
              </Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <X size={24} color={isDark ? '#9ca3af' : '#6b7280'} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <TextInput
                style={{
                  padding: 12,
                  borderRadius: 8,
                  backgroundColor: isDark ? '#1e293b' : '#f3f4f6',
                  color: isDark ? '#ffffff' : '#1e293b',
                  marginBottom: 16,
                }}
                placeholder="Event Title"
                placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                value={editForm.title}
                onChangeText={(text) => setEditForm({ ...editForm, title: text })}
              />

              <TextInput
                style={{
                  padding: 12,
                  borderRadius: 8,
                  backgroundColor: isDark ? '#1e293b' : '#f3f4f6',
                  color: isDark ? '#ffffff' : '#1e293b',
                  marginBottom: 16,
                  minHeight: 100,
                  textAlignVertical: 'top',
                }}
                placeholder="Description"
                placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                multiline
                value={editForm.description}
                onChangeText={(text) => setEditForm({ ...editForm, description: text })}
              />

              <TextInput
                style={{
                  padding: 12,
                  borderRadius: 8,
                  backgroundColor: isDark ? '#1e293b' : '#f3f4f6',
                  color: isDark ? '#ffffff' : '#1e293b',
                  marginBottom: 16,
                }}
                placeholder="Location"
                placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                value={editForm.location}
                onChangeText={(text) => setEditForm({ ...editForm, location: text })}
              />

              {/* Category Selection */}
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: isDark ? '#ffffff' : '#1e293b', marginBottom: 8 }}>
                  Category
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {['social', 'academic', 'sports', 'career', 'workshop'].map((cat) => (
                      <TouchableOpacity
                        key={cat}
                        onPress={() => setEditForm({ ...editForm, category: cat })}
                        style={{
                          paddingHorizontal: 16,
                          paddingVertical: 8,
                          borderRadius: 20,
                          backgroundColor: editForm.category === cat ? '#0066cc' : (isDark ? '#1e293b' : '#f3f4f6'),
                        }}
                      >
                        <Text
                          style={{
                            color: editForm.category === cat ? '#ffffff' : (isDark ? '#ffffff' : '#1e293b'),
                            fontSize: 14,
                            fontWeight: '500',
                          }}
                        >
                          {cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              {/* Max Attendees */}
              <TextInput
                style={{
                  padding: 12,
                  borderRadius: 8,
                  backgroundColor: isDark ? '#1e293b' : '#f3f4f6',
                  color: isDark ? '#ffffff' : '#1e293b',
                  marginBottom: 16,
                }}
                placeholder="Max Attendees (optional)"
                placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                keyboardType="numeric"
                value={editForm.max_attendees}
                onChangeText={(text) => setEditForm({ ...editForm, max_attendees: text })}
              />

              {/* Privacy Toggle */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: isDark ? '#ffffff' : '#1e293b', marginBottom: 4 }}>
                    Private Event
                  </Text>
                  <Text style={{ fontSize: 12, color: isDark ? '#9ca3af' : '#6b7280' }}>
                    {event.is_private ? 'Users must request to join' : 'Anyone can join directly'}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={async () => {
                    const newPrivacy = !event.is_private;
                    const { error } = await api.changeEventPrivacy(event.id, user!.id, newPrivacy);
                    if (error) {
                      Alert.alert('Error', error.message || 'Failed to change privacy setting');
                    } else {
                      Alert.alert('Success', `Event is now ${newPrivacy ? 'private' : 'public'}`);
                      fetchEvent();
                    }
                  }}
                  style={{
                    width: 50,
                    height: 30,
                    borderRadius: 15,
                    backgroundColor: event.is_private ? '#0066cc' : (isDark ? '#374151' : '#d1d5db'),
                    justifyContent: 'center',
                    paddingHorizontal: 2,
                  }}
                >
                  <View
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 13,
                      backgroundColor: '#ffffff',
                      transform: [{ translateX: event.is_private ? 20 : 0 }],
                    }}
                  />
                </TouchableOpacity>
              </View>

              {/* Change Cover Photo */}
              <TouchableOpacity
                onPress={async () => {
                  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                  if (status !== 'granted') {
                    Alert.alert('Permission Required', 'Please grant permission to access your photos.');
                    return;
                  }

                  const result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                    allowsEditing: true,
                    aspect: [16, 9],
                    quality: 0.8,
                  });

                  if (!result.canceled && result.assets[0] && user?.id) {
                    const { url, error: uploadError } = await api.changeEventCoverPhoto(
                      event.id,
                      user.id,
                      result.assets[0].uri
                    );
                    if (uploadError) {
                      Alert.alert('Error', uploadError.message || 'Failed to update cover photo');
                    } else {
                      Alert.alert('Success', 'Cover photo updated successfully');
                      fetchEvent();
                    }
                  }
                }}
                style={{
                  padding: 12,
                  borderRadius: 8,
                  backgroundColor: isDark ? '#1e293b' : '#f3f4f6',
                  marginBottom: 16,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: isDark ? '#ffffff' : '#1e293b', fontSize: 14, fontWeight: '500' }}>
                  Change Cover Photo
                </Text>
              </TouchableOpacity>

              {/* Reschedule Event */}
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: isDark ? '#ffffff' : '#1e293b', marginBottom: 8 }}>
                  Reschedule Event
                </Text>
                <TextInput
                  style={{
                    padding: 12,
                    borderRadius: 8,
                    backgroundColor: isDark ? '#1e293b' : '#f3f4f6',
                    color: isDark ? '#ffffff' : '#1e293b',
                    marginBottom: 8,
                  }}
                  placeholder="Date (YYYY-MM-DD)"
                  placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                  value={editForm.date}
                  onChangeText={(text) => setEditForm({ ...editForm, date: text })}
                />
                <TextInput
                  style={{
                    padding: 12,
                    borderRadius: 8,
                    backgroundColor: isDark ? '#1e293b' : '#f3f4f6',
                    color: isDark ? '#ffffff' : '#1e293b',
                  }}
                  placeholder="Time (HH:MM:SS)"
                  placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                  value={editForm.time}
                  onChangeText={(text) => setEditForm({ ...editForm, time: text })}
                />
              </View>

              <TouchableOpacity
                onPress={async () => {
                  if (!user?.id) return;
                  setEditingEvent(true);
                  try {
                    // Update basic fields
                    const { error: updateError } = await api.updateEvent(event.id, user.id, {
                      title: editForm.title,
                      description: editForm.description,
                      location: editForm.location,
                      category: editForm.category,
                      max_attendees: editForm.max_attendees ? parseInt(editForm.max_attendees) : undefined,
                    });

                    if (updateError) {
                      Alert.alert('Error', updateError.message || 'Failed to update event');
                      return;
                    }

                    // Reschedule if date/time changed
                    if (editForm.date !== event.date || editForm.time !== event.time) {
                      const { error: rescheduleError } = await api.rescheduleEvent(
                        event.id,
                        user.id,
                        editForm.date,
                        editForm.time || undefined
                      );
                      if (rescheduleError) {
                        Alert.alert('Error', rescheduleError.message || 'Failed to reschedule event');
                        return;
                      }
                    }

                    Alert.alert('Success', 'Event updated successfully');
                    setShowEditModal(false);
                    fetchEvent();
                  } catch (err: any) {
                    Alert.alert('Error', err.message || 'Failed to update event');
                  } finally {
                    setEditingEvent(false);
                  }
                }}
                disabled={editingEvent}
                style={{
                  paddingVertical: 14,
                  borderRadius: 12,
                  backgroundColor: '#0066cc',
                  alignItems: 'center',
                  marginTop: 20,
                }}
              >
                {editingEvent ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '600' }}>Save Changes</Text>
                )}
              </TouchableOpacity>

              {/* Delete Event Button - Only visible to organizer */}
              {user?.id === event?.organizer_id && (
                <TouchableOpacity
                  onPress={() => {
                    setShowEditModal(false);
                    setShowDeleteConfirm(true);
                  }}
                  style={{
                    paddingVertical: 14,
                    borderRadius: 12,
                    backgroundColor: '#ef4444',
                    alignItems: 'center',
                    marginTop: 12,
                    flexDirection: 'row',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                >
                  <Trash2 size={18} color="#ffffff" />
                  <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '600' }}>Delete Event</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal visible={showDeleteConfirm} animationType="fade" transparent={true} onRequestClose={() => setShowDeleteConfirm(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View
            style={{
              backgroundColor: isDark ? 'rgba(30, 41, 59, 0.98)' : 'rgba(255, 255, 255, 0.98)',
              borderRadius: 16,
              padding: 20,
              width: '100%',
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: isDark ? '#ffffff' : '#1e293b', marginBottom: 12 }}>
              Delete Event
            </Text>
            {event && (
              <Text style={{ fontSize: 16, fontWeight: '600', color: isDark ? '#e2e8f0' : '#1e293b', marginBottom: 12 }}>
                {event.title}
              </Text>
            )}
            <Text style={{ fontSize: 14, color: isDark ? '#e2e8f0' : '#475569', marginBottom: 12 }}>
              Are you sure you want to delete this event? This action cannot be undone.
            </Text>
            <Text style={{ fontSize: 13, color: isDark ? '#94a3b8' : '#64748b', marginBottom: 20 }}>
              This will permanently delete:
              {'\n'}• The event and all its details
              {'\n'}• All event photos
              {'\n'}• All announcements
              {'\n'}• All attendee records
              {'\n'}• All join requests
            </Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                onPress={() => setShowDeleteConfirm(false)}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 8,
                  backgroundColor: isDark ? '#374151' : '#e5e7eb',
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: isDark ? '#ffffff' : '#1e293b', fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={async () => {
                  if (!user?.id) return;
                  setDeletingEvent(true);
                  try {
                    const { error } = await api.deleteEvent(event.id, user.id);
                    if (error) {
                      Alert.alert('Error', error.message || 'Failed to delete event');
                    } else {
                      Alert.alert('Success', 'Event deleted successfully');
                      router.back();
                    }
                  } catch (err: any) {
                    Alert.alert('Error', err.message || 'Failed to delete event');
                  } finally {
                    setDeletingEvent(false);
                    setShowDeleteConfirm(false);
                  }
                }}
                disabled={deletingEvent}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 8,
                  backgroundColor: '#ef4444',
                  alignItems: 'center',
                }}
              >
                {deletingEvent ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={{ color: '#ffffff', fontWeight: '600' }}>Delete</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </BackgroundImage>
  );
}
