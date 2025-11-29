import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
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
  Bus,
  Car,
  MapPin,
  Clock,
  Navigation,
  ChevronRight,
  AlertCircle,
  Building,
  Eye,
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { BUILDING_LOCATIONS, openGoogleMaps, openNavigation } from '@/lib/maps';
import { useColorScheme } from '@/components/useColorScheme';

// Campus building and street locations
const buildingOptions = BUILDING_LOCATIONS.map((building) => ({
  id: building.id,
  name: building.name,
  type: building.type,
  address: building.address,
  color: building.type === 'building' ? '#3B82F6' : '#10B981',
  icon: building.type === 'building' ? '🏢' : '📍',
}));

const parkingLots = [
  {
    id: '1',
    name: 'Lot A - Main',
    available: 45,
    total: 200,
    type: 'student',
    distance: '5 min walk',
  },
  {
    id: '2',
    name: 'Lot B - Engineering',
    available: 12,
    total: 100,
    type: 'student',
    distance: '3 min walk',
  },
  {
    id: '3',
    name: 'Lot C - Sports',
    available: 78,
    total: 150,
    type: 'student',
    distance: '8 min walk',
  },
  {
    id: '4',
    name: 'Visitor Parking',
    available: 5,
    total: 50,
    type: 'visitor',
    distance: '2 min walk',
  },
];

