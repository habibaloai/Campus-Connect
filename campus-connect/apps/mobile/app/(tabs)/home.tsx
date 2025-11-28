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
import { LinearGradient } from 'expo-linear-gradient';
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

// Stats data with gradient colors
const statsData = [
  { 
    id: 'gpa', 
    label: 'GPA', 
    value: '3.75', 
    icon: TrendingUp, 
    gradient: ['#10b981', '#059669'],
    iconBg: 'rgba(16, 185, 129, 0.2)',
    iconColor: '#ffffff',
  },
  { 
    id: 'credits', 
    label: 'Credits', 
    value: '78', 
    icon: BookOpen, 
    gradient: ['#0066cc', '#0052a3'],
    iconBg: 'rgba(0, 102, 204, 0.2)',
    iconColor: '#ffffff',
  },
  { 
    id: 'balance', 
    label: 'Balance', 
    value: '$156', 
    icon: Wallet, 
    gradient: ['#3b82f6', '#2563eb'],
    iconBg: 'rgba(59, 130, 246, 0.2)',
    iconColor: '#ffffff',
  },
  { 
    id: 'points', 
    label: 'Points', 
    value: '2.4K', 
    icon: Award, 
    gradient: ['#6366f1', '#4f46e5'],
    iconBg: 'rgba(99, 102, 241, 0.2)',
    iconColor: '#ffffff',
  },
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
          {/* Professional Header with Gradient */}
          <Animated.View 
            key={`header-${animationKey}`}
            entering={FadeInDown.duration(500).springify()}
            style={styles.headerContainer}
          >
            <LinearGradient
              colors={isDark ? ['rgba(0, 102, 204, 0.15)', 'rgba(0, 102, 204, 0.05)'] : ['rgba(0, 102, 204, 0.08)', 'rgba(255, 255, 255, 0.95)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.headerGradient}
            >
              <View style={styles.header}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
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
                    <Text style={[styles.headerSubtitle, { color: isDark ? 'rgba(255, 255, 255, 0.8)' : '#64748b' }]}>
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
              </View>
            </LinearGradient>
          </Animated.View>

          {/* Enhanced Greeting Section */}
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
            <LinearGradient
              colors={['#ff6b35', '#f97316']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.streakBadgeGradient}
            >
              <Flame size={16} color="#ffffff" />
              <Text style={styles.streakText}>{streak} day streak</Text>
            </LinearGradient>
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
                  <LinearGradient
                    colors={stat.gradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.statGradient}
                  >
                    {/* Decorative circle pattern */}
                    <View style={styles.statPattern}>
                      <View style={[styles.patternCircle, { top: -20, right: -20 }]} />
                      <View style={[styles.patternCircle, { bottom: -30, left: -30, width: 60, height: 60 }]} />
                    </View>
                    
                    {/* Icon with glow effect */}
                    <View style={[styles.statIconContainer, { backgroundColor: stat.iconBg }]}>
                      <stat.icon size={28} color={stat.iconColor} strokeWidth={2.5} />
                    </View>
                    
                    {/* Value and Label */}
                    <View style={styles.statContent}>
                      <Text style={styles.statValue}>
                        {stat.value}
                      </Text>
                      <Text style={styles.statLabel}>
                        {stat.label}
                      </Text>
                    </View>
                    
                    {/* Subtle shine effect */}
                    <View style={styles.statShine} />
                  </LinearGradient>
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
                  <LinearGradient
                    colors={isDark 
                      ? ['rgba(0, 102, 204, 0.25)', 'rgba(0, 102, 204, 0.15)'] 
                      : ['rgba(255, 255, 255, 0.98)', 'rgba(240, 247, 255, 0.98)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.classGradient}
                  >
                    <View style={styles.classHeader}>
                      {classItem.isNow ? (
                        <LinearGradient
                          colors={['#0066cc', '#0052a3']}
                          style={styles.classTimeBadgeActive}
                        >
                          <Clock size={14} color="#ffffff" />
                          <Text style={styles.classTimeActive}>
                            {classItem.time}
                          </Text>
                        </LinearGradient>
                      ) : (
                        <View style={styles.classTimeBadge}>
                          <Clock size={14} color={isDark ? '#9ca3af' : '#6b7280'} />
                          <Text style={[styles.classTime, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                            {classItem.time}
                          </Text>
                        </View>
                      )}
                      {classItem.isNow && (
                        <LinearGradient
                          colors={['#ef4444', '#dc2626']}
                          style={styles.nowBadge}
                        >
                          <Text style={styles.nowBadgeText}>NOW</Text>
                        </LinearGradient>
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
                  </LinearGradient>
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
                    <LinearGradient
                      colors={isDark 
                        ? ['rgba(0, 102, 204, 0.25)', 'rgba(0, 102, 204, 0.15)'] 
                        : ['rgba(255, 255, 255, 0.98)', 'rgba(240, 247, 255, 0.98)']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.eventGradient}
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
                      <LinearGradient
                        colors={['#0066cc', '#0052a3']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.eventButton}
                      >
                        <TouchableOpacity
                          onPress={() => router.push(`/(tabs)/events/${event.id}`)}
                          style={styles.eventButtonContent}
                        >
                          <Text style={styles.eventButtonText}>View Event</Text>
                          <ArrowRight size={16} color="#ffffff" />
                        </TouchableOpacity>
                      </LinearGradient>
                    </LinearGradient>
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
              style={styles.notificationCard}
            >
              <LinearGradient
                colors={isDark 
                  ? ['rgba(0, 102, 204, 0.25)', 'rgba(0, 102, 204, 0.15)'] 
                  : ['rgba(255, 255, 255, 0.98)', 'rgba(240, 247, 255, 0.98)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.notificationGradient}
              >
                <LinearGradient
                  colors={['#0066cc', '#0052a3']}
                  style={styles.notificationIconContainer}
                >
                  <Bell size={22} color="#ffffff" />
                </LinearGradient>
                <View style={styles.notificationContent}>
                  <Text style={[styles.notificationTitle, { color: isDark ? '#ffffff' : '#1e293b' }]}>
                    {unreadCount > 0 ? `You have ${unreadCount} new notification${unreadCount > 1 ? 's' : ''}` : 'No new notifications'}
                  </Text>
                  <Text style={[styles.notificationSubtext, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                    {unreadCount > 0 ? 'Tap to view all notifications' : 'You\'re all caught up!'}
                  </Text>
                </View>
                <ChevronRight size={20} color={isDark ? '#9ca3af' : '#9ca3af'} />
              </LinearGradient>
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
                { title: 'Community', route: '/(tabs)/community', icon: Users, gradient: ['#00897b', '#00695c'] },
                { title: 'Events', route: '/(tabs)/events', icon: Calendar, gradient: ['#0066cc', '#0052a3'] },
                { title: 'Messages', route: '/(tabs)/messages', icon: MessageCircle, gradient: ['#3b82f6', '#2563eb'] },
                { title: 'Profile', route: '/(tabs)/profile', icon: Users, gradient: ['#6366f1', '#4f46e5'] },
              ].map((action, index) => {
                const Icon = action.icon;
                return (
                  <TouchableOpacity
                    key={action.title}
                    onPress={() => router.push(action.route as any)}
                    style={styles.quickActionCard}
                  >
                    <LinearGradient
                      colors={action.gradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.quickActionGradient}
                    >
                      <View style={styles.quickActionIconContainer}>
                        <Icon size={24} color="#ffffff" strokeWidth={2.5} />
                      </View>
                      <Text style={styles.quickActionText}>
                        {action.title}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Animated.View>

          {/* Sign Out Button */}
          <View style={styles.signOutContainer}>
            <TouchableOpacity
              onPress={signOut}
              style={[styles.signOutButton, isDark && styles.signOutButtonDark]}
            >
              <Text style={[styles.signOutText, { color: isDark ? '#94a3b8' : '#64748b' }]}>
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
  headerContainer: {
    marginBottom: 8,
  },
  headerGradient: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
    borderRadius: 0,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginHorizontal: 0,
  },
  header: {
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
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  notificationButtonDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
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
  streakBadgeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    marginLeft: 12,
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  streakText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
    marginLeft: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  sectionContainer: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 8,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 102, 204, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    marginLeft: 10,
    letterSpacing: -0.4,
  },
  viewAllText: {
    color: '#0066cc',
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 0.2,
  },
  horizontalScrollContent: {
    paddingLeft: 20,
    paddingRight: 4,
    gap: 16,
  },
  statCard: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  statGradient: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 160,
    position: 'relative',
    overflow: 'hidden',
  },
  statPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.15,
  },
  patternCircle: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  statIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  statContent: {
    alignItems: 'center',
    zIndex: 1,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 6,
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  statShine: {
    position: 'absolute',
    top: -50,
    left: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    transform: [{ rotate: '45deg' }],
  },
  classCard: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  classGradient: {
    padding: 24,
    borderRadius: 24,
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
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(241, 245, 249, 0.8)',
  },
  classTimeBadgeActive: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  classTime: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  classTimeActive: {
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 6,
    color: '#ffffff',
  },
  nowBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
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
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  eventGradient: {
    padding: 24,
    borderRadius: 24,
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
    borderRadius: 14,
    marginTop: 12,
    shadowColor: '#0066cc',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  eventButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  eventButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 15,
    marginRight: 8,
    letterSpacing: 0.3,
  },
  notificationCard: {
    marginHorizontal: 20,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  notificationGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 24,
  },
  notificationIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    shadowColor: '#0066cc',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
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
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  quickActionGradient: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  quickActionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  quickActionText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  signOutContainer: {
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 32,
  },
  signOutButton: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    backgroundColor: 'rgba(241, 245, 249, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
  },
  signOutButtonDark: {
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderColor: 'rgba(148, 163, 184, 0.1)',
  },
  signOutText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
