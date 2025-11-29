import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Modal,
  Alert,
  ImageBackground,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router, Stack, useFocusEffect } from 'expo-router';
import * as Linking from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ChevronLeft,
  Heart,
  Brain,
  Moon,
  Dumbbell,
  Phone,
  Calendar,
  ChevronRight,
  Clock,
  MapPin,
  Activity,
  Plus,
  X,
  Trash2,
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useColorScheme } from '@/components/useColorScheme';

// Mock wellness data
const wellnessResources = [
  {
    id: '1',
    title: 'Counseling Services',
    description: 'Free confidential support',
    icon: Brain,
    color: '#8B5CF6',
    bgColor: '#EDE9FE',
    available: true,
    nextAvailable: 'Today',
  },
  {
    id: '2',
    title: 'Health Center',
    description: 'Medical appointments',
    icon: Heart,
    color: '#EF4444',
    bgColor: '#FEE2E2',
    available: true,
    nextAvailable: 'Tomorrow',
  },
  {
    id: '3',
    title: 'Fitness Center',
    description: 'Gym access & classes',
    icon: Dumbbell,
    color: '#F97316',
    bgColor: '#FFEDD5',
    available: true,
    hours: '6 AM - 10 PM',
  },
  {
    id: '4',
    title: 'Sleep Resources',
    description: 'Tips & workshops',
    icon: Moon,
    color: '#3B82F6',
    bgColor: '#DBEAFE',
    available: true,
  },
];

/**
 * Weekly sports schedule from AStA Hochschulsport
 * Same schedule every week - https://asta.hs-heilbronn.de/hochschulsport/
 * 
 * To update with actual schedule:
 * 1. Visit https://asta.hs-heilbronn.de/hochschulsport/
 * 2. Note the sports offered for each day of the week
 * 3. Update the sports array below with actual times and registration URLs
 * 4. Each sport should link to its specific registration page on the ASTA website
 */
const weeklySportsSchedule = [
  {
    day: 'Monday',
    sports: [
      {
        id: 'monday-1',
        title: 'Volleyball',
        time: '6:00 PM',
        location: 'Sports Hall',
        registrationUrl: 'https://asta.hs-heilbronn.de/hochschulsport/',
      },
      {
        id: 'monday-2',
        title: 'Basketball',
        time: '8:00 PM',
        location: 'Sports Hall',
        registrationUrl: 'https://asta.hs-heilbronn.de/hochschulsport/',
      },
    ],
  },
  {
    day: 'Tuesday',
    sports: [
      {
        id: 'tuesday-1',
        title: 'Badminton',
        time: '5:00 PM',
        location: 'Sports Hall',
        registrationUrl: 'https://asta.hs-heilbronn.de/hochschulsport/',
      },
      {
        id: 'tuesday-2',
        title: 'Football (Men)',
        time: '7:00 PM',
        location: 'Football Field',
        registrationUrl: 'https://asta.hs-heilbronn.de/hochschulsport/course/herren-fussball/',
      },
    ],
  },
  {
    day: 'Wednesday',
    sports: [
      {
        id: 'wednesday-1',
        title: 'Table Tennis',
        time: '5:00 PM',
        location: 'Sports Hall',
        registrationUrl: 'https://asta.hs-heilbronn.de/hochschulsport/',
      },
      {
        id: 'wednesday-2',
        title: 'Calisthenics',
        time: '6:30 PM',
        location: 'Sports Hall',
        registrationUrl: 'https://asta.hs-heilbronn.de/hochschulsport/',
      },
      {
        id: 'wednesday-3',
        title: 'Salsa (Beginners)',
        time: '8:00 PM',
        location: 'Dance Hall',
        registrationUrl: 'https://asta.hs-heilbronn.de/hochschulsport/',
      },
    ],
  },
  {
    day: 'Thursday',
    sports: [
      {
        id: 'thursday-1',
        title: 'Bouldering',
        time: '6:00 PM',
        location: 'Climbing Hall',
        registrationUrl: 'https://asta.hs-heilbronn.de/hochschulsport/',
      },
      {
        id: 'thursday-2',
        title: 'Fitness & Defense',
        time: '7:30 PM',
        location: 'Sports Hall',
        registrationUrl: 'https://asta.hs-heilbronn.de/hochschulsport/',
      },
    ],
  },
  {
    day: 'Friday',
    sports: [
      {
        id: 'friday-1',
        title: 'Lacrosse',
        time: '5:00 PM',
        location: 'Sports Field',
        registrationUrl: 'https://asta.hs-heilbronn.de/hochschulsport/',
      },
      {
        id: 'friday-2',
        title: 'Salsa (Advanced)',
        time: '7:00 PM',
        location: 'Dance Hall',
        registrationUrl: 'https://asta.hs-heilbronn.de/hochschulsport/',
      },
      {
        id: 'friday-3',
        title: 'Chess',
        time: '6:00 PM',
        location: 'Student Union',
        registrationUrl: 'https://asta.hs-heilbronn.de/hochschulsport/',
      },
    ],
  },
];

