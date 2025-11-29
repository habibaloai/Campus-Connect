import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    Image,
    ActivityIndicator,
    RefreshControl,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import { Search, UserPlus, UserCheck, UserX, MessageCircle, ChevronLeft } from 'lucide-react-native';
import { useAuth } from '@/providers';
import { api, supabase } from '@/lib/supabase';
import { useColorScheme } from '@/components/useColorScheme';

type Tab = 'friends' | 'requests' | 'search';

export default function FriendsScreen() {
    const { user } = useAuth();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const [activeTab, setActiveTab] = useState<Tab>('friends');
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    // Data states
    const [friends, setFriends] = useState<any[]>([]);
    const [requests, setRequests] = useState<any[]>([]);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchFriends = useCallback(async () => {
        if (!user?.id) return;
        try {
            const { data, error } = await api.getFriends(user.id);
            if (error) throw error;
            setFriends(data || []);
        } catch (error) {
            console.error('Error fetching friends:', error);
        }
    }, [user?.id]);

    const fetchRequests = useCallback(async () => {
        if (!user?.id) return;
        try {
            const { data, error } = await api.getFriendRequests(user.id, 'received');
            if (error) throw error;
            setRequests(data || []);
        } catch (error) {
            console.error('Error fetching requests:', error);
        }
    }, [user?.id]);

    const handleSearch = async () => {
        if (!searchQuery.trim() || !user?.id) return;
        setLoading(true);
        try {
            const { data, error } = await api.searchUsers(searchQuery, user.id);
            if (error) throw error;
            setSearchResults(data || []);
        } catch (error) {
            console.error('Error searching users:', error);
            Alert.alert('Error', 'Failed to search users');
        } finally {
            setLoading(false);
        }
    };

    const handleSendRequest = async (recipientId: string) => {
        if (!user?.id) return;
        try {
            const { error } = await api.sendFriendRequest(user.id, recipientId);
            if (error) throw error;
            Alert.alert('Success', 'Friend request sent!');
            // Update search results to show pending status if needed
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to send request');
        }
    };

    const handleRespondToRequest = async (requestId: string, status: 'accepted' | 'rejected') => {
        if (!user?.id) return;
        try {
            const { error } = await api.respondToFriendRequest(requestId, status, user.id);
            if (error) throw error;

            // Refresh lists
            fetchRequests();
            if (status === 'accepted') fetchFriends();
        } catch (error) {
            Alert.alert('Error', 'Failed to respond to request');
        }
    };

    const handleRemoveFriend = async (friendId: string) => {
        if (!user?.id) return;
        Alert.alert(
            'Remove Friend',
            'Are you sure you want to remove this friend?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const { error } = await api.removeFriend(user.id, friendId);
                            if (error) throw error;
                            fetchFriends();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to remove friend');
                        }
                    },
                },
            ]
        );
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await Promise.all([fetchFriends(), fetchRequests()]);
        setRefreshing(false);
    };

    useEffect(() => {
        fetchFriends();
        fetchRequests();
    }, [fetchFriends, fetchRequests]);

    // Refresh when screen comes into focus (e.g., after unfriending someone)
    useFocusEffect(
        useCallback(() => {
            fetchFriends();
            fetchRequests();
        }, [fetchFriends, fetchRequests])
    );

    // Real-time subscription for friend requests and friendships
    useEffect(() => {
        if (!user?.id) return;

        const channel = supabase
            .channel('friends-tab-realtime')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'friend_requests',
                    filter: `recipient_id=eq.${user.id}`,
                },
                (payload) => {
                    console.log('Friend request update in friends tab:', payload);
                    // Reload requests when any change occurs
                    fetchRequests();
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'friend_requests',
                    filter: `requester_id=eq.${user.id}`,
                },
                (payload) => {
                    console.log('Sent friend request update in friends tab:', payload);
                    // Reload requests when any change occurs
                    fetchRequests();
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'friendships',
                    filter: `user_id=eq.${user.id}`,
                },
                (payload) => {
                    console.log('Friendship update in friends tab:', payload);
                    // Reload friends when any change occurs
                    fetchFriends();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user?.id, fetchRequests, fetchFriends]);

    const renderFriendItem = ({ item }: { item: any }) => (
        <View className={`flex-row items-center justify-between p-4 mb-2 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <TouchableOpacity
                onPress={() => router.push(`/profile/${item.friend_id}`)}
                className="flex-row items-center flex-1"
                activeOpacity={0.7}
            >
                <Image
                    source={{ uri: item.friend?.avatar_url || 'https://via.placeholder.com/50' }}
                    className="w-12 h-12 rounded-full bg-gray-200"
                />
                <View className="ml-3 flex-1">
                    <Text className={`font-semibold text-base ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {item.friend?.name || 'Unknown User'}
                    </Text>
                    <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {item.friend?.major || 'Student'}
                    </Text>
                </View>
            </TouchableOpacity>
            <View className="flex-row gap-2">
                <TouchableOpacity
                    onPress={() => router.push(`/messages/${item.friend_id}`)}
                    className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30"
                >
                    <MessageCircle size={20} color="#0066cc" />
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => handleRemoveFriend(item.friend_id)}
                    className="p-2 rounded-full bg-red-100 dark:bg-red-900/30"
                >
                    <UserX size={20} color="#ef4444" />
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderRequestItem = ({ item }: { item: any }) => (
        <View className={`flex-row items-center justify-between p-4 mb-2 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <TouchableOpacity
                onPress={() => router.push(`/profile/${item.requester?.id}`)}
                className="flex-row items-center flex-1"
                activeOpacity={0.7}
            >
                <Image
                    source={{ uri: item.requester?.avatar_url || 'https://via.placeholder.com/50' }}
                    className="w-12 h-12 rounded-full bg-gray-200"
                />
                <View className="ml-3 flex-1">
                    <Text className={`font-semibold text-base ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {item.requester?.name || 'Unknown User'}
                    </Text>
                    <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {item.requester?.major || 'Student'}
                    </Text>
                </View>
            </TouchableOpacity>
            <View className="flex-row gap-2">
                <TouchableOpacity
                    onPress={() => handleRespondToRequest(item.id, 'accepted')}
                    className="p-2 rounded-full bg-green-100 dark:bg-green-900/30"
                >
                    <UserCheck size={20} color="#10b981" />
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => handleRespondToRequest(item.id, 'rejected')}
                    className="p-2 rounded-full bg-red-100 dark:bg-red-900/30"
                >
                    <UserX size={20} color="#ef4444" />
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderSearchItem = ({ item }: { item: any }) => {
        // Check if already friends or request sent (simplified check)
        const isFriend = friends.some(f => f.friend_id === item.id);
        const hasRequest = requests.some(r => r.requester_id === item.id); // Only checking received requests here for simplicity

        return (
            <View className={`flex-row items-center justify-between p-4 mb-2 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                <TouchableOpacity
                    onPress={() => router.push(`/profile/${item.id}`)}
                    className="flex-row items-center flex-1"
                    activeOpacity={0.7}
                >
                    <Image
                        source={{ uri: item.avatar_url || 'https://via.placeholder.com/50' }}
                        className="w-12 h-12 rounded-full bg-gray-200"
                    />
                    <View className="ml-3 flex-1">
                        <Text className={`font-semibold text-base ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {item.name || 'Unknown User'}
                        </Text>
                        <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {item.major || 'Student'}
                        </Text>
                    </View>
                </TouchableOpacity>
                {!isFriend && (
                    <TouchableOpacity
                        onPress={() => handleSendRequest(item.id)}
                        className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30"
                    >
                        <UserPlus size={20} color="#0066cc" />
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    return (
        <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`} edges={['top']}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View className="px-4 py-3 flex-row items-center border-b border-gray-200 dark:border-gray-800">
                <TouchableOpacity onPress={() => router.back()} className="mr-3">
                    <ChevronLeft size={24} color={isDark ? '#fff' : '#000'} />
                </TouchableOpacity>
                <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Friends
                </Text>
            </View>

            {/* Tabs */}
            <View className="flex-row px-4 py-4 gap-2">
                {(['friends', 'requests', 'search'] as Tab[]).map((tab) => (
                    <TouchableOpacity
                        key={tab}
                        onPress={() => setActiveTab(tab)}
                        className={`flex-1 py-2 rounded-full items-center justify-center ${activeTab === tab
                                ? 'bg-blue-600'
                                : isDark ? 'bg-gray-800' : 'bg-gray-200'
                            }`}
                    >
                        <Text
                            className={`font-semibold capitalize ${activeTab === tab
                                    ? 'text-white'
                                    : isDark ? 'text-gray-300' : 'text-gray-600'
                                }`}
                        >
                            {tab}
                            {tab === 'requests' && requests.length > 0 && ` (${requests.length})`}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Content */}
            <View className="flex-1 px-4">
                {activeTab === 'search' && (
                    <View className="mb-4">
                        <View className={`flex-row items-center px-4 py-2 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                            <Search size={20} color={isDark ? '#9ca3af' : '#6b7280'} />
                            <TextInput
                                className={`flex-1 ml-2 py-2 ${isDark ? 'text-white' : 'text-gray-900'}`}
                                placeholder="Search users..."
                                placeholderTextColor={isDark ? '#9ca3af' : '#6b7280'}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                onSubmitEditing={handleSearch}
                                returnKeyType="search"
                            />
                        </View>
                    </View>
                )}

                {activeTab === 'friends' && (
                    <FlatList
                        data={friends}
                        renderItem={renderFriendItem}
                        keyExtractor={(item) => item.id}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                        ListEmptyComponent={
                            <Text className={`text-center mt-10 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                No friends yet. Go to Search to find people!
                            </Text>
                        }
                    />
                )}

                {activeTab === 'requests' && (
                    <FlatList
                        data={requests}
                        renderItem={renderRequestItem}
                        keyExtractor={(item) => item.id}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                        ListEmptyComponent={
                            <Text className={`text-center mt-10 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                No pending requests.
                            </Text>
                        }
                    />
                )}

                {activeTab === 'search' && (
                    <FlatList
                        data={searchResults}
                        renderItem={renderSearchItem}
                        keyExtractor={(item) => item.id}
                        ListEmptyComponent={
                            loading ? (
                                <ActivityIndicator className="mt-10" />
                            ) : (
                                <Text className={`text-center mt-10 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                    {searchQuery ? 'No users found.' : 'Search for students by name.'}
                                </Text>
                            )
                        }
                    />
                )}
            </View>
        </SafeAreaView>
    );
}
