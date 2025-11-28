import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
} from 'react-native';
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

  return (
    <View className="flex-1 bg-gray-50">
      <Stack.Screen
        options={{
          title: 'Dining',
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
        {/* Search Bar */}
        <Animated.View entering={FadeInDown.duration(500)} className="px-4 pt-4">
          <View className="bg-white rounded-xl flex-row items-center px-4 py-3 shadow-sm">
            <Search size={20} color="#9CA3AF" />
            <TextInput
              className="flex-1 ml-3 text-base text-gray-800"
              placeholder="Search meals or locations..."
              placeholderTextColor="#9CA3AF"
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
                    className={`flex-row items-center px-4 py-2 rounded-full ${
                      isActive ? 'bg-blue-500' : 'bg-white'
                    }`}
                    style={{ borderWidth: isActive ? 0 : 1, borderColor: '#E5E7EB' }}
                  >
                    <filter.icon size={16} color={isActive ? '#FFFFFF' : filter.color} />
                    <Text
                      className={`ml-2 text-sm font-medium ${
                        isActive ? 'text-white' : 'text-gray-700'
                      }`}
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
          <Text className="text-lg font-semibold text-gray-800 mb-3">Dining Locations</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-3">
              {diningLocations.map((location) => (
                <TouchableOpacity
                  key={location.id}
                  className="bg-white rounded-xl p-4 shadow-sm"
                  style={{ width: 180 }}
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
                      <Text className="text-sm text-gray-600 ml-1">{location.rating}</Text>
                    </View>
                  </View>
                  <Text className="text-base font-semibold text-gray-800" numberOfLines={1}>
                    {location.name}
                  </Text>
                  <Text className="text-sm text-gray-500">{location.type}</Text>
                  <View className="flex-row items-center mt-2">
                    <Clock size={12} color="#6B7280" />
                    <Text className="text-xs text-gray-500 ml-1">{location.hours}</Text>
                  </View>
                  <View className="flex-row items-center mt-1">
                    <MapPin size={12} color="#6B7280" />
                    <Text className="text-xs text-gray-500 ml-1">{location.distance}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </Animated.View>

        {/* Today's Menu */}
        <Animated.View entering={FadeInDown.duration(500).delay(200)} className="px-4 mt-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-semibold text-gray-800">Today's Menu</Text>
            <TouchableOpacity>
              <Text className="text-blue-500 text-sm">Full Menu</Text>
            </TouchableOpacity>
          </View>

          {filteredMenu.length === 0 ? (
            <View className="bg-white rounded-xl p-8 items-center">
              <Utensils size={48} color="#D1D5DB" />
              <Text className="text-gray-500 mt-4">No items match your filters</Text>
            </View>
          ) : (
            filteredMenu.map((item, index) => (
              <Animated.View
                key={item.id}
                entering={FadeInDown.duration(400).delay(250 + index * 50)}
              >
                <TouchableOpacity
                  className="bg-white rounded-xl p-4 mb-3 shadow-sm"
                  activeOpacity={0.7}
                >
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1">
                      <Text className="text-base font-semibold text-gray-800">{item.name}</Text>
                      <Text className="text-sm text-gray-500">{item.station}</Text>
                      <View className="flex-row items-center mt-2">
                        <Text className="text-sm text-gray-600">{item.calories} cal</Text>
                        <View className="mx-2 w-1 h-1 rounded-full bg-gray-300" />
                        <Text className="text-sm text-gray-600">{item.protein}g protein</Text>
                      </View>
                    </View>
                    <View className="flex-row items-center bg-yellow-50 px-2 py-1 rounded-full">
                      <Star size={14} color="#F59E0B" fill="#F59E0B" />
                      <Text className="text-sm text-yellow-700 ml-1">{item.rating}</Text>
                    </View>
                  </View>
                  <View className="flex-row flex-wrap mt-3 gap-2">
                    {item.tags.map((tag) => (
                      <View key={tag} className="bg-gray-100 px-2 py-1 rounded-full">
                        <Text className="text-xs text-gray-600 capitalize">{tag}</Text>
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
    </View>
  );
}









