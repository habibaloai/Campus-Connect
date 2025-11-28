import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useColorScheme } from '@/components/useColorScheme';
import { DesignSystem } from '@/constants/design';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: number;
}

export default function Card({ children, style, variant = 'default', padding = 16 }: CardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const cardStyle = [
    styles.card,
    {
      backgroundColor: isDark ? DesignSystem.colors.cardOverlayDark : DesignSystem.colors.cardOverlay,
      padding,
    },
    variant === 'elevated' && DesignSystem.shadows.lg,
    variant === 'outlined' && {
      borderWidth: 1,
      borderColor: isDark ? DesignSystem.colors.borderDark : DesignSystem.colors.border,
    },
    variant === 'default' && DesignSystem.shadows.md,
    style,
  ];

  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: DesignSystem.borderRadius.lg,
  },
});
