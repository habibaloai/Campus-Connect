import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  TextInput,
} from 'react-native';
import { router, Stack, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
  ChevronLeft,
  Search,
  Users,
  UserPlus,
  Star,
  MapPin,
  MessageCircle,
  UserCheck,
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useColorScheme } from '@/components/useColorScheme';
import { useAuth } from '@/providers';
import { api, supabase } from '@/lib/supabase';
import { resolveStorageUrl } from '@/lib/resolve-storage-url';
import { Friendship, Follow, Profile } from '@/types';

export default function ConnectionsScreen() {
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [activeTab, setActiveTab] = useState<'friends' | 'following' | 'followers'>('friends');
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [following, setFollowing] = useState<Follow[]>([]);
  const [followers, setFollowers] = useState<Follow[]>([]);
  const [closeFriends, setCloseFriends] = useState<Friendship[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      switch (activeTab) {
        case 'friends':
          const friendsRes = await api.getFriends(user.id);
          if (friendsRes.data) {
            setFriends(friendsRes.data);
            setCloseFriends(friendsRes.data.filter((f: Friendship) => f.is_close_friend));
          }
          break;
        case 'following':
          const followingRes = await api.getFollowing(user.id);
          if (followingRes.data) setFollowing(followingRes.data);
          break;
        case 'followers':
          const followersRes = await api.getFollowers(user.id);
          if (followersRes.data) setFollowers(followersRes.data);
          break;
      }
    } catch (error) {
      console.error('Error loading connections:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id, activeTab]);

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user?.id, activeTab, loadData]);

  // Refresh when screen comes into focus (e.g., after unfriending from profile)
  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        loadData();
      }
    }, [user?.id, loadData])
  );

  // Real-time subscription for friendships changes
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('connections-friendships-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friendships',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          // Reload data when friendships change
          loadData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleUnfriend = async (friendId: string) => {
    if (!user?.id) return;
    await api.removeFriend(user.id, friendId);
    await loadData();
  };

  const handleUnfollow = async (followingId: string) => {
    if (!user?.id) return;
    await api.unfollowUser(user.id, followingId);
    await loadData();
  };

  const filteredFriends = friends.filter((f) => {
    const friend = f.friend as Profile;
    return friend?.name?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const filteredFollowing = following.filter((f) => {
    const followingUser = f.following as Profile;
    return followingUser?.name?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const filteredFollowers = followers.filter((f) => {
    const follower = f.follower as Profile;
    return follower?.name?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const currentData = activeTab === 'friends' 
    ? filteredFriends 
    : activeTab === 'following' 
    ? filteredFollowing 
    : filteredFollowers;

  const renderConnection = (item: any, index: number) => {
    const profile = activeTab === 'friends' 
      ? (item.friend as Profile)
      : activeTab === 'following'
      ? (item.following as Profile)
      : (item.follower as Profile);

    const isCloseFriend = activeTab === 'friends' && (item as Friendship).is_close_friend;

    return (
      <Animated.View
        key={item.id}
        entering={FadeInDown.duration(400).delay(index * 50)}
        className={`rounded-2xl p-4 mb-3 ${isDark ? 'bg-gray-800' : 'bg-white'}`}
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDark ? 0.3 : 0.06,
          shadowRadius: 8,
          elevation: 3,
        }}
      >
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => router.push(`/profile/${profile?.id}`)}
            className="mr-3"
            activeOpacity={0.7}
          >
            <View className={`w-14 h-14 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'} items-center justify-center relative`}>
              {profile?.avatar_url ? (
                <Image
                  source={{ uri: resolveStorageUrl(profile.avatar_url)! }}
                  className="w-14 h-14 rounded-full"
                />
              ) : (
                <Users size={24} color={isDark ? '#9ca3af' : '#6b7280'} />
              )}
              {isCloseFriend && (
                <View className="absolute -top-1 -right-1 bg-yellow-500 rounded-full p-1">
                  <Star size={12} color="#fff" fill="#fff" />
                </View>
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push(`/profile/${profile?.id}`)}
            className="flex-1"
            activeOpacity={0.7}
          >
            <View className="flex-row items-center">
              <Text className={`font-semibold text-base ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {profile?.name || 'Unknown User'}
              </Text>
              {isCloseFriend && (
                <Star size={14} color="#F59E0B" fill="#F59E0B" className="ml-2" />
              )}
            </View>
            {profile?.major && (
              <Text className={`text-sm mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {profile.major} {profile.year ? `• ${profile.year}` : ''}
              </Text>
            )}
            {profile?.availability_status && (
              <View className="flex-row items-center mt-1">
                <View
                  className="w-2 h-2 rounded-full mr-1.5"
                  style={{
                    backgroundColor:
                      profile.availability_status === 'free' || profile.availability_status === 'available'
                        ? '#10B981'
                        : profile.availability_status === 'studying'
                        ? '#3B82F6'
                        : '#EF4444',
                  }}
                />
                <Text className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  {profile.availability_status === 'free' ? 'Free for coffee' :
                   profile.availability_status === 'studying' ? 'Studying - DND' :
                   profile.availability_status === 'available' ? 'Available' :
                   profile.availability_status === 'busy' ? 'Busy' : 'Away'}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <View className="flex-row" style={{ gap: 8 }}>
            <TouchableOpacity
              onPress={() => router.push(`/(tabs)/messages?userId=${profile?.id}`)}
              className={`p-2 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}
            >
              <MessageCircle size={18} color={isDark ? '#9ca3af' : '#6b7280'} />
            </TouchableOpacity>
            {activeTab === 'friends' ? (
              <TouchableOpacity
                onPress={() => handleUnfriend(profile?.id || '')}
                className={`p-2 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}
              >
                <UserCheck size={18} color={isDark ? '#ef4444' : '#dc2626'} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() => handleUnfollow(profile?.id || '')}
                className={`p-2 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}
              >
                <UserPlus size={18} color={isDark ? '#ef4444' : '#dc2626'} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`} edges={['top']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      {/* Header */}
      <View className={`flex-row items-center justify-between px-5 py-4 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
        <View className="flex-row items-center flex-1">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <ChevronLeft size={24} color={isDark ? '#fff' : '#000'} />
          </TouchableOpacity>
          <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Connections
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push('/connections/map')}
          className="p-2"
        >
          <MapPin size={20} color={isDark ? '#fff' : '#000'} />
        </TouchableOpacity>
      </View>

      {/* Tab Switcher */}
      <View className={`px-5 py-3 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
        <View className={`flex-row rounded-xl p-1 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
          {(['friends', 'following', 'followers'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-lg items-center ${
                activeTab === tab ? (isDark ? 'bg-gray-600' : 'bg-white') : ''
              }`}
            >
              <Text
                className={`font-medium capitalize ${
                  activeTab === tab
                    ? isDark
                      ? 'text-white'
                      : 'text-gray-900'
                    : isDark
                    ? 'text-gray-400'
                    : 'text-gray-600'
                }`}
              >
                {tab === 'friends' ? `Friends (${friends.length})` :
                 tab === 'following' ? `Following (${following.length})` :
                 `Followers (${followers.length})`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Search */}
      <View className={`px-5 pb-3 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
        <View className={`flex-row items-center px-4 py-2 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <Search size={18} color={isDark ? '#9ca3af' : '#6b7280'} />
          <TextInput
            placeholder="Search connections..."
            placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
            value={searchQuery}
            onChangeText={setSearchQuery}
            className={`flex-1 ml-3 ${isDark ? 'text-white' : 'text-gray-900'}`}
          />
        </View>
      </View>

      {/* Close Friends Section (only for friends tab) */}
      {activeTab === 'friends' && closeFriends.length > 0 && (
        <View className={`px-5 py-2 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <View className="flex-row items-center mb-2">
            <Star size={16} color="#F59E0B" fill="#F59E0B" />
            <Text className={`text-sm font-semibold ml-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Close Friends ({closeFriends.length})
            </Text>
          </View>
        </View>
      )}

      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-5 py-4">
          {loading ? (
            <View className="items-center justify-center py-20">
              <Text className={isDark ? 'text-gray-400' : 'text-gray-500'}>Loading...</Text>
            </View>
          ) : currentData.length === 0 ? (
            <View className="items-center justify-center py-20">
              <Users size={48} color={isDark ? '#4b5563' : '#9ca3af'} />
              <Text className={`text-lg font-semibold mt-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                No {activeTab} found
              </Text>
            </View>
          ) : (
            currentData.map((item, index) => renderConnection(item, index))
          )}
        </View>
        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}

