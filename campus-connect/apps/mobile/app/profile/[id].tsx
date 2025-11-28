import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
  ChevronLeft,
  User,
  GraduationCap,
  MapPin,
  Calendar,
  Trophy,
  Users,
  BookOpen,
  Heart,
  Coffee,
  MessageCircle,
  UserPlus,
  UserMinus,
  Star,
  Settings,
  Camera,
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useColorScheme } from '@/components/useColorScheme';
import { useAuth } from '@/providers';
import { api } from '@/lib/supabase';
import { Profile, Friendship, Follow, Achievement, Event, Course } from '@/types';

const { width } = Dimensions.get('window');

export default function UserProfileScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const { user: currentUser } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const isOwnProfile = params.id === currentUser?.id;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isFriend, setIsFriend] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isCloseFriend, setIsCloseFriend] = useState(false);
  const [friendRequestSent, setFriendRequestSent] = useState(false);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [communities, setCommunities] = useState<any[]>([]);

  useEffect(() => {
    if (params.id) {
      loadProfile();
    }
  }, [params.id]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const { data, error } = await api.getProfile(params.id);
      if (data) {
        setProfile(data as Profile);
        await Promise.all([
          checkConnectionStatus(),
          loadAchievements(),
          loadUpcomingEvents(),
          loadCourses(),
          loadCommunities(),
        ]);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkConnectionStatus = async () => {
    if (!currentUser?.id || isOwnProfile) return;

    const [friendsRes, followRes] = await Promise.all([
      api.getFriends(currentUser.id),
      api.checkFollowStatus(currentUser.id, params.id),
    ]);

    if (friendsRes.data) {
      const friendship = friendsRes.data.find((f: Friendship) => f.friend_id === params.id);
      setIsFriend(!!friendship);
      setIsCloseFriend(friendship?.is_close_friend || false);
    }

    if (followRes.data !== undefined) {
      setIsFollowing(followRes.data);
    }

    // Check for pending friend request
    const { data: requests } = await api.getFriendRequests(currentUser.id, 'sent');
    if (requests) {
      const pending = requests.find((r: any) => r.recipient_id === params.id);
      setFriendRequestSent(!!pending);
    }
  };

  const loadAchievements = async () => {
    // Mock data for now - replace with actual API call
    setAchievements([
      { id: '1', name: 'Early Bird', description: 'Attended 10 morning classes', points: 50, unlocked: true },
      { id: '2', name: 'Study Streak', description: '7 days in a row', points: 100, unlocked: true },
    ]);
  };

  const loadUpcomingEvents = async () => {
    // Mock data - replace with actual API call
    setUpcomingEvents([
      { id: '1', title: 'Campus Tour', date: '2024-01-15', time: '10:00', location: 'Main Hall', category: 'social' },
    ]);
  };

  const loadCourses = async () => {
    // Mock data - replace with actual API call
    setCourses([
      { id: '1', code: 'CS101', name: 'Introduction to Computer Science', professor: 'Dr. Smith', credits: 3, difficulty: 3, capacity: 50, semester: 'Fall 2024', category: 'Computer Science' },
    ]);
  };

  const loadCommunities = async () => {
    // Mock data - replace with actual API call
    setCommunities([
      { id: '1', name: 'Computer Science Club' },
      { id: '2', name: 'Photography Society' },
    ]);
  };

  const handleFriendRequest = async () => {
    if (!currentUser?.id) return;

    if (isFriend) {
      // Remove friend
      await api.removeFriend(currentUser.id, params.id);
      setIsFriend(false);
      setIsCloseFriend(false);
    } else if (friendRequestSent) {
      // Cancel request
      const { data: requests } = await api.getFriendRequests(currentUser.id, 'sent');
      const request = requests?.find((r: any) => r.recipient_id === params.id);
      if (request) {
        await api.cancelFriendRequest(request.id, currentUser.id);
        setFriendRequestSent(false);
      }
    } else {
      // Send request
      await api.sendFriendRequest(currentUser.id, params.id);
      setFriendRequestSent(true);
    }
  };

  const handleFollow = async () => {
    if (!currentUser?.id) return;

    if (isFollowing) {
      await api.unfollowUser(currentUser.id, params.id);
      setIsFollowing(false);
    } else {
      await api.followUser(currentUser.id, params.id);
      setIsFollowing(true);
    }
  };

  const handleToggleCloseFriend = async () => {
    if (!currentUser?.id || !isFriend) return;
    await api.toggleCloseFriend(currentUser.id, params.id, !isCloseFriend);
    setIsCloseFriend(!isCloseFriend);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProfile();
    setRefreshing(false);
  };

  const getAvailabilityColor = (status?: string) => {
    switch (status) {
      case 'free':
      case 'available':
        return '#10B981';
      case 'studying':
        return '#3B82F6';
      case 'busy':
        return '#EF4444';
      case 'away':
        return '#F59E0B';
      default:
        return '#6B7280';
    }
  };

  const getAvailabilityText = (status?: string) => {
    switch (status) {
      case 'free':
        return 'Free for coffee';
      case 'available':
        return 'Available';
      case 'studying':
        return 'Studying - DND';
      case 'busy':
        return 'Busy';
      case 'away':
        return 'Away';
      default:
        return 'Offline';
    }
  };

  if (loading && !profile) {
    return (
      <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <View className="flex-1 items-center justify-center">
          <Text className={isDark ? 'text-white' : 'text-gray-900'}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <View className="flex-1 items-center justify-center">
          <Text className={isDark ? 'text-white' : 'text-gray-900'}>Profile not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`} edges={['top']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner */}
        <View className="relative" style={{ height: 200 }}>
          {profile.banner_url ? (
            <Image
              source={{ uri: profile.banner_url }}
              className="w-full h-full"
              resizeMode="cover"
            />
          ) : (
            <View className={`w-full h-full ${isDark ? 'bg-gray-800' : 'bg-blue-500'}`} />
          )}
          
          {/* Header Overlay */}
          <View className="absolute top-0 left-0 right-0 flex-row items-center justify-between p-4">
            <TouchableOpacity
              onPress={() => router.back()}
              className={`p-2 rounded-full ${isDark ? 'bg-gray-900/50' : 'bg-white/50'}`}
            >
              <ChevronLeft size={24} color={isDark ? '#fff' : '#000'} />
            </TouchableOpacity>
            
            {isOwnProfile && (
              <TouchableOpacity
                className={`p-2 rounded-full ${isDark ? 'bg-gray-900/50' : 'bg-white/50'}`}
              >
                <Settings size={20} color={isDark ? '#fff' : '#000'} />
              </TouchableOpacity>
            )}
          </View>

          {/* Availability Status Badge */}
          {profile.availability_status && (
            <View className="absolute bottom-4 left-4">
              <View
                className="px-3 py-1.5 rounded-full flex-row items-center"
                style={{ backgroundColor: getAvailabilityColor(profile.availability_status) }}
              >
                <View className="w-2 h-2 rounded-full bg-white mr-2" />
                <Text className="text-white text-xs font-medium">
                  {getAvailabilityText(profile.availability_status)}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Profile Info */}
        <View className={`px-5 pt-4 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
          <View className="flex-row items-start justify-between mb-4">
            <View className="flex-1">
              {/* Avatar */}
              <View className="relative -mt-12 mb-3">
                <View className={`w-24 h-24 rounded-full ${isDark ? 'bg-gray-800' : 'bg-white'} items-center justify-center border-4 ${isDark ? 'border-gray-900' : 'border-gray-50'}`}>
                  {profile.avatar_url ? (
                    <Image
                      source={{ uri: profile.avatar_url }}
                      className="w-full h-full rounded-full"
                    />
                  ) : (
                    <User size={40} color={isDark ? '#9ca3af' : '#6b7280'} />
                  )}
                </View>
                {isOwnProfile && (
                  <TouchableOpacity
                    className={`absolute bottom-0 right-0 p-2 rounded-full ${isDark ? 'bg-gray-700' : 'bg-blue-500'}`}
                  >
                    <Camera size={16} color="#fff" />
                  </TouchableOpacity>
                )}
              </View>

              <Text className={`text-2xl font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {profile.name}
              </Text>
              
              {profile.major && (
                <View className="flex-row items-center mb-2">
                  <GraduationCap size={14} color={isDark ? '#9ca3af' : '#6b7280'} />
                  <Text className={`text-sm ml-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {profile.major} {profile.year ? `• ${profile.year}` : ''}
                  </Text>
                </View>
              )}

              {profile.bio && (
                <Text className={`text-sm mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {profile.bio}
                </Text>
              )}

              {/* Interests */}
              {profile.interests && profile.interests.length > 0 && (
                <View className="flex-row flex-wrap mb-3" style={{ gap: 6 }}>
                  {profile.interests.map((interest, idx) => (
                    <View
                      key={idx}
                      className={`px-3 py-1 rounded-full ${isDark ? 'bg-gray-800' : 'bg-blue-100'}`}
                    >
                      <Text className={`text-xs ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                        {interest}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>

          {/* Action Buttons */}
          {!isOwnProfile && (
            <View className="flex-row mb-4" style={{ gap: 8 }}>
              <TouchableOpacity
                onPress={handleFriendRequest}
                className={`flex-1 flex-row items-center justify-center py-3 rounded-xl ${
                  isFriend ? (isDark ? 'bg-gray-800' : 'bg-gray-200') : (isDark ? 'bg-blue-600' : 'bg-blue-500')
                }`}
              >
                {isFriend ? (
                  <>
                    <UserMinus size={18} color={isDark ? '#fff' : '#000'} />
                    <Text className={`ml-2 font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Unfriend
                    </Text>
                  </>
                ) : friendRequestSent ? (
                  <>
                    <UserPlus size={18} color={isDark ? '#fff' : '#000'} />
                    <Text className={`ml-2 font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Request Sent
                    </Text>
                  </>
                ) : (
                  <>
                    <UserPlus size={18} color="#fff" />
                    <Text className="ml-2 font-semibold text-white">Add Friend</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleFollow}
                className={`flex-row items-center justify-center py-3 px-4 rounded-xl ${
                  isFollowing ? (isDark ? 'bg-gray-800' : 'bg-gray-200') : (isDark ? 'bg-gray-700' : 'bg-gray-100')
                }`}
              >
                {isFollowing ? (
                  <>
                    <UserMinus size={18} color={isDark ? '#fff' : '#000'} />
                    <Text className={`ml-2 font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Unfollow
                    </Text>
                  </>
                ) : (
                  <>
                    <UserPlus size={18} color={isDark ? '#9ca3af' : '#6b7280'} />
                    <Text className={`ml-2 font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Follow
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                className={`p-3 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}
                onPress={() => router.push(`/(tabs)/messages?userId=${params.id}`)}
              >
                <MessageCircle size={18} color={isDark ? '#9ca3af' : '#6b7280'} />
              </TouchableOpacity>
            </View>
          )}

          {/* Close Friend Toggle */}
          {isFriend && !isOwnProfile && (
            <TouchableOpacity
              onPress={handleToggleCloseFriend}
              className={`flex-row items-center justify-between p-3 rounded-xl mb-4 ${
                isDark ? 'bg-gray-800' : 'bg-white'
              }`}
            >
              <View className="flex-row items-center">
                <Star size={18} color={isCloseFriend ? '#F59E0B' : (isDark ? '#9ca3af' : '#6b7280')} />
                <Text className={`ml-2 font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Close Friend
                </Text>
              </View>
              <View className={`w-12 h-6 rounded-full ${isCloseFriend ? 'bg-yellow-500' : (isDark ? 'bg-gray-700' : 'bg-gray-300')}`}>
                <View
                  className={`w-5 h-5 rounded-full bg-white absolute top-0.5 ${
                    isCloseFriend ? 'right-0.5' : 'left-0.5'
                  }`}
                />
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Course List */}
        {courses.length > 0 && (
          <Animated.View
            entering={FadeInDown.duration(500).delay(100)}
            className={`mx-5 mb-4 rounded-2xl p-4 ${isDark ? 'bg-gray-800' : 'bg-white'}`}
          >
            <View className="flex-row items-center mb-3">
              <BookOpen size={18} color={isDark ? '#9ca3af' : '#6b7280'} />
              <Text className={`text-lg font-semibold ml-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Courses
              </Text>
            </View>
            {courses.map((course) => (
              <View key={course.id} className="mb-2 pb-2" style={{ borderBottomWidth: 1, borderBottomColor: isDark ? '#374151' : '#e5e7eb' }}>
                <Text className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {course.code} - {course.name}
                </Text>
                <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {course.professor}
                </Text>
              </View>
            ))}
          </Animated.View>
        )}

        {/* Achievement Showcase */}
        {achievements.length > 0 && (
          <Animated.View
            entering={FadeInDown.duration(500).delay(200)}
            className={`mx-5 mb-4 rounded-2xl p-4 ${isDark ? 'bg-gray-800' : 'bg-white'}`}
          >
            <View className="flex-row items-center mb-3">
              <Trophy size={18} color={isDark ? '#9ca3af' : '#6b7280'} />
              <Text className={`text-lg font-semibold ml-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Top Achievements
              </Text>
            </View>
            <View className="flex-row flex-wrap" style={{ gap: 8 }}>
              {achievements.slice(0, 6).map((achievement) => (
                <View
                  key={achievement.id}
                  className={`p-3 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-yellow-50'}`}
                  style={{ width: (width - 80) / 3 }}
                >
                  <Trophy size={24} color="#F59E0B" />
                  <Text className={`text-xs font-medium mt-2 ${isDark ? 'text-white' : 'text-gray-900'}`} numberOfLines={1}>
                    {achievement.name}
                  </Text>
                </View>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Joined Communities */}
        {communities.length > 0 && (
          <Animated.View
            entering={FadeInDown.duration(500).delay(300)}
            className={`mx-5 mb-4 rounded-2xl p-4 ${isDark ? 'bg-gray-800' : 'bg-white'}`}
          >
            <View className="flex-row items-center mb-3">
              <Users size={18} color={isDark ? '#9ca3af' : '#6b7280'} />
              <Text className={`text-lg font-semibold ml-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Communities
              </Text>
            </View>
            {communities.map((community) => (
              <View key={community.id} className="mb-2">
                <Text className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {community.name}
                </Text>
              </View>
            ))}
          </Animated.View>
        )}

        {/* Upcoming Events */}
        {upcomingEvents.length > 0 && (
          <Animated.View
            entering={FadeInDown.duration(500).delay(400)}
            className={`mx-5 mb-4 rounded-2xl p-4 ${isDark ? 'bg-gray-800' : 'bg-white'}`}
          >
            <View className="flex-row items-center mb-3">
              <Calendar size={18} color={isDark ? '#9ca3af' : '#6b7280'} />
              <Text className={`text-lg font-semibold ml-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Upcoming Events
              </Text>
            </View>
            {upcomingEvents.map((event) => (
              <View key={event.id} className="mb-2 pb-2" style={{ borderBottomWidth: 1, borderBottomColor: isDark ? '#374151' : '#e5e7eb' }}>
                <Text className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {event.title}
                </Text>
                <View className="flex-row items-center mt-1">
                  <Calendar size={12} color={isDark ? '#9ca3af' : '#6b7280'} />
                  <Text className={`text-xs ml-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {event.date} at {event.time}
                  </Text>
                </View>
              </View>
            ))}
          </Animated.View>
        )}

        {/* Study Statistics (if enabled) */}
        {profile.show_study_stats && profile.study_hours !== undefined && (
          <Animated.View
            entering={FadeInDown.duration(500).delay(500)}
            className={`mx-5 mb-4 rounded-2xl p-4 ${isDark ? 'bg-gray-800' : 'bg-white'}`}
          >
            <View className="flex-row items-center mb-3">
              <BookOpen size={18} color={isDark ? '#9ca3af' : '#6b7280'} />
              <Text className={`text-lg font-semibold ml-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Study Statistics
              </Text>
            </View>
            <Text className={`text-2xl font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {profile.study_hours} hours
            </Text>
            <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Total study time this semester
            </Text>
            {profile.favorite_study_spots && profile.favorite_study_spots.length > 0 && (
              <View className="mt-3">
                <Text className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Favorite Study Spots:
                </Text>
                {profile.favorite_study_spots.map((spot, idx) => (
                  <View key={idx} className="flex-row items-center mb-1">
                    <MapPin size={12} color={isDark ? '#9ca3af' : '#6b7280'} />
                    <Text className={`text-sm ml-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {spot}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </Animated.View>
        )}

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}

