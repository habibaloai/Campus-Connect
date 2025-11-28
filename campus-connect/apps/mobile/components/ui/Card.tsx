import React from 'react';
import { View, TouchableOpacity, ViewStyle } from 'react-native';
import { useColorScheme } from '@/components/useColorScheme';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  className?: string;
  variant?: 'default' | 'elevated' | 'outlined';
}

export function Card({
  children,
  onPress,
  style,
  className = '',
  variant = 'default',
}: CardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Card background - translucent to show background image underneath
  const getCardBackground = () => {
    if (variant === 'outlined') {
      return 'transparent';
    }
    // Translucent white in light mode, darker translucent in dark mode
    return isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)';
  };
  
  const borderRadius = 24; // Matching splash/login design

  const shadowStyle =
    variant === 'elevated'
      ? {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: isDark ? 0.4 : 0.15,
          shadowRadius: 20,
          elevation: 10,
        }
      : variant === 'default'
      ? {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: isDark ? 0.3 : 0.1,
          shadowRadius: 12,
          elevation: 6,
        }
      : {};

  const Wrapper = onPress ? TouchableOpacity : View;

  return (
    <Wrapper
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      style={[
        {
          borderRadius: 24,
          padding: 16,
          backgroundColor: variant === 'outlined' ? 'transparent' : getCardBackground(),
          ...(variant === 'outlined' && {
            borderWidth: 1,
            borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
          }),
        },
        shadowStyle,
        style,
      ]}
      className={className}
    >
      {children}
    </Wrapper>
  );
}

export default Card;








