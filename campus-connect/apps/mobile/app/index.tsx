import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import SplashScreen from '@/components/SplashScreen';

export default function IndexScreen() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Show splash screen for 4 seconds
    const timer = setTimeout(() => {
      setShowSplash(false);
      // Navigate to login page after splash screen
      router.replace('/(auth)/login');
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return (
      <View style={styles.container}>
        <SplashScreen />
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

