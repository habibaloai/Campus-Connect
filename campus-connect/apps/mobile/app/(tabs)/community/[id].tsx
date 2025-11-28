import React, { useState, useEffect, useCallback } from 'react';
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
import { Heart, MessageSquare, User, Send, ChevronLeft, Share2 } from 'lucide-react-native';
import { useColorScheme } from '@/components/useColorScheme';
import { useAuth } from '@/providers';
import { supabase } from '@/lib/supabase';

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

  // Fetch post and replies
  const fetchData = useCallback(async () => {
    if (!id) return;

    try {
      setError(null);

      // Fetch post
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .select(`
          *,
          author:profiles(id, name, avatar_url, major, year)
        `)
        .eq('id', id)
        .single();

      if (postError) {
        console.error('Error fetching post:', postError);
        setError('Failed to load post');
        return;
      }

      // Check if user liked this post
      if (user?.id) {
        const { data: likeData } = await supabase
          .from('post_likes')
          .select('id')
          .eq('post_id', id)
          .eq('user_id', user.id)
          .single();

        postData.is_liked = !!likeData;
      }

      setPost(postData);

      // Fetch replies
      const { data: repliesData, error: repliesError } = await supabase
        .from('post_replies')
        .select(`
          *,
          author:profiles(id, name, avatar_url, major)
        `)
        .eq('post_id', id)
        .order('created_at', { ascending: true });

      if (!repliesError) {
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

    try {
      if (post.is_liked) {
        // Unlike
        await supabase.from('post_likes').delete().eq('post_id', post.id).eq('user_id', user.id);
        setPost((prev) => (prev ? { ...prev, is_liked: false, likes: prev.likes - 1 } : null));
      } else {
        // Like
        await supabase.from('post_likes').insert({ post_id: post.id, user_id: user.id });
        setPost((prev) => (prev ? { ...prev, is_liked: true, likes: prev.likes + 1 } : null));
      }
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  };

  // Send reply
  const sendReply = async () => {
    if (!replyText.trim() || !post || !user?.id || sending) return;

    setSending(true);
    const content = replyText.trim();
    setReplyText('');

    try {
      const { data, error } = await supabase
        .from('post_replies')
        .insert({
          post_id: post.id,
          user_id: user.id,
          content: content,
        })
        .select(`
          *,
          author:profiles(id, name, avatar_url, major)
        `)
        .single();

      if (error) {
        console.error('Error sending reply:', error);
        setReplyText(content);
        Alert.alert('Error', 'Failed to send reply');
      } else if (data) {
        setReplies((prev) => [...prev, data]);
      }
    } catch (err) {
      console.error('Error:', err);
      setReplyText(content);
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
              <TouchableOpacity className="flex-row items-center mr-6" onPress={handleLike}>
                <Heart
                  size={20}
                  color={post.is_liked ? '#ef4444' : isDark ? '#9ca3af' : '#6b7280'}
                  fill={post.is_liked ? '#ef4444' : 'none'}
                />
                <Text className={`text-base ml-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {post.likes}
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
              replies.map((reply) => (
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
                  </View>
                  <Text className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    {reply.content}
                  </Text>
                </View>
              ))
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
