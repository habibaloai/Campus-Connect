import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import BackgroundImage from '@/components/BackgroundImage';
import {
  Bell,
  TrendingUp,
  BookOpen,
  Wallet,
  Award,
  Clock,
  ChevronRight,
  Flame,
  Calendar,
  MessageCircle,
  Users,
  MapPin,
  ArrowRight,
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { useAuth, useNotifications } from '@/providers';
import { useColorScheme } from '@/components/useColorScheme';
import { useFocusEffect } from 'expo-router';
import { api } from '@/lib/supabase';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 80; // 40px padding on each side + gap

// Mock data for today's classes
const todaysClasses = [
  {
    id: '1',
    code: 'CS301',
    name: 'Data Structures & Algorithms',
    location: 'Engineering 201',
    time: '10:00 AM',
    isNow: true,
  },
  {
    id: '2',
    code: 'CS350',
    name: 'Machine Learning Fundamentals',
    location: 'CS Building 302',
    time: '1:00 PM',
    isNow: false,
  },
  {
    id: '3',
    code: 'MATH201',
    name: 'Linear Algebra',
    location: 'Math Building 105',
    time: '3:30 PM',
    isNow: false,
  },
];

// Stats data
const statsData = [
  { id: 'gpa', label: 'GPA', value: '3.75', icon: TrendingUp, color: '#10b981', bgColor: '#d1fae5' },
  { id: 'credits', label: 'Credits', value: '78', icon: BookOpen, color: '#0066cc', bgColor: '#e6f2ff' },
  { id: 'balance', label: 'Balance', value: '$156', icon: Wallet, color: '#f59e0b', bgColor: '#fef3c7' },
  { id: 'points', label: 'Points', value: '2.4K', icon: Award, color: '#ef4444', bgColor: '#fee2e2' },
];

export default function HomeScreen() {
  const { user, profile, signOut } = useAuth();
  const { unreadCount, refreshNotifications } = useNotifications();
  const colorScheme = useColorScheme();
  const [refreshing, setRefreshing] = useState(false);
  const [streak, setStreak] = useState(7);
  const [animationKey, setAnimationKey] = useState(0);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);

  const isDark = colorScheme === 'dark';

  // Reset animation key when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      setAnimationKey((prev) => prev + 1);
    }, [])
  );

  useEffect(() => {
    // Fetch upcoming events
    const fetchEvents = async () => {
      try {
        const { data } = await api.getEvents(user?.id);
        if (data) {
          setUpcomingEvents(data.slice(0, 5)); // Get first 5 events
        }
      } catch (error) {
        console.error('Error fetching events:', error);
      }
    };
    if (user?.id) {
      fetchEvents();
    }
  }, [user?.id]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      refreshNotifications(),
      new Promise((resolve) => setTimeout(resolve, 500)),
    ]);
    setRefreshing(false);
  }, [refreshNotifications]);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const userName = profile?.name || user?.email?.split('@')[0] || 'Student';

  return (
    <BackgroundImage overlayOpacity={isDark ? 0.7 : 0.4}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />
        
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0066cc" />
          }
        >
          {/* Professional Header */}
          <Animated.View 
            key={`header-${animationKey}`}
            entering={FadeInDown.duration(500).springify()}
            style={styles.header}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={styles.logoContainer}>
                <Image 
                  source={require('@/assets/images/tum-logo.png')}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.headerTitle, { color: isDark ? '#ffffff' : '#1e293b' }]}>
                  Campus Connect
                </Text>
                <Text style={[styles.headerSubtitle, { color: isDark ? 'rgba(255, 255, 255, 0.7)' : '#64748b' }]}>
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </Text>
              </View>
            </View>
            
            <TouchableOpacity
              onPress={() => router.push('/notifications')}
              style={[styles.notificationButton, isDark && styles.notificationButtonDark]}
            >
              <Bell size={20} color={isDark ? "#ffffff" : "#1e293b"} />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </Animated.View>

          {/* Greeting Section */}
          <Animated.View 
            key={`greeting-${animationKey}`}
            entering={FadeInDown.duration(500).delay(100).springify()}
            style={styles.greetingSection}
          >
            <View style={styles.greetingContent}>
              <Text style={[styles.greetingText, { color: isDark ? '#ffffff' : '#1e293b' }]}>
                {greeting()}, {userName} 👋
              </Text>
              <Text style={[styles.greetingSubtext, { color: isDark ? 'rgba(255, 255, 255, 0.8)' : '#64748b' }]}>
                Here's your overview for today
              </Text>
            </View>
            <View style={[styles.streakBadge, isDark && styles.streakBadgeDark]}>
              <Flame size={16} color="#f97316" />
              <Text style={styles.streakText}>{streak} day streak</Text>
            </View>
          </Animated.View>

          {/* Horizontal Scrolling Stats */}
          <Animated.View 
            key={`stats-${animationKey}`}
            entering={FadeInDown.duration(500).delay(200).springify()}
            style={styles.sectionContainer}
          >
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScrollContent}
              decelerationRate="fast"
              snapToInterval={CARD_WIDTH + 16}
              snapToAlignment="start"
            >
              {statsData.map((stat, index) => (
                <Animated.View
                  key={`${stat.id}-${animationKey}`}
                  entering={FadeInRight.duration(400).delay(250 + index * 80).springify()}
                  style={[styles.statCard, { width: CARD_WIDTH }]}
                >
                  <View style={[styles.statIconContainer, { backgroundColor: stat.bgColor }]}>
                    <stat.icon size={24} color={stat.color} />
                  </View>
                  <Text style={[styles.statValue, { color: isDark ? '#ffffff' : '#1e293b' }]}>
                    {stat.value}
                  </Text>
                  <Text style={[styles.statLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                    {stat.label}
                  </Text>
                </Animated.View>
              ))}
            </ScrollView>
          </Animated.View>

          {/* Today's Classes - Horizontal Scroll */}
          <Animated.View 
            key={`classes-${animationKey}`}
            entering={FadeInDown.duration(500).delay(300).springify()}
            style={styles.sectionContainer}
          >
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <BookOpen size={20} color={isDark ? '#9ca3af' : '#6b7280'} />
                <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#1e293b' }]}>
                  Today's Classes
                </Text>
              </View>
              <TouchableOpacity onPress={() => router.push('/academics')}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScrollContent}
              decelerationRate="fast"
              snapToInterval={CARD_WIDTH + 16}
              snapToAlignment="start"
            >
              {todaysClasses.map((classItem, index) => (
                <Animated.View
                  key={`${classItem.id}-${animationKey}`}
                  entering={FadeInRight.duration(400).delay(350 + index * 80).springify()}
                  style={[styles.classCard, { width: CARD_WIDTH }]}
                >
                  <View style={styles.classHeader}>
                    <View style={[styles.classTimeBadge, classItem.isNow && styles.classTimeBadgeActive]}>
                      <Clock size={14} color={classItem.isNow ? "#ffffff" : (isDark ? '#9ca3af' : '#6b7280')} />
                      <Text style={[styles.classTime, classItem.isNow && styles.classTimeActive]}>
                        {classItem.time}
                      </Text>
                    </View>
                    {classItem.isNow && (
                      <View style={styles.nowBadge}>
                        <Text style={styles.nowBadgeText}>NOW</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.classCode, { color: isDark ? '#ffffff' : '#1e293b' }]}>
                    {classItem.code}
                  </Text>
                  <Text style={[styles.className, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                    {classItem.name}
                  </Text>
                  <View style={styles.classLocation}>
                    <MapPin size={14} color={isDark ? '#64748b' : '#94a3b8'} />
                    <Text style={[styles.classLocationText, { color: isDark ? '#64748b' : '#94a3b8' }]}>
                      {classItem.location}
                    </Text>
                  </View>
                </Animated.View>
              ))}
            </ScrollView>
          </Animated.View>

          {/* Upcoming Events - Horizontal Scroll */}
          {upcomingEvents.length > 0 && (
            <Animated.View 
              key={`events-${animationKey}`}
              entering={FadeInDown.duration(500).delay(400).springify()}
              style={styles.sectionContainer}
            >
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleContainer}>
                  <Calendar size={20} color={isDark ? '#9ca3af' : '#6b7280'} />
                  <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#1e293b' }]}>
                    Upcoming Events
                  </Text>
                </View>
                <TouchableOpacity onPress={() => router.push('/(tabs)/events')}>
                  <Text style={styles.viewAllText}>View All</Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalScrollContent}
                decelerationRate="fast"
                snapToInterval={CARD_WIDTH + 16}
                snapToAlignment="start"
              >
                {upcomingEvents.map((event, index) => (
                  <Animated.View
                    key={`${event.id}-${animationKey}`}
                    entering={FadeInRight.duration(400).delay(450 + index * 80).springify()}
                    style={[styles.eventCard, { width: CARD_WIDTH }]}
                  >
                    <Text style={[styles.eventTitle, { color: isDark ? '#ffffff' : '#1e293b' }]} numberOfLines={2}>
                      {event.title}
                    </Text>
                    <View style={styles.eventDetails}>
                      <View style={styles.eventDetailRow}>
                        <Calendar size={14} color={isDark ? '#9ca3af' : '#6b7280'} />
                        <Text style={[styles.eventDetailText, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                          {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </Text>
                      </View>
                      <View style={styles.eventDetailRow}>
                        <MapPin size={14} color={isDark ? '#9ca3af' : '#6b7280'} />
                        <Text style={[styles.eventDetailText, { color: isDark ? '#94a3b8' : '#64748b' }]} numberOfLines={1}>
                          {event.location}
                        </Text>
                      </View>
                      <View style={styles.eventDetailRow}>
                        <Users size={14} color={isDark ? '#9ca3af' : '#6b7280'} />
                        <Text style={[styles.eventDetailText, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                          {event.attendee_count || 0} attending
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.eventButton}
                      onPress={() => router.push(`/(tabs)/events/${event.id}`)}
                    >
                      <Text style={styles.eventButtonText}>View Event</Text>
                      <ArrowRight size={16} color="#ffffff" />
                    </TouchableOpacity>
                  </Animated.View>
                ))}
              </ScrollView>
            </Animated.View>
          )}

          {/* Notifications Section */}
          <Animated.View 
            key={`notification-${animationKey}`}
            entering={FadeInDown.duration(500).delay(500).springify()}
            style={styles.sectionContainer}
          >
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <Bell size={20} color={isDark ? '#9ca3af' : '#6b7280'} />
                <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#1e293b' }]}>
                  Notifications
                </Text>
              </View>
              <TouchableOpacity onPress={() => router.push('/notifications')}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() => router.push('/notifications')}
              style={[styles.notificationCard, isDark && styles.notificationCardDark]}
            >
              <View style={[styles.notificationIconContainer, { backgroundColor: '#e6f2ff' }]}>
                <Bell size={22} color="#0066cc" />
              </View>
              <View style={styles.notificationContent}>
                <Text style={[styles.notificationTitle, { color: isDark ? '#ffffff' : '#1e293b' }]}>
                  {unreadCount > 0 ? `You have ${unreadCount} new notification${unreadCount > 1 ? 's' : ''}` : 'No new notifications'}
                </Text>
                <Text style={[styles.notificationSubtext, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                  {unreadCount > 0 ? 'Tap to view all notifications' : 'You\'re all caught up!'}
                </Text>
              </View>
              <ChevronRight size={20} color={isDark ? '#9ca3af' : '#9ca3af'} />
            </TouchableOpacity>
          </Animated.View>

          {/* Quick Actions */}
          <Animated.View 
            key={`actions-${animationKey}`}
            entering={FadeInDown.duration(500).delay(600).springify()}
            style={styles.sectionContainer}
          >
            <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#1e293b', marginBottom: 16, paddingHorizontal: 20 }]}>
              Quick Actions
            </Text>
            
            <View style={styles.quickActionsGrid}>
              {[
                { title: 'Community', route: '/(tabs)/community', icon: Users, color: '#00897b', bgColor: '#e0f2f1' },
                { title: 'Events', route: '/(tabs)/events', icon: Calendar, color: '#0066cc', bgColor: '#e6f2ff' },
                { title: 'Messages', route: '/(tabs)/messages', icon: MessageCircle, color: '#0066cc', bgColor: '#e6f2ff' },
                { title: 'Profile', route: '/(tabs)/profile', icon: Users, color: '#6b7280', bgColor: '#f3f4f6' },
              ].map((action, index) => {
                const Icon = action.icon;
                return (
                  <TouchableOpacity
                    key={action.title}
                    onPress={() => router.push(action.route as any)}
                    style={[styles.quickActionCard, isDark && styles.quickActionCardDark]}
                  >
                    <View style={[styles.quickActionIcon, { backgroundColor: action.bgColor }]}>
                      <Icon size={20} color={action.color} />
                    </View>
                    <Text style={[styles.quickActionText, { color: isDark ? '#ffffff' : '#1e293b' }]}>
                      {action.title}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Animated.View>

          {/* Sign Out Button */}
          <View className="px-5 mt-6">
            <TouchableOpacity
              onPress={signOut}
              className={`py-3.5 rounded-xl items-center ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}
            >
              <Text className={`font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Sign Out
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </BackgroundImage>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logo: {
    width: 40,
    height: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  notificationButtonDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 20,
    height: 20,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  greetingSection: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  greetingContent: {
    flex: 1,
  },
  greetingText: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  greetingSubtext: {
    fontSize: 15,
    fontWeight: '500',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffedd5',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 12,
  },
  streakBadgeDark: {
    backgroundColor: 'rgba(249, 115, 22, 0.2)',
  },
  streakText: {
    color: '#ea580c',
    fontWeight: '600',
    fontSize: 13,
    marginLeft: 6,
  },
  sectionContainer: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 8,
    letterSpacing: -0.3,
  },
  viewAllText: {
    color: '#0066cc',
    fontWeight: '600',
    fontSize: 14,
  },
  horizontalScrollContent: {
    paddingLeft: 20,
    paddingRight: 4,
    gap: 16,
  },
  statCard: {
    padding: 20,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  classCard: {
    padding: 20,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  classHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  classTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  classTimeBadgeActive: {
    backgroundColor: '#0066cc',
  },
  classTime: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
    color: '#6b7280',
  },
  classTimeActive: {
    color: '#ffffff',
  },
  nowBadge: {
    backgroundColor: '#0066cc',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  nowBadgeText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  classCode: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  className: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  classLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  classLocationText: {
    fontSize: 12,
    marginLeft: 6,
  },
  eventCard: {
    padding: 20,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  eventDetails: {
    marginBottom: 16,
  },
  eventDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventDetailText: {
    fontSize: 13,
    marginLeft: 8,
    flex: 1,
  },
  eventButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0066cc',
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  eventButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
    marginRight: 6,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    marginHorizontal: 20,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  notificationCardDark: {
    backgroundColor: 'rgba(30, 41, 59, 0.98)',
  },
  notificationIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  notificationSubtext: {
    fontSize: 13,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
  },
  quickActionCard: {
    width: (SCREEN_WIDTH - 64) / 2, // 20px padding * 2 + 12px gap
    padding: 20,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    alignItems: 'center',
  },
  quickActionCardDark: {
    backgroundColor: 'rgba(30, 41, 59, 0.98)',
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  quickActionText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
