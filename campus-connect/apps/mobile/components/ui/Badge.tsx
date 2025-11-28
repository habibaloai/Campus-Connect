import React from 'react';
import { View, Text } from 'react-native';

interface BadgeProps {
  label: string;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md';
}

const variantStyles = {
  default: {
    container: 'bg-gray-100 dark:bg-gray-700',
    text: 'text-gray-700 dark:text-gray-300',
  },
  primary: {
    container: 'bg-primary-100',
    text: 'text-primary-700',
  },
  success: {
    container: 'bg-green-100',
    text: 'text-green-700',
  },
  warning: {
    container: 'bg-yellow-100',
    text: 'text-yellow-700',
  },
  error: {
    container: 'bg-red-100',
    text: 'text-red-700',
  },
  info: {
    container: 'bg-blue-100',
    text: 'text-blue-700',
  },
};

const sizeStyles = {
  sm: {
    container: 'px-2 py-0.5',
    text: 'text-xs',
  },
  md: {
    container: 'px-3 py-1',
    text: 'text-sm',
  },
};

export function Badge({ label, variant = 'default', size = 'md' }: BadgeProps) {
  const variantStyle = variantStyles[variant];
  const sizeStyle = sizeStyles[size];

  return (
    <View className={`rounded-full ${variantStyle.container} ${sizeStyle.container}`}>
      <Text className={`font-medium ${variantStyle.text} ${sizeStyle.text}`}>{label}</Text>
    </View>
  );
}

export default Badge;










