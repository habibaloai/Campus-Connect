import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  Alert,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
  ChevronLeft,
  UserPlus,
  UserCheck,
  UserX,
  X,
  Check,
  Clock,
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useColorScheme } from '@/components/useColorScheme';
import { useAuth } from '@/providers';
import { api } from '@/lib/supabase';
import { FriendRequest, Profile } from '@/types';

export default function FriendRequestsScreen() {
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [receivedRequests, setReceivedRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadRequests();
    }
  }, [user?.id, activeTab]);

  const loadRequests = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const [receivedRes, sentRes] = await Promise.all([
        api.getFriendRequests(user.id, 'received'),
        api.getFriendRequests(user.id, 'sent'),
      ]);

      if (receivedRes.data) {
        setReceivedRequests(receivedRes.data);
      }
      if (sentRes.data) {
        setSentRequests(sentRes.data);
      }
    } catch (error) {
      console.error('Error loading friend requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRequests();
    setRefreshing(false);
  };

  const handleAccept = async (requestId: string) => {
    if (!user?.id) return;

    try {
      const { error } = await api.respondToFriendRequest(requestId, 'accepted', user.id);
      if (error) {
        Alert.alert('Error', 'Failed to accept friend request');
        return;
      }
      await loadRequests();
    } catch (error) {
      Alert.alert('Error', 'Failed to accept friend request');
    }
  };

  const handleReject = async (requestId: string) => {
    if (!user?.id) return;

    try {
      const { error } = await api.respondToFriendRequest(requestId, 'rejected', user.id);
      if (error) {
        Alert.alert('Error', 'Failed to reject friend request');
        return;
      }
      await loadRequests();
    } catch (error) {
      Alert.alert('Error', 'Failed to reject friend request');
    }
  };

  const handleCancel = async (requestId: string) => {
    if (!user?.id) return;

    try {
      const { error } = await api.cancelFriendRequest(requestId, user.id);
      if (error) {
        Alert.alert('Error', 'Failed to cancel friend request');
        return;
      }
      await loadRequests();
    } catch (error) {
      Alert.alert('Error', 'Failed to cancel friend request');
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const requests = activeTab === 'received' ? receivedRequests : sentRequests;
  const emptyMessage = activeTab === 'received'
    ? 'No pending friend requests'
    : 'No sent friend requests';

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
            Friend Requests
          </Text>
        </View>
      </View>

      {/* Tab Switcher */}
      <View className={`px-5 py-3 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
        <View className={`flex-row rounded-xl p-1 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
          <TouchableOpacity
            onPress={() => setActiveTab('received')}
            className={`flex-1 py-2 rounded-lg items-center ${
              activeTab === 'received' ? (isDark ? 'bg-gray-600' : 'bg-white') : ''
            }`}
          >
            <Text
              className={`font-medium ${
                activeTab === 'received'
                  ? isDark
                    ? 'text-white'
                    : 'text-gray-900'
                  : isDark
                  ? 'text-gray-400'
                  : 'text-gray-600'
              }`}
            >
              Received {receivedRequests.length > 0 && `(${receivedRequests.length})`}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('sent')}
            className={`flex-1 py-2 rounded-lg items-center ${
              activeTab === 'sent' ? (isDark ? 'bg-gray-600' : 'bg-white') : ''
            }`}
          >
            <Text
              className={`font-medium ${
                activeTab === 'sent'
                  ? isDark
                    ? 'text-white'
                    : 'text-gray-900'
                  : isDark
                  ? 'text-gray-400'
                  : 'text-gray-600'
              }`}
            >
              Sent {sentRequests.length > 0 && `(${sentRequests.length})`}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View className="flex-1 items-center justify-center py-20">
            <Text className={isDark ? 'text-gray-400' : 'text-gray-500'}>Loading...</Text>
          </View>
        ) : requests.length === 0 ? (
          <View className="flex-1 items-center justify-center py-20 px-5">
            <UserPlus size={48} color={isDark ? '#4b5563' : '#9ca3af'} />
            <Text className={`text-lg font-semibold mt-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              {emptyMessage}
            </Text>
          </View>
        ) : (
          <View className="px-5 py-4">
            {requests.map((request, index) => {
              const profile = activeTab === 'received' 
                ? (request.requester as Profile)
                : (request.recipient as Profile);

              return (
                <Animated.View
                  key={request.id}
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
                    {/* Avatar */}
                    <TouchableOpacity
                      onPress={() => router.push(`/profile/${profile?.id}`)}
                      className="mr-3"
                    >
                      <View className={`w-14 h-14 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'} items-center justify-center`}>
                        {profile?.avatar_url ? (
                          <Image
                            source={{ uri: profile.avatar_url }}
                            className="w-14 h-14 rounded-full"
                          />
                        ) : (
                          <UserPlus size={24} color={isDark ? '#9ca3af' : '#6b7280'} />
                        )}
                      </View>
                    </TouchableOpacity>

                    {/* Info */}
                    <View className="flex-1">
                      <Text className={`font-semibold text-base ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {profile?.name || 'Unknown User'}
                      </Text>
                      {profile?.major && (
                        <Text className={`text-sm mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {profile.major} {profile.year ? `• ${profile.year}` : ''}
                        </Text>
                      )}
                      <View className="flex-row items-center mt-1">
                        <Clock size={12} color={isDark ? '#6b7280' : '#9ca3af'} />
                        <Text className={`text-xs ml-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                          {formatTimeAgo(request.created_at)}
                        </Text>
                      </View>
                    </View>

                    {/* Actions */}
                    {activeTab === 'received' ? (
                      <View className="flex-row" style={{ gap: 8 }}>
                        <TouchableOpacity
                          onPress={() => handleReject(request.id)}
                          className={`p-2 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}
                        >
                          <X size={18} color={isDark ? '#ef4444' : '#dc2626'} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleAccept(request.id)}
                          className={`p-2 rounded-full ${isDark ? 'bg-blue-600' : 'bg-blue-500'}`}
                        >
                          <Check size={18} color="#fff" />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity
                        onPress={() => handleCancel(request.id)}
                        className={`px-4 py-2 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}
                      >
                        <Text className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          Cancel
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </Animated.View>
              );
            })}
          </View>
        )}
        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}

