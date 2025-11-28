import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useColorScheme } from '@/components/useColorScheme';
import { DesignSystem } from '@/constants/design';

interface MessageBubbleProps {
  message: string;
  isSent: boolean;
  timestamp: string;
  senderName?: string;
  senderAvatar?: string;
  imageUrl?: string;
}

export default function MessageBubble({
  message,
  isSent,
  timestamp,
  senderName,
  senderAvatar,
  imageUrl,
}: MessageBubbleProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  if (isSent) {
    return (
      <View style={styles.sentContainer}>
        <View style={[styles.bubble, styles.sentBubble, { backgroundColor: DesignSystem.colors.primary }]}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.messageImage} />
          ) : (
            <Text style={styles.sentText}>{message}</Text>
          )}
          <Text style={styles.timestamp}>{timestamp}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.receivedContainer}>
      {senderAvatar ? (
        <Image source={{ uri: senderAvatar }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarPlaceholder]}>
          <Text style={styles.avatarText}>{senderName?.[0] || 'U'}</Text>
        </View>
      )}
      <View style={styles.receivedContent}>
        {senderName && <Text style={styles.senderName}>{senderName}</Text>}
        <View style={[styles.bubble, styles.receivedBubble, { backgroundColor: isDark ? '#1e293b' : '#ffffff' }]}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.messageImage} />
          ) : (
            <Text style={[styles.receivedText, { color: isDark ? '#ffffff' : '#1e293b' }]}>{message}</Text>
          )}
          <Text style={[styles.timestamp, { color: isDark ? '#94a3b8' : '#64748b' }]}>{timestamp}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sentContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  receivedContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingHorizontal: 20,
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 16,
  },
  sentBubble: {
    borderBottomRightRadius: 4,
  },
  receivedBubble: {
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  sentText: {
    color: '#ffffff',
    fontSize: 15,
    lineHeight: 20,
  },
  receivedText: {
    fontSize: 15,
    lineHeight: 20,
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  avatarPlaceholder: {
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  receivedContent: {
    flex: 1,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 4,
    paddingLeft: 4,
  },
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: 8,
    marginBottom: 8,
  },
});