export default function TransportScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'bus' | 'parking'>('bus');

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const openMaps = (destination: string) => {
    const url = `https://maps.google.com/?q=${encodeURIComponent(destination)}`;
    Linking.openURL(url);
  };

  const handleStreetView = (building: typeof buildingOptions[0]) => {
    // Find the full building data from BUILDING_LOCATIONS
    const fullBuilding = BUILDING_LOCATIONS.find((b) => b.id === building.id);
    if (!fullBuilding) return;
    
    // Navigate to embedded Street View screen
    router.push({
      pathname: '/transport/streetview',
      params: {
        latitude: fullBuilding.latitude.toString(),
        longitude: fullBuilding.longitude.toString(),
        name: fullBuilding.name,
        address: fullBuilding.address || '',
      },
    });
  };

  const getAvailabilityColor = (available: number, total: number) => {
    const ratio = available / total;
    if (ratio > 0.3) return '#10B981';
    if (ratio > 0.1) return '#F59E0B';
    return '#EF4444';
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
            Navigate
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
        {/* Tab Switcher */}
        <Animated.View entering={FadeInDown.duration(500)} className="px-4 pt-4">
          <View className="rounded-xl p-1 flex-row" style={{
            backgroundColor: isDark ? 'rgba(55, 65, 81, 0.5)' : 'rgba(229, 231, 235, 0.8)',
          }}>
            <TouchableOpacity
              onPress={() => setActiveTab('bus')}
              className="flex-1 flex-row items-center justify-center py-3 rounded-lg"
              style={{
                backgroundColor: activeTab === 'bus' ? (isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)') : 'transparent',
              }}
            >
              <Building size={18} color={activeTab === 'bus' ? '#3B82F6' : (isDark ? '#9ca3af' : '#6B7280')} />
              <Text
                className="ml-2 font-medium"
                style={{
                  color: activeTab === 'bus' ? '#3b82f6' : (isDark ? '#9ca3af' : '#6b7280')
                }}
              >
                Buildings
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setActiveTab('parking')}
              className="flex-1 flex-row items-center justify-center py-3 rounded-lg"
              style={{
                backgroundColor: activeTab === 'parking' ? (isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)') : 'transparent',
              }}
            >
              <Car size={18} color={activeTab === 'parking' ? '#3B82F6' : (isDark ? '#9ca3af' : '#6B7280')} />
              <Text
                className="ml-2 font-medium"
                style={{
                  color: activeTab === 'parking' ? '#3b82f6' : (isDark ? '#9ca3af' : '#6b7280')
                }}
              >
                Parking
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {activeTab === 'bus' ? (
          /* Building Locations */
          <Animated.View entering={FadeInDown.duration(500).delay(100)} className="px-4 mt-6">
            <Text className="text-lg font-semibold mb-3" style={{ color: isDark ? '#ffffff' : '#1e293b' }}>Campus Locations</Text>

            {buildingOptions.map((building, index) => (
              <Animated.View
                key={building.id}
                entering={FadeInDown.duration(400).delay(150 + index * 50)}
              >
                <View className="rounded-xl p-4 mb-3" style={{
                  backgroundColor: isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: isDark ? 0.3 : 0.1,
                  shadowRadius: 8,
                  elevation: 4,
                }}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => openGoogleMaps(building.address)}
                  >
                    <View className="flex-row items-center justify-between mb-3">
                      <View className="flex-row items-center flex-1">
                        <Text className="text-2xl mr-3">{building.icon}</Text>
                        <View className="flex-1">
                          <Text className="text-lg font-semibold" style={{ color: isDark ? '#ffffff' : '#1e293b' }}>{building.name}</Text>
                          <Text className="text-xs mt-0.5 capitalize" style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>{building.type}</Text>
                        </View>
                      </View>
                      <View
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: building.color }}
                      />
                    </View>

                    <View className="pt-3" style={{ borderTopWidth: 1, borderTopColor: isDark ? '#374151' : '#e5e7eb' }}>
                      <View className="flex-row items-center">
                        <MapPin size={14} color={isDark ? "#9ca3af" : "#9CA3AF"} />
                        <Text className="text-sm ml-2" style={{ color: isDark ? '#9ca3af' : '#6b7280' }} numberOfLines={2}>
                          {building.address}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>

                  {/* Action Buttons - Street View and Navigate */}
                  <View className="flex-row gap-2 mt-3 pt-3 border-t border-gray-100">
                    <TouchableOpacity
                      className="flex-1 flex-row items-center justify-center py-2.5 rounded-xl border border-blue-500"
                      onPress={(e) => {
                        e.stopPropagation();
                        handleStreetView(building);
                      }}
                      activeOpacity={0.7}
                    >
                      <Eye size={14} color="#3b82f6" />
                      <Text className="text-blue-500 font-medium text-xs ml-1.5">Street View</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      className="flex-1 flex-row items-center justify-center py-2.5 rounded-xl bg-blue-500"
                      onPress={(e) => {
                        e.stopPropagation();
                        openNavigation(BUILDING_LOCATIONS.find((b) => b.id === building.id) || building);
                      }}
                      activeOpacity={0.7}
                    >
                      <Navigation size={14} color="#ffffff" />
                      <Text className="text-white font-medium text-xs ml-1.5">Navigate</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Animated.View>
            ))}

            {/* Buses Button */}
            <TouchableOpacity
              className="bg-blue-500 rounded-xl py-4 items-center flex-row justify-center mt-4"
              onPress={() => router.push('/transport/maps')}
              activeOpacity={0.8}
            >
              <Bus size={20} color="#FFFFFF" />
              <Text className="text-white font-semibold ml-2">Buses</Text>
              <ChevronRight size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          </Animated.View>
        ) : (
          /* Parking Lots */
          <Animated.View entering={FadeInDown.duration(500).delay(100)} className="px-4 mt-6">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-lg font-semibold" style={{ color: isDark ? '#ffffff' : '#1e293b' }}>Parking Availability</Text>
              <Text className="text-sm" style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>Updated just now</Text>
            </View>

            {parkingLots.map((lot, index) => (
              <Animated.View
                key={lot.id}
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
                  onPress={() => openMaps(lot.name)}
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1">
                      <View className="flex-row items-center">
                        <Text className="text-base font-semibold" style={{ color: isDark ? '#ffffff' : '#1e293b' }}>{lot.name}</Text>
                        {lot.type === 'visitor' && (
                          <View className="px-2 py-0.5 rounded-full ml-2" style={{ backgroundColor: isDark ? 'rgba(168, 85, 247, 0.2)' : 'rgba(243, 232, 255, 0.8)' }}>
                            <Text className="text-xs" style={{ color: isDark ? '#c084fc' : '#7c3aed' }}>Visitor</Text>
                          </View>
                        )}
                      </View>
                      <View className="flex-row items-center mt-1">
                        <MapPin size={12} color={isDark ? "#9ca3af" : "#6B7280"} />
                        <Text className="text-sm ml-1" style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>{lot.distance}</Text>
                      </View>
                    </View>
                    <View className="items-end">
                      <Text
                        className="text-2xl font-bold"
                        style={{ color: getAvailabilityColor(lot.available, lot.total) }}
                      >
                        {lot.available}
                      </Text>
                      <Text className="text-sm" style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>of {lot.total} spots</Text>
                    </View>
                  </View>

                  {/* Progress bar */}
                  <View className="mt-3">
                    <View className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: isDark ? '#374151' : '#e5e7eb' }}>
                      <View
                        className="h-full rounded-full"
                        style={{
                          width: `${(lot.available / lot.total) * 100}%`,
                          backgroundColor: getAvailabilityColor(lot.available, lot.total),
                        }}
                      />
                    </View>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            ))}

            {/* Tips */}
            <View className="rounded-xl p-4 mt-4" style={{
              backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(239, 246, 255, 0.8)',
            }}>
              <Text className="font-semibold mb-2" style={{ color: isDark ? '#93c5fd' : '#1e40af' }}>💡 Parking Tips</Text>
              <Text className="text-sm" style={{ color: isDark ? '#bfdbfe' : '#1e3a8a' }}>
                Lot A typically fills up by 9 AM on weekdays. Consider arriving early or using the
                shuttle from Lot C for best availability.
              </Text>
            </View>
          </Animated.View>
        )}

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










