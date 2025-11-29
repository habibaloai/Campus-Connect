import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  ImageBackground,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router, Stack } from 'expo-router';
import {
  ChevronLeft,
  BookOpen,
  GraduationCap,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  TrendingUp,
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAuth } from '@/providers';
import { useColorScheme } from '@/components/useColorScheme';

// Mock data - replace with Supabase queries
const mockCourses = [
  {
    id: '1',
    code: 'CS 301',
    name: 'Data Structures & Algorithms',
    instructor: 'Dr. Sarah Johnson',
    schedule: 'MWF 10:00 AM',
    room: 'ENG 201',
    grade: 'A',
    credits: 3,
    progress: 75,
  },
  {
    id: '2',
    code: 'MATH 201',
    name: 'Linear Algebra',
    instructor: 'Prof. Michael Chen',
    schedule: 'TTh 2:00 PM',
    room: 'MATH 105',
    grade: 'B+',
    credits: 4,
    progress: 60,
  },
  {
    id: '3',
    code: 'ENG 102',
    name: 'Technical Writing',
    instructor: 'Dr. Emily Brooks',
    schedule: 'MWF 1:00 PM',
    room: 'HUM 302',
    grade: 'A-',
    credits: 3,
    progress: 80,
  },
  {
    id: '4',
    code: 'PHY 201',
    name: 'Physics II',
    instructor: 'Prof. David Kim',
    schedule: 'TTh 11:00 AM',
    room: 'SCI 401',
    grade: 'B',
    credits: 4,
    progress: 55,
  },
];

const mockAssignments = [
  {
    id: '1',
    course: 'CS 301',
    title: 'Binary Tree Implementation',
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days
    status: 'pending',
    points: 100,
  },
  {
    id: '2',
    course: 'MATH 201',
    title: 'Problem Set 5',
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days
    status: 'pending',
    points: 50,
  },
  {
    id: '3',
    course: 'ENG 102',
    title: 'Research Paper Draft',
    dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
    status: 'submitted',
    points: 150,
  },
];

const getGradeColor = (grade: string): string => {
  if (grade.startsWith('A')) return '#10B981';
  if (grade.startsWith('B')) return '#3B82F6';
  if (grade.startsWith('C')) return '#F59E0B';
  return '#EF4444';
};

