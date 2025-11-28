import React from 'react';
import { View, Image, Text } from 'react-native';
import { User } from 'lucide-react-native';

interface AvatarProps {
  source?: string | null;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showBadge?: boolean;
  badgeColor?: string;
}

const sizeMap = {
  xs: { container: 24, icon: 12, text: 10 },
  sm: { container: 32, icon: 16, text: 12 },
  md: { container: 40, icon: 20, text: 14 },
  lg: { container: 56, icon: 28, text: 18 },
  xl: { container: 80, icon: 40, text: 24 },
};

export function Avatar({
  source,
  name,
  size = 'md',
  showBadge = false,
  badgeColor = '#22c55e',
}: AvatarProps) {
  const dimensions = sizeMap[size];

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <View style={{ width: dimensions.container, height: dimensions.container }}>
      {source ? (
        <Image
          source={{ uri: source }}
          className="rounded-full"
          style={{ width: dimensions.container, height: dimensions.container }}
        />
      ) : name ? (
        <View
          className="rounded-full bg-primary-100 items-center justify-center"
          style={{ width: dimensions.container, height: dimensions.container }}
        >
          <Text
            className="text-primary-600 font-semibold"
            style={{ fontSize: dimensions.text }}
          >
            {getInitials(name)}
          </Text>
        </View>
      ) : (
        <View
          className="rounded-full bg-gray-200 dark:bg-gray-700 items-center justify-center"
          style={{ width: dimensions.container, height: dimensions.container }}
        >
          <User size={dimensions.icon} color="#9ca3af" />
        </View>
      )}
      {showBadge && (
        <View
          className="absolute bottom-0 right-0 rounded-full border-2 border-white dark:border-gray-900"
          style={{
            width: dimensions.container * 0.3,
            height: dimensions.container * 0.3,
            backgroundColor: badgeColor,
          }}
        />
      )}
    </View>
  );
}

export default Avatar;









