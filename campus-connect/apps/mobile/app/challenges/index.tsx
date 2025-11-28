import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
  ChevronLeft,
  Target,
  Trophy,
  Calendar,
  Zap,
  Users,
  BookOpen,
  Dumbbell,
  TrendingUp,
  CheckCircle,
  Clock,
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useColorScheme } from '@/components/useColorScheme';
import { useAuth } from '@/providers';
import { api } from '@/lib/supabase';
import { Challenge, ChallengeParticipant } from '@/types';

const CHALLENGE_TYPES = [
  { type: 'study', label: 'Study', icon: BookOpen, color: '#3B82F6' },
  { type: 'fitness', label: 'Fitness', icon: Dumbbell, color: '#10B981' },
  { type: 'social', label: 'Social', icon: Users, color: '#EC4899' },
  { type: 'academic', label: 'Academic', icon: Trophy, color: '#F59E0B' },
];

export default function ChallengesScreen() {
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [selectedType, setSelectedType] = useState<string | undefined>(undefined);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [userChallenges, setUserChallenges] = useState<ChallengeParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadChallenges();
    }
  }, [user?.id, selectedType]);

  const loadChallenges = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const [challengesRes, userChallengesRes] = await Promise.all([
        api.getChallenges(selectedType, true),
        api.getUserChallenges(user.id),
      ]);

      if (challengesRes.data) {
        setChallenges(challengesRes.data);
      }
      if (userChallengesRes.data) {
        setUserChallenges(userChallengesRes.data);
      }
    } catch (error) {
      console.error('Error loading challenges:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadChallenges();
    setRefreshing(false);
  };

  const isParticipating = (challengeId: string) => {
    return userChallenges.some((uc) => uc.challenge_id === challengeId);
  };

  const getUserProgress = (challengeId: string) => {
    const participant = userChallenges.find((uc) => uc.challenge_id === challengeId);
    return participant?.progress || 0;
  };

  const isCompleted = (challengeId: string) => {
    const participant = userChallenges.find((uc) => uc.challenge_id === challengeId);
    return participant?.completed_at !== null && participant?.completed_at !== undefined;
  };

  const handleJoinChallenge = async (challengeId: string) => {
    if (!user?.id) return;

    Alert.alert(
      'Join Challenge?',
      'Are you ready to take on this challenge?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Join',
          onPress: async () => {
            const { error } = await api.joinChallenge(user.id, challengeId);
            if (error) {
              Alert.alert('Error', 'Failed to join challenge');
            } else {
              Alert.alert('Success', 'You joined the challenge!');
              await loadChallenges();
            }
          },
        },
      ]
    );
  };

  const getProgressPercentage = (challenge: Challenge) => {
    const progress = getUserProgress(challenge.id);
    return Math.min((progress / challenge.target_value) * 100, 100);
  };

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  const availableChallenges = challenges.filter((c) => !isParticipating(c.id));
  const activeChallenges = challenges.filter((c) => isParticipating(c.id) && !isCompleted(c.id));
  const completedChallenges = challenges.filter((c) => isCompleted(c.id));

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
          <Target size={24} color="#F59E0B" />
          <Text className={`text-xl font-bold ml-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Challenges
          </Text>
        </View>
      </View>

      {/* Type Filter */}
      <View className={`px-5 py-3 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row" style={{ gap: 8 }}>
            <TouchableOpacity
              onPress={() => setSelectedType(undefined)}
              className={`px-4 py-2 rounded-xl flex-row items-center ${
                selectedType === undefined
                  ? isDark
                    ? 'bg-blue-600'
                    : 'bg-blue-500'
                  : isDark
                  ? 'bg-gray-700'
                  : 'bg-gray-200'
              }`}
            >
              <Text
                className={`font-medium text-sm ${
                  selectedType === undefined
                    ? 'text-white'
                    : isDark
                    ? 'text-gray-300'
                    : 'text-gray-700'
                }`}
              >
                All
              </Text>
            </TouchableOpacity>
            {CHALLENGE_TYPES.map((type) => {
              const Icon = type.icon;
              return (
                <TouchableOpacity
                  key={type.type}
                  onPress={() => setSelectedType(type.type)}
                  className={`px-4 py-2 rounded-xl flex-row items-center ${
                    selectedType === type.type
                      ? isDark
                        ? 'bg-blue-600'
                        : 'bg-blue-500'
                      : isDark
                      ? 'bg-gray-700'
                      : 'bg-gray-200'
                  }`}
                >
                  <Icon
                    size={16}
                    color={selectedType === type.type ? '#fff' : (isDark ? '#9ca3af' : '#6b7280')}
                  />
                  <Text
                    className={`ml-2 font-medium text-sm ${
                      selectedType === type.type
                        ? 'text-white'
                        : isDark
                        ? 'text-gray-300'
                        : 'text-gray-700'
                    }`}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>

      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Active Challenges */}
        {activeChallenges.length > 0 && (
          <View className="px-5 mt-4">
            <Text className={`text-lg font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Active Challenges
            </Text>
            {activeChallenges.map((challenge, index) => {
              const progress = getUserProgress(challenge.id);
              const percentage = getProgressPercentage(challenge);
              const daysRemaining = getDaysRemaining(challenge.end_date);
              const TypeIcon = CHALLENGE_TYPES.find((t) => t.type === challenge.type)?.icon || Target;

              return (
                <Animated.View
                  key={challenge.id}
                  entering={FadeInDown.duration(400).delay(index * 50)}
                  className={`rounded-2xl p-4 mb-3 ${
                    isDark ? 'bg-gray-800 border border-blue-500' : 'bg-white border border-blue-200'
                  }`}
                  style={{
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: isDark ? 0.3 : 0.06,
                    shadowRadius: 8,
                    elevation: 3,
                  }}
                >
                  <View className="flex-row items-start justify-between mb-3">
                    <View className="flex-row items-center flex-1">
                      <View
                        className="w-12 h-12 rounded-xl items-center justify-center mr-3"
                        style={{
                          backgroundColor: CHALLENGE_TYPES.find((t) => t.type === challenge.type)?.color + '20',
                        }}
                      >
                        <TypeIcon
                          size={24}
                          color={CHALLENGE_TYPES.find((t) => t.type === challenge.type)?.color || '#6b7280'}
                        />
                      </View>
                      <View className="flex-1">
                        <Text className={`font-semibold text-base ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {challenge.name}
                        </Text>
                        <Text className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {challenge.description}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View className="mb-3">
                    <View className="flex-row justify-between mb-2">
                      <Text className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Progress: {progress}/{challenge.target_value}
                      </Text>
                      <Text className={`text-sm font-semibold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                        {Math.round(percentage)}%
                      </Text>
                    </View>
                    <View className={`h-3 rounded-full overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                      <View
                        className="h-full rounded-full"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: CHALLENGE_TYPES.find((t) => t.type === challenge.type)?.color || '#3B82F6',
                        }}
                      />
                    </View>
                  </View>

                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center">
                      <Clock size={14} color={isDark ? '#9ca3af' : '#6b7280'} />
                      <Text className={`text-xs ml-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {daysRemaining} days left
                      </Text>
                    </View>
                    {challenge.reward_points > 0 && (
                      <View className="flex-row items-center">
                        <Trophy size={14} color="#F59E0B" />
                        <Text className={`text-xs ml-1 font-medium ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>
                          +{challenge.reward_points} pts
                        </Text>
                      </View>
                    )}
                  </View>
                </Animated.View>
              );
            })}
          </View>
        )}

        {/* Available Challenges */}
        {availableChallenges.length > 0 && (
          <View className="px-5 mt-4">
            <Text className={`text-lg font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Available Challenges
            </Text>
            {availableChallenges.map((challenge, index) => {
              const daysRemaining = getDaysRemaining(challenge.end_date);
              const TypeIcon = CHALLENGE_TYPES.find((t) => t.type === challenge.type)?.icon || Target;

              return (
                <Animated.View
                  key={challenge.id}
                  entering={FadeInDown.duration(400).delay((activeChallenges.length + index) * 50)}
                  className={`rounded-2xl p-4 mb-3 ${isDark ? 'bg-gray-800' : 'bg-white'}`}
                  style={{
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: isDark ? 0.3 : 0.06,
                    shadowRadius: 8,
                    elevation: 3,
                  }}
                >
                  <View className="flex-row items-start justify-between mb-3">
                    <View className="flex-row items-center flex-1">
                      <View
                        className="w-12 h-12 rounded-xl items-center justify-center mr-3"
                        style={{
                          backgroundColor: CHALLENGE_TYPES.find((t) => t.type === challenge.type)?.color + '20',
                        }}
                      >
                        <TypeIcon
                          size={24}
                          color={CHALLENGE_TYPES.find((t) => t.type === challenge.type)?.color || '#6b7280'}
                        />
                      </View>
                      <View className="flex-1">
                        <Text className={`font-semibold text-base ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {challenge.name}
                        </Text>
                        <Text className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {challenge.description}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View className="flex-row items-center justify-between mb-3">
                    <View>
                      <Text className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Target: {challenge.target_value} {challenge.target_type.replace('_', ' ')}
                      </Text>
                      <Text className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        Duration: {challenge.duration_days} days
                      </Text>
                    </View>
                    {challenge.reward_points > 0 && (
                      <View className="items-end">
                        <View className="flex-row items-center">
                          <Trophy size={16} color="#F59E0B" />
                          <Text className={`text-sm ml-1 font-semibold ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>
                            +{challenge.reward_points} pts
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>

                  <TouchableOpacity
                    onPress={() => handleJoinChallenge(challenge.id)}
                    className={`py-3 rounded-xl items-center ${
                      isDark ? 'bg-blue-600' : 'bg-blue-500'
                    }`}
                  >
                    <Text className="text-white font-semibold">Join Challenge</Text>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>
        )}

        {/* Completed Challenges */}
        {completedChallenges.length > 0 && (
          <View className="px-5 mt-4">
            <Text className={`text-lg font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Completed Challenges
            </Text>
            {completedChallenges.map((challenge, index) => {
              const TypeIcon = CHALLENGE_TYPES.find((t) => t.type === challenge.type)?.icon || Target;

              return (
                <Animated.View
                  key={challenge.id}
                  entering={FadeInDown.duration(400).delay((activeChallenges.length + availableChallenges.length + index) * 50)}
                  className={`rounded-2xl p-4 mb-3 ${isDark ? 'bg-gray-800' : 'bg-white'} opacity-75`}
                >
                  <View className="flex-row items-center">
                    <View
                      className="w-12 h-12 rounded-xl items-center justify-center mr-3"
                      style={{
                        backgroundColor: CHALLENGE_TYPES.find((t) => t.type === challenge.type)?.color + '20',
                      }}
                    >
                      <TypeIcon
                        size={24}
                        color={CHALLENGE_TYPES.find((t) => t.type === challenge.type)?.color || '#6b7280'}
                      />
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center">
                        <Text className={`font-semibold text-base ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {challenge.name}
                        </Text>
                        <CheckCircle size={18} color="#10B981" className="ml-2" />
                      </View>
                      <Text className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        Completed!
                      </Text>
                    </View>
                  </View>
                </Animated.View>
              );
            })}
          </View>
        )}

        {challenges.length === 0 && !loading && (
          <View className="flex-1 items-center justify-center py-20 px-5">
            <Target size={48} color={isDark ? '#4b5563' : '#9ca3af'} />
            <Text className={`text-lg font-semibold mt-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              No challenges available
            </Text>
            <Text className={`text-sm mt-2 text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              Check back later for new challenges!
            </Text>
          </View>
        )}

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}

