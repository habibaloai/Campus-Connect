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
  Briefcase,
  MapPin,
  Clock,
  DollarSign,
  Search,
  Filter,
  Building2,
  ChevronRight,
  Calendar,
  Bookmark,
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

// Mock job data
const jobListings = [
  {
    id: '1',
    title: 'Software Engineering Intern',
    company: 'TechCorp Inc.',
    location: 'San Francisco, CA',
    type: 'Internship',
    salary: '$35/hr',
    posted: '2 days ago',
    saved: true,
    logo: '🏢',
  },
  {
    id: '2',
    title: 'Marketing Coordinator',
    company: 'StartUp Labs',
    location: 'Remote',
    type: 'Part-time',
    salary: '$20/hr',
    posted: '5 days ago',
    saved: false,
    logo: '🚀',
  },
  {
    id: '3',
    title: 'Research Assistant',
    company: 'University Research Lab',
    location: 'On Campus',
    type: 'Part-time',
    salary: '$18/hr',
    posted: '1 week ago',
    saved: true,
    logo: '🔬',
  },
  {
    id: '4',
    title: 'UX Design Intern',
    company: 'Design Studio',
    location: 'New York, NY',
    type: 'Internship',
    salary: '$30/hr',
    posted: '3 days ago',
    saved: false,
    logo: '🎨',
  },
];

const upcomingEvents = [
  {
    id: '1',
    title: 'Fall Career Fair 2024',
    date: 'Oct 15, 2024',
    time: '10:00 AM - 4:00 PM',
    location: 'Student Center Ballroom',
    companies: 50,
  },
  {
    id: '2',
    title: 'Tech Industry Panel',
    date: 'Oct 20, 2024',
    time: '2:00 PM - 4:00 PM',
    location: 'Engineering Auditorium',
    companies: 5,
  },
];

const jobTypes = ['All', 'Internship', 'Part-time', 'Full-time', 'Remote'];

