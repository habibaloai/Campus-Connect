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
import { router, Stack } from 'expo-router';
import * as Linking from 'expo-linking';
import {
  ChevronLeft,
  Calendar,
  ChevronRight,
  Clock,
  MapPin,
  Activity,
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useColorScheme } from '@/components/useColorScheme';


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


export default function WellnessScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [refreshing, setRefreshing] = useState(false);
  
  // Get upcoming sports for display (limit to 6 most upcoming)
  const upcomingSports = getUpcomingSports().slice(0, 6);

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const openRegistrationUrl = (url: string) => {
    Linking.openURL(url).catch((err) => {
      console.error('Failed to open registration URL:', err);
    });
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
            Sports
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










