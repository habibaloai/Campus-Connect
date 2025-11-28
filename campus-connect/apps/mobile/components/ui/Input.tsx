import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, TextInputProps } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { useColorScheme } from '@/components/useColorScheme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isPassword?: boolean;
}

export function Input({
  label,
  error,
  hint,
  icon,
  rightIcon,
  isPassword = false,
  ...props
}: InputProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View className="mb-4">
      {label && (
        <Text
          className={`text-sm font-medium mb-2 ${
            isDark ? 'text-gray-300' : 'text-gray-700'
          }`}
        >
          {label}
        </Text>
      )}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 14,
          borderRadius: 12,
          borderWidth: 1,
          backgroundColor: isDark ? 'rgba(30, 41, 59, 0.8)' : '#f8fafc',
          borderColor: error
            ? '#ef4444'
            : isFocused
            ? '#3b82f6'
            : isDark
            ? 'rgba(255, 255, 255, 0.2)'
            : '#e2e8f0',
        }}
      >
        {icon && <View className="mr-3">{icon}</View>}
        <TextInput
          style={{
            flex: 1,
            marginLeft: icon ? 12 : 0,
            fontSize: 16,
            color: isDark ? '#ffffff' : '#1e293b',
          }}
          placeholderTextColor={isDark ? '#64748b' : '#9ca3af'}
          secureTextEntry={isPassword && !showPassword}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        {isPassword && (
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="ml-2">
            {showPassword ? (
              <EyeOff size={20} color={isDark ? '#9ca3af' : '#6b7280'} />
            ) : (
              <Eye size={20} color={isDark ? '#9ca3af' : '#6b7280'} />
            )}
          </TouchableOpacity>
        )}
        {rightIcon && !isPassword && <View className="ml-2">{rightIcon}</View>}
      </View>
      {error && <Text className="text-red-500 text-sm mt-1">{error}</Text>}
      {hint && !error && (
        <Text className={`text-sm mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          {hint}
        </Text>
      )}
    </View>
  );
}

export default Input;