// Get today's date to show current day's sports first
const getTodaySports = () => {
  const today = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayName = dayNames[today];
  
  // Find today's sports
  const todaySchedule = weeklySportsSchedule.find(schedule => schedule.day === todayName);
  
  // If today has sports, return them; otherwise return empty array
  return todaySchedule ? todaySchedule.sports : [];
};

// Get upcoming sports for the rest of the week
const getUpcomingSports = () => {
  const today = new Date().getDay();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayName = dayNames[today];
  
  const todayIndex = weeklySportsSchedule.findIndex(schedule => schedule.day === todayName);
  
  if (todayIndex === -1) {
    // If today is Sunday or no schedule, return all sports
    return weeklySportsSchedule.flatMap(schedule => schedule.sports);
  }
  
  // Get sports from today onwards
  const upcoming = weeklySportsSchedule.slice(todayIndex).flatMap(schedule => schedule.sports);
  
  // If we're at the end of the week, add next week's sports
  if (todayIndex === weeklySportsSchedule.length - 1) {
    return upcoming.concat(weeklySportsSchedule.slice(0, todayIndex).flatMap(schedule => schedule.sports));
  }
  
  return upcoming;
};

const dailyTips = [
  '💧 Stay hydrated! Aim for 8 glasses of water today.',
  '🚶 Take a 10-minute walk between classes.',
  '😴 Try to get 7-8 hours of sleep tonight.',
  '🧘 Practice 5 minutes of deep breathing.',
];

// Default self-care items
const DEFAULT_SELF_CARE_ITEMS = [
  { id: '1', task: 'Drink 8 glasses of water', done: false },
  { id: '2', task: 'Take a 10-minute break', done: false },
  { id: '3', task: 'Eat a healthy meal', done: false },
  { id: '4', task: 'Get some fresh air', done: false },
];

const STORAGE_KEYS = {
  SELF_CARE_ITEMS: 'wellness_self_care_items',
  LAST_RESET_DATE: 'wellness_last_reset_date',
};

interface SelfCareItem {
  id: string;
  task: string;
  done: boolean;
}

// Check if we need to reset (after 5 AM)
const shouldResetItems = async (): Promise<boolean> => {
  try {
    const lastResetDate = await AsyncStorage.getItem(STORAGE_KEYS.LAST_RESET_DATE);
    const now = new Date();
    
    if (!lastResetDate) {
      // First time - initialize with current date (will reset next time if after 5 AM)
      return false;
    }

    const lastReset = new Date(lastResetDate);
    
    // Get date strings for comparison (YYYY-MM-DD)
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const lastResetStr = `${lastReset.getFullYear()}-${String(lastReset.getMonth() + 1).padStart(2, '0')}-${String(lastReset.getDate()).padStart(2, '0')}`;
    
    // Check if it's a different day
    const isNewDay = todayStr !== lastResetStr;
    
    // Reset if:
    // 1. It's a new day AND it's after 5 AM, OR
    // 2. Same day but last reset was before 5 AM and now it's after 5 AM
    if (isNewDay) {
      // New day - reset if it's after 5 AM
      return now.getHours() >= 5;
    } else {
      // Same day - reset if last reset was before 5 AM and now it's after 5 AM
      const lastResetHour = lastReset.getHours();
      return lastResetHour < 5 && now.getHours() >= 5;
    }
  } catch (error) {
    console.error('Error checking reset time:', error);
    return false;
  }
};

