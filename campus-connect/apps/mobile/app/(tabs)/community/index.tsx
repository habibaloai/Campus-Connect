import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import BackgroundImage from '@/components/BackgroundImage';
import {
  Search,
  Plus,
  MessageSquare,
  MessageCircle,
  Heart,
  User,
  Users,
  X,
  Filter,
  Clock,
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { useColorScheme } from '@/components/useColorScheme';
import { useAuth } from '@/providers';
import { api, supabase } from '@/lib/supabase';
import PageHeader from '@/components/ui/PageHeader';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Post {
  id: string;
  title: string;
  content: string;
  category: string;
  likes: number;
  reply_count: number;
  is_liked: boolean;
  created_at: string;
  author: {
    id: string;
    name: string;
    avatar_url?: string;
    major?: string;
    year?: string;
  };
}

const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
  Question: { bg: '#e6f2ff', text: '#0066cc', border: '#99c2ff' },
  question: { bg: '#e6f2ff', text: '#0066cc', border: '#99c2ff' },
  Help: { bg: '#dcfce7', text: '#16a34a', border: '#86efac' },
  help: { bg: '#dcfce7', text: '#16a34a', border: '#86efac' },
  Discussion: { bg: '#fce7f3', text: '#db2777', border: '#f9a8d4' },
  discussion: { bg: '#fce7f3', text: '#db2777', border: '#f9a8d4' },
  Announcement: { bg: '#ffedd5', text: '#ea580c', border: '#fdba74' },
  announcement: { bg: '#ffedd5', text: '#ea580c', border: '#fdba74' },
  Academic: { bg: '#e6f2ff', text: '#0066cc', border: '#99c2ff' },
  academic: { bg: '#e6f2ff', text: '#0066cc', border: '#99c2ff' },
  'Campus Life': { bg: '#f3e8ff', text: '#9333ea', border: '#d8b4fe' },
  campus_life: { bg: '#f3e8ff', text: '#9333ea', border: '#d8b4fe' },
  Events: { bg: '#ffedd5', text: '#ea580c', border: '#fdba74' },
  events: { bg: '#ffedd5', text: '#ea580c', border: '#fdba74' },
  General: { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' },
  general: { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' },
};

const defaultColors = { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' };

const categories = [
  { id: 'all', label: 'All', icon: Filter },
  { id: 'question', label: 'Question', icon: MessageSquare },
  { id: 'help', label: 'Help', icon: Users },
  { id: 'discussion', label: 'Discussion', icon: MessageCircle },
  { id: 'announcement', label: 'Announcement', icon: Users },
];

const postCategories = [
  { id: 'question', label: 'Question' },
  { id: 'help', label: 'Help' },
  { id: 'discussion', label: 'Discussion' },
  { id: 'announcement', label: 'Announcement' },
];

interface NewPostForm {
  title: string;
  content: string;
  category: string;
}

export default function CommunityScreen() {
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [animationKey, setAnimationKey] = useState(0);
  
  const [posts, setPosts] = useState<Post[]>([]);
  
  // Reset animation key when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      setAnimationKey((prev) => prev + 1);
    }, [])
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // Create Post Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newPost, setNewPost] = useState<NewPostForm>({
    title: '',
    content: '',
    category: 'question',
  });

  const fetchPosts = useCallback(async () => {
    try {
      setError(null);
      const { data, error } = await api.getPosts(user?.id);
      
      if (error) {
        console.error('Error fetching posts:', error);
        setError('Failed to load posts');
        return;
      }
      
      setPosts(data || []);
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to load posts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPosts();
  }, [fetchPosts]);

  const handleLike = async (postId: string, isLiked: boolean) => {
    if (!user?.id) return;

    try {
      if (isLiked) {
        await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', user.id);
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId ? { ...p, is_liked: false, likes: p.likes - 1 } : p
          )
        );
      } else {
        await supabase.from('post_likes').insert({ post_id: postId, user_id: user.id });
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId ? { ...p, is_liked: true, likes: p.likes + 1 } : p
          )
        );
      }
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  };

  // Handle reply - start a conversation with the post author
  const handleReply = async (post: Post) => {
    if (!user?.id) {
      Alert.alert('Sign In Required', 'Please sign in to reply');
      return;
    }

    if (!post.author?.id) {
      Alert.alert('Error', 'Cannot find post author');
      return;
    }

    if (post.author.id === user.id) {
      Alert.alert('Info', 'You cannot reply to your own post');
      return;
    }

    setReplyingToId(post.id);

    try {
      const result = await api.createDirectConversation(user.id, post.author.id);

      if (result.error) {
        console.error('Error creating conversation:', result.error);
        Alert.alert('Error', 'Failed to start conversation. Please try again.');
        setReplyingToId(null);
        return;
      }

      if (result.data) {
        router.push(`/(tabs)/messages/${result.data.id}` as any);
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
      Alert.alert('Error', 'Failed to start conversation. Please try again.');
    } finally {
      setReplyingToId(null);
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const filteredPosts = posts.filter((post) => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || 
      post.category.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  const handleCreatePost = async () => {
    if (!user?.id) {
      Alert.alert('Sign In Required', 'Please sign in to create a post');
      return;
    }

    if (!newPost.title.trim()) {
      Alert.alert('Error', 'Please enter a title for your post');
      return;
    }

    if (!newPost.content.trim()) {
      Alert.alert('Error', 'Please enter content for your post');
      return;
    }

    setCreating(true);

    try {
      const { data, error } = await api.createPost(user.id, {
        title: newPost.title.trim(),
        content: newPost.content.trim(),
        category: newPost.category,
      });

      if (error) {
        console.error('Error creating post:', error);
        Alert.alert('Error', 'Failed to create post. Please try again.');
        return;
      }

      setShowCreateModal(false);
      setNewPost({
        title: '',
        content: '',
        category: 'question',
      });

      fetchPosts();
      Alert.alert('Success', 'Your post has been created!');
    } catch (err) {
      console.error('Error:', err);
      Alert.alert('Error', 'Failed to create post');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <BackgroundImage overlayOpacity={isDark ? 0.7 : 0.4}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0066cc" />
            <Text style={[styles.loadingText, { color: isDark ? '#ffffff' : '#1e293b' }]}>Loading posts...</Text>
          </View>
        </SafeAreaView>
      </BackgroundImage>
    );
  }

  return (
    <BackgroundImage overlayOpacity={isDark ? 0.7 : 0.4}>
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        {/* Header */}
        <PageHeader
          title="Community"
          showBack={false}
          rightAction={
            <TouchableOpacity
              onPress={() => setShowCreateModal(true)}
              style={styles.createButton}
              activeOpacity={0.8}
            >
              <Plus size={20} color="#ffffff" />
            </TouchableOpacity>
          }
        />

        {/* Search Bar */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(100).springify()}
          style={styles.searchContainer}
        >
          <View style={[styles.searchBar, isDark && styles.searchBarDark]}>
            <Search size={20} color={isDark ? '#9ca3af' : '#9ca3af'} />
            <TextInput
              style={[styles.searchInput, { color: isDark ? '#ffffff' : '#1e293b' }]}
              placeholder="Search posts..."
              placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </Animated.View>

        {/* Category Filters - Horizontal Scroll */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(150).springify()}
          style={styles.categoryContainer}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScrollContent}
          >
            {categories.map((category) => {
              const isSelected = selectedCategory === category.id;
              const Icon = category.icon;
              return (
                <TouchableOpacity
                  key={category.id}
                  onPress={() => setSelectedCategory(category.id)}
                  style={[
                    styles.categoryChip,
                    isSelected && styles.categoryChipSelected,
                    isDark && !isSelected && styles.categoryChipDark,
                  ]}
                  activeOpacity={0.7}
                >
                  <Icon 
                    size={16} 
                    color={isSelected ? '#ffffff' : (isDark ? '#9ca3af' : '#6b7280')} 
                  />
                  <Text
                    style={[
                      styles.categoryChipText,
                      isSelected && styles.categoryChipTextSelected,
                      { color: isSelected ? '#ffffff' : (isDark ? '#9ca3af' : '#6b7280') },
                    ]}
                  >
                    {category.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </Animated.View>

        {/* Posts List */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0066cc" />
          }
        >
          {error ? (
            <View style={styles.emptyContainer}>
              <Users size={48} color={isDark ? '#6b7280' : '#9ca3af'} />
              <Text style={[styles.emptyText, { color: isDark ? '#94a3b8' : '#64748b' }]}>{error}</Text>
              <TouchableOpacity 
                onPress={onRefresh} 
                style={styles.retryButton}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : filteredPosts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Users size={48} color={isDark ? '#6b7280' : '#9ca3af'} />
              <Text style={[styles.emptyText, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                {searchQuery ? 'No posts match your search' : 'No posts yet. Start the conversation!'}
              </Text>
            </View>
          ) : (
            <View style={styles.postsContainer}>
              {filteredPosts.map((post, index) => {
                const colors = categoryColors[post.category] || defaultColors;
                
                return (
                  <Animated.View
                    key={post.id}
                    entering={FadeInRight.duration(400).delay(80 * index).springify()}
                  >
                    <TouchableOpacity
                      onPress={() => router.push(`/(tabs)/community/${post.id}` as any)}
                      style={[styles.postCard, isDark && styles.postCardDark]}
                      activeOpacity={0.8}
                    >
                      {/* Author Header */}
                      <View style={styles.postHeader}>
                        <View style={styles.authorInfo}>
                          <View style={[styles.avatarContainer, { backgroundColor: colors.bg }]}>
                            {post.author?.avatar_url ? (
                              <Image 
                                source={{ uri: post.author.avatar_url }} 
                                style={styles.avatar}
                              />
                            ) : (
                              <User size={20} color={colors.text} />
                            )}
                          </View>
                          <View style={styles.authorDetails}>
                            <Text style={[styles.authorName, { color: isDark ? '#ffffff' : '#1e293b' }]}>
                              {post.author?.name || 'Anonymous'}
                            </Text>
                            <View style={styles.authorMeta}>
                              <Text style={[styles.authorMetaText, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                                {post.author?.major || 'Student'}
                              </Text>
                              <Text style={[styles.authorMetaText, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                                • {formatTimeAgo(post.created_at)}
                              </Text>
                            </View>
                          </View>
                        </View>
                        <View style={[styles.categoryBadge, { backgroundColor: colors.bg }]}>
                          <Text style={[styles.categoryBadgeText, { color: colors.text }]}>
                            {post.category.replace('_', ' ')}
                          </Text>
                        </View>
                      </View>

                      {/* Post Content */}
                      <Text style={[styles.postTitle, { color: isDark ? '#ffffff' : '#1e293b' }]}>
                        {post.title}
                      </Text>
                      <Text
                        style={[styles.postContent, { color: isDark ? '#94a3b8' : '#64748b' }]}
                        numberOfLines={3}
                      >
                        {post.content}
                      </Text>

                      {/* Post Actions */}
                      <View style={styles.postActions}>
                        <TouchableOpacity
                          onPress={(e) => {
                            e.stopPropagation();
                            handleLike(post.id, post.is_liked);
                          }}
                          style={styles.actionButton}
                        >
                          <Heart 
                            size={18} 
                            color={post.is_liked ? '#ef4444' : (isDark ? '#9ca3af' : '#6b7280')}
                            fill={post.is_liked ? '#ef4444' : 'none'}
                          />
                          <Text style={[styles.actionText, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                            {post.likes}
                          </Text>
                        </TouchableOpacity>
                        
                        <View style={styles.actionButton}>
                          <MessageCircle size={18} color={isDark ? '#9ca3af' : '#6b7280'} />
                          <Text style={[styles.actionText, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                            {post.reply_count}
                          </Text>
                        </View>

                        {post.author?.id !== user?.id && (
                          <TouchableOpacity
                            onPress={(e) => {
                              e.stopPropagation();
                              handleReply(post);
                            }}
                            style={[styles.replyButton, isDark && styles.replyButtonDark]}
                            disabled={replyingToId === post.id}
                          >
                            {replyingToId === post.id ? (
                              <ActivityIndicator size="small" color="#0066cc" />
                            ) : (
                              <>
                                <MessageCircle size={16} color="#0066cc" />
                                <Text style={styles.replyButtonText}>Reply</Text>
                              </>
                            )}
                          </TouchableOpacity>
                        )}
                      </View>
                    </TouchableOpacity>
                  </Animated.View>
                );
              })}
            </View>
          )}
        </ScrollView>

        {/* FAB - Create Post */}
        <TouchableOpacity
          onPress={() => setShowCreateModal(true)}
          style={styles.fab}
          activeOpacity={0.8}
        >
          <Plus size={26} color="#ffffff" strokeWidth={2.5} />
        </TouchableOpacity>

        {/* Create Post Modal */}
        <Modal
          visible={showCreateModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowCreateModal(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContainer}
          >
            <View style={styles.modalOverlay}>
              <View style={[styles.modalContent, isDark && styles.modalContentDark]}>
                {/* Modal Header */}
                <View style={[styles.modalHeader, isDark && styles.modalHeaderDark]}>
                  <Text style={[styles.modalTitle, { color: isDark ? '#ffffff' : '#1e293b' }]}>
                    Create Post
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowCreateModal(false)}
                    style={styles.modalCloseButton}
                  >
                    <X size={24} color={isDark ? '#9ca3af' : '#6b7280'} />
                  </TouchableOpacity>
                </View>

                <ScrollView 
                  style={styles.modalScrollView}
                  keyboardShouldPersistTaps="handled"
                >
                  {/* Post Title */}
                  <View style={styles.modalField}>
                    <Text style={[styles.modalLabel, { color: isDark ? '#e2e8f0' : '#475569' }]}>
                      Title *
                    </Text>
                    <TextInput
                      style={[styles.modalInput, isDark && styles.modalInputDark]}
                      placeholder="What's your question or topic?"
                      placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                      value={newPost.title}
                      onChangeText={(text) => setNewPost({ ...newPost, title: text })}
                      maxLength={100}
                    />
                  </View>

                  {/* Category */}
                  <View style={styles.modalField}>
                    <Text style={[styles.modalLabel, { color: isDark ? '#e2e8f0' : '#475569' }]}>
                      Category *
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View style={styles.categorySelection}>
                        {postCategories.map((cat) => {
                          const colors = categoryColors[cat.id] || defaultColors;
                          const isSelected = newPost.category === cat.id;
                          return (
                            <TouchableOpacity
                              key={cat.id}
                              onPress={() => setNewPost({ ...newPost, category: cat.id })}
                              style={[
                                styles.categorySelectChip,
                                isSelected && { backgroundColor: colors.bg, borderColor: colors.text },
                                isDark && !isSelected && styles.categorySelectChipDark,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.categorySelectText,
                                  { color: isSelected ? colors.text : (isDark ? '#d1d5db' : '#4b5563') },
                                ]}
                              >
                                {cat.label}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </ScrollView>
                  </View>

                  {/* Content */}
                  <View style={styles.modalField}>
                    <Text style={[styles.modalLabel, { color: isDark ? '#e2e8f0' : '#475569' }]}>
                      Content *
                    </Text>
                    <TextInput
                      style={[styles.modalTextArea, isDark && styles.modalInputDark]}
                      placeholder="Share more details about your post..."
                      placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                      multiline
                      numberOfLines={6}
                      textAlignVertical="top"
                      value={newPost.content}
                      onChangeText={(text) => setNewPost({ ...newPost, content: text })}
                    />
                  </View>

                  {/* Create Button */}
                  <TouchableOpacity
                    onPress={handleCreatePost}
                    disabled={creating || !newPost.title.trim() || !newPost.content.trim()}
                    style={[
                      styles.createPostButton,
                      (creating || !newPost.title.trim() || !newPost.content.trim()) && styles.createPostButtonDisabled,
                    ]}
                    activeOpacity={0.8}
                  >
                    {creating ? (
                      <ActivityIndicator color="#ffffff" />
                    ) : (
                      <Text style={styles.createPostButtonText}>
                        Create Post
                      </Text>
                    )}
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </View>
          </KeyboardAvoidingView>
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
    fontSize: 16,
    fontWeight: '500',
  },
  createButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#0066cc',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  searchBarDark: {
    backgroundColor: 'rgba(30, 41, 59, 0.98)',
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    fontWeight: '500',
  },
  categoryContainer: {
    marginBottom: 8,
  },
  categoryScrollContent: {
    paddingHorizontal: 20,
    gap: 10,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 6,
  },
  categoryChipSelected: {
    backgroundColor: '#0066cc',
    borderColor: '#0066cc',
  },
  categoryChipDark: {
    backgroundColor: 'rgba(30, 41, 59, 0.98)',
    borderColor: '#334155',
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  categoryChipTextSelected: {
    color: '#ffffff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 15,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#0066cc',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  postsContainer: {
    gap: 16,
  },
  postCard: {
    padding: 20,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  postCardDark: {
    backgroundColor: 'rgba(30, 41, 59, 0.98)',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  authorDetails: {
    flex: 1,
  },
  authorName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  authorMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorMetaText: {
    fontSize: 12,
    fontWeight: '500',
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  postTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  postContent: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
    gap: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  replyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#e6f2ff',
    gap: 6,
  },
  replyButtonDark: {
    backgroundColor: 'rgba(0, 102, 204, 0.2)',
  },
  replyButtonText: {
    color: '#0066cc',
    fontSize: 13,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    backgroundColor: '#0066cc',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0066cc',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  modalContainer: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    maxHeight: '90%',
  },
  modalContentDark: {
    backgroundColor: 'rgba(30, 41, 59, 0.98)',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  modalHeaderDark: {
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalScrollView: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  modalField: {
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  modalInput: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    fontSize: 15,
    color: '#1e293b',
  },
  modalInputDark: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
    color: '#ffffff',
  },
  modalTextArea: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    fontSize: 15,
    color: '#1e293b',
    minHeight: 120,
  },
  categorySelection: {
    flexDirection: 'row',
    gap: 10,
  },
  categorySelectChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  categorySelectChipDark: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
  },
  categorySelectText: {
    fontSize: 14,
    fontWeight: '600',
  },
  createPostButton: {
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#0066cc',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  createPostButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  createPostButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