export default function CareerScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [savedJobs, setSavedJobs] = useState<string[]>(['1', '3']);

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const toggleSaveJob = (jobId: string) => {
    setSavedJobs((prev) =>
      prev.includes(jobId) ? prev.filter((id) => id !== jobId) : [...prev, jobId]
    );
  };

  const filteredJobs = jobListings.filter((job) => {
    if (selectedType !== 'All' && job.type !== selectedType) return false;
    if (
      searchQuery &&
      !job.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !job.company.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;
    return true;
  });

  return (
    <View className="flex-1 bg-gray-50">
      <Stack.Screen
        options={{
          title: 'Career Services',
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
              placeholder="Search jobs or companies..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <TouchableOpacity>
              <Filter size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Job Type Filters */}
        <Animated.View entering={FadeInDown.duration(500).delay(50)} className="px-4 mt-4">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-2">
              {jobTypes.map((type) => (
                <TouchableOpacity
                  key={type}
                  onPress={() => setSelectedType(type)}
                  className={`px-4 py-2 rounded-full ${
                    selectedType === type ? 'bg-blue-500' : 'bg-white border border-gray-200'
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${
                      selectedType === type ? 'text-white' : 'text-gray-700'
                    }`}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </Animated.View>

        {/* Upcoming Career Events */}
        <Animated.View entering={FadeInDown.duration(500).delay(100)} className="px-4 mt-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-semibold text-gray-800">Upcoming Events</Text>
            <TouchableOpacity>
              <Text className="text-blue-500 text-sm">View All</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-3">
              {upcomingEvents.map((event) => (
                <TouchableOpacity
                  key={event.id}
                  className="bg-gradient-to-br from-blue-500 to-indigo-600 bg-blue-500 rounded-xl p-4"
                  style={{ width: 260 }}
                  activeOpacity={0.8}
                >
                  <View className="flex-row items-center mb-2">
                    <Calendar size={16} color="#FFFFFF" />
                    <Text className="text-white/80 text-sm ml-2">{event.date}</Text>
                  </View>
                  <Text className="text-white text-lg font-semibold mb-1">{event.title}</Text>
                  <Text className="text-white/70 text-sm">{event.location}</Text>
                  <View className="flex-row items-center mt-3">
                    <Building2 size={14} color="#FFFFFF" />
                    <Text className="text-white/80 text-sm ml-1">
                      {event.companies}+ companies attending
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </Animated.View>

        {/* Job Listings */}
        <Animated.View entering={FadeInDown.duration(500).delay(200)} className="px-4 mt-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-semibold text-gray-800">
              Job Opportunities ({filteredJobs.length})
            </Text>
          </View>

          {filteredJobs.length === 0 ? (
            <View className="bg-white rounded-xl p-8 items-center">
              <Briefcase size={48} color="#D1D5DB" />
              <Text className="text-gray-500 mt-4">No jobs match your search</Text>
            </View>
          ) : (
            filteredJobs.map((job, index) => (
              <Animated.View
                key={job.id}
                entering={FadeInDown.duration(400).delay(250 + index * 50)}
              >
                <TouchableOpacity
                  className="bg-white rounded-xl p-4 mb-3 shadow-sm"
                  activeOpacity={0.7}
                >
                  <View className="flex-row items-start">
                    <View className="w-12 h-12 rounded-xl bg-gray-100 items-center justify-center mr-3">
                      <Text className="text-2xl">{job.logo}</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-base font-semibold text-gray-800">{job.title}</Text>
                      <Text className="text-sm text-gray-500">{job.company}</Text>
                    </View>
                    <TouchableOpacity onPress={() => toggleSaveJob(job.id)}>
                      <Bookmark
                        size={20}
                        color={savedJobs.includes(job.id) ? '#3B82F6' : '#9CA3AF'}
                        fill={savedJobs.includes(job.id) ? '#3B82F6' : 'none'}
                      />
                    </TouchableOpacity>
                  </View>

                  <View className="flex-row flex-wrap items-center mt-3 gap-3">
                    <View className="flex-row items-center">
                      <MapPin size={14} color="#6B7280" />
                      <Text className="text-sm text-gray-500 ml-1">{job.location}</Text>
                    </View>
                    <View className="flex-row items-center">
                      <DollarSign size={14} color="#6B7280" />
                      <Text className="text-sm text-gray-500 ml-1">{job.salary}</Text>
                    </View>
                    <View className="flex-row items-center">
                      <Clock size={14} color="#6B7280" />
                      <Text className="text-sm text-gray-500 ml-1">{job.posted}</Text>
                    </View>
                  </View>

                  <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-gray-100">
                    <View className="bg-blue-50 px-3 py-1 rounded-full">
                      <Text className="text-blue-600 text-sm font-medium">{job.type}</Text>
                    </View>
                    <TouchableOpacity className="flex-row items-center">
                      <Text className="text-blue-500 font-medium mr-1">Apply Now</Text>
                      <ChevronRight size={16} color="#3B82F6" />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            ))
          )}
        </Animated.View>

        {/* Quick Links */}
        <Animated.View entering={FadeInDown.duration(500).delay(400)} className="px-4 mt-6 mb-6">
          <Text className="text-lg font-semibold text-gray-800 mb-3">Resources</Text>
          <View className="bg-white rounded-xl shadow-sm overflow-hidden">
            {[
              { title: 'Resume Builder', subtitle: 'Create a professional resume' },
              { title: 'Mock Interviews', subtitle: 'Practice with AI feedback' },
              { title: 'Career Counseling', subtitle: 'Book an appointment' },
            ].map((resource, index) => (
              <TouchableOpacity
                key={resource.title}
                className={`flex-row items-center p-4 ${index !== 2 ? 'border-b border-gray-100' : ''}`}
                activeOpacity={0.7}
              >
                <View className="flex-1">
                  <Text className="text-base font-medium text-gray-800">{resource.title}</Text>
                  <Text className="text-sm text-gray-500">{resource.subtitle}</Text>
                </View>
                <ChevronRight size={20} color="#9CA3AF" />
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        <View className="h-8" />
      </ScrollView>
    </View>
  );
}









