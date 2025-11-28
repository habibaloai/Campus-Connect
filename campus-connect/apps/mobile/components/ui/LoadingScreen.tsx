import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';

interface LoadingScreenProps {
  message?: string;
  fullScreen?: boolean;
}

export default function LoadingScreen({
  message = 'Loading...',
  fullScreen = true,
}: LoadingScreenProps) {
  const content = (
    <Animated.View entering={FadeIn.duration(300)} className="items-center justify-center">
      <Animated.View
        entering={FadeInUp.duration(400).delay(100)}
        className="w-16 h-16 rounded-full bg-blue-100 items-center justify-center mb-4"
      >
        <ActivityIndicator size="large" color="#3B82F6" />
      </Animated.View>
      <Animated.Text
        entering={FadeInUp.duration(400).delay(200)}
        className="text-gray-600 font-medium"
      >
        {message}
      </Animated.Text>
    </Animated.View>
  );

  if (fullScreen) {
    return (
      <View className="flex-1 items-center justify-center bg-white">{content}</View>
    );
  }

  return <View className="py-12 items-center justify-center">{content}</View>;
}









