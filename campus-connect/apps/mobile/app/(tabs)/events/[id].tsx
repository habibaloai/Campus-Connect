import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Image,
} from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, MapPin, Users, Clock, ChevronLeft, Share2, Check, X, MessageCircle } from 'lucide-react-native';
import { useColorScheme } from '@/components/useColorScheme';
import { useAuth } from '@/providers';
import { api } from '@/lib/supabase';

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
}

interface Attendee {
  id: string;
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
  Academic: { bg: '#dbeafe', text: '#2563eb' },
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

  // Fetch attendees when event is loaded
  useEffect(() => {
    if (event?.id) {
      fetchAttendees();
      if (event.organizer_id) {
        fetchOrganizer(event.organizer_id);
      }
    }
  }, [event?.id, event?.organizer_id, fetchAttendees, fetchOrganizer]);

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
      } else {
        // RSVP to event
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
    } catch (err) {
      console.error('RSVP error:', err);
      Alert.alert('Error', 'Something went wrong');
    } finally {
      setRsvpLoading(false);
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

    try {
      const result = await api.createDirectConversation(user.id, userId);
      if (result.error) {
        console.error('Error creating conversation:', result.error);
        Alert.alert('Error', 'Failed to start conversation');
        return;
      }
      if (result.data) {
        router.push(`/(tabs)/messages/${result.data.id}`);
      }
    } catch (err) {
      console.error('Error:', err);
      Alert.alert('Error', 'Failed to start conversation');
    }
  };

  // Format date and time
  const formatDateTime = (dateStr: string, timeStr?: string) => {
    const date = new Date(dateStr);
    const dateFormatted = date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
    
    let timeFormatted = timeStr;
    if (!timeFormatted) {
      timeFormatted = date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    }
    
    return `${dateFormatted} at ${timeFormatted}`;
  };

  // Get initials from name
  const getInitials = (name: string) => {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  };

  if (loading) {
    return (
      <SafeAreaView className={`flex-1 items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <ActivityIndicator size="large" color="#1a73e8" />
        <Text className={`mt-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Loading event...</Text>
      </SafeAreaView>
    );
  }

  if (error || !event) {
    return (
      <SafeAreaView className={`flex-1 items-center justify-center px-6 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <Calendar size={48} color={isDark ? '#6b7280' : '#9ca3af'} />
        <Text className={`mt-4 text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          {error || 'Event not found'}
        </Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4 bg-blue-500 px-6 py-2 rounded-lg">
          <Text className="text-white font-medium">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const categoryStyle = categoryColors[event.category] || { bg: '#f1f5f9', text: '#64748b' };
  const organizerName = organizer?.name || event.organizer || 'Event Organizer';

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-[#f8fafc]'}`} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: '',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} className="p-2">
              <ChevronLeft size={24} color={isDark ? '#FFFFFF' : '#374151'} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity className="p-2">
              <X size={20} color={isDark ? '#FFFFFF' : '#374151'} />
            </TouchableOpacity>
          ),
          headerStyle: { backgroundColor: isDark ? '#1f2937' : '#ffffff' },
          headerShadowVisible: false,
        }}
      />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1a73e8" />
        }
      >
        {/* Modal-like Content Card */}
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
            <Text className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Attendees ({event.attendee_count})
            </Text>
            
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
                    className={`flex-row items-center py-3 ${isDark ? 'border-gray-700' : 'border-gray-100'}`}
                    style={{ borderBottomWidth: 1, borderBottomColor: isDark ? '#374151' : '#f3f4f6' }}
                  >
                    {/* Avatar */}
                    <View className="w-10 h-10 rounded-full bg-[#14b8a6] items-center justify-center overflow-hidden">
                      {attendee.avatar_url ? (
                        <Image
                          source={{ uri: attendee.avatar_url }}
                          className="w-10 h-10 rounded-full"
                          style={{ width: 40, height: 40 }}
                        />
                      ) : (
                        <Text className="text-white font-semibold text-base">
                          {getInitials(attendee.name)}
                        </Text>
                      )}
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
                    
                    {/* Message Button (only for other users) */}
                    {user && attendee.id !== user.id && (
                      <TouchableOpacity
                        onPress={() => handleMessageUser(attendee.id, attendee.name)}
                        className={`w-9 h-9 rounded-full items-center justify-center ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}
                      >
                        <MessageCircle size={18} color={isDark ? '#9ca3af' : '#6b7280'} />
                      </TouchableOpacity>
                    )}
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

          {/* Join Button */}
          <View className="px-5 py-5">
            <TouchableOpacity
              onPress={handleRSVP}
              disabled={rsvpLoading}
              className={`py-4 rounded-xl items-center flex-row justify-center ${
                event.is_attending ? 'bg-gray-200' : 'bg-[#14b8a6]'
              }`}
              activeOpacity={0.8}
            >
              {rsvpLoading ? (
                <ActivityIndicator size="small" color={event.is_attending ? '#374151' : '#ffffff'} />
              ) : (
                <>
                  {event.is_attending && <Check size={20} color="#374151" style={{ marginRight: 8 }} />}
                  <Text
                    className={`font-semibold text-base ${event.is_attending ? 'text-gray-700' : 'text-white'}`}
                  >
                    {event.is_attending ? 'Leave Event' : 'Join Event'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
