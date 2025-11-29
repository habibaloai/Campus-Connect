import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  ImageBackground,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router, Stack } from 'expo-router';
import {
  ChevronLeft,
  Utensils,
  Clock,
  MapPin,
  Star,
  Search,
  Filter,
  Leaf,
  Wheat,
  Milk,
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useColorScheme } from '@/components/useColorScheme';

// Mock dining data
const diningLocations = [
  {
    id: '1',
    name: 'Main Dining Hall',
    type: 'Dining Hall',
    status: 'open',
    hours: '7:00 AM - 9:00 PM',
    currentMeal: 'Lunch',
    rating: 4.2,
    distance: '2 min walk',
  },
  {
    id: '2',
    name: 'Campus Café',
    type: 'Café',
    status: 'open',
    hours: '6:30 AM - 10:00 PM',
    currentMeal: 'All Day',
    rating: 4.5,
    distance: '5 min walk',
  },
  {
    id: '3',
    name: 'Student Union Food Court',
    type: 'Food Court',
    status: 'open',
    hours: '10:00 AM - 8:00 PM',
    currentMeal: 'Lunch',
    rating: 4.0,
    distance: '8 min walk',
  },
  {
    id: '4',
    name: 'Engineering Café',
    type: 'Café',
    status: 'closed',
    hours: '8:00 AM - 4:00 PM',
    currentMeal: 'Closed',
    rating: 3.8,
    distance: '3 min walk',
  },
];

const todaysMenu = [
  {
    id: '1',
    name: 'Grilled Chicken Breast',
    station: 'Grill Station',
    calories: 280,
    protein: 42,
    tags: ['gluten-free', 'high-protein'],
    rating: 4.5,
  },
  {
    id: '2',
    name: 'Vegetable Stir Fry',
    station: 'International',
    calories: 220,
    protein: 8,
    tags: ['vegan', 'vegetarian'],
    rating: 4.2,
  },
  {
    id: '3',
    name: 'Caesar Salad',
    station: 'Salad Bar',
    calories: 180,
    protein: 12,
    tags: ['vegetarian'],
    rating: 4.0,
  },
  {
    id: '4',
    name: 'Margherita Pizza',
    station: 'Pizza Station',
    calories: 350,
    protein: 14,
    tags: ['vegetarian'],
    rating: 4.3,
  },
];

const dietaryFilters = [
  { id: 'vegan', label: 'Vegan', icon: Leaf, color: '#10B981' },
  { id: 'vegetarian', label: 'Vegetarian', icon: Leaf, color: '#22C55E' },
  { id: 'gluten-free', label: 'Gluten-Free', icon: Wheat, color: '#F59E0B' },
  { id: 'dairy-free', label: 'Dairy-Free', icon: Milk, color: '#3B82F6' },
];

