import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
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

  return (
    <View className="flex-1 bg-gray-50">
      <Stack.Screen
        options={{
          title: 'Academics',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} className="p-2">
              <ChevronLeft size={24} color="#374151" />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3B82F6']} />
        }
        showsVerticalScrollIndicator={false}
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
            <Text className="text-lg font-semibold text-gray-800">Current Courses</Text>
            <TouchableOpacity>
              <Text className="text-blue-500 text-sm">View All</Text>
            </TouchableOpacity>
          </View>

          {mockCourses.map((course, index) => (
            <Animated.View
              key={course.id}
              entering={FadeInDown.duration(400).delay(150 + index * 50)}
            >
              <TouchableOpacity
                className="bg-white rounded-xl p-4 mb-3 shadow-sm"
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
                    <Text className="text-base font-medium text-gray-800 mt-1">{course.name}</Text>
                    <Text className="text-sm text-gray-500 mt-1">{course.instructor}</Text>
                  </View>
                  <ChevronRight size={20} color="#9CA3AF" />
                </View>

                <View className="flex-row items-center mt-3 pt-3 border-t border-gray-100">
                  <Clock size={14} color="#6B7280" />
                  <Text className="text-sm text-gray-500 ml-1">{course.schedule}</Text>
                  <View className="mx-2 w-1 h-1 rounded-full bg-gray-300" />
                  <Text className="text-sm text-gray-500">{course.room}</Text>
                </View>

                {/* Progress bar */}
                <View className="mt-3">
                  <View className="flex-row justify-between mb-1">
                    <Text className="text-xs text-gray-500">Course Progress</Text>
                    <Text className="text-xs font-medium text-gray-700">{course.progress}%</Text>
                  </View>
                  <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <View
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${course.progress}%` }}
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
            <Text className="text-lg font-semibold text-gray-800">Upcoming Assignments</Text>
            <TouchableOpacity>
              <Text className="text-blue-500 text-sm">View All</Text>
            </TouchableOpacity>
          </View>

          {mockAssignments.map((assignment, index) => (
            <Animated.View
              key={assignment.id}
              entering={FadeInDown.duration(400).delay(350 + index * 50)}
            >
              <TouchableOpacity
                className="bg-white rounded-xl p-4 mb-3 shadow-sm flex-row items-center"
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
                  <Text className="text-sm text-gray-500">{assignment.course}</Text>
                  <Text className="text-base font-medium text-gray-800">{assignment.title}</Text>
                  <View className="flex-row items-center mt-1">
                    <Text
                      className="text-sm"
                      style={{ color: assignment.status === 'submitted' ? '#10B981' : getDueDateColor(assignment.dueDate) }}
                    >
                      {assignment.status === 'submitted' ? 'Submitted' : getDaysUntilDue(assignment.dueDate)}
                    </Text>
                    <View className="mx-2 w-1 h-1 rounded-full bg-gray-300" />
                    <Text className="text-sm text-gray-500">{assignment.points} pts</Text>
                  </View>
                </View>
                <ChevronRight size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </Animated.View>
          ))}
        </Animated.View>

        <View className="h-8" />
      </ScrollView>
    </View>
  );
}