// Load self-care items from storage
const loadSelfCareItems = async (): Promise<SelfCareItem[]> => {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.SELF_CARE_ITEMS);
    let items: SelfCareItem[] = stored ? JSON.parse(stored) : DEFAULT_SELF_CARE_ITEMS;
    
    // If no items stored, save defaults
    if (!stored) {
      await AsyncStorage.setItem(STORAGE_KEYS.SELF_CARE_ITEMS, JSON.stringify(DEFAULT_SELF_CARE_ITEMS));
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_RESET_DATE, new Date().toISOString());
      return DEFAULT_SELF_CARE_ITEMS;
    }
    
    // Check if we need to reset (preserve items, just reset done status)
    const needsReset = await shouldResetItems();
    
    if (needsReset) {
      // Reset all checked items - keep all items but set done to false
      const resetItems = items.map(item => ({ ...item, done: false }));
      await AsyncStorage.setItem(STORAGE_KEYS.SELF_CARE_ITEMS, JSON.stringify(resetItems));
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_RESET_DATE, new Date().toISOString());
      return resetItems;
    }
    
    return items;
  } catch (error) {
    console.error('Error loading self-care items:', error);
    return DEFAULT_SELF_CARE_ITEMS;
  }
};

// Save self-care items to storage
const saveSelfCareItems = async (items: SelfCareItem[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.SELF_CARE_ITEMS, JSON.stringify(items));
  } catch (error) {
    console.error('Error saving self-care items:', error);
  }
};

