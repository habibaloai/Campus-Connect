import React, { useState } from 'react';
import { useFocusEffect } from 'expo-router';
import Animated, { FadeInDown, FadeInRight, FadeIn, SlideInDown, SlideInRight } from 'react-native-reanimated';
import { View, ViewProps } from 'react-native';

interface FocusAwareAnimatedViewProps extends ViewProps {
  children: React.ReactNode;
  entering?: any;
  delay?: number;
  duration?: number;
  className?: string;
}

/**
 * Animated View that re-triggers animations when the screen comes into focus
 * This fixes the issue where animations only work the first time a tab is pressed
 */
export function FocusAwareAnimatedView({
  children,
  entering,
  delay = 0,
  duration = 400,
  className,
  ...props
}: FocusAwareAnimatedViewProps) {
  const [animationKey, setAnimationKey] = useState(0);

  useFocusEffect(
    React.useCallback(() => {
      // Reset animation key when screen comes into focus
      // This forces the component to re-mount and trigger the entering animation
      setAnimationKey((prev) => prev + 1);
    }, [])
  );

  // Default to FadeInDown if no entering animation specified
  const defaultEntering = entering || FadeInDown.duration(duration).delay(delay).springify();
  const finalEntering = entering 
    ? (typeof entering === 'function' ? entering.duration(duration).delay(delay).springify() : entering)
    : defaultEntering;

  return (
    <Animated.View
      key={animationKey}
      entering={finalEntering}
      className={className}
      {...props}
    >
      {children}
    </Animated.View>
  );
}

export default FocusAwareAnimatedView;


