import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { router, Stack } from 'expo-router';
import {
  ChevronLeft,
  Search as SearchIcon,
  X,
  Clock,
  Calendar,
  Users,
  MessageCircle,
  BookOpen,
  Briefcase,
  User,
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';

// Mock search results
const mockResults = {
  events: [
    { id: '1', title: 'Fall Career Fair 2024', subtitle: 'Oct 15 • Student Center', type: 'event' },
    { id: '2', title: 'Tech Workshop', subtitle: 'Oct 18 • Engineering Building', type: 'event' },
  ],
  posts: [
    { id: '1', title: 'Looking for study group for CS 301', subtitle: 'Posted by Alex • 2 hours ago', type: 'post' },
    { id: '2', title: 'Best coffee spots on campus?', subtitle: 'Posted by Sarah • 1 day ago', type: 'post' },
  ],
  people: [
    { id: '1', title: 'Alex Thompson', subtitle: 'Computer Science • Junior', type: 'person' },
    { id: '2', title: 'Sarah Johnson', subtitle: 'Business Admin • Senior', type: 'person' },
  ],
  courses: [
    { id: '1', title: 'CS 301 - Data Structures', subtitle: 'Dr. Johnson • MWF 10 AM', type: 'course' },
    { id: '2', title: 'MATH 201 - Linear Algebra', subtitle: 'Prof. Chen • TTh 2 PM', type: 'course' },
  ],
  jobs: [
    { id: '1', title: 'Software Engineering Intern', subtitle: 'TechCorp Inc. • San Francisco', type: 'job' },
    { id: '2', title: 'Research Assistant', subtitle: 'University Lab • On Campus', type: 'job' },
  ],
};

const recentSearches = ['career fair', 'study room', 'CS 301', 'dining hours'];

const categoryIcons: Record<string, any> = {
  event: Calendar,
  post: Users,
  person: User,
  course: BookOpen,
  job: Briefcase,
};

const categoryColors: Record<string, string> = {
  event: '#9C27B0',
  post: '#00897B',
  person: '#3B82F6',
  course: '#1A73E8',
  job: '#546E7A',
};

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [results, setResults] = useState<typeof mockResults | null>(null);
  const inputRef = useRef<TextInput>(null);

  const handleSearch = useCallback(() => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setHasSearched(true);

    // Simulate API call
    setTimeout(() => {
      setResults(mockResults);
      setIsSearching(false);
    }, 500);
  }, [searchQuery]);

  const clearSearch = () => {
    setSearchQuery('');
    setResults(null);
    setHasSearched(false);
    inputRef.current?.focus();
  };

  const handleRecentSearch = (query: string) => {
    setSearchQuery(query);
    // Trigger search with the query
    setIsSearching(true);
    setHasSearched(true);
    setTimeout(() => {
      setResults(mockResults);
      setIsSearching(false);
    }, 500);
  };

  const handleResultPress = (type: string, id: string) => {
    switch (type) {
      case 'event':
        router.push(`/(tabs)/events/${id}`);
        break;
      case 'post':
        router.push(`/(tabs)/community/${id}`);
        break;
      case 'person':
        // Navigate to profile
        break;
      case 'course':
        router.push('/academics');
        break;
      case 'job':
        router.push('/career');
        break;
    }
  };

  const renderResultSection = (
    title: string,
    items: Array<{ id: string; title: string; subtitle: string; type: string }>
  ) => {
    if (items.length === 0) return null;

    return (
      <Animated.View entering={FadeInDown.duration(400)} className="mb-6">
        <Text className="text-sm font-semibold text-gray-500 uppercase mb-3">{title}</Text>
        {items.map((item, index) => {
          const Icon = categoryIcons[item.type];
          const color = categoryColors[item.type];
          return (
            <TouchableOpacity
              key={item.id}
              className="flex-row items-center bg-white rounded-xl p-4 mb-2 shadow-sm"
              onPress={() => handleResultPress(item.type, item.id)}
              activeOpacity={0.7}
            >
              <View
                className="w-10 h-10 rounded-full items-center justify-center mr-3"
                style={{ backgroundColor: color + '20' }}
              >
                <Icon size={20} color={color} />
              </View>
              <View className="flex-1">
                <Text className="text-base font-medium text-gray-800">{item.title}</Text>
                <Text className="text-sm text-gray-500">{item.subtitle}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </Animated.View>
    );
  };

  const totalResults = results
    ? Object.values(results).reduce((sum, arr) => sum + arr.length, 0)
    : 0;

  return (
    <View className="flex-1 bg-gray-50">
      <Stack.Screen
        options={{
          title: 'Search',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} className="p-2">
              <ChevronLeft size={24} color="#374151" />
            </TouchableOpacity>
          ),
        }}
      />

      {/* Search Input */}
      <View className="px-4 pt-4">
        <View className="bg-white rounded-xl flex-row items-center px-4 py-3 shadow-sm">
          <SearchIcon size={20} color="#9CA3AF" />
          <TextInput
            ref={inputRef}
            className="flex-1 mx-3 text-base text-gray-800"
            placeholder="Search events, posts, people, courses..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch}>
              <X size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
        {/* Loading State */}
        {isSearching && (
          <View className="items-center py-8">
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text className="text-gray-500 mt-4">Searching...</Text>
          </View>
        )}

        {/* No Query - Show Recent Searches */}
        {!hasSearched && !isSearching && (
          <Animated.View entering={FadeIn.duration(300)}>
            <Text className="text-sm font-semibold text-gray-500 uppercase mb-3">
              Recent Searches
            </Text>
            {recentSearches.map((query, index) => (
              <TouchableOpacity
                key={query}
                className="flex-row items-center py-3 border-b border-gray-100"
                onPress={() => handleRecentSearch(query)}
              >
                <Clock size={18} color="#9CA3AF" />
                <Text className="text-base text-gray-700 ml-3">{query}</Text>
              </TouchableOpacity>
            ))}

            {/* Quick Categories */}
            <Text className="text-sm font-semibold text-gray-500 uppercase mt-6 mb-3">
              Browse Categories
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {[
                { label: 'Events', route: '/(tabs)/events', icon: Calendar, color: '#9C27B0' },
                { label: 'Community', route: '/(tabs)/community', icon: Users, color: '#00897B' },
                { label: 'Courses', route: '/academics', icon: BookOpen, color: '#1A73E8' },
                { label: 'Jobs', route: '/career', icon: Briefcase, color: '#546E7A' },
              ].map((category) => (
                <TouchableOpacity
                  key={category.label}
                  className="flex-row items-center bg-white rounded-xl px-4 py-3 shadow-sm"
                  onPress={() => router.push(category.route as any)}
                >
                  <category.icon size={18} color={category.color} />
                  <Text className="text-gray-700 font-medium ml-2">{category.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Search Results */}
        {hasSearched && !isSearching && results && (
          <Animated.View entering={FadeIn.duration(300)}>
            <Text className="text-gray-500 mb-4">{totalResults} results found</Text>

            {renderResultSection('Events', results.events)}
            {renderResultSection('Community Posts', results.posts)}
            {renderResultSection('People', results.people)}
            {renderResultSection('Courses', results.courses)}
            {renderResultSection('Jobs', results.jobs)}

            {totalResults === 0 && (
              <View className="items-center py-12">
                <SearchIcon size={48} color="#D1D5DB" />
                <Text className="text-gray-500 mt-4 text-center">
                  No results found for "{searchQuery}"
                </Text>
                <Text className="text-gray-400 text-sm text-center mt-2">
                  Try different keywords or browse categories
                </Text>
              </View>
            )}
          </Animated.View>
        )}

        <View className="h-8" />
      </ScrollView>
    </View>
  );
}










