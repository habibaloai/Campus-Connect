'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Heart, Tag, Clock, Loader2, PlusCircle } from 'lucide-react';
import { usePosts, useMutation } from '@/hooks/useSupabase';
import { useAuth } from '@/context/AuthContext';
import { api, Post } from '@/lib/supabase';
import { StaggerContainer, StaggerItem } from '@/components/PageTransition';
import styles from './CommunityTab.module.css';

const categoryStyles: Record<string, { bg: string; color: string; label: string }> = {
  question: { bg: '#2196F320', color: '#2196F3', label: '❓ Question' },
  help: { bg: '#FF980020', color: '#FF9800', label: '🆘 Help' },
  discussion: { bg: '#4CAF5020', color: '#4CAF50', label: '💬 Discussion' },
  announcement: { bg: '#9C27B020', color: '#9C27B0', label: '📢 Announcement' },
};

export default function CommunityTab() {
  const { user } = useAuth();
  const { data: initialPosts, loading, error, refetch } = usePosts();
  const [posts, setPosts] = useState<Post[]>(initialPosts || []);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());

  // Update posts when initialPosts changes
  useEffect(() => {
    if (initialPosts) {
      setPosts(initialPosts);
      // Update likedPosts set from initial data
      const liked = new Set<string>();
      initialPosts.forEach((post) => {
        if (post.is_liked) {
          liked.add(post.id);
        }
      });
      setLikedPosts(liked);
    }
  }, [initialPosts]);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays}d ago`;
    } else if (diffHours > 0) {
      return `${diffHours}h ago`;
    } else {
      return 'Just now';
    }
  };


  const handleLike = async (postId: string) => {
    if (!user) return;
    
    const currentPost = posts.find((p) => p.id === postId);
    if (!currentPost) return;
    
    const isLiked = currentPost.is_liked || false;
    
    try {
      if (isLiked) {
        // Unlike
        const { error } = await api.unlikePost(postId, user.id);
        if (error) {
          alert(`Error: ${error.message || 'Failed to unlike post'}`);
          return;
        }
      } else {
        // Like
        const { error } = await api.likePost(postId, user.id);
        if (error && error.code !== 'ALREADY_LIKED') {
          alert(`Error: ${error.message || 'Failed to like post'}`);
          return;
        }
      }
      
      // Refresh posts to get accurate counts from server
      await refetch();
    } catch (err: any) {
      console.error('Error toggling like:', err);
      alert(`Error: ${err.message || 'Failed to toggle like'}`);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 className={styles.spinner} size={32} />
        <p>Loading posts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p>Failed to load community posts</p>
        <p className={styles.errorHint}>Please check your connection and try again</p>
      </div>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>Community</h2>
          <p className={styles.subtitle}>Connect and help fellow students</p>
        </div>
        <div className={styles.emptyContainer}>
          <p>No posts yet</p>
          <p className={styles.emptyHint}>Be the first to start a discussion!</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Community</h2>
        <p className={styles.subtitle}>Connect and help fellow students</p>
      </div>

      <StaggerContainer className={styles.postList}>
        {posts.map((post: Post) => (
          <StaggerItem key={post.id}>
            <motion.div
              whileTap={{ scale: 0.98 }}
              className={styles.postCard}
            >
              {/* Author Info */}
              <div className={styles.authorSection}>
                <div className={styles.avatar}>
                  {post.author?.name?.charAt(0) || 'U'}
                </div>
                <div className={styles.authorInfo}>
                  <span className={styles.authorName}>{post.author?.name || 'Anonymous'}</span>
                  <span className={styles.authorMeta}>
                    {post.author?.major || 'Student'} • {post.author?.year || ''}
                  </span>
                </div>
                <div className={styles.timeStamp}>
                  <Clock size={12} />
                  <span>{formatTimeAgo(post.created_at)}</span>
                </div>
              </div>

              {/* Category Badge */}
              <span 
                className={styles.category}
                style={{ 
                  backgroundColor: categoryStyles[post.category]?.bg || '#66666620', 
                  color: categoryStyles[post.category]?.color || '#666' 
                }}
              >
                {categoryStyles[post.category]?.label || post.category}
              </span>

              {/* Post Content */}
              <h3 className={styles.postTitle}>{post.title}</h3>
              <p className={styles.postContent}>{post.content}</p>

              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div className={styles.tags}>
                  {post.tags.map((tag) => (
                    <span key={tag} className={styles.tag}>
                      <Tag size={10} />
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className={styles.actions}>
                <motion.button 
                  whileTap={{ scale: 0.9 }}
                  className={`${styles.actionButton} ${post.is_liked || likedPosts.has(post.id) ? styles.liked : ''}`}
                  onClick={() => handleLike(post.id)}
                >
                  <Heart size={16} fill={post.is_liked || likedPosts.has(post.id) ? 'currentColor' : 'none'} />
                  <span>{post.likes}</span>
                </motion.button>
                <motion.button 
                  whileTap={{ scale: 0.9 }}
                  className={styles.actionButton}
                >
                  <MessageCircle size={16} />
                  <span>{post.reply_count || 0} replies</span>
                </motion.button>
              </div>
            </motion.div>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </div>
  );
}
