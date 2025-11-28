import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ImageBackground } from 'react-native';
import { Calendar, MapPin, Users, Clock, Briefcase, BookOpen, Trophy, Users as UsersIcon, Wrench } from 'lucide-react-native';
import { useColorScheme } from '@/components/useColorScheme';
import { DesignSystem } from '@/constants/design';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

interface EventCardProps {
  id: string;
  title: string;
  date: string;
  time?: string;
  location: string;
  category: string;
  attendeeCount: number;
  maxAttendees?: number;
  isAttending: boolean;
  onPress: () => void;
  onJoinPress: () => void;
  index?: number;
  imageUrl?: string;
}

// Category-based icon mapping
const getCategoryIcon = (category: string) => {
  const categoryLower = category.toLowerCase();
  switch (categoryLower) {
    case 'career':
      return Briefcase;
    case 'academic':
      return BookOpen;
    case 'sports':
      return Trophy;
    case 'social':
      return UsersIcon;
    case 'workshop':
      return Wrench;
    default:
      return Calendar;
  }
};

const categoryColors: Record<string, { bg: string; text: string }> = {
  Career: { bg: '#dcfce7', text: '#16a34a' },
  Academic: { bg: '#e6f2ff', text: '#0066cc' },
  Sports: { bg: '#ffedd5', text: '#ea580c' },
  Social: { bg: '#f3e8ff', text: '#9333ea' },
  Workshop: { bg: '#cffafe', text: '#0891b2' },
  career: { bg: '#dcfce7', text: '#16a34a' },
  academic: { bg: '#e6f2ff', text: '#0066cc' },
  sports: { bg: '#ffedd5', text: '#ea580c' },
  social: { bg: '#f3e8ff', text: '#9333ea' },
  workshop: { bg: '#cffafe', text: '#0891b2' },
};

const defaultColors = { bg: '#f1f5f9', text: '#475569' };

export default function EventCard({
  title,
  date,
  time,
  location,
  category,
  attendeeCount,
  maxAttendees,
  isAttending,
  onPress,
  onJoinPress,
  index = 0,
  imageUrl,
}: EventCardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = categoryColors[category] || defaultColors;
  const CategoryIcon = getCategoryIcon(category);
  const hasImage = !!imageUrl;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <Animated.View entering={FadeInDown.duration(400).delay(index * 50).springify()}>
      <TouchableOpacity
        onPress={onPress}
        style={[
          styles.card,
          {
            backgroundColor: isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: isDark ? 0.3 : 0.15,
            shadowRadius: 12,
            elevation: 6,
          },
        ]}
        activeOpacity={0.8}
      >
        {/* Event Image or Category Icon */}
        {hasImage ? (
          <ImageBackground
            source={{ uri: imageUrl }}
            style={styles.imageContainer}
            resizeMode="cover"
          >
            <LinearGradient
              colors={['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.6)']}
              style={StyleSheet.absoluteFillObject}
            />
            <View style={styles.imageContent}>
              <View style={[styles.categoryBadge, { backgroundColor: colors.bg }]}>
                <Text style={[styles.categoryText, { color: colors.text }]}>
                  {category}
                </Text>
              </View>
              <Text style={styles.eventTitle} numberOfLines={2}>
                {title}
              </Text>
            </View>
          </ImageBackground>
        ) : (
          <View style={[styles.imageContainer, { backgroundColor: colors.bg }]}>
            <View style={styles.iconContainer}>
              <CategoryIcon size={64} color={colors.text} />
            </View>
            <View style={styles.imageContent}>
              <View style={[styles.categoryBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                <Text style={[styles.categoryText, { color: colors.text }]}>
                  {category}
                </Text>
              </View>
              <Text style={[styles.eventTitle, { color: colors.text }]} numberOfLines={2}>
                {title}
              </Text>
            </View>
          </View>
        )}

        {/* Event Details */}
        <View style={styles.details}>
          <View style={styles.detailRow}>
            <Calendar size={16} color={isDark ? '#9ca3af' : '#6b7280'} />
            <Text style={[styles.detailText, { color: isDark ? '#94a3b8' : '#64748b' }]}>
              {formatDate(date)}
            </Text>
            {time && (
              <>
                <Clock size={16} color={isDark ? '#9ca3af' : '#6b7280'} style={{ marginLeft: 12 }} />
                <Text style={[styles.detailText, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                  {time}
                </Text>
              </>
            )}
          </View>
          <View style={styles.detailRow}>
            <MapPin size={16} color={isDark ? '#9ca3af' : '#6b7280'} />
            <Text style={[styles.detailText, { color: isDark ? '#94a3b8' : '#64748b' }]} numberOfLines={1}>
              {location}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Users size={16} color={isDark ? '#9ca3af' : '#6b7280'} />
            <Text style={[styles.detailText, { color: isDark ? '#94a3b8' : '#64748b' }]}>
              {attendeeCount}{maxAttendees ? ` / ${maxAttendees}` : ''} attending
            </Text>
          </View>
        </View>

        {/* Action Button */}
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            onJoinPress();
          }}
          style={[
            styles.actionButton,
            {
              backgroundColor: isAttending ? '#10b981' : DesignSystem.colors.primary,
            },
          ]}
          activeOpacity={0.8}
        >
          <Text style={styles.actionButtonText}>
            {isAttending ? 'Attending' : 'Join Event'}
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
  },
  imageContainer: {
    height: 180,
    justifyContent: 'flex-end',
    padding: 16,
  },
  iconContainer: {
    position: 'absolute',
    top: 40,
    left: '50%',
    marginLeft: -32,
    opacity: 0.3,
  },
  imageContent: {
    zIndex: 1,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  eventTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  details: {
    padding: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  actionButton: {
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

