import React from 'react';
import { View, Text } from 'react-native';
import { Tabs } from 'expo-router';
import { Home, Users, Calendar, MessageCircle, Menu } from 'lucide-react-native';
import { useColorScheme } from '@/components/useColorScheme';
import { useMessages } from '@/providers';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { unreadMessagesCount } = useMessages();
  const isDark = colorScheme === 'dark';

  const activeColor = '#3b82f6';
  const inactiveColor = isDark ? '#9ca3af' : '#6b7280';
  const bgColor = isDark ? '#1e293b' : 'rgba(255, 255, 255, 0.95)';
  const borderColor = isDark ? '#334155' : '#e2e8f0';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,
        tabBarStyle: {
          backgroundColor: bgColor,
          borderTopColor: borderColor,
          borderTopWidth: 1,
          paddingTop: 8,
          paddingBottom: 20, // Increased from 8 to lift it up
          height: 90, // Increased from 70 to accommodate padding
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 4,
          marginBottom: 4,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
        headerStyle: {
          backgroundColor: bgColor,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: borderColor,
        },
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 18,
          color: isDark ? '#ffffff' : '#111827',
        },
        headerTintColor: isDark ? '#ffffff' : '#111827',
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <View className={`p-1.5 rounded-xl ${focused ? 'bg-blue-50' : ''}`}>
              <Home size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: 'Community',
          headerTitle: 'Community',
          tabBarIcon: ({ color, focused }) => (
            <View className={`p-1.5 rounded-xl ${focused ? 'bg-blue-50' : ''}`}>
              <Users size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          title: 'Events',
          headerTitle: 'Campus Events',
          tabBarIcon: ({ color, focused }) => (
            <View className={`p-1.5 rounded-xl ${focused ? 'bg-blue-50' : ''}`}>
              <Calendar size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          headerTitle: 'Messages',
          tabBarIcon: ({ color, focused }) => (
            <View className="relative">
              <View className={`p-1.5 rounded-xl ${focused ? 'bg-blue-50' : ''}`}>
                <MessageCircle size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
              </View>
              {unreadMessagesCount > 0 && (
                <View className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 rounded-full items-center justify-center px-1">
                  <Text className="text-white text-[10px] font-bold">
                    {unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}
                  </Text>
                </View>
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'More',
          headerTitle: 'More Options',
          tabBarIcon: ({ color, focused }) => (
            <View className={`p-1.5 rounded-xl ${focused ? 'bg-blue-50' : ''}`}>
              <Menu size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
      {/* Hide index and two from tabs - they came from template */}
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen name="two" options={{ href: null }} />
    </Tabs>
  );
}
