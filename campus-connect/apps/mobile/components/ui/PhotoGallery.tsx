import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { Camera, Image as ImageIcon } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { PhotoCard } from './PhotoCard';
import { useAuth } from '@/providers';
import { api } from '@/lib/supabase';
import { useColorScheme } from '@/components/useColorScheme';

interface PhotoGalleryProps {
  eventId: string;
  isAttending: boolean;
  isCreator: boolean;
  onRefresh?: () => void;
}

export function PhotoGallery({ eventId, isAttending, isCreator, onRefresh }: PhotoGalleryProps) {
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);

  const loadPhotos = useCallback(async () => {
    if (!isAttending || !user?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await api.getEventPhotos(eventId, user.id);
    if (error) {
      console.error('Error loading photos:', error);
      if (error.code !== 'NOT_ATTENDEE') {
        Alert.alert('Error', error.message || 'Failed to load photos');
      }
      setPhotos([]);
    } else {
      setPhotos(data || []);
    }
    setLoading(false);
  }, [eventId, isAttending, user?.id]);

  useEffect(() => {
    loadPhotos();
  }, [loadPhotos]);

  // Real-time subscription for new photos
  useEffect(() => {
    if (!isAttending || !user?.id) return;

    const channel = api.subscribeToEventPhotos(eventId, (photo) => {
      if (photo.deleted) {
        setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
      } else {
        setPhotos((prev) => [photo, ...prev]);
        if (onRefresh) {
          onRefresh();
        }
      }
    });

    return () => {
      api.unsubscribeFromEventPhotos(eventId);
    };
  }, [eventId, isAttending, user?.id, onRefresh]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPhotos();
    if (onRefresh) {
      onRefresh();
    }
    setRefreshing(false);
  };

  const handleUploadPhoto = async () => {
    if (!user?.id || !isAttending) {
      Alert.alert('Error', 'You must be attending this event to upload photos');
      return;
    }

    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant permission to access your photos.');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (result.canceled || !result.assets[0]) {
        return;
      }

      setUploading(true);
      const fileUri = result.assets[0].uri;
      const fileExt = fileUri.split('.').pop() || 'jpg';

      const { data, error } = await api.uploadEventPhoto(eventId, user.id, fileUri, fileExt);

      if (error) {
        Alert.alert('Upload Failed', error.message || 'Failed to upload photo');
      } else if (data) {
        setPhotos([data, ...photos]);
        if (onRefresh) {
          onRefresh();
        }
      }
    } catch (error: any) {
      console.error('Error uploading photo:', error);
      Alert.alert('Error', 'Failed to upload photo. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleLike = async (photoId: string) => {
    if (!user?.id) return;

    const { error } = await api.likeEventPhoto(photoId, user.id);
    if (error) {
      Alert.alert('Error', error.message || 'Failed to like photo');
    } else {
      // Update local state
      setPhotos(
        photos.map((photo) => {
          if (photo.id === photoId) {
            return {
              ...photo,
              is_liked: !photo.is_liked,
              likes_count: photo.is_liked ? photo.likes_count - 1 : photo.likes_count + 1,
            };
          }
          return photo;
        })
      );
    }
  };

  const handleDelete = async (photoId: string) => {
    if (!user?.id) return;

    const { error } = await api.deleteEventPhoto(photoId, user.id, isCreator);
    if (error) {
      Alert.alert('Error', error.message || 'Failed to delete photo');
    } else {
      setPhotos(photos.filter((photo) => photo.id !== photoId));
      if (onRefresh) {
        onRefresh();
      }
    }
  };

  if (!isAttending) {
    return (
      <View style={styles.emptyContainer}>
        <ImageIcon size={48} color={isDark ? '#6b7280' : '#9ca3af'} />
        <Text style={[styles.emptyText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
          Join this event to view and upload photos
        </Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={[styles.loadingText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
          Loading photos...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Upload Button */}
      {isAttending && (
        <TouchableOpacity
          onPress={handleUploadPhoto}
          disabled={uploading}
          style={[
            styles.uploadButton,
            {
              backgroundColor: uploading ? (isDark ? '#374151' : '#d1d5db') : '#0066cc',
            },
          ]}
        >
          {uploading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <Camera size={20} color="#ffffff" />
              <Text style={styles.uploadButtonText}>Upload Photo</Text>
            </>
          )}
        </TouchableOpacity>
      )}

      {/* Photos List */}
      {photos.length === 0 ? (
        <View style={styles.emptyContainer}>
          <ImageIcon size={48} color={isDark ? '#6b7280' : '#9ca3af'} />
          <Text style={[styles.emptyText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
            No photos yet. Be the first to share!
          </Text>
        </View>
      ) : (
        <FlatList
          data={photos}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PhotoCard
              photo={item}
              isCreator={isCreator}
              onLike={handleLike}
              onDelete={handleDelete}
              onRefresh={handleRefresh}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#0066cc" />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 16,
    gap: 8,
  },
  uploadButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 14,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
  },
});

