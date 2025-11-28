import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import * as Haptics from 'expo-haptics';

interface ButtonProps {
  onPress: () => void;
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const variantStyles = {
  primary: {
    container: 'bg-blue-500',
    text: 'text-white',
    disabled: 'bg-blue-300',
  },
  secondary: {
    container: 'bg-gray-100 dark:bg-gray-800',
    text: 'text-gray-900 dark:text-white',
    disabled: 'bg-gray-50 dark:bg-gray-900',
  },
  outline: {
    container: 'bg-transparent border border-primary-500',
    text: 'text-primary-500',
    disabled: 'border-primary-300',
  },
  ghost: {
    container: 'bg-transparent',
    text: 'text-primary-500',
    disabled: '',
  },
};

const sizeStyles = {
  sm: {
    container: 'py-2 px-4',
    text: 'text-sm',
  },
  md: {
    container: 'py-3 px-6',
    text: 'text-base',
  },
  lg: {
    container: 'py-4 px-8',
    text: 'text-lg',
  },
};

export function Button({
  onPress,
  title,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
}: ButtonProps) {
  const variantStyle = variantStyles[variant];
  const sizeStyle = sizeStyles[size];

  const handlePress = () => {
    if (!disabled && !loading) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      className={`
        flex-row items-center justify-center rounded-xl
        ${sizeStyle.container}
        ${disabled ? variantStyle.disabled : variantStyle.container}
        ${fullWidth ? 'w-full' : ''}
      `}
      style={[
        variant === 'primary' && !disabled
          ? {
              shadowColor: '#3b82f6',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 5,
            }
          : {},
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#ffffff' : '#1a73e8'} />
      ) : (
        <>
          {icon && iconPosition === 'left' && <>{icon}</>}
          <Text
            className={`
              font-semibold
              ${sizeStyle.text}
              ${disabled ? 'opacity-50' : ''}
              ${variantStyle.text}
              ${icon ? (iconPosition === 'left' ? 'ml-2' : 'mr-2') : ''}
            `}
            style={textStyle}
          >
            {title}
          </Text>
          {icon && iconPosition === 'right' && <>{icon}</>}
        </>
      )}
    </TouchableOpacity>
  );
}

export default Button;










