import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft, User, Camera, X, Hash, BookOpen, AtSign } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useColorScheme } from '@/components/useColorScheme';
import { useAuth } from '@/providers';
import { api } from '@/lib/supabase';
import * as ImagePicker from 'expo-image-picker';

export default function EditProfileScreen() {
  const { user, profile, refreshProfile } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [loading, setLoading] = useState(false);
  const [nickname, setNickname] = useState('');
  const [bio, setBio] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [newInterest, setNewInterest] = useState('');
  const [favoriteLecture, setFavoriteLecture] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Load current profile data into form fields when screen opens
  useEffect(() => {
    let isMounted = true;

    const loadProfileData = async () => {
      if (!user?.id) {
        console.log('[Edit Profile] No user ID');
        return;
      }

      // Always fetch fresh profile data when edit screen opens
      console.log('[Edit Profile] Fetching profile data for user:', user.id);
      try {
        const { data: profileData, error } = await api.getProfile(user.id);

        if (!isMounted) return;

        if (error) {
          console.error('[Edit Profile] Error fetching profile:', error);
          console.error('[Edit Profile] Error details:', JSON.stringify(error, null, 2));
          // If profile doesn't exist, that's okay - start with empty form
          if (isMounted) {
            setDataLoaded(true);
          }
          return;
        }

        if (profileData) {
          console.log('[Edit Profile] Profile data loaded:', {
            id: profileData.id,
            name: profileData.name,
            nickname: profileData.nickname || '(empty)',
            bio: profileData.bio || '(empty)',
            interests: profileData.interests || [],
            interests_type: Array.isArray(profileData.interests) ? 'array' : typeof profileData.interests,
            favorite_lecture: profileData.favorite_lecture || '(empty)',
            avatar_url: profileData.avatar_url ? 'exists' : 'null',
          });

          // Populate form with current profile data
          if (isMounted) {
            const currentBio = profileData.bio || '';
            const currentInterests = Array.isArray(profileData.interests)
              ? profileData.interests
              : (profileData.interests ? [profileData.interests] : []);
            const currentLecture = profileData.favorite_lecture || 'Introduction to Computer Science';
            const currentAvatar = profileData.avatar_url || null;

            const currentNickname = profileData.nickname || '';

            console.log('[Edit Profile] Setting form values:', {
              nickname: currentNickname,
              bio: currentBio,
              interests: currentInterests,
              favorite_lecture: currentLecture,
              avatar: currentAvatar ? 'exists' : 'null',
            });

            setNickname(currentNickname);
            setBio(currentBio);
            setInterests(currentInterests);
            setFavoriteLecture(currentLecture);
            setAvatarUri(currentAvatar);
            setDataLoaded(true);

            console.log('[Edit Profile] Form values set, dataLoaded = true');
          }
        } else {
          // No profile data, start with defaults
          console.log('[Edit Profile] No profile data found, using defaults');
          if (isMounted) {
            setNickname('');
            setBio('');
            setInterests([]);
            setFavoriteLecture('Introduction to Computer Science');
            setAvatarUri(null);
            setDataLoaded(true);
          }
        }
      } catch (err) {
        console.error('[Edit Profile] Error loading profile:', err);
        if (isMounted) {
          setDataLoaded(true); // Still allow editing even if fetch fails
        }
      }
    };

    loadProfileData();

    return () => {
      isMounted = false;
    };
  }, [user?.id]); // Run when user ID changes (on mount)

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'We need access to your photos to update your profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const removeInterest = (index: number) => {
    setInterests(interests.filter((_, i) => i !== index));
  };

  const addInterest = () => {
    if (newInterest.trim() && interests.length < 5) {
      setInterests([...interests, newInterest.trim()]);
      setNewInterest('');
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      // Upload avatar if changed
      let avatarUrl = profile?.avatar_url;
      if (avatarUri && avatarUri !== profile?.avatar_url) {
        // Check if it's already a URL (from Supabase)
        if (avatarUri.startsWith('http')) {
          avatarUrl = avatarUri;
        } else {
          // It's a local file, try to upload to Supabase Storage
          const fileExt = avatarUri.split('.').pop() || 'jpg';
          const { url: uploadedUrl, error: uploadError } = await api.uploadAvatar(user.id, avatarUri, fileExt);

          if (uploadError) {
            console.error('Upload error:', uploadError);
            // Show user-friendly error message
            if (uploadError.code === 'BUCKET_NOT_FOUND') {
              Alert.alert(
                'Storage Not Configured',
                'The storage bucket for avatars is not set up. Please create an "avatars" bucket in your Supabase Storage. Other profile changes will still be saved.',
                [{ text: 'OK' }]
              );
            } else {
              Alert.alert(
                'Upload Failed',
                'Failed to upload avatar image. Other profile changes will still be saved.',
                [{ text: 'OK' }]
              );
            }
            // Continue without updating avatar - other profile data will still be saved
          } else if (uploadedUrl) {
            avatarUrl = uploadedUrl;
          }
        }
      }

      // Prepare updates - ensure proper data types for PostgreSQL
      const updates: any = {
        updated_at: new Date().toISOString(),
      };

      // Add nickname
      updates.nickname = nickname.trim() || null;

      // Add bio - explicitly set to null if empty to clear it
      updates.bio = bio.trim() || null;

      // Add bio - explicitly set to null if empty to clear it
      updates.bio = bio.trim() || null;

      // Interests are handled separately via updateUserInterests
      // We don't add them to 'updates' object for the profiles table

      // Add favorite lecture
      updates.favorite_lecture = favoriteLecture.trim() || null;

      // Only update avatar_url if we have a value
      if (avatarUrl !== undefined && avatarUrl !== null) {
        updates.avatar_url = avatarUrl;
      }

      console.log('[Edit Profile] Updating profile with:', JSON.stringify(updates, null, 2));
      console.log('[Edit Profile] User ID:', user.id);
      console.log('[Edit Profile] Updates validation:', {
        nickname: updates.nickname,
        nickname_type: typeof updates.nickname,
        bio: updates.bio,
        bio_type: typeof updates.bio,
        interests: updates.interests,
        interests_type: Array.isArray(updates.interests) ? 'array' : (updates.interests === null ? 'null' : typeof updates.interests),
        interests_length: Array.isArray(updates.interests) ? updates.interests.length : 'N/A',
        favorite_lecture: updates.favorite_lecture,
        favorite_lecture_type: typeof updates.favorite_lecture,
      });

      const { data, error } = await api.updateProfile(user.id, updates);

      if (error) {
        console.error('[Edit Profile] Update error:', error);
        console.error('[Edit Profile] Error details:', JSON.stringify(error, null, 2));
        Alert.alert(
          'Error',
          error.message || error.code || 'Failed to update profile. Please check the console for details.'
        );
        setLoading(false);
        return;
      }

      // Save interests separately
      console.log('[Edit Profile] Saving interests:', interests);
      const { error: interestError } = await api.updateUserInterests(user.id, interests);

      if (interestError) {
        console.error('[Edit Profile] Interest update error:', interestError);
        // We don't return here, as the main profile update succeeded
        // But we should probably warn the user
        Alert.alert('Warning', 'Profile updated, but failed to save interests.');
      }

      console.log('[Edit Profile] Profile updated successfully:', JSON.stringify(data, null, 2));

      // Verify the update was successful by fetching the updated profile
      try {
        console.log('[Edit Profile] Verifying update by fetching profile...');
        const { data: refreshedProfile, error: refreshError } = await api.getProfile(user.id);
        if (refreshError) {
          console.error('[Edit Profile] Error verifying update:', refreshError);
        } else {
          console.log('[Edit Profile] Verified updated profile:', {
            nickname: refreshedProfile?.nickname || '(empty)',
            bio: refreshedProfile?.bio || '(empty)',
            interests: refreshedProfile?.interests || [],
            favorite_lecture: refreshedProfile?.favorite_lecture || '(empty)',
          });
        }
      } catch (verifyError) {
        console.error('[Edit Profile] Error verifying update:', verifyError);
      }

      // Update the profile in context
      console.log('[Edit Profile] Refreshing profile context...');
      await refreshProfile();

      // Additional delay to ensure all state updates propagate
      await new Promise(resolve => setTimeout(resolve, 300));

      console.log('[Edit Profile] Navigation back to profile screen');
      // Navigate back
      router.back();
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
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
            Edit Profile
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleSave}
          disabled={loading}
          className={`px-4 py-2 rounded-lg ${isDark ? 'bg-blue-600' : 'bg-blue-500'}`}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text className="text-white font-semibold">Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {!dataLoaded ? (
          <View className="flex-1 items-center justify-center py-20">
            <ActivityIndicator size="large" color={isDark ? '#3b82f6' : '#3b82f6'} />
            <Text className={`mt-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Loading profile...
            </Text>
          </View>
        ) : (
          <>
            {/* Profile Picture */}
            <Animated.View
              entering={FadeInDown.duration(500)}
              className={`items-center py-6 mx-5 mt-4 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: isDark ? 0.3 : 0.06,
                shadowRadius: 8,
                elevation: 3,
              }}
            >
              <View className="w-28 h-28 rounded-full bg-blue-100 items-center justify-center overflow-hidden mb-3">
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} className="w-28 h-28 rounded-full" />
                ) : (
                  <User size={48} color="#3b82f6" />
                )}
              </View>
              <TouchableOpacity onPress={pickImage} className="flex-row items-center">
                <Camera size={16} color={isDark ? '#9ca3af' : '#6b7280'} />
                <Text className={`text-sm font-medium ml-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Change Photo
                </Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Nickname */}
            <Animated.View
              entering={FadeInDown.duration(500).delay(50)}
              className={`mx-5 mt-4 rounded-2xl p-4 ${isDark ? 'bg-gray-800' : 'bg-white'}`}
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: isDark ? 0.3 : 0.06,
                shadowRadius: 8,
                elevation: 3,
              }}
            >
              <Text className={`text-sm font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Nickname
              </Text>
              <View className="flex-row items-center px-3 py-2 rounded-xl" style={{ backgroundColor: isDark ? '#374151' : '#f3f4f6' }}>
                <AtSign size={14} color={isDark ? '#9ca3af' : '#6b7280'} />
                <TextInput
                  value={nickname}
                  onChangeText={setNickname}
                  placeholder="Enter your nickname..."
                  placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                  className={`flex-1 ml-2 text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}
                />
              </View>
            </Animated.View>

            {/* Description */}
            <Animated.View
              entering={FadeInDown.duration(500).delay(100)}
              className={`mx-5 mt-4 rounded-2xl p-4 ${isDark ? 'bg-gray-800' : 'bg-white'}`}
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: isDark ? 0.3 : 0.06,
                shadowRadius: 8,
                elevation: 3,
              }}
            >
              <Text className={`text-sm font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Description
              </Text>
              <TextInput
                value={bio}
                onChangeText={setBio}
                placeholder="Tell us about yourself..."
                placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                multiline
                numberOfLines={4}
                className={`text-sm rounded-xl p-3 ${isDark ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-900'}`}
                style={{
                  minHeight: 100,
                  textAlignVertical: 'top',
                }}
              />
            </Animated.View>

            {/* Interests */}
            <Animated.View
              entering={FadeInDown.duration(500).delay(200)}
              className={`mx-5 mt-4 rounded-2xl p-4 ${isDark ? 'bg-gray-800' : 'bg-white'}`}
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: isDark ? 0.3 : 0.06,
                shadowRadius: 8,
                elevation: 3,
              }}
            >
              <Text className={`text-sm font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Interests
              </Text>

              {/* Current Interests */}
              {interests.length > 0 && (
                <View className="flex-row flex-wrap mb-3" style={{ gap: 8 }}>
                  {interests.map((interest, index) => (
                    <View
                      key={index}
                      className="flex-row items-center px-3 py-1.5 rounded-full"
                      style={{ backgroundColor: isDark ? '#374151' : '#f3f4f6' }}
                    >
                      <Hash size={12} color={isDark ? '#9ca3af' : '#6b7280'} />
                      <Text className={`text-xs ml-1.5 font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {interest}
                      </Text>
                      <TouchableOpacity onPress={() => removeInterest(index)} className="ml-2">
                        <X size={14} color={isDark ? '#9ca3af' : '#6b7280'} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              {/* Add Interest */}
              {interests.length < 5 && (
                <View className="flex-row items-center" style={{ gap: 8 }}>
                  <View className="flex-1 flex-row items-center px-3 py-2 rounded-xl" style={{ backgroundColor: isDark ? '#374151' : '#f3f4f6' }}>
                    <Hash size={14} color={isDark ? '#9ca3af' : '#6b7280'} />
                    <TextInput
                      value={newInterest}
                      onChangeText={setNewInterest}
                      placeholder="Add interest..."
                      placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                      onSubmitEditing={addInterest}
                      className={`flex-1 ml-2 text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}
                    />
                  </View>
                  <TouchableOpacity
                    onPress={addInterest}
                    className={`px-4 py-2 rounded-xl ${isDark ? 'bg-blue-600' : 'bg-blue-500'}`}
                  >
                    <Text className="text-white font-semibold text-sm">Add</Text>
                  </TouchableOpacity>
                </View>
              )}
              {interests.length >= 5 && (
                <Text className={`text-xs mt-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  Maximum 5 interests
                </Text>
              )}
            </Animated.View>

            {/* Favorite Lecture */}
            <Animated.View
              entering={FadeInDown.duration(500).delay(300)}
              className={`mx-5 mt-4 rounded-2xl p-4 ${isDark ? 'bg-gray-800' : 'bg-white'}`}
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: isDark ? 0.3 : 0.06,
                shadowRadius: 8,
                elevation: 3,
              }}
            >
              <Text className={`text-sm font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Favorite Lecture
              </Text>
              <View className="flex-row items-center px-3 py-2 rounded-xl" style={{ backgroundColor: isDark ? '#374151' : '#f3f4f6' }}>
                <BookOpen size={14} color={isDark ? '#9ca3af' : '#6b7280'} />
                <TextInput
                  value={favoriteLecture}
                  onChangeText={setFavoriteLecture}
                  placeholder="Enter your favorite lecture..."
                  placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                  className={`flex-1 ml-2 text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}
                />
              </View>
            </Animated.View>

            <View className="h-8" />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