export default function WellnessScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [refreshing, setRefreshing] = useState(false);
  const [currentTip] = useState(dailyTips[Math.floor(Math.random() * dailyTips.length)]);
  const [selfCareItems, setSelfCareItems] = useState<SelfCareItem[]>(DEFAULT_SELF_CARE_ITEMS);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTaskText, setNewTaskText] = useState('');
  
  // Get upcoming sports for display (limit to 6 most upcoming)
  const upcomingSports = getUpcomingSports().slice(0, 6);

  // Load self-care items on mount and when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      const loadItems = async () => {
        const items = await loadSelfCareItems();
        setSelfCareItems(items);
      };
      loadItems();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    // Reload self-care items to check for reset
    const items = await loadSelfCareItems();
    setSelfCareItems(items);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const openRegistrationUrl = (url: string) => {
    Linking.openURL(url).catch((err) => {
      console.error('Failed to open registration URL:', err);
    });
  };

  const toggleSelfCareItem = async (id: string) => {
    const updatedItems = selfCareItems.map(item =>
      item.id === id ? { ...item, done: !item.done } : item
    );
    setSelfCareItems(updatedItems);
    await saveSelfCareItems(updatedItems);
  };

  const addSelfCareItem = async () => {
    if (!newTaskText.trim()) {
      Alert.alert('Error', 'Please enter a task');
      return;
    }

    const newItem: SelfCareItem = {
      id: Date.now().toString(),
      task: newTaskText.trim(),
      done: false,
    };

    const updatedItems = [...selfCareItems, newItem];
    setSelfCareItems(updatedItems);
    await saveSelfCareItems(updatedItems);
    setNewTaskText('');
    setShowAddModal(false);
  };

  const removeSelfCareItem = async (id: string) => {
    Alert.alert(
      'Remove Item',
      'Are you sure you want to remove this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const updatedItems = selfCareItems.filter(item => item.id !== id);
            setSelfCareItems(updatedItems);
            await saveSelfCareItems(updatedItems);
          },
        },
      ]
    );
  };

  // Use splash screen image as background (same as login page)
  const backgroundSource = require('@/assets/images/splash-screen.png');

  return (
    <ImageBackground
      source={backgroundSource}
      style={styles.background}
      resizeMode="cover"
    >
      {/* Blurred Background Overlay */}
      <View style={[styles.blurOverlay, { backgroundColor: isDark ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.1)' }]} />
      
      {/* Gradient Overlay */}
      <LinearGradient
        colors={isDark 
          ? ['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.3)']
          : ['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.05)']}
        style={styles.gradientOverlay}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />

      {/* Bottom gradient */}
      <LinearGradient
        colors={isDark
          ? ['rgba(17,17,16,0)', 'rgba(17,17,16,1)', 'rgba(17,17,16,1)']
          : ['rgba(0,0,0,0)', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.4)']}
        locations={[0, 0.4424, 1]}
        style={styles.bottomGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <StatusBar style={isDark ? "light" : "dark"} />
        <Stack.Screen
          options={{
            headerShown: false,
          }}
        />

        {/* Header with Title and Back Button */}
        <View className="flex-row items-center px-4 py-3">
          <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
            <ChevronLeft size={24} color={isDark ? "#ffffff" : "#1e293b"} />
          </TouchableOpacity>
          <Text className={`text-2xl font-bold flex-1 ml-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Wellness
          </Text>
        </View>

        <ScrollView
          className="flex-1"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B82F6" />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 8 }}
        >
        {/* Daily Wellness Tip */}
        <Animated.View entering={FadeInDown.duration(500)} className="px-4 pt-4">
          <View className="bg-gradient-to-r from-pink-500 to-rose-500 bg-pink-500 rounded-2xl p-5">
            <View className="flex-row items-center mb-2">
              <Activity size={20} color="#FFFFFF" />
              <Text className="text-white/80 text-sm ml-2">Daily Wellness Tip</Text>
            </View>
            <Text className="text-white text-lg font-medium">{currentTip}</Text>
          </View>
        </Animated.View>

        {/* Emergency Contact */}
        <Animated.View entering={FadeInDown.duration(500).delay(50)} className="px-4 mt-4">
          <TouchableOpacity className="bg-red-50 border border-red-200 rounded-xl p-4 flex-row items-center">
            <View className="w-12 h-12 rounded-full bg-red-100 items-center justify-center mr-4">
              <Phone size={24} color="#EF4444" />
            </View>
            <View className="flex-1">
              <Text className="text-red-800 font-semibold">Crisis Support</Text>
              <Text className="text-red-600 text-sm">24/7 confidential helpline</Text>
            </View>
            <ChevronRight size={20} color="#EF4444" />
          </TouchableOpacity>
        </Animated.View>

        {/* Wellness Resources */}
        <Animated.View entering={FadeInDown.duration(500).delay(100)} className="px-4 mt-6">
          <Text className="text-lg font-semibold text-gray-800 mb-3">Wellness Resources</Text>

          <View className="flex-row flex-wrap justify-between">
            {wellnessResources.map((resource, index) => (
              <Animated.View
                key={resource.id}
                entering={FadeInDown.duration(400).delay(150 + index * 50)}
                style={{ width: '48%', marginBottom: 12 }}
              >
                <TouchableOpacity
                  className="bg-white rounded-xl p-4 shadow-sm"
                  activeOpacity={0.7}
                >
                  <View
                    className="w-12 h-12 rounded-xl items-center justify-center mb-3"
                    style={{ backgroundColor: resource.bgColor }}
                  >
                    <resource.icon size={24} color={resource.color} />
                  </View>
                  <Text className="text-base font-semibold text-gray-800">{resource.title}</Text>
                  <Text className="text-sm text-gray-500 mt-1">{resource.description}</Text>
                  {resource.nextAvailable && (
                    <View className="flex-row items-center mt-2">
                      <Clock size={12} color="#10B981" />
                      <Text className="text-xs text-green-600 ml-1">
                        Next: {resource.nextAvailable}
                      </Text>
                    </View>
                  )}
                  {resource.hours && (
                    <View className="flex-row items-center mt-2">
                      <Clock size={12} color="#6B7280" />
                      <Text className="text-xs text-gray-500 ml-1">{resource.hours}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        {/* Sports Calendar */}
        <Animated.View entering={FadeInDown.duration(500).delay(300)} className="px-4 mt-6">
          <Text className="text-lg font-semibold text-gray-800 mb-3">Weekly Sports Schedule</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            className="mb-4"
          >
            {weeklySportsSchedule.map((daySchedule, dayIndex) => {
              // Get color for the day
              const dayColors = [
                { bg: '#FEF3C7', border: '#F59E0B', text: '#92400E' }, // Monday - Yellow
                { bg: '#DBEAFE', border: '#3B82F6', text: '#1E40AF' }, // Tuesday - Blue
                { bg: '#D1FAE5', border: '#10B981', text: '#065F46' }, // Wednesday - Green
                { bg: '#E9D5FF', border: '#8B5CF6', text: '#6B21A8' }, // Thursday - Purple
                { bg: '#FCE7F3', border: '#EC4899', text: '#9F1239' }, // Friday - Pink
              ];
              const dayColor = dayColors[dayIndex] || dayColors[0];
              
              // Get short day name
              const shortDay = daySchedule.day.substring(0, 3);
              
              // Group sports by time slots
              const timeSlots: { [key: string]: typeof daySchedule.sports } = {};
              daySchedule.sports.forEach(sport => {
                if (!timeSlots[sport.time]) {
                  timeSlots[sport.time] = [];
                }
                timeSlots[sport.time].push(sport);
              });

              return (
                <View
                  key={daySchedule.day}
                  className="mr-3"
                  style={{ width: 140 }}
                >
                  <View
                    className="rounded-xl p-3 mb-2 border-2"
                    style={{
                      backgroundColor: dayColor.bg,
                      borderColor: dayColor.border,
                    }}
                  >
                    <Text
                      className="font-bold text-center mb-2"
                      style={{ color: dayColor.text, fontSize: 14 }}
                    >
                      {shortDay}
                    </Text>
                  </View>
                  
                  <ScrollView
                    style={{ maxHeight: 300 }}
                    showsVerticalScrollIndicator={false}
                  >
                    {Object.entries(timeSlots)
                      .sort(([timeA], [timeB]) => {
                        // Sort by time (convert to comparable format)
                        const getTimeValue = (time: string) => {
                          const [hours, minutes] = time.replace(' AM', '').replace(' PM', '').split(':').map(Number);
                          const isPM = time.includes('PM');
                          return (isPM && hours !== 12 ? hours + 12 : hours === 12 && !isPM ? 0 : hours) * 60 + minutes;
                        };
                        return getTimeValue(timeA) - getTimeValue(timeB);
                      })
                      .map(([time, sports]) => (
                        <View key={time} className="mb-2">
                          <Text className="text-xs font-semibold text-gray-600 mb-1">{time}</Text>
                          {sports.map((sport) => {
                            // Get color for sport type
                            const sportColors: { [key: string]: string } = {
                              'Volleyball': '#EF4444',
                              'Basketball': '#F97316',
                              'Badminton': '#10B981',
                              'Football': '#3B82F6',
                              'Table Tennis': '#8B5CF6',
                              'Calisthenics': '#EC4899',
                              'Salsa': '#F59E0B',
                              'Bouldering': '#6366F1',
                              'Fitness': '#14B8A6',
                              'Lacrosse': '#06B6D4',
                              'Chess': '#6B7280',
                            };
                            const sportColor = Object.entries(sportColors).find(([key]) => 
                              sport.title.includes(key)
                            )?.[1] || '#6B7280';

                            return (
                              <TouchableOpacity
                                key={sport.id}
                                onPress={() => openRegistrationUrl(sport.registrationUrl)}
                                className="mb-1 rounded-lg p-2"
                                style={{ backgroundColor: sportColor + '20' }}
                                activeOpacity={0.7}
                              >
                                <Text
                                  className="text-xs font-medium"
                                  style={{ color: sportColor }}
                                  numberOfLines={1}
                                >
                                  {sport.title}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      ))}
                  </ScrollView>
                </View>
              );
            })}
          </ScrollView>
        </Animated.View>

        {/* Upcoming Sports */}
        <Animated.View entering={FadeInDown.duration(500).delay(400)} className="px-4 mt-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-semibold text-gray-800">Upcoming Sports</Text>
            <TouchableOpacity
              onPress={() => openRegistrationUrl('https://asta.hs-heilbronn.de/hochschulsport/')}
              activeOpacity={0.7}
            >
              <Text className="text-blue-500 text-sm">View All</Text>
            </TouchableOpacity>
          </View>

          {upcomingSports.length > 0 ? (
            upcomingSports.map((sport, index) => {
              // Find which day this sport belongs to
              const sportDay = weeklySportsSchedule.find(schedule => 
                schedule.sports.some(s => s.id === sport.id)
              );
              
              return (
                <Animated.View
                  key={sport.id}
                  entering={FadeInDown.duration(400).delay(350 + index * 50)}
                >
                  <TouchableOpacity
                    className="bg-white rounded-xl p-4 mb-3 shadow-sm"
                    activeOpacity={0.7}
                  >
                    <View className="flex-row items-start justify-between">
                      <View className="flex-1">
                        <Text className="text-base font-semibold text-gray-800">{sport.title}</Text>
                        <View className="flex-row items-center mt-2">
                          <Calendar size={14} color="#6B7280" />
                          <Text className="text-sm text-gray-500 ml-1">{sportDay?.day || 'This Week'}</Text>
                          <View className="mx-2 w-1 h-1 rounded-full bg-gray-300" />
                          <Clock size={14} color="#6B7280" />
                          <Text className="text-sm text-gray-500 ml-1">{sport.time}</Text>
                        </View>
                        <View className="flex-row items-center mt-1">
                          <MapPin size={14} color="#6B7280" />
                          <Text className="text-sm text-gray-500 ml-1">{sport.location}</Text>
                        </View>
                      </View>
                      <View className="items-end">
                        <View className="bg-blue-100 px-2 py-1 rounded-full">
                          <Text className="text-blue-700 text-xs">Weekly</Text>
                        </View>
                      </View>
                    </View>
                    <TouchableOpacity
                      className="bg-blue-500 rounded-lg py-2 mt-3 items-center"
                      onPress={() => openRegistrationUrl(sport.registrationUrl)}
                      activeOpacity={0.8}
                    >
                      <Text className="text-white font-medium">Register on ASTA</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                </Animated.View>
              );
            })
          ) : (
            <View className="bg-white rounded-xl p-4 mb-3 shadow-sm items-center">
              <Activity size={24} color="#6B7280" />
              <Text className="text-gray-500 text-sm mt-2">No sports scheduled for this week</Text>
            </View>
          )}
        </Animated.View>

        {/* Self-Care Checklist */}
        <Animated.View entering={FadeInDown.duration(500).delay(500)} className="px-4 mt-6 mb-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-semibold text-gray-800">Today's Self-Care</Text>
            <TouchableOpacity
              onPress={() => setShowAddModal(true)}
              className="bg-blue-500 rounded-full p-2"
              activeOpacity={0.7}
            >
              <Plus size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <View className="bg-white rounded-xl shadow-sm overflow-hidden">
            {selfCareItems.length > 0 ? (
              selfCareItems.map((item, index) => (
                <View
                  key={item.id}
                  className={`flex-row items-center p-4 ${
                    index !== selfCareItems.length - 1 ? 'border-b border-gray-100' : ''
                  }`}
                >
                  <TouchableOpacity
                    onPress={() => toggleSelfCareItem(item.id)}
                    className="flex-row items-center flex-1"
                    activeOpacity={0.7}
                  >
                    <View
                      className={`w-6 h-6 rounded-full border-2 items-center justify-center mr-3 ${
                        item.done
                          ? 'bg-green-500 border-green-500'
                          : 'border-gray-300'
                      }`}
                    >
                      {item.done && <Text className="text-white text-xs font-bold">✓</Text>}
                    </View>
                    <Text
                      className={`flex-1 ${
                        item.done ? 'text-gray-400 line-through' : 'text-gray-700'
                      }`}
                    >
                      {item.task}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => removeSelfCareItem(item.id)}
                    className="ml-2 p-2"
                    activeOpacity={0.7}
                  >
                    <Trash2 size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <View className="p-6 items-center">
                <Text className="text-gray-500 text-sm">No self-care items yet. Add one to get started!</Text>
              </View>
            )}
          </View>
        </Animated.View>

        {/* Add Task Modal */}
        <Modal
          visible={showAddModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => {
            setShowAddModal(false);
            setNewTaskText('');
          }}
        >
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-white rounded-t-3xl p-6">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-xl font-semibold text-gray-800">Add Self-Care Task</Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowAddModal(false);
                    setNewTaskText('');
                  }}
                  className="p-2"
                  activeOpacity={0.7}
                >
                  <X size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>
              <TextInput
                className="border border-gray-300 rounded-xl p-4 mb-4 text-gray-800"
                placeholder="Enter your self-care task..."
                value={newTaskText}
                onChangeText={setNewTaskText}
                multiline={false}
                autoFocus={true}
                onSubmitEditing={addSelfCareItem}
              />
              <TouchableOpacity
                onPress={addSelfCareItem}
                className="bg-blue-500 rounded-xl py-4 items-center"
                activeOpacity={0.8}
              >
                <Text className="text-white font-semibold text-base">Add Task</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <View className="h-8" />
      </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  bottomGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  safeArea: {
    flex: 1,
  },
});










