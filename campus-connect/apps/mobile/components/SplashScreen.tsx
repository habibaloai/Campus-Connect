import React from 'react';
import { View, Image, StyleSheet, Dimensions, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn } from 'react-native-reanimated';

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
    imageSource = null;
  }

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      
      {/* Background Image */}
      {imageSource ? (
        <Image
          source={imageSource}
          style={styles.backgroundImage}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.backgroundImage, styles.placeholderBackground]} />
      )}

      {/* Gradient Overlay - from rgba(0,0,0,0.5) to rgba(0,0,0,0.1) */}
      <LinearGradient
        colors={['rgba(0,0,0,0.5)', 'rgba(0,0,0,0.1)']}
        style={styles.gradientOverlay}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />

      {/* Dark gradient at bottom */}
      <LinearGradient
        colors={['rgba(17,17,16,0)', 'rgba(17,17,16,1)', 'rgba(17,17,16,1)']}
        locations={[0, 0.4424, 1]}
        style={styles.bottomGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />

      {/* Content Container */}
      <View style={styles.contentContainer}>
        {/* Logo and Text Row */}
        <Animated.View 
          entering={FadeIn.duration(600).delay(300)}
          style={styles.logoTextRow}
        >
          <View style={styles.logoContainer}>
            <View style={styles.diamondShape} />
          </View>
          <View style={styles.textGroup}>
            <View style={styles.titleRow}>
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
                {' '}Heilbronn
              </Animated.Text>
            </View>
            <Animated.Text 
              entering={FadeIn.duration(600).delay(700)}
              style={styles.campusConnectText}
            >
              campus-connect
            </Animated.Text>
          </View>
        </Animated.View>
      </View>

      {/* Blue Progress Indicator at Bottom */}
      <View style={styles.progressIndicator} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: width,
    height: height,
    backgroundColor: '#111110',
    borderRadius: 30,
    overflow: 'hidden',
  },
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    top: 0,
    left: 0,
  },
  placeholderBackground: {
    backgroundColor: '#111110',
  },
  gradientOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    top: 0,
    left: 0,
    borderRadius: 30,
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.525, // Matches Figma design
  },
  contentContainer: {
    position: 'absolute',
    top: '36%',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  logoContainer: {
    width: 32,
    height: 32,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  diamondShape: {
    width: 32,
    height: 32,
    backgroundColor: '#FFFFFF',
    transform: [{ rotate: '45deg' }],
    borderRadius: 2,
  },
  textGroup: {
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 2,
  },
  tumText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0066cc',
    lineHeight: 32,
  },
  heilbronnText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    lineHeight: 32,
  },
  campusConnectText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
    letterSpacing: 6,
    textTransform: 'lowercase',
    marginTop: 2,
    lineHeight: 20,
  },
  progressIndicator: {
    position: 'absolute',
    bottom: 7,
    left: 139,
    width: 135,
    height: 5,
    backgroundColor: '#0066cc',
    borderRadius: 100,
  },
});
