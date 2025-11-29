import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  ActivityIndicator,
  Modal,
  Alert,
  StyleSheet,
  Image,
  ImageBackground,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  Calendar,
  CalendarDays,
  MapPin,
  Users,
  Search,
  List,
  Plus,
  X,
  Image as ImageIcon,
  Camera,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useColorScheme } from '@/components/useColorScheme';
import { useAuth } from '@/providers';
import { api, supabase } from '@/lib/supabase';
import EventCard from '@/components/ui/EventCard';
import PageHeader from '@/components/ui/PageHeader';

interface Event {
  id: string;
  title: string;
  description?: string;
  date: string;
  time?: string;
  location: string;
  category: string;
  attendee_count: number;
  is_attending: boolean;
  max_attendees?: number;
  organizer_id?: string;
  image_url?: string;
  is_private?: boolean;
  has_pending_request?: boolean;
  created_at?: string;
}

interface Attendee {
  id: string;
  name: string;
  avatar_url?: string;
}

interface NewEventForm {
  title: string;
  category: string;
  location: string;
  date: string;
  max_attendees: string;
  description: string;
  is_private: boolean;
}

const eventCategories = [
  { id: 'social', label: 'Social' },
  { id: 'academic', label: 'Academic' },
  { id: 'sports', label: 'Sports' },
  { id: 'career', label: 'Career' },
  { id: 'workshop', label: 'Workshop' },
];

const categoryColors: Record<string, { bg: string; text: string }> = {
  Career: { bg: '#dcfce7', text: '#16a34a' },
  Academic: { bg: '#e6f2ff', text: '#0066cc' },
  Sports: { bg: '#ffedd5', text: '#ea580c' },
  Social: { bg: '#f3e8ff', text: '#9333ea' },
  Workshop: { bg: '#cffafe', text: '#0891b2' },
  career: { bg: '#dcfce7', text: '#16a34a' },
  academic: { bg: '#dbeafe', text: '#2563eb' },
  sports: { bg: '#ffedd5', text: '#ea580c' },
  social: { bg: '#f3e8ff', text: '#9333ea' },
  workshop: { bg: '#cffafe', text: '#0891b2' },
};

const defaultColors = { bg: '#f1f5f9', text: '#475569' };

