import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft, MapPin, Navigation } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useColorScheme } from '@/components/useColorScheme';
import { useAuth } from '@/providers';
import { api } from '@/lib/supabase';
import { resolveStorageUrl } from '@/lib/resolve-storage-url';
import { FriendLocation, Profile } from '@/types';
import { openNavigation } from '@/lib/maps';

export default function FriendMapScreen() {
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [friendLocations, setFriendLocations] = useState<FriendLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadFriendLocations();
    }
  }, [user?.id]);

  const loadFriendLocations = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const { data, error } = await api.getFriendLocations(user.id);
      if (data) {
        setFriendLocations(data);
      }
    } catch (error) {
      console.error('Error loading friend locations:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFriendLocations();
    setRefreshing(false);
  };

  const handleNavigate = (location: FriendLocation) => {
    if (location.latitude && location.longitude) {
      openNavigation({
        name: location.location_name || 'Friend Location',
        latitude: location.latitude,
        longitude: location.longitude,
      });
    }
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
            Friend Map
          </Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View className="flex-1 items-center justify-center py-20">
            <Text className={isDark ? 'text-gray-400' : 'text-gray-500'}>Loading friend locations...</Text>
          </View>
        ) : friendLocations.length === 0 ? (
          <View className="flex-1 items-center justify-center py-20 px-5">
            <MapPin size={48} color={isDark ? '#4b5563' : '#9ca3af'} />
            <Text className={`text-lg font-semibold mt-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              No friends sharing location
            </Text>
            <Text className={`text-sm mt-2 text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              Friends can share their location in their profile settings
            </Text>
          </View>
        ) : (
          <View className="px-5 py-4">
            {friendLocations.map((location, index) => {
              const friend = location.user as Profile;
              
              return (
                <Animated.View
                  key={location.id}
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
                      onPress={() => router.push(`/profile/${friend?.id}`)}
                      className="mr-3"
                    >
                      <View className={`w-14 h-14 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'} items-center justify-center`}>
                        {friend?.avatar_url ? (
                          <Image
                            source={{ uri: resolveStorageUrl(friend.avatar_url)! }}
                            className="w-14 h-14 rounded-full"
                          />
                        ) : (
                          <MapPin size={24} color={isDark ? '#9ca3af' : '#6b7280'} />
                        )}
                      </View>
                    </TouchableOpacity>

                    <View className="flex-1">
                      <Text className={`font-semibold text-base ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {friend?.name || 'Unknown User'}
                      </Text>
                      {location.location_name && (
                        <View className="flex-row items-center mt-1">
                          <MapPin size={12} color={isDark ? '#9ca3af' : '#6b7280'} />
                          <Text className={`text-sm ml-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {location.location_name}
                          </Text>
                        </View>
                      )}
                      <Text className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        Updated {new Date(location.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>

                    {location.latitude && location.longitude && (
                      <TouchableOpacity
                        onPress={() => handleNavigate(location)}
                        className={`p-2 rounded-full ${isDark ? 'bg-blue-600' : 'bg-blue-500'}`}
                      >
                        <Navigation size={18} color="#fff" />
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

