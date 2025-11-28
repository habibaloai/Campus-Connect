import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { router, Stack } from 'expo-router';
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
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

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

const upcomingWorkshops = [
  {
    id: '1',
    title: 'Stress Management 101',
    date: 'Oct 18, 2024',
    time: '3:00 PM',
    location: 'Wellness Center',
    spots: 12,
  },
  {
    id: '2',
    title: 'Mindfulness Meditation',
    date: 'Oct 20, 2024',
    time: '12:00 PM',
    location: 'Student Union',
    spots: 8,
  },
  {
    id: '3',
    title: 'Yoga for Beginners',
    date: 'Oct 22, 2024',
    time: '5:00 PM',
    location: 'Fitness Center',
    spots: 15,
  },
];

const dailyTips = [
  '💧 Stay hydrated! Aim for 8 glasses of water today.',
  '🚶 Take a 10-minute walk between classes.',
  '😴 Try to get 7-8 hours of sleep tonight.',
  '🧘 Practice 5 minutes of deep breathing.',
];

export default function WellnessScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [currentTip] = useState(dailyTips[Math.floor(Math.random() * dailyTips.length)]);

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  return (
    <View className="flex-1 bg-gray-50">
      <Stack.Screen
        options={{
          title: 'Wellness',
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

        {/* Upcoming Workshops */}
        <Animated.View entering={FadeInDown.duration(500).delay(300)} className="px-4 mt-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-semibold text-gray-800">Upcoming Workshops</Text>
            <TouchableOpacity>
              <Text className="text-blue-500 text-sm">View All</Text>
            </TouchableOpacity>
          </View>

          {upcomingWorkshops.map((workshop, index) => (
            <Animated.View
              key={workshop.id}
              entering={FadeInDown.duration(400).delay(350 + index * 50)}
            >
              <TouchableOpacity
                className="bg-white rounded-xl p-4 mb-3 shadow-sm"
                activeOpacity={0.7}
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-gray-800">{workshop.title}</Text>
                    <View className="flex-row items-center mt-2">
                      <Calendar size={14} color="#6B7280" />
                      <Text className="text-sm text-gray-500 ml-1">{workshop.date}</Text>
                      <View className="mx-2 w-1 h-1 rounded-full bg-gray-300" />
                      <Clock size={14} color="#6B7280" />
                      <Text className="text-sm text-gray-500 ml-1">{workshop.time}</Text>
                    </View>
                    <View className="flex-row items-center mt-1">
                      <MapPin size={14} color="#6B7280" />
                      <Text className="text-sm text-gray-500 ml-1">{workshop.location}</Text>
                    </View>
                  </View>
                  <View className="items-end">
                    <View className="bg-green-100 px-2 py-1 rounded-full">
                      <Text className="text-green-700 text-xs">{workshop.spots} spots left</Text>
                    </View>
                  </View>
                </View>
                <TouchableOpacity className="bg-purple-500 rounded-lg py-2 mt-3 items-center">
                  <Text className="text-white font-medium">Register</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </Animated.View>

        {/* Self-Care Checklist */}
        <Animated.View entering={FadeInDown.duration(500).delay(500)} className="px-4 mt-6 mb-6">
          <Text className="text-lg font-semibold text-gray-800 mb-3">Today's Self-Care</Text>
          <View className="bg-white rounded-xl shadow-sm overflow-hidden">
            {[
              { task: 'Drink 8 glasses of water', done: true },
              { task: 'Take a 10-minute break', done: true },
              { task: 'Eat a healthy meal', done: false },
              { task: 'Get some fresh air', done: false },
            ].map((item, index) => (
              <TouchableOpacity
                key={item.task}
                className={`flex-row items-center p-4 ${index !== 3 ? 'border-b border-gray-100' : ''}`}
              >
                <View
                  className={`w-6 h-6 rounded-full border-2 items-center justify-center mr-3 ${
                    item.done
                      ? 'bg-green-500 border-green-500'
                      : 'border-gray-300'
                  }`}
                >
                  {item.done && <Text className="text-white text-xs">✓</Text>}
                </View>
                <Text
                  className={`flex-1 ${
                    item.done ? 'text-gray-400 line-through' : 'text-gray-700'
                  }`}
                >
                  {item.task}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        <View className="h-8" />
      </ScrollView>
    </View>
  );
}









