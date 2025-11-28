import React, { useEffect } from 'react';
import { View, Image, StyleSheet, Dimensions, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';

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

  // Animation values for frame-by-frame animation
  const frameProgress = useSharedValue(0); // Goes from 0 to 1 across all frames
  
  // Logo animation properties
  const logoScale = useSharedValue(0);
  const logoOpacity = useSharedValue(0);
  const logoRotation = useSharedValue(-45);
  const logoTranslateY = useSharedValue(-20);
  
  // Text animation properties
  const tumOpacity = useSharedValue(0);
  const tumTranslateX = useSharedValue(-20);
  const heilbronnOpacity = useSharedValue(0);
  const heilbronnTranslateX = useSharedValue(20);
  const campusConnectOpacity = useSharedValue(0);
  const campusConnectTranslateY = useSharedValue(10);

  useEffect(() => {
    const FRAME_DELAY = 400; // 400ms between frames
    const TRANSITION_DURATION = 500; // Duration for each transition
    const easeOut = Easing.out(Easing.cubic); // Smooth ease-out

    // Frame 1: Logo appears with scale and fade (0ms)
    logoScale.value = withTiming(1, {
      duration: TRANSITION_DURATION,
      easing: easeOut,
    });
    logoOpacity.value = withTiming(1, {
      duration: TRANSITION_DURATION,
      easing: easeOut,
    });

    // Frame 2: Logo rotates into position (400ms delay)
    logoRotation.value = withDelay(
      FRAME_DELAY,
      withTiming(0, {
        duration: TRANSITION_DURATION,
        easing: easeOut,
      })
    );
    logoTranslateY.value = withDelay(
      FRAME_DELAY,
      withTiming(0, {
        duration: TRANSITION_DURATION,
        easing: easeOut,
      })
    );

    // Frame 3: "TUM" text appears from left (800ms delay)
    tumOpacity.value = withDelay(
      FRAME_DELAY * 2,
      withTiming(1, {
        duration: TRANSITION_DURATION,
        easing: easeOut,
      })
    );
    tumTranslateX.value = withDelay(
      FRAME_DELAY * 2,
      withTiming(0, {
        duration: TRANSITION_DURATION,
        easing: easeOut,
      })
    );

    // Frame 4: "Heilbronn" text appears from right (1200ms delay)
    heilbronnOpacity.value = withDelay(
      FRAME_DELAY * 3,
      withTiming(1, {
        duration: TRANSITION_DURATION,
        easing: easeOut,
      })
    );
    heilbronnTranslateX.value = withDelay(
      FRAME_DELAY * 3,
      withTiming(0, {
        duration: TRANSITION_DURATION,
        easing: easeOut,
      })
    );

    // Frame 5: "campus-connect" appears below (1600ms delay)
    campusConnectOpacity.value = withDelay(
      FRAME_DELAY * 4,
      withTiming(1, {
        duration: TRANSITION_DURATION,
        easing: easeOut,
      })
    );
    campusConnectTranslateY.value = withDelay(
      FRAME_DELAY * 4,
      withTiming(0, {
        duration: TRANSITION_DURATION,
        easing: easeOut,
      })
    );
  }, []);

  // Animated styles for logo
  const logoAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: logoScale.value },
        { rotate: `${logoRotation.value}deg` },
        { translateY: logoTranslateY.value },
      ],
      opacity: logoOpacity.value,
    };
  });

  // Animated styles for "TUM" text
  const tumAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: tumOpacity.value,
      transform: [{ translateX: tumTranslateX.value }],
    };
  });

  // Animated styles for "Heilbronn" text
  const heilbronnAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: heilbronnOpacity.value,
      transform: [{ translateX: heilbronnTranslateX.value }],
    };
  });

  // Animated styles for "campus-connect" text
  const campusConnectAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: campusConnectOpacity.value,
      transform: [{ translateY: campusConnectTranslateY.value }],
    };
  });

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
        <View style={styles.logoTextRow}>
          {/* Animated Logo */}
          <Animated.View 
            style={[styles.logoContainer, logoAnimatedStyle]}
          >
            <View style={styles.diamondShape} />
          </Animated.View>

          {/* Animated Text Group */}
          <View style={styles.textGroup}>
            <View style={styles.titleRow}>
              <Animated.Text style={[styles.tumText, tumAnimatedStyle]}>
                TUM
              </Animated.Text>
              <Animated.Text style={[styles.heilbronnText, heilbronnAnimatedStyle]}>
                {' '}Heilbronn
              </Animated.Text>
            </View>
            <Animated.Text style={[styles.campusConnectText, campusConnectAnimatedStyle]}>
              campus-connect
            </Animated.Text>
          </View>
        </View>
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
    height: height * 0.525,
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
    left: '50%',
    marginLeft: -67.5,
    width: 135,
    height: 5,
    backgroundColor: '#0066cc',
    borderRadius: 100,
  },
});
