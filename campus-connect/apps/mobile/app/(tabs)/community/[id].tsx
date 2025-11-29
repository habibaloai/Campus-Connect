import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Heart, MessageSquare, User, Send, ChevronLeft, Share2, Trash } from 'lucide-react-native';
import { useColorScheme } from '@/components/useColorScheme';
import { useAuth } from '@/providers';
import { api } from '@/lib/supabase';

interface Author {
  id: string;
  name: string;
  avatar_url?: string;
  major?: string;
  year?: string;
}

interface Post {
  id: string;
  title: string;
  content: string;
  category: string;
  likes: number;
  is_liked: boolean;
  created_at: string;
  user_id: string;
  author?: Author;
}

interface Reply {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  author?: Author;
}

const categoryColors: Record<string, string> = {
  Academic: '#1a73e8',
  'Campus Life': '#9c27b0',
  Events: '#f57c00',
  Help: '#43a047',
  General: '#546e7a',
  academic: '#1a73e8',
  campus_life: '#9c27b0',
  events: '#f57c00',
  help: '#43a047',
  general: '#546e7a',
};

export default function PostDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [post, setPost] = useState<Post | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [renderKey, setRenderKey] = useState(0); // Force re-render on iOS
  const lastOptimisticUpdateRef = useRef<{ postId: string; likes: number; timestamp: number } | null>(null);

  // Fetch post and replies
  const fetchData = useCallback(async () => {
    if (!id) return;

    try {
      setError(null);

      // Fetch post using API
      const { data: postsData } = await api.getPosts(user?.id);
      const postData = postsData?.find((p) => p.id === id);

      if (!postData) {
        setError('Post not found');
        return;
      }

      // Check if we have a recent optimistic update (within last 2 seconds)
      const now = Date.now();
      const optimisticUpdate = lastOptimisticUpdateRef.current;
      if (optimisticUpdate && 
          optimisticUpdate.postId === id && 
          (now - optimisticUpdate.timestamp) < 2000) {
        // Don't overwrite recent optimistic update - it's more accurate
        // Only update other fields, preserve likes and is_liked
        setPost((prev) => {
          if (!prev) return postData;
          return {
            ...postData,
            likes: prev.likes, // Keep optimistic likes
            is_liked: prev.is_liked, // Keep optimistic is_liked
          };
        });
      } else {
        // No recent optimistic update, use server data
        setPost(postData);
        // Clear the ref if update is old
        if (optimisticUpdate && optimisticUpdate.postId === id) {
          lastOptimisticUpdateRef.current = null;
        }
      }

      // Fetch replies using API
      const { data: repliesData, error: repliesError } = await api.getComments(id);

      if (repliesError) {
        console.error('Error fetching replies:', repliesError);
      } else {
        setReplies(repliesData || []);
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to load post');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id, user?.id]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);



  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
  }, [fetchData]);

  // Handle like/unlike
  const handleLike = async () => {
    if (!post || !user?.id) return;

    const currentIsLiked = post.is_liked || false;
    const currentLikes = post.likes || 0;

    // Optimistically update UI immediately
    const newLikes = currentIsLiked ? Math.max(currentLikes - 1, 0) : currentLikes + 1;
    setPost((prev) => {
      if (!prev) return null;
      // Create a completely new object to ensure React detects the change
      return {
        ...prev,
        is_liked: !currentIsLiked,
        likes: Number(newLikes), // Ensure it's a number
      };
    });
    // Track optimistic update to prevent fetchData from overwriting it
    lastOptimisticUpdateRef.current = {
      postId: id,
      likes: newLikes,
      timestamp: Date.now(),
    };
    // Force re-render on iOS by updating render key
    setRenderKey((prev) => prev + 1);

    try {
      if (currentIsLiked) {
        // Unlike
        const { error } = await api.unlikePost(post.id, user.id);
        if (error) {
          // Revert optimistic update on error
          setPost((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              is_liked: true,
              likes: currentLikes,
            };
          });
          Alert.alert('Error', error.message || 'Failed to unlike post');
          return;
        }
      } else {
        // Like
        const { error } = await api.likePost(post.id, user.id);
        if (error && error.code !== 'ALREADY_LIKED') {
          // Revert optimistic update on error
          setPost((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              is_liked: false,
              likes: currentLikes,
            };
          });
          Alert.alert('Error', error.message || 'Failed to like post');
          return;
        }
      }

      // Don't refresh immediately - optimistic update is correct
      // The database trigger will update the count, and it will be correct on next natural refresh
      // This prevents the count from "jumping back" to the old value
    } catch (err: any) {
      console.error('Error toggling like:', err);
      // Revert optimistic update on error
      setPost((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          is_liked: currentIsLiked,
          likes: currentLikes,
        };
      });
      Alert.alert('Error', err.message || 'Failed to toggle like');
    }
  };

  // Send reply
  const sendReply = async () => {
    if (!replyText.trim() || !post || !user?.id || sending) return;

    setSending(true);
    const content = replyText.trim();
    setReplyText('');

    try {
      const { data, error } = await api.addComment(post.id, user.id, content);

      if (error) {
        console.error('Error sending reply:', error);
        setReplyText(content);
        Alert.alert('Error', error.message || 'Failed to send reply');
      } else if (data) {
        // Refresh comments to get accurate data from server
        const { data: commentsData } = await api.getComments(post.id);
        if (commentsData) {
          setReplies(commentsData);
          setPost((prev) => (prev ? { ...prev, reply_count: commentsData.length } : null));
        }
      }
    } catch (err: any) {
      console.error('Error:', err);
      setReplyText(content);
      Alert.alert('Error', err.message || 'Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  // Format time ago
  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <SafeAreaView className={`flex-1 items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <ActivityIndicator size="large" color="#1a73e8" />
        <Text className={`mt-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Loading post...</Text>
      </SafeAreaView>
    );
  }

  if (error || !post) {
    return (
      <SafeAreaView className={`flex-1 items-center justify-center px-6 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <MessageSquare size={48} color={isDark ? '#6b7280' : '#9ca3af'} />
        <Text className={`mt-4 text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          {error || 'Post not found'}
        </Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4 bg-blue-500 px-6 py-2 rounded-lg">
          <Text className="text-white font-medium">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const categoryColor = categoryColors[post.category] || '#546e7a';

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: 'Post',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} className="p-2">
              <ChevronLeft size={24} color={isDark ? '#FFFFFF' : '#374151'} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity className="p-2">
              <Share2 size={20} color={isDark ? '#FFFFFF' : '#374151'} />
            </TouchableOpacity>
          ),
        }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
        keyboardVerticalOffset={90}
      >
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1a73e8" />
          }
        >
          {/* Post */}
          <View className={`p-4 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <View className="flex-row items-center mb-4">
              <View className="w-12 h-12 rounded-full bg-primary-100 items-center justify-center overflow-hidden">
                {post.author?.avatar_url ? (
                  <Image
                    source={{ uri: post.author.avatar_url }}
                    className="w-12 h-12 rounded-full"
                    style={{ width: 48, height: 48 }}
                  />
                ) : (
                  <User size={24} color="#1a73e8" />
                )}
              </View>
              <View className="ml-3 flex-1">
                <Text className={`text-base font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {post.author?.name || 'Anonymous'}
                </Text>
                <Text className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  {post.author?.major || 'Student'}
                  {post.author?.year ? ` • ${post.author.year}` : ''}
                  {' • '}
                  {formatTimeAgo(post.created_at)}
                </Text>
              </View>
              <View
                className="px-2 py-1 rounded-full"
                style={{ backgroundColor: categoryColor + '20' }}
              >
                <Text className="text-xs font-medium capitalize" style={{ color: categoryColor }}>
                  {post.category.replace('_', ' ')}
                </Text>
              </View>
            </View>

            <Text className={`text-xl font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {post.title}
            </Text>
            <Text className={`text-base leading-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              {post.content}
            </Text>

            <View className="flex-row items-center mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <TouchableOpacity 
                className="flex-row items-center mr-6" 
                onPress={handleLike}
                key={`like-btn-${post.id}-${renderKey}`}
              >
                <Heart
                  size={20}
                  color={post.is_liked ? '#ef4444' : isDark ? '#9ca3af' : '#6b7280'}
                  fill={post.is_liked ? '#ef4444' : 'none'}
                />
                <Text 
                  key={`likes-text-${post.id}-${renderKey}`}
                  className={`text-base ml-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
                >
                  {String(post.likes ?? 0)}
                </Text>
              </TouchableOpacity>
              <View className="flex-row items-center">
                <MessageSquare size={20} color={isDark ? '#9ca3af' : '#6b7280'} />
                <Text className={`text-base ml-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
                </Text>
              </View>
            </View>
          </View>

          {/* Replies */}
          <View className="p-4">
            <Text className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Replies ({replies.length})
            </Text>

            {replies.length === 0 ? (
              <View className={`p-6 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} items-center`}>
                <MessageSquare size={32} color={isDark ? '#6b7280' : '#9ca3af'} />
                <Text className={`mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  No replies yet. Be the first to reply!
                </Text>
              </View>
            ) : (
              replies.map((reply) => {
                const isOwnComment = reply.author?.id === user?.id;
                return (
                  <View
                    key={reply.id}
                    className={`p-4 rounded-xl mb-3 ${isDark ? 'bg-gray-800' : 'bg-white'}`}
                  >
                    <View className="flex-row items-center mb-2">
                      <View className="w-8 h-8 rounded-full bg-gray-200 items-center justify-center overflow-hidden">
                        {reply.author?.avatar_url ? (
                          <Image
                            source={{ uri: reply.author.avatar_url }}
                            className="w-8 h-8 rounded-full"
                            style={{ width: 32, height: 32 }}
                          />
                        ) : (
                          <User size={16} color="#6b7280" />
                        )}
                      </View>
                      <View className="ml-2 flex-1">
                        <Text className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {reply.author?.name || 'Anonymous'}
                        </Text>
                        <Text className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                          {reply.author?.major || 'Student'} • {formatTimeAgo(reply.created_at)}
                        </Text>
                      </View>
                      {isOwnComment && (
                        <TouchableOpacity
                          onPress={async () => {
                            Alert.alert(
                              'Delete Comment',
                              'Are you sure you want to delete this comment?',
                              [
                                { text: 'Cancel', style: 'cancel' },
                                {
                                  text: 'Delete',
                                  style: 'destructive',
                                  onPress: async () => {
                                    const { error } = await api.deleteComment(reply.id, user!.id);
                                    if (error) {
                                      Alert.alert('Error', error.message || 'Failed to delete comment');
                                    } else {
                                      // Refresh comments to get accurate data from server
                                      const { data: commentsData } = await api.getComments(post.id);
                                      if (commentsData) {
                                        setReplies(commentsData);
                                        setPost((prev) => (prev ? { ...prev, reply_count: commentsData.length } : null));
                                      }
                                    }
                                  },
                                },
                              ]
                            );
                          }}
                          className="p-2"
                        >
                          <Trash size={16} color={isDark ? '#ef4444' : '#dc2626'} />
                        </TouchableOpacity>
                      )}
                    </View>
                    <Text className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      {reply.content}
                    </Text>
                  </View>
                );
              })
            )}
          </View>
        </ScrollView>

        {/* Reply Input */}
        <View
          className={`px-4 py-3 ${isDark ? 'bg-gray-800' : 'bg-white'} border-t ${
            isDark ? 'border-gray-700' : 'border-gray-200'
          }`}
        >
          <View className="flex-row items-end">
            <TextInput
              className={`flex-1 max-h-24 px-4 py-3 rounded-xl ${
                isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'
              }`}
              placeholder="Write a reply..."
              placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
              value={replyText}
              onChangeText={setReplyText}
              multiline
              editable={!sending}
            />
            <TouchableOpacity
              onPress={sendReply}
              disabled={!replyText.trim() || sending}
              className={`ml-2 w-12 h-12 rounded-xl items-center justify-center ${
                replyText.trim() && !sending ? 'bg-primary-500' : isDark ? 'bg-gray-700' : 'bg-gray-200'
              }`}
              activeOpacity={0.8}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Send
                  size={20}
                  color={replyText.trim() ? '#ffffff' : isDark ? '#6b7280' : '#9ca3af'}
                />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
