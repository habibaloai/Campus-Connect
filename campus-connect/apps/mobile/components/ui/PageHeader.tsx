import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { ChevronLeft, Edit, MoreVertical, Settings } from 'lucide-react-native';
import { useColorScheme } from '@/components/useColorScheme';
import { router } from 'expo-router';

interface PageHeaderProps {
  title: string;
  showBack?: boolean;
  rightAction?: 'edit' | 'settings' | 'more' | React.ReactNode;
  onRightActionPress?: () => void;
  subtitle?: string;
}

export default function PageHeader({
  title,
  showBack = true,
  rightAction,
  onRightActionPress,
  subtitle,
}: PageHeaderProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const renderRightAction = () => {
    if (!rightAction) return null;

    if (typeof rightAction === 'string') {
      let Icon;
      switch (rightAction) {
        case 'edit':
          Icon = Edit;
          break;
        case 'settings':
          Icon = Settings;
          break;
        case 'more':
          Icon = MoreVertical;
          break;
        default:
          return null;
      }

      return (
        <TouchableOpacity onPress={onRightActionPress} style={styles.rightButton}>
          <Icon size={22} color={isDark ? '#ffffff' : '#1e293b'} />
        </TouchableOpacity>
      );
    }

    return rightAction;
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)' }]}>
      <View style={styles.content}>
        {showBack ? (
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft size={24} color={isDark ? '#ffffff' : '#1e293b'} />
          </TouchableOpacity>
        ) : (
          <View style={styles.logoContainer}>
            <Image 
              source={require('@/assets/images/tum-logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
        )}
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: isDark ? '#ffffff' : '#1e293b' }]}>{title}</Text>
          {subtitle && (
            <Text style={[styles.subtitle, { color: isDark ? '#94a3b8' : '#64748b' }]}>{subtitle}</Text>
          )}
        </View>
        {renderRightAction()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 12,
    paddingBottom: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  logoContainer: {
    width: 40,
    height: 40,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 40,
    height: 40,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  rightButton: {
    padding: 4,
  },
});

