import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
} from 'react-native';
import { router, Stack } from 'expo-router';
import {
  ChevronLeft,
  BookOpen,
  Users,
  Wifi,
  Plug,
  Monitor,
  Clock,
  MapPin,
  X,
  Check,
  Calendar,
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';

// Mock study spaces data
const studySpaces = [
  {
    id: '1',
    name: 'Library Study Room 101',
    building: 'Main Library',
    floor: '1st Floor',
    capacity: 4,
    available: true,
    amenities: ['wifi', 'power', 'whiteboard'],
    hours: '7:00 AM - 11:00 PM',
  },
  {
    id: '2',
    name: 'Library Study Room 102',
    building: 'Main Library',
    floor: '1st Floor',
    capacity: 6,
    available: true,
    amenities: ['wifi', 'power', 'whiteboard', 'monitor'],
    hours: '7:00 AM - 11:00 PM',
  },
  {
    id: '3',
    name: 'Engineering Lab Room A',
    building: 'Engineering Building',
    floor: '2nd Floor',
    capacity: 8,
    available: false,
    bookedUntil: '4:00 PM',
    amenities: ['wifi', 'power', 'monitor', 'computers'],
    hours: '8:00 AM - 10:00 PM',
  },
  {
    id: '4',
    name: 'Quiet Study Zone',
    building: 'Main Library',
    floor: '3rd Floor',
    capacity: 20,
    available: true,
    isOpenArea: true,
    amenities: ['wifi', 'power'],
    hours: '7:00 AM - 11:00 PM',
  },
  {
    id: '5',
    name: 'Graduate Student Lounge',
    building: 'Student Union',
    floor: '2nd Floor',
    capacity: 12,
    available: false,
    bookedUntil: '6:00 PM',
    amenities: ['wifi', 'power', 'coffee'],
    hours: '8:00 AM - 9:00 PM',
  },
];

const AmenityIcon = ({ type, size = 16 }: { type: string; size?: number }) => {
  const color = '#6B7280';
  switch (type) {
    case 'wifi':
      return <Wifi size={size} color={color} />;
    case 'power':
      return <Plug size={size} color={color} />;
    case 'monitor':
    case 'computers':
      return <Monitor size={size} color={color} />;
    default:
      return null;
  }
};

export default function StudyScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSpace, setSelectedSpace] = useState<typeof studySpaces[0] | null>(null);
  const [bookingModalVisible, setBookingModalVisible] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const handleBook = (space: typeof studySpaces[0]) => {
    setSelectedSpace(space);
    setBookingModalVisible(true);
  };

  const confirmBooking = () => {
    // Handle booking logic here
    setBookingModalVisible(false);
    setSelectedSpace(null);
    // Show success message
  };

  const availableSpaces = studySpaces.filter((s) => s.available);
  const unavailableSpaces = studySpaces.filter((s) => !s.available);

  return (
    <View className="flex-1 bg-gray-50">
      <Stack.Screen
        options={{
          title: 'Study Spaces',
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
        {/* Stats */}
        <Animated.View entering={FadeInDown.duration(500)} className="px-4 pt-4">
          <View className="flex-row gap-3">
            <View className="flex-1 bg-green-500 rounded-xl p-4">
              <Text className="text-white/80 text-sm">Available Now</Text>
              <Text className="text-white text-3xl font-bold">{availableSpaces.length}</Text>
              <Text className="text-white/60 text-sm">study spaces</Text>
            </View>
            <View className="flex-1 bg-white rounded-xl p-4 shadow-sm">
              <Text className="text-gray-500 text-sm">Library Hours</Text>
              <Text className="text-gray-800 text-lg font-bold">Open</Text>
              <Text className="text-gray-500 text-sm">Until 11:00 PM</Text>
            </View>
          </View>
        </Animated.View>

        {/* Available Spaces */}
        <Animated.View entering={FadeInDown.duration(500).delay(100)} className="px-4 mt-6">
          <Text className="text-lg font-semibold text-gray-800 mb-3">Available Now</Text>

          {availableSpaces.map((space, index) => (
            <Animated.View
              key={space.id}
              entering={FadeInDown.duration(400).delay(150 + index * 50)}
            >
              <TouchableOpacity
                className="bg-white rounded-xl p-4 mb-3 shadow-sm"
                activeOpacity={0.7}
                onPress={() => handleBook(space)}
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1">
                    <View className="flex-row items-center">
                      <View className="w-2 h-2 rounded-full bg-green-500 mr-2" />
                      <Text className="text-base font-semibold text-gray-800">{space.name}</Text>
                    </View>
                    <View className="flex-row items-center mt-1">
                      <MapPin size={12} color="#6B7280" />
                      <Text className="text-sm text-gray-500 ml-1">
                        {space.building} • {space.floor}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    className="bg-blue-500 px-4 py-2 rounded-lg"
                    onPress={() => handleBook(space)}
                  >
                    <Text className="text-white font-medium">Book</Text>
                  </TouchableOpacity>
                </View>

                <View className="flex-row items-center mt-3 pt-3 border-t border-gray-100">
                  <View className="flex-row items-center flex-1">
                    <Users size={14} color="#6B7280" />
                    <Text className="text-sm text-gray-500 ml-1">
                      {space.isOpenArea ? 'Open area' : `Up to ${space.capacity} people`}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-2">
                    {space.amenities.slice(0, 3).map((amenity) => (
                      <View key={amenity} className="bg-gray-100 p-1.5 rounded-full">
                        <AmenityIcon type={amenity} />
                      </View>
                    ))}
                    {space.amenities.length > 3 && (
                      <Text className="text-xs text-gray-500">+{space.amenities.length - 3}</Text>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </Animated.View>

        {/* Unavailable Spaces */}
        {unavailableSpaces.length > 0 && (
          <Animated.View entering={FadeInDown.duration(500).delay(300)} className="px-4 mt-6">
            <Text className="text-lg font-semibold text-gray-800 mb-3">Currently Occupied</Text>

            {unavailableSpaces.map((space, index) => (
              <Animated.View
                key={space.id}
                entering={FadeInDown.duration(400).delay(350 + index * 50)}
              >
                <View className="bg-white rounded-xl p-4 mb-3 shadow-sm opacity-70">
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1">
                      <View className="flex-row items-center">
                        <View className="w-2 h-2 rounded-full bg-red-500 mr-2" />
                        <Text className="text-base font-semibold text-gray-600">{space.name}</Text>
                      </View>
                      <View className="flex-row items-center mt-1">
                        <MapPin size={12} color="#9CA3AF" />
                        <Text className="text-sm text-gray-400 ml-1">
                          {space.building} • {space.floor}
                        </Text>
                      </View>
                    </View>
                    <View className="bg-gray-100 px-3 py-1 rounded-full">
                      <Text className="text-gray-500 text-sm">Until {space.bookedUntil}</Text>
                    </View>
                  </View>
                </View>
              </Animated.View>
            ))}
          </Animated.View>
        )}

        <View className="h-8" />
      </ScrollView>

      {/* Booking Modal */}
      <Modal
        visible={bookingModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setBookingModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <Animated.View
            entering={FadeIn.duration(200)}
            className="bg-white rounded-t-3xl p-6"
          >
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-xl font-bold text-gray-800">Book Study Space</Text>
              <TouchableOpacity onPress={() => setBookingModalVisible(false)}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {selectedSpace && (
              <>
                <View className="bg-gray-50 rounded-xl p-4 mb-4">
                  <Text className="text-lg font-semibold text-gray-800">{selectedSpace.name}</Text>
                  <Text className="text-gray-500">
                    {selectedSpace.building} • {selectedSpace.floor}
                  </Text>
                  <View className="flex-row items-center mt-2">
                    <Users size={14} color="#6B7280" />
                    <Text className="text-sm text-gray-600 ml-1">
                      Capacity: {selectedSpace.capacity} people
                    </Text>
                  </View>
                </View>

                <View className="mb-4">
                  <Text className="text-sm font-medium text-gray-700 mb-2">Select Duration</Text>
                  <View className="flex-row gap-2">
                    {['1 hour', '2 hours', '3 hours'].map((duration) => (
                      <TouchableOpacity
                        key={duration}
                        className="flex-1 bg-gray-100 py-3 rounded-xl items-center"
                      >
                        <Text className="text-gray-700 font-medium">{duration}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View className="mb-6">
                  <Text className="text-sm font-medium text-gray-700 mb-2">Amenities</Text>
                  <View className="flex-row flex-wrap gap-2">
                    {selectedSpace.amenities.map((amenity) => (
                      <View
                        key={amenity}
                        className="flex-row items-center bg-blue-50 px-3 py-2 rounded-full"
                      >
                        <AmenityIcon type={amenity} />
                        <Text className="text-blue-700 text-sm ml-2 capitalize">{amenity}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                <TouchableOpacity
                  className="bg-blue-500 py-4 rounded-xl items-center flex-row justify-center"
                  onPress={confirmBooking}
                >
                  <Calendar size={20} color="#FFFFFF" />
                  <Text className="text-white font-semibold ml-2">Confirm Booking</Text>
                </TouchableOpacity>
              </>
            )}
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}