export default function DiningScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const toggleFilter = (filterId: string) => {
    setActiveFilters((prev) =>
      prev.includes(filterId)
        ? prev.filter((f) => f !== filterId)
        : [...prev, filterId]
    );
  };

  const filteredMenu = todaysMenu.filter((item) => {
    if (activeFilters.length === 0) return true;
    return activeFilters.some((filter) => item.tags.includes(filter));
  });

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
            Dining
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
        {/* Search Bar */}
        <Animated.View entering={FadeInDown.duration(500)} className="px-4 pt-4">
          <View style={{
            backgroundColor: isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            borderRadius: 12,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 12,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: isDark ? 0.3 : 0.1,
            shadowRadius: 8,
            elevation: 4,
          }}>
            <Search size={20} color="#9CA3AF" />
            <TextInput
              className="flex-1 ml-3 text-base"
              style={{ color: isDark ? '#ffffff' : '#1e293b' }}
              placeholder="Search meals or locations..."
              placeholderTextColor={isDark ? "#6b7280" : "#9CA3AF"}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </Animated.View>

        {/* Dietary Filters */}
        <Animated.View entering={FadeInDown.duration(500).delay(50)} className="px-4 mt-4">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-2">
              {dietaryFilters.map((filter) => {
                const isActive = activeFilters.includes(filter.id);
                return (
                  <TouchableOpacity
                    key={filter.id}
                    onPress={() => toggleFilter(filter.id)}
                    className="flex-row items-center px-4 py-2 rounded-full"
                    style={{
                      backgroundColor: isActive ? '#3b82f6' : (isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)'),
                      borderWidth: isActive ? 0 : 1,
                      borderColor: isDark ? '#374151' : '#E5E7EB',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: isDark ? 0.2 : 0.05,
                      shadowRadius: 3,
                      elevation: 2,
                    }}
                  >
                    <filter.icon size={16} color={isActive ? '#FFFFFF' : filter.color} />
                    <Text
                      className="ml-2 text-sm font-medium"
                      style={{
                        color: isActive ? '#ffffff' : (isDark ? '#e2e8f0' : '#374151')
                      }}
                    >
                      {filter.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </Animated.View>

        {/* Dining Locations */}
        <Animated.View entering={FadeInDown.duration(500).delay(100)} className="px-4 mt-6">
          <Text className="text-lg font-semibold mb-3" style={{ color: isDark ? '#ffffff' : '#1e293b' }}>Dining Locations</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-3">
              {diningLocations.map((location) => (
                <TouchableOpacity
                  key={location.id}
                  className="rounded-xl p-4"
                  style={{
                    width: 180,
                    backgroundColor: isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: isDark ? 0.3 : 0.1,
                    shadowRadius: 8,
                    elevation: 4,
                  }}
                  activeOpacity={0.7}
                >
                  <View className="flex-row items-center justify-between mb-2">
                    <View
                      className={`px-2 py-1 rounded-full ${
                        location.status === 'open' ? 'bg-green-100' : 'bg-red-100'
                      }`}
                    >
                      <Text
                        className={`text-xs font-medium ${
                          location.status === 'open' ? 'text-green-700' : 'text-red-700'
                        }`}
                      >
                        {location.status === 'open' ? 'Open' : 'Closed'}
                      </Text>
                    </View>
                    <View className="flex-row items-center">
                      <Star size={12} color="#F59E0B" fill="#F59E0B" />
                      <Text className="text-sm ml-1" style={{ color: isDark ? '#d1d5db' : '#4b5563' }}>{location.rating}</Text>
                    </View>
                  </View>
                  <Text className="text-base font-semibold" style={{ color: isDark ? '#ffffff' : '#1e293b' }} numberOfLines={1}>
                    {location.name}
                  </Text>
                  <Text className="text-sm" style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>{location.type}</Text>
                  <View className="flex-row items-center mt-2">
                    <Clock size={12} color={isDark ? "#9ca3af" : "#6B7280"} />
                    <Text className="text-xs ml-1" style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>{location.hours}</Text>
                  </View>
                  <View className="flex-row items-center mt-1">
                    <MapPin size={12} color={isDark ? "#9ca3af" : "#6B7280"} />
                    <Text className="text-xs ml-1" style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>{location.distance}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </Animated.View>

        {/* Today's Menu */}
        <Animated.View entering={FadeInDown.duration(500).delay(200)} className="px-4 mt-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-semibold" style={{ color: isDark ? '#ffffff' : '#1e293b' }}>Today's Menu</Text>
            <TouchableOpacity>
              <Text className="text-sm" style={{ color: '#3b82f6' }}>Full Menu</Text>
            </TouchableOpacity>
          </View>

          {filteredMenu.length === 0 ? (
            <View style={{
              backgroundColor: isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
              borderRadius: 12,
              padding: 32,
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: isDark ? 0.3 : 0.1,
              shadowRadius: 8,
              elevation: 4,
            }}>
              <Utensils size={48} color={isDark ? "#6b7280" : "#D1D5DB"} />
              <Text className="mt-4" style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>No items match your filters</Text>
            </View>
          ) : (
            filteredMenu.map((item, index) => (
              <Animated.View
                key={item.id}
                entering={FadeInDown.duration(400).delay(250 + index * 50)}
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
                      <Text className="text-base font-semibold" style={{ color: isDark ? '#ffffff' : '#1e293b' }}>{item.name}</Text>
                      <Text className="text-sm" style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>{item.station}</Text>
                      <View className="flex-row items-center mt-2">
                        <Text className="text-sm" style={{ color: isDark ? '#d1d5db' : '#4b5563' }}>{item.calories} cal</Text>
                        <View className="mx-2 w-1 h-1 rounded-full" style={{ backgroundColor: isDark ? '#4b5563' : '#d1d5db' }} />
                        <Text className="text-sm" style={{ color: isDark ? '#d1d5db' : '#4b5563' }}>{item.protein}g protein</Text>
                      </View>
                    </View>
                    <View className="flex-row items-center px-2 py-1 rounded-full" style={{ backgroundColor: isDark ? 'rgba(245, 158, 11, 0.2)' : 'rgba(254, 243, 199, 0.8)' }}>
                      <Star size={14} color="#F59E0B" fill="#F59E0B" />
                      <Text className="text-sm ml-1" style={{ color: isDark ? '#fbbf24' : '#92400e' }}>{item.rating}</Text>
                    </View>
                  </View>
                  <View className="flex-row flex-wrap mt-3 gap-2">
                    {item.tags.map((tag) => (
                      <View key={tag} className="px-2 py-1 rounded-full" style={{ backgroundColor: isDark ? 'rgba(75, 85, 99, 0.3)' : 'rgba(243, 244, 246, 0.8)' }}>
                        <Text className="text-xs capitalize" style={{ color: isDark ? '#d1d5db' : '#4b5563' }}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                </TouchableOpacity>
              </Animated.View>
            ))
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










