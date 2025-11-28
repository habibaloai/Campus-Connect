import React from 'react';
import { View, ImageBackground, StyleSheet, Dimensions, ViewStyle } from 'react-native';
import { useColorScheme } from '@/components/useColorScheme';

const { width, height } = Dimensions.get('window');

interface BackgroundImageProps {
  children: React.ReactNode;
  overlayOpacity?: number;
  style?: ViewStyle;
  useTheme?: boolean; // If true, adjusts overlay based on light/dark mode
}

export default function BackgroundImage({ 
  children, 
  overlayOpacity,
  style,
  useTheme = true,
}: BackgroundImageProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Try to use splash screen image as background
  let backgroundSource;
  try {
    backgroundSource = require('../../assets/images/splash-screen.png');
  } catch {
    backgroundSource = null;
  }

  // Determine overlay opacity based on theme if not explicitly provided
  const finalOverlayOpacity = overlayOpacity !== undefined 
    ? overlayOpacity 
    : useTheme 
      ? (isDark ? 0.7 : 0.4) // Darker overlay in dark mode for better contrast, lighter in light mode
      : 0.5;

  if (!backgroundSource) {
    // Fallback to gradient background
    return (
      <View style={[styles.container, { backgroundColor: isDark ? '#0f172a' : '#f8fafc' }, style]}>
        {children}
      </View>
    );
  }

  return (
    <ImageBackground
      source={backgroundSource}
      style={[styles.container, style]}
      resizeMode="cover"
    >
      <View style={[styles.overlay, { opacity: finalOverlayOpacity }]} />
      {children}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: width,
    height: height,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
  },
});