export default function EventsScreen() {
  const { user, profile } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const [events, setEvents] = useState<Event[]>([]);
  const [eventAttendees, setEventAttendees] = useState<Record<string, Attendee[]>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newEvent, setNewEvent] = useState<NewEventForm>({
    title: '',
    category: 'social',
    location: '',
    date: '',
    max_attendees: '',
    description: '',
    is_private: false,
  });
  const [eventImageUri, setEventImageUri] = useState<string | null>(null);
  const [animationKey, setAnimationKey] = useState(0);

  const fetchEvents = useCallback(async () => {
    try {
      setError(null);
      const { data, error } = await api.getEvents(user?.id);
      
      if (error) {
        console.error('Error fetching events:', error);
        setError('Failed to load events');
        return;
      }
      
      setEvents(data || []);
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to load events');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Subscribe to real-time event updates
  useEffect(() => {
    if (!user?.id) return;

    // Subscribe to events table changes
    const eventsChannel = supabase
      .channel(`events:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'events',
        },
        async (payload) => {
          // New event created - add to list
          const newEvent = payload.new as any;
          // Only add if it's a future event
          if (newEvent.date >= new Date().toISOString().split('T')[0]) {
            setEvents((prev) => {
              // Check for duplicates
              if (prev.some((e) => e.id === newEvent.id)) return prev;
              // Add and sort by creation date (newest first)
              const updated = [...prev, newEvent].sort((a, b) => {
                const aCreated = new Date(a.created_at || a.date).getTime();
                const bCreated = new Date(b.created_at || b.date).getTime();
                return bCreated - aCreated; // Descending order (newest first)
              });
              return updated;
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'events',
        },
        async (payload) => {
          // Event updated - update in list
          const updatedEvent = payload.new as any;
          setEvents((prev) =>
            prev.map((e) => (e.id === updatedEvent.id ? { ...e, ...updatedEvent } : e))
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'events',
        },
        async (payload) => {
          // Event deleted - remove from list
          const deletedEventId = payload.old.id;
          setEvents((prev) => prev.filter((e) => e.id !== deletedEventId));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'event_attendees',
        },
        async (payload) => {
          // Attendee joined - update attendee count
          const attendee = payload.new as any;
          setEvents((prev) =>
            prev.map((e) =>
              e.id === attendee.event_id
                ? { ...e, attendee_count: (e.attendee_count || 0) + 1 }
                : e
            )
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'event_attendees',
        },
        async (payload) => {
          // Attendee left - update attendee count
          const attendee = payload.old as any;
          setEvents((prev) =>
            prev.map((e) =>
              e.id === attendee.event_id
                ? { ...e, attendee_count: Math.max((e.attendee_count || 0) - 1, 0) }
                : e
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(eventsChannel);
    };
  }, [user?.id]);

  // Refresh events when screen comes into focus (e.g., after deleting an event)
  useFocusEffect(
    useCallback(() => {
      setAnimationKey(prev => prev + 1); // Re-trigger animations
      fetchEvents();
    }, [fetchEvents])
  );

  // Fetch attendees for all events
  useEffect(() => {
    const fetchAllAttendees = async () => {
      if (events.length === 0) return;

      const attendeesMap: Record<string, Attendee[]> = {};

      // Fetch attendees for each event (limit to first 3 for preview)
      await Promise.all(
        events.map(async (event) => {
          try {
            const { data, error } = await api.getEventAttendees(event.id);
            if (!error && data) {
              const attendees = data
                .slice(0, 3) // Only get first 3 for preview
                .map((a: any) => {
                  const profile = Array.isArray(a.profile) ? a.profile[0] : a.profile;
                  return {
                    id: profile?.id || a.user_id,
                    name: profile?.name || 'Anonymous',
                    avatar_url: profile?.avatar_url,
                  };
                });
              attendeesMap[event.id] = attendees;
            }
          } catch (err) {
            console.error(`Error fetching attendees for event ${event.id}:`, err);
          }
        })
      );

      setEventAttendees(attendeesMap);
    };

    fetchAllAttendees();
  }, [events]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchEvents();
  }, [fetchEvents]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
      month: date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
      day: date.getDate().toString(),
    };
  };

  const formatTime = (dateStr: string, timeStr?: string) => {
    if (timeStr) return timeStr;
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  // Get initials from name
  const getInitials = (name: string) => {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  };

  const filteredEvents = events.filter((event) =>
    event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePickImage = async () => {
    try {
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

      if (!result.canceled && result.assets[0]) {
        setEventImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleCreateEvent = async () => {
    if (!user?.id) {
      Alert.alert('Sign In Required', 'Please sign in to create an event');
      return;
    }

    if (!newEvent.title.trim() || !newEvent.location.trim()) {
      Alert.alert('Error', 'Please fill in title and location');
      return;
    }

    setCreating(true);

    try {
      // Use provided date or default to today
      const eventDate = newEvent.date || new Date().toISOString().split('T')[0];
      // Default time to 6:00 PM if not provided
      const eventTime = '18:00:00';
      
      // Get organizer name from profile or user email
      const organizerName = profile?.name || user.email?.split('@')[0] || 'Event Organizer';
      
      // Create event first
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .insert({
          title: newEvent.title.trim(),
          description: newEvent.description.trim() || 'Join this event and meet fellow students!',
          date: eventDate,
          time: eventTime,
          location: newEvent.location.trim(),
          category: newEvent.category,
          max_attendees: newEvent.max_attendees ? parseInt(newEvent.max_attendees) : null,
          organizer: organizerName,
          is_private: newEvent.is_private,
          organizer_id: user.id,
        })
        .select()
        .single();

      if (eventError) {
        console.error('Error creating event:', eventError);
        
        // Check if error is due to missing columns
        if (eventError.message?.includes('is_private') || eventError.message?.includes('organizer_id') || eventError.message?.includes('column') || eventError.message?.includes('schema cache')) {
          Alert.alert(
            'Database Schema Update Required',
            'The events table is missing required columns. Please run this SQL in your Supabase SQL Editor:\n\n' +
            'ALTER TABLE events ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false;\n' +
            'ALTER TABLE events ADD COLUMN IF NOT EXISTS organizer_id UUID REFERENCES profiles(id) ON DELETE SET NULL;\n\n' +
            'Or see ADD_EVENT_COLUMNS.sql file for the complete script.',
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert('Error', eventError.message || 'Failed to create event. Please try again.');
        }
        return;
      }

      // Upload image if provided
      let imageUrl = null;
      if (eventImageUri && eventData.id) {
        const fileExt = eventImageUri.split('.').pop() || 'jpg';
        const { url, error: uploadError } = await api.uploadEventImage(eventData.id, eventImageUri, fileExt);
        
        if (uploadError) {
          console.error('Error uploading event image:', uploadError);
          // Show user-friendly error message
          if (uploadError.code === 'BUCKET_NOT_FOUND') {
            Alert.alert(
              'Storage Not Configured',
              'The storage bucket for event images is not set up. Please create an "events" bucket in your Supabase Storage. The event was created successfully without an image.',
              [{ text: 'OK' }]
            );
          } else {
            Alert.alert(
              'Upload Failed',
              'Failed to upload event image. The event was created successfully without an image.',
              [{ text: 'OK' }]
            );
          }
          // Continue without image - event is already created
        } else if (url) {
          imageUrl = url;
          // Update event with image URL
          await supabase
            .from('events')
            .update({ image_url: imageUrl })
            .eq('id', eventData.id);
        }
      }

      // Automatically add creator as attendee
      if (eventData.id && user.id) {
        const { error: attendeeError } = await api.joinEvent(eventData.id, user.id);
        if (attendeeError) {
          console.error('Error adding creator as attendee:', attendeeError);
          // Don't fail the event creation if this fails, just log it
        }
      }

      setShowCreateModal(false);
      setNewEvent({
        title: '',
        category: 'social',
        location: '',
        date: '',
        max_attendees: '',
        description: '',
        is_private: false,
      });
      setEventImageUri(null);
      await fetchEvents();
      Alert.alert('Success', 'Event created successfully!');
    } catch (err) {
      console.error('Error:', err);
      Alert.alert('Error', 'Failed to create event');
    } finally {
      setCreating(false);
    }
  };

  const handleJoinEvent = async (eventId: string, isAttending: boolean) => {
    if (!user?.id) {
      Alert.alert('Sign In Required', 'Please sign in to join events');
      return;
    }

    try {
      // Check if user is the organizer
      const event = events.find(e => e.id === eventId);
      if (event?.organizer_id === user.id) {
        Alert.alert('Cannot Join', 'You are the organizer of this event');
        return;
      }

      if (isAttending) {
        await api.leaveEvent(eventId, user.id);
        setEvents((prev) =>
          prev.map((e) =>
            e.id === eventId
              ? { ...e, is_attending: false, attendee_count: e.attendee_count - 1 }
              : e
          )
        );
      } else {
        // Check if event is private
        if (event?.is_private) {
          // Send join request for private events
          const { error } = await api.requestToJoinEvent(eventId, user.id);
          if (error) {
            Alert.alert('Error', error.message || 'Failed to send join request');
            return;
          }
          // Update event to show pending request
          setEvents((prev) =>
            prev.map((e) =>
              e.id === eventId
                ? { ...e, has_pending_request: true }
                : e
            )
          );
          Alert.alert('Request Sent', 'Your request to join this private event has been sent to the organizer.');
        } else {
          // Direct join for public events
          const { error } = await api.joinEvent(eventId, user.id);
          if (error) {
            Alert.alert('Error', error.message || 'Failed to join event');
            return;
          }
          setEvents((prev) =>
            prev.map((e) =>
              e.id === eventId
                ? { ...e, is_attending: true, attendee_count: e.attendee_count + 1 }
                : e
            )
          );
        }
      }
      
      // Refresh attendees for this event
      const { data, error } = await api.getEventAttendees(eventId);
      if (!error && data) {
        const attendees = data
          .slice(0, 3)
          .map((a: any) => {
            const profile = Array.isArray(a.profile) ? a.profile[0] : a.profile;
            return {
              id: profile?.id || a.user_id,
              name: profile?.name || 'Anonymous',
              avatar_url: profile?.avatar_url,
            };
          });
        setEventAttendees((prev) => ({ ...prev, [eventId]: attendees }));
      }
    } catch (err) {
      console.error('Error:', err);
      Alert.alert('Error', 'Failed to update attendance');
    }
  };

  // Use splash screen image as background (same as login page)
  const backgroundSource = require('@/assets/images/splash-screen.png');

  if (loading) {
    return (
      <ImageBackground
        source={backgroundSource}
        style={styles.background}
        resizeMode="cover"
      >
        {/* Blurred Background Overlay */}
        <View style={[styles.blurOverlay, { backgroundColor: isDark ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.1)' }]} />
        
        {/* Gradient Overlay */}
        <LinearGradient
          colors={isDark 
            ? ['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.3)']
            : ['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.05)']}
          style={styles.gradientOverlay}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />

        {/* Bottom gradient */}
        <LinearGradient
          colors={isDark
            ? ['rgba(17,17,16,0)', 'rgba(17,17,16,1)', 'rgba(17,17,16,1)']
            : ['rgba(0,0,0,0)', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.4)']}
          locations={[0, 0.4424, 1]}
          style={styles.bottomGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0066cc" />
            <Text style={[styles.loadingText, { color: isDark ? '#ffffff' : '#1e293b' }]}>Loading events...</Text>
          </View>
        </SafeAreaView>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground
      source={backgroundSource}
      style={styles.background}
      resizeMode="cover"
    >
      {/* Blurred Background Overlay */}
      <View style={[styles.blurOverlay, { backgroundColor: isDark ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.1)' }]} />
      
      {/* Gradient Overlay */}
      <LinearGradient
        colors={isDark 
          ? ['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.3)']
          : ['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.05)']}
        style={styles.gradientOverlay}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />

      {/* Bottom gradient */}
      <LinearGradient
        colors={isDark
          ? ['rgba(17,17,16,0)', 'rgba(17,17,16,1)', 'rgba(17,17,16,1)']
          : ['rgba(0,0,0,0)', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.4)']}
        locations={[0, 0.4424, 1]}
        style={styles.bottomGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <StatusBar style={isDark ? "light" : "dark"} />
      {/* Header */}
      <Animated.View
        key={`events-header-${animationKey}`}
        entering={FadeInDown.duration(400).springify()}
      >
        <PageHeader
          title="Events"
          showBack={false}
          rightAction={
            <TouchableOpacity
              onPress={() => setShowCreateModal(true)}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 8,
                backgroundColor: '#0066cc',
              }}
              activeOpacity={0.8}
            >
              <Plus size={20} color="#ffffff" />
            </TouchableOpacity>
          }
        />
      </Animated.View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#14b8a6" />
        }
      >
        {error ? (
          <View className="items-center justify-center py-12">
            <Calendar size={48} color={isDark ? '#6b7280' : '#9ca3af'} />
            <Text className={`mt-4 text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{error}</Text>
            <TouchableOpacity onPress={onRefresh} className="mt-4 bg-[#14b8a6] px-6 py-2.5 rounded-xl">
              <Text className="text-white font-semibold">Retry</Text>
            </TouchableOpacity>
          </View>
        ) : filteredEvents.length === 0 ? (
          <View className="items-center justify-center py-12">
            <Calendar size={48} color={isDark ? '#6b7280' : '#9ca3af'} />
            <Text className={`mt-4 text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {searchQuery ? 'No events match your search' : 'No upcoming events'}
            </Text>
          </View>
        ) : (
          <View style={{ marginTop: 8 }}>
            {filteredEvents.map((event, index) => (
              <Animated.View
                key={`event-card-${event.id}-${animationKey}`}
                entering={FadeInDown.duration(400).delay(80 * index).springify()}
              >
                <EventCard
                  id={event.id}
                  title={event.title}
                  date={event.date}
                  time={event.time}
                  location={event.location}
                  category={event.category}
                  attendeeCount={event.attendee_count}
                  maxAttendees={event.max_attendees}
                  isAttending={event.is_attending}
                  onPress={() => router.push(`/(tabs)/events/${event.id}` as any)}
                  onJoinPress={() => handleJoinEvent(event.id, event.is_attending)}
                  index={index}
                  imageUrl={event.image_url}
                  isPrivate={event.is_private || false}
                  organizerId={event.organizer_id}
                  hasPendingRequest={event.has_pending_request || false}
                  currentUserId={user?.id}
                />
              </Animated.View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Create Event Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View style={{ borderTopLeftRadius: 24, borderTopRightRadius: 24, backgroundColor: isDark ? 'rgba(30, 41, 59, 0.98)' : 'rgba(255, 255, 255, 0.98)', maxHeight: '90%' }}>
            {/* Modal Header */}
            <View className={`flex-row items-center justify-between px-5 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Create Event
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowCreateModal(false);
                  setEventImageUri(null);
                  setNewEvent({
                    title: '',
                    category: 'social',
                    location: '',
                    date: '',
                    max_attendees: '',
                    description: '',
                    is_private: false,
                  });
                }}
                className="p-2"
              >
                <X size={24} color={isDark ? '#9ca3af' : '#6b7280'} />
              </TouchableOpacity>
            </View>

            <ScrollView className="px-5 py-4">
              {/* Event Title */}
              <View className="mb-4">
                <Text className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Event Title *
                </Text>
                <TextInput
                  className={`px-4 py-3 rounded-xl border ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'}`}
                  placeholder="e.g. Sunday Cooking Club"
                  placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                  value={newEvent.title}
                  onChangeText={(text) => setNewEvent({ ...newEvent, title: text })}
                />
              </View>

              {/* Event Image */}
              <View className="mb-4">
                <Text className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Event Photo (optional)
                </Text>
                <TouchableOpacity
                  onPress={handlePickImage}
                  style={{
                    height: 150,
                    borderRadius: 12,
                    backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
                    borderWidth: 2,
                    borderColor: isDark ? '#334155' : '#e2e8f0',
                    borderStyle: eventImageUri ? 'solid' : 'dashed',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                  }}
                  activeOpacity={0.7}
                >
                  {eventImageUri ? (
                    <Image
                      source={{ uri: eventImageUri }}
                      style={{ width: '100%', height: '100%' }}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={{ alignItems: 'center' }}>
                      <Camera size={32} color={isDark ? '#64748b' : '#94a3b8'} />
                      <Text style={{ marginTop: 8, color: isDark ? '#94a3b8' : '#64748b', fontSize: 14 }}>
                        Tap to add photo
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
                {eventImageUri && (
                  <TouchableOpacity
                    onPress={() => setEventImageUri(null)}
                    style={{ marginTop: 8, alignSelf: 'flex-start' }}
                  >
                    <Text style={{ color: '#ef4444', fontSize: 12 }}>Remove photo</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Category */}
              <View className="mb-4">
                <Text className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Category *
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View className="flex-row gap-2">
                    {eventCategories.map((cat) => (
                      <TouchableOpacity
                        key={cat.id}
                        onPress={() => setNewEvent({ ...newEvent, category: cat.id })}
                        className={`px-4 py-2 rounded-full ${
                          newEvent.category === cat.id
                            ? 'bg-[#14b8a6]'
                            : isDark
                            ? 'bg-gray-800 border border-gray-700'
                            : 'bg-gray-100'
                        }`}
                      >
                        <Text className={newEvent.category === cat.id ? 'text-white font-medium' : isDark ? 'text-gray-300' : 'text-gray-700'}>
                          {cat.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              {/* Location */}
              <View className="mb-4">
                <Text className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Location *
                </Text>
                <TextInput
                  className={`px-4 py-3 rounded-xl border ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'}`}
                  placeholder="e.g. Dorm Common Room"
                  placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                  value={newEvent.location}
                  onChangeText={(text) => setNewEvent({ ...newEvent, location: text })}
                />
              </View>

              {/* Max Attendees */}
              <View className="mb-4">
                <Text className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Max Attendees (optional)
                </Text>
                <TextInput
                  className={`px-4 py-3 rounded-xl border ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'}`}
                  placeholder="Leave empty for unlimited"
                  placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                  keyboardType="numeric"
                  value={newEvent.max_attendees}
                  onChangeText={(text) => setNewEvent({ ...newEvent, max_attendees: text })}
                />
              </View>

              {/* Description */}
              <View className="mb-4">
                <Text className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Description (optional)
                </Text>
                <TextInput
                  className={`px-4 py-3 rounded-xl border ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'}`}
                  placeholder="Tell people what the event is about..."
                  placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  style={{ minHeight: 100 }}
                  value={newEvent.description}
                  onChangeText={(text) => setNewEvent({ ...newEvent, description: text })}
                />
              </View>

              {/* Privacy Toggle */}
              <View className="mb-6">
                <View className="flex-row items-center justify-between py-3">
                  <View className="flex-1">
                    <Text className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Private Event
                    </Text>
                    <Text className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                      {newEvent.is_private 
                        ? 'Users must request to join' 
                        : 'Anyone can join directly'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setNewEvent({ ...newEvent, is_private: !newEvent.is_private })}
                    style={{
                      width: 50,
                      height: 30,
                      borderRadius: 15,
                      backgroundColor: newEvent.is_private ? '#0066cc' : (isDark ? '#374151' : '#d1d5db'),
                      justifyContent: 'center',
                      paddingHorizontal: 2,
                    }}
                    activeOpacity={0.7}
                  >
                    <View
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: 13,
                        backgroundColor: '#ffffff',
                        transform: [{ translateX: newEvent.is_private ? 20 : 0 }],
                      }}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Create Button */}
              <TouchableOpacity
                onPress={handleCreateEvent}
                disabled={creating}
                className={`py-4 rounded-xl items-center mb-6 ${creating ? 'bg-gray-400' : 'bg-[#14b8a6]'}`}
                activeOpacity={0.8}
              >
                {creating ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text className="text-white font-bold text-base">
                    {user ? 'Create Event' : 'Sign in to create'}
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  bottomGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#ffffff',
    fontSize: 16,
  },
});
