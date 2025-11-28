import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import Animated, { 
  FadeInDown, 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { useColorScheme } from '@/components/useColorScheme';
import { DesignSystem } from '@/constants/design';

interface AnimatedCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  delay?: number;
  index?: number;
  variant?: 'default' | 'elevated' | '3d';
}

export default function AnimatedCard({
  children,
  style,
  onPress,
  delay = 0,
  index = 0,
  variant = 'default',
}: AnimatedCardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const scale = useSharedValue(1);
  const rotateX = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    if (variant === '3d') {
      return {
        transform: [
          { scale: scale.value },
          { perspective: 1000 },
          { rotateX: `${interpolate(rotateX.value, [0, 1], [0, 5])}deg` },
        ],
      };
    }
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handlePressIn = () => {
    if (onPress) {
      scale.value = withSpring(0.96, { damping: 15 });
      if (variant === '3d') {
        rotateX.value = withTiming(1, { duration: 100 });
      }
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15 });
    if (variant === '3d') {
      rotateX.value = withTiming(0, { duration: 100 });
    }
  };

  const cardStyle = [
    styles.card,
    {
      backgroundColor: isDark ? DesignSystem.colors.cardOverlayDark : DesignSystem.colors.cardOverlay,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: variant === '3d' ? 8 : 4 },
      shadowOpacity: isDark ? 0.3 : variant === '3d' ? 0.2 : 0.1,
      shadowRadius: variant === '3d' ? 16 : 12,
      elevation: variant === '3d' ? 10 : 6,
    },
    style,
  ];

  if (onPress) {
    return (
      <Animated.View
        entering={FadeInDown.duration(500).delay(delay + index * 50).springify()}
        style={animatedStyle}
      >
        <TouchableOpacity
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.9}
          style={cardStyle}
        >
          {children}
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      entering={FadeInDown.duration(500).delay(delay + index * 50).springify()}
      style={[cardStyle, animatedStyle]}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: DesignSystem.borderRadius.lg,
  },
});

