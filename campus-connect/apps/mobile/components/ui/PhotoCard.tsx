import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Modal, ScrollView, TextInput, Alert } from 'react-native';
import { Heart, MessageCircle, Trash2, X, Send } from 'lucide-react-native';
import { Avatar } from './Avatar';
import { useAuth } from '@/providers';
import { api } from '@/lib/supabase';
import { useColorScheme } from '@/components/useColorScheme';

interface PhotoCardProps {
  photo: {
    id: string;
    photo_url: string;
    created_at: string;
    user: {
      id: string;
      name: string;
      avatar_url?: string;
    };
    likes_count: number;
    comments_count: number;
    is_liked: boolean;
  };
  isCreator: boolean;
  onLike: (photoId: string) => void;
  onDelete: (photoId: string) => void;
  onRefresh: () => void;
}

export function PhotoCard({ photo, isCreator, onLike, onDelete, onRefresh }: PhotoCardProps) {
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [showFullScreen, setShowFullScreen] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
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

  const loadComments = async () => {
    setLoadingComments(true);
    const { data, error } = await api.getPhotoComments(photo.id);
    if (!error && data) {
      setComments(data);
    }
    setLoadingComments(false);
  };

  // Real-time subscription for comments
  useEffect(() => {
    if (!showComments) return;

    const channel = api.subscribeToPhotoComments(photo.id, (comment) => {
      if (comment.deleted) {
        setComments((prev) => prev.filter((c) => c.id !== comment.id));
      } else {
        setComments((prev) => [...prev, comment]);
      }
    });

    return () => {
      api.unsubscribeFromPhotoComments(photo.id);
    };
  }, [photo.id, showComments]);

  // Real-time subscription for likes
  useEffect(() => {
    const channel = api.subscribeToPhotoLikes(photo.id, (likeUpdate) => {
      if (likeUpdate.action === 'INSERT') {
        // Like added
        onRefresh();
      } else if (likeUpdate.action === 'DELETE') {
        // Like removed
        onRefresh();
      }
    });

    return () => {
      api.unsubscribeFromPhotoLikes(photo.id);
    };
  }, [photo.id, onRefresh]);

  const handleShowComments = () => {
    setShowComments(true);
    if (comments.length === 0) {
      loadComments();
    }
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim() || !user?.id) return;

    setSubmittingComment(true);
    const { data, error } = await api.commentOnPhoto(photo.id, user.id, commentText);
    if (error) {
      Alert.alert('Error', error.message || 'Failed to post comment');
    } else if (data) {
      setComments([...comments, data]);
      setCommentText('');
      onRefresh(); // Refresh to update comment count
    }
    setSubmittingComment(false);
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!user?.id) return;

    const { error } = await api.deletePhotoComment(commentId, user.id);
    if (error) {
      Alert.alert('Error', error.message || 'Failed to delete comment');
    } else {
      setComments(comments.filter((c) => c.id !== commentId));
      onRefresh();
    }
  };

  const canDelete = isCreator || photo.user.id === user?.id;

  return (
    <>
      <View style={[styles.card, { backgroundColor: isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)' }]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <Avatar source={photo.user.avatar_url} name={photo.user.name} size="sm" />
            <View style={styles.userText}>
              <Text style={[styles.userName, { color: isDark ? '#ffffff' : '#1e293b' }]}>
                {photo.user.name}
              </Text>
              <Text style={[styles.time, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                {formatTime(photo.created_at)}
              </Text>
            </View>
          </View>
          {canDelete && (
            <TouchableOpacity
              onPress={() => {
                Alert.alert(
                  'Delete Photo',
                  'Are you sure you want to delete this photo?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Delete',
                      style: 'destructive',
                      onPress: () => onDelete(photo.id),
                    },
                  ]
                );
              }}
            >
              <Trash2 size={20} color={isDark ? '#ef4444' : '#dc2626'} />
            </TouchableOpacity>
          )}
        </View>

        {/* Photo */}
        <TouchableOpacity onPress={() => setShowFullScreen(true)} activeOpacity={0.9}>
          <Image source={{ uri: photo.photo_url }} style={styles.photo} resizeMode="cover" />
        </TouchableOpacity>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            onPress={() => onLike(photo.id)}
            style={styles.actionButton}
            activeOpacity={0.7}
          >
            <Heart
              size={24}
              color={photo.is_liked ? '#ef4444' : isDark ? '#9ca3af' : '#6b7280'}
              fill={photo.is_liked ? '#ef4444' : 'none'}
            />
            <Text style={[styles.actionText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
              {photo.likes_count}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleShowComments}
            style={styles.actionButton}
            activeOpacity={0.7}
          >
            <MessageCircle size={24} color={isDark ? '#9ca3af' : '#6b7280'} />
            <Text style={[styles.actionText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
              {photo.comments_count}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Full Screen Modal */}
      <Modal visible={showFullScreen} transparent={true} animationType="fade" onRequestClose={() => setShowFullScreen(false)}>
        <View style={styles.fullScreenContainer}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowFullScreen(false)}
          >
            <X size={24} color="#ffffff" />
          </TouchableOpacity>
          <Image source={{ uri: photo.photo_url }} style={styles.fullScreenPhoto} resizeMode="contain" />
        </View>
      </Modal>

      {/* Comments Modal */}
      <Modal
        visible={showComments}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowComments(false)}
      >
        <View style={[styles.commentsContainer, { backgroundColor: isDark ? 'rgba(0,0,0,0.9)' : 'rgba(0,0,0,0.7)' }]}>
          <View style={[styles.commentsModal, { backgroundColor: isDark ? 'rgba(30, 41, 59, 0.98)' : 'rgba(255, 255, 255, 0.98)' }]}>
            <View style={styles.commentsHeader}>
              <Text style={[styles.commentsTitle, { color: isDark ? '#ffffff' : '#1e293b' }]}>
                Comments
              </Text>
              <TouchableOpacity onPress={() => setShowComments(false)}>
                <X size={24} color={isDark ? '#9ca3af' : '#6b7280'} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.commentsList}>
              {loadingComments ? (
                <Text style={[styles.emptyText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                  Loading comments...
                </Text>
              ) : comments.length === 0 ? (
                <Text style={[styles.emptyText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                  No comments yet
                </Text>
              ) : (
                comments.map((comment) => (
                  <View key={comment.id} style={styles.commentItem}>
                    <Avatar source={comment.user?.avatar_url} name={comment.user?.name} size="sm" />
                    <View style={styles.commentContent}>
                      <Text style={[styles.commentName, { color: isDark ? '#ffffff' : '#1e293b' }]}>
                        {comment.user?.name}
                      </Text>
                      <Text style={[styles.commentText, { color: isDark ? '#e2e8f0' : '#475569' }]}>
                        {comment.content}
                      </Text>
                      <Text style={[styles.commentTime, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                        {formatTime(comment.created_at)}
                      </Text>
                    </View>
                    {comment.user_id === user?.id && (
                      <TouchableOpacity
                        onPress={() => {
                          Alert.alert(
                            'Delete Comment',
                            'Are you sure?',
                            [
                              { text: 'Cancel', style: 'cancel' },
                              {
                                text: 'Delete',
                                style: 'destructive',
                                onPress: () => handleDeleteComment(comment.id),
                              },
                            ]
                          );
                        }}
                      >
                        <Trash2 size={16} color={isDark ? '#9ca3af' : '#6b7280'} />
                      </TouchableOpacity>
                    )}
                  </View>
                ))
              )}
            </ScrollView>

            {user && (
              <View style={[styles.commentInput, { borderTopColor: isDark ? '#374151' : '#e5e7eb' }]}>
                <TextInput
                  style={[styles.input, { backgroundColor: isDark ? '#1e293b' : '#f3f4f6', color: isDark ? '#ffffff' : '#1e293b' }]}
                  placeholder="Add a comment..."
                  placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                  value={commentText}
                  onChangeText={setCommentText}
                  multiline
                />
                <TouchableOpacity
                  onPress={handleSubmitComment}
                  disabled={!commentText.trim() || submittingComment}
                  style={[styles.sendButton, { opacity: commentText.trim() ? 1 : 0.5 }]}
                >
                  <Send size={20} color="#0066cc" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userText: {
    marginLeft: 12,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
  },
  time: {
    fontSize: 12,
    marginTop: 2,
  },
  photo: {
    width: '100%',
    height: 400,
    backgroundColor: '#f3f4f6',
  },
  actions: {
    flexDirection: 'row',
    padding: 12,
    gap: 16,
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
  fullScreenContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1,
    padding: 8,
  },
  fullScreenPhoto: {
    width: '100%',
    height: '100%',
  },
  commentsContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  commentsModal: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  commentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  commentsList: {
    maxHeight: 400,
    padding: 20,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  commentContent: {
    flex: 1,
  },
  commentName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  commentTime: {
    fontSize: 12,
  },
  emptyText: {
    textAlign: 'center',
    padding: 20,
    fontSize: 14,
  },
  commentInput: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    gap: 12,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
  },
  sendButton: {
    padding: 8,
  },
});

