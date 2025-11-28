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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import BackgroundImage from '@/components/BackgroundImage';
import {
  Calendar,
  CalendarDays,
  MapPin,
  Users,
  Search,
  List,
  Plus,
  X,
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useColorScheme } from '@/components/useColorScheme';
import { useAuth } from '@/providers';
import { api, supabase } from '@/lib/supabase';

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
  Academic: { bg: '#dbeafe', text: '#2563eb' },
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
  });

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
      
      const { data, error } = await supabase
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
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating event:', error);
        Alert.alert('Error', error.message || 'Failed to create event. Please try again.');
        return;
      }

      setShowCreateModal(false);
      setNewEvent({
        title: '',
        category: 'social',
        location: '',
        date: '',
        max_attendees: '',
        description: '',
      });
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
        await api.joinEvent(eventId, user.id);
        setEvents((prev) =>
          prev.map((e) =>
            e.id === eventId
              ? { ...e, is_attending: true, attendee_count: e.attendee_count + 1 }
              : e
          )
        );
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

  if (loading) {
    return (
      <BackgroundImage>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={styles.loadingText}>Loading events...</Text>
          </View>
        </SafeAreaView>
      </BackgroundImage>
    );
  }

  return (
    <BackgroundImage>
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      {/* Header with Create Event and View Toggle */}
      <Animated.View
        entering={FadeInDown.duration(400).springify()}
        className="px-5 py-3"
      >
        <View className="flex-row items-center justify-between mb-3">
          {/* Create Event Button */}
          <TouchableOpacity
            onPress={() => setShowCreateModal(true)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingVertical: 10,
              backgroundColor: '#3b82f6',
              borderRadius: 12,
              shadowColor: '#3b82f6',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 5,
            }}
            activeOpacity={0.8}
          >
            <Plus size={18} color="#ffffff" strokeWidth={2.5} />
            <Text style={{ color: '#ffffff', fontWeight: '600', marginLeft: 6 }}>Create Event</Text>
          </TouchableOpacity>

          {/* View Toggle */}
          <View style={{ flexDirection: 'row', backgroundColor: isDark ? 'rgba(30, 41, 59, 0.3)' : 'rgba(255, 255, 255, 0.3)', borderRadius: 12, padding: 4 }}>
            <TouchableOpacity
              onPress={() => setViewMode('list')}
              className={`flex-row items-center px-3 py-1.5 rounded-md ${
                viewMode === 'list' ? 'bg-[#14b8a6]' : ''
              }`}
              activeOpacity={0.7}
            >
              <List size={16} color={viewMode === 'list' ? '#ffffff' : '#6b7280'} />
              <Text className={`ml-1.5 text-sm font-medium ${viewMode === 'list' ? 'text-white' : 'text-gray-600'}`}>
                List
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setViewMode('calendar')}
              className={`flex-row items-center px-3 py-1.5 rounded-md ${
                viewMode === 'calendar' ? 'bg-[#14b8a6]' : ''
              }`}
              activeOpacity={0.7}
            >
              <CalendarDays size={16} color={viewMode === 'calendar' ? '#ffffff' : '#6b7280'} />
              <Text className={`ml-1.5 text-sm font-medium ${viewMode === 'calendar' ? 'text-white' : 'text-gray-600'}`}>
                Calendar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
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
          <View className="mt-2">
            {filteredEvents.map((event, index) => {
              const colors = categoryColors[event.category] || defaultColors;
              const { month, day } = formatDate(event.date);
              
              return (
                <Animated.View
                  key={event.id}
                  entering={FadeInDown.duration(400).delay(80 * index).springify()}
                >
                  <TouchableOpacity
                    onPress={() => router.push(`/(tabs)/events/${event.id}` as any)}
                    style={{
                      marginBottom: 16,
                      borderRadius: 24,
                      overflow: 'hidden',
                      backgroundColor: isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: isDark ? 0.3 : 0.15,
                      shadowRadius: 12,
                      elevation: 6,
                    }}
                    activeOpacity={0.8}
                  >
                    {/* Event Header with Date and Icon */}
                    <View style={{ padding: 16, backgroundColor: '#f8fafc' }}>
                      <View className="flex-row items-start">
                        {/* Date Badge */}
                        <View className="bg-white rounded-lg p-2 mr-4 items-center" style={{ minWidth: 50 }}>
                          <Text className="text-xs font-semibold text-[#14b8a6]">{month}</Text>
                          <Text className="text-2xl font-bold text-gray-900">{day}</Text>
                        </View>
                        
                        {/* Calendar Icon */}
                        <View className="flex-1 items-center justify-center py-2">
                          <CalendarDays size={40} color="#14b8a6" strokeWidth={1.5} />
                        </View>
                      </View>
                    </View>

                    {/* Event Content */}
                    <View className="p-4">
                      <Text
                        className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}
                        numberOfLines={1}
                      >
                        {event.title}
                      </Text>

                      <View className="flex-row items-center">
                        <MapPin size={14} color="#14b8a6" />
                        <Text className="text-sm ml-1.5 text-[#14b8a6] font-medium">
                          {event.location}
                        </Text>
                      </View>

                      {/* Attendee Avatars */}
                      <View className="flex-row items-center mt-3">
                        {eventAttendees[event.id] && eventAttendees[event.id].length > 0 ? (
                          <>
                            {eventAttendees[event.id].map((attendee, i) => (
                              <View
                                key={attendee.id}
                                className="w-8 h-8 rounded-full bg-[#14b8a6] items-center justify-center border-2 border-white"
                                style={{ marginLeft: i > 0 ? -10 : 0 }}
                              >
                                <Text className="text-white text-xs font-semibold">
                                  {getInitials(attendee.name)}
                                </Text>
                              </View>
                            ))}
                            {event.attendee_count > eventAttendees[event.id].length && (
                              <Text className={`ml-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                +{event.attendee_count - eventAttendees[event.id].length}
                              </Text>
                            )}
                          </>
                        ) : event.attendee_count > 0 ? (
                          // Fallback: show placeholder if attendees not loaded yet
                          Array.from({ length: Math.min(event.attendee_count, 3) }).map((_, i) => (
                            <View
                              key={i}
                              className="w-8 h-8 rounded-full bg-[#14b8a6] items-center justify-center border-2 border-white"
                              style={{ marginLeft: i > 0 ? -10 : 0 }}
                            >
                              <Text className="text-white text-xs font-semibold">?</Text>
                            </View>
                          ))
                        ) : null}
                      </View>

                      {/* Action Buttons */}
                      <View className="flex-row items-center mt-4">
                        <TouchableOpacity
                          onPress={(e) => {
                            e.stopPropagation();
                            handleJoinEvent(event.id, event.is_attending);
                          }}
                          className={`flex-1 py-3 rounded-xl items-center ${
                            event.is_attending ? 'bg-green-500' : 'bg-[#f97316]'
                          }`}
                          activeOpacity={0.8}
                        >
                          <Text className="text-white font-semibold">
                            {event.is_attending ? 'Joined ✓' : 'Join Event'}
                          </Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                          onPress={() => router.push(`/(tabs)/events/${event.id}` as any)}
                          className={`ml-2 w-12 h-12 rounded-xl items-center justify-center ${
                            isDark ? 'bg-gray-700' : 'bg-gray-100'
                          }`}
                          activeOpacity={0.7}
                        >
                          <Users size={20} color={isDark ? '#9ca3af' : '#6b7280'} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
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
                onPress={() => setShowCreateModal(false)}
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
              <View className="mb-6">
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
    </BackgroundImage>
  );
}

const styles = StyleSheet.create({
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