export default function AcademicsScreen() {
  const { profile } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);

  const gpa = profile?.gpa || 3.75;
  const totalCredits = mockCourses.reduce((sum, c) => sum + c.credits, 0);
  const completedCredits = 78; // Mock value

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const getDaysUntilDue = (date: Date) => {
    const diff = date.getTime() - Date.now();
    const days = Math.ceil(diff / (24 * 60 * 60 * 1000));
    if (days < 0) return 'Overdue';
    if (days === 0) return 'Due today';
    if (days === 1) return 'Due tomorrow';
    return `Due in ${days} days`;
  };

  const getDueDateColor = (date: Date) => {
    const diff = date.getTime() - Date.now();
    const days = Math.ceil(diff / (24 * 60 * 60 * 1000));
    if (days < 0) return '#EF4444';
    if (days <= 2) return '#F59E0B';
    return '#10B981';
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
            Academics
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
        {/* GPA Overview Card */}
        <Animated.View entering={FadeInDown.duration(500)} className="px-4 pt-4">
          <View className="bg-gradient-to-r from-blue-500 to-blue-600 bg-blue-500 rounded-2xl p-5 shadow-lg">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-white/80 text-sm mb-1">Current GPA</Text>
                <Text className="text-white text-4xl font-bold">{gpa.toFixed(2)}</Text>
                <View className="flex-row items-center mt-2">
                  <TrendingUp size={14} color="#34D399" />
                  <Text className="text-green-300 text-sm ml-1">+0.15 from last semester</Text>
                </View>
              </View>
              <View className="items-end">
                <View className="bg-white/20 rounded-full p-3 mb-2">
                  <GraduationCap size={32} color="#FFFFFF" />
                </View>
                <Text className="text-white/80 text-sm">{completedCredits}/{completedCredits + totalCredits} credits</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Current Courses */}
        <Animated.View entering={FadeInDown.duration(500).delay(100)} className="px-4 mt-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-semibold" style={{ color: isDark ? '#ffffff' : '#1e293b' }}>Current Courses</Text>
            <TouchableOpacity>
              <Text className="text-sm" style={{ color: '#3b82f6' }}>View All</Text>
            </TouchableOpacity>
          </View>

          {mockCourses.map((course, index) => (
            <Animated.View
              key={course.id}
              entering={FadeInDown.duration(400).delay(150 + index * 50)}
            >
              <TouchableOpacity
                className="rounded-xl p-4 mb-3"
                style={{
                  backgroundColor: isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: isDark ? 0.3 : 0.1,
                  shadowRadius: 8,
                  elevation: 4,
                }}
                activeOpacity={0.7}
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1">
                    <View className="flex-row items-center">
                      <Text className="text-sm font-semibold text-blue-500">{course.code}</Text>
                      <View
                        className="ml-2 px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: getGradeColor(course.grade) + '20' }}
                      >
                        <Text style={{ color: getGradeColor(course.grade) }} className="text-xs font-semibold">
                          {course.grade}
                        </Text>
                      </View>
                    </View>
                    <Text className="text-base font-medium mt-1" style={{ color: isDark ? '#ffffff' : '#1e293b' }}>{course.name}</Text>
                    <Text className="text-sm mt-1" style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>{course.instructor}</Text>
                  </View>
                  <ChevronRight size={20} color="#9CA3AF" />
                </View>

                <View className="flex-row items-center mt-3 pt-3" style={{ borderTopWidth: 1, borderTopColor: isDark ? '#374151' : '#e5e7eb' }}>
                  <Clock size={14} color={isDark ? "#9ca3af" : "#6B7280"} />
                  <Text className="text-sm ml-1" style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>{course.schedule}</Text>
                  <View className="mx-2 w-1 h-1 rounded-full" style={{ backgroundColor: isDark ? '#4b5563' : '#d1d5db' }} />
                  <Text className="text-sm" style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>{course.room}</Text>
                </View>

                {/* Progress bar */}
                <View className="mt-3">
                  <View className="flex-row justify-between mb-1">
                    <Text className="text-xs" style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>Course Progress</Text>
                    <Text className="text-xs font-medium" style={{ color: isDark ? '#d1d5db' : '#374151' }}>{course.progress}%</Text>
                  </View>
                  <View className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: isDark ? '#374151' : '#e5e7eb' }}>
                    <View
                      className="h-full rounded-full"
                      style={{ width: `${course.progress}%`, backgroundColor: '#3b82f6' }}
                    />
                  </View>
                </View>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </Animated.View>

        {/* Upcoming Assignments */}
        <Animated.View entering={FadeInDown.duration(500).delay(300)} className="px-4 mt-6 mb-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-semibold" style={{ color: isDark ? '#ffffff' : '#1e293b' }}>Upcoming Assignments</Text>
            <TouchableOpacity>
              <Text className="text-sm" style={{ color: '#3b82f6' }}>View All</Text>
            </TouchableOpacity>
          </View>

          {mockAssignments.map((assignment, index) => (
            <Animated.View
              key={assignment.id}
              entering={FadeInDown.duration(400).delay(350 + index * 50)}
            >
              <TouchableOpacity
                className="rounded-xl p-4 mb-3 flex-row items-center"
                style={{
                  backgroundColor: isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: isDark ? 0.3 : 0.1,
                  shadowRadius: 8,
                  elevation: 4,
                }}
                activeOpacity={0.7}
              >
                <View
                  className="w-10 h-10 rounded-full items-center justify-center mr-3"
                  style={{ backgroundColor: assignment.status === 'submitted' ? '#D1FAE5' : '#FEE2E2' }}
                >
                  {assignment.status === 'submitted' ? (
                    <CheckCircle size={20} color="#10B981" />
                  ) : (
                    <AlertCircle size={20} color={getDueDateColor(assignment.dueDate)} />
                  )}
                </View>
                <View className="flex-1">
                  <Text className="text-sm" style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>{assignment.course}</Text>
                  <Text className="text-base font-medium" style={{ color: isDark ? '#ffffff' : '#1e293b' }}>{assignment.title}</Text>
                  <View className="flex-row items-center mt-1">
                    <Text
                      className="text-sm"
                      style={{ color: assignment.status === 'submitted' ? '#10B981' : getDueDateColor(assignment.dueDate) }}
                    >
                      {assignment.status === 'submitted' ? 'Submitted' : getDaysUntilDue(assignment.dueDate)}
                    </Text>
                    <View className="mx-2 w-1 h-1 rounded-full" style={{ backgroundColor: isDark ? '#4b5563' : '#d1d5db' }} />
                    <Text className="text-sm" style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>{assignment.points} pts</Text>
                  </View>
                </View>
                <ChevronRight size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </Animated.View>
          ))}
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










