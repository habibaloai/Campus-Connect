import React from 'react';
import { View, Image, StyleSheet, Dimensions, StatusBar } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  imageUri?: string;
}

export default function SplashScreen({ imageUri }: SplashScreenProps) {
  // Use the splash screen image if provided, otherwise try to load from assets
  let imageSource;
  try {
    imageSource = imageUri 
      ? { uri: imageUri }
      : require('../assets/images/splash-screen.png');
  } catch (error) {
    // If image doesn't exist, use a placeholder color
    imageSource = null;
  }

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      
      {/* Background Image or Color */}
      {imageSource ? (
        <Image
          source={imageSource}
          style={styles.backgroundImage}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.backgroundImage, styles.placeholderBackground]} />
      )}

      {/* Dark gradient overlay at bottom */}
      <View style={styles.bottomGradient} />

      {/* Text Overlay */}
      <Animated.View 
        entering={FadeIn.duration(800).delay(300)}
        style={styles.textContainer}
      >
        {/* TUM Logo and Text */}
        <View style={styles.logoContainer}>
          <View style={styles.diamondLogo}>
            <View style={styles.diamondShape} />
          </View>
          <View style={styles.titleContainer}>
            <Animated.Text 
              entering={FadeIn.duration(600).delay(500)}
              style={styles.tumText}
            >
              TUM
            </Animated.Text>
            <Animated.Text 
              entering={FadeIn.duration(600).delay(600)}
              style={styles.heilbronnText}
            >
              Heilbronn
            </Animated.Text>
          </View>
        </View>
        
        {/* Campus Connect Text */}
        <Animated.Text 
          entering={FadeIn.duration(600).delay(700)}
          style={styles.campusConnectText}
        >
          campus-connect
        </Animated.Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: width,
    height: height,
  },
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    top: 0,
    left: 0,
  },
  placeholderBackground: {
    backgroundColor: '#4A90E2', // Fallback blue color
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.25, // Bottom 25% dark gradient
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  textContainer: {
    position: 'absolute',
    top: '35%',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  diamondLogo: {
    width: 40,
    height: 40,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  diamondShape: {
    width: 28,
    height: 28,
    backgroundColor: '#FFFFFF',
    transform: [{ rotate: '45deg' }],
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  tumText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#0065BD', // TUM blue
    letterSpacing: 1,
  },
  heilbronnText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
    letterSpacing: 0.5,
  },
  campusConnectText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '500',
    letterSpacing: 2,
    textTransform: 'lowercase',
  },
});

