import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { WifiOff, RefreshCw, CloudOff, Check } from 'lucide-react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { useOffline } from '../hooks/useOffline';

interface OfflineBannerProps {
  onSync?: () => Promise<{ success: number; failed: number }>;
}

export default function OfflineBanner({ onSync }: OfflineBannerProps) {
  const { isOffline, pendingActionsCount, lastSyncFormatted, syncNow } = useOffline();
  const [syncing, setSyncing] = React.useState(false);
  const [syncResult, setSyncResult] = React.useState<{ success: number; failed: number } | null>(null);

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    
    try {
      const result = onSync ? await onSync() : await syncNow();
      setSyncResult(result);
      
      // Clear result after 3 seconds
      setTimeout(() => setSyncResult(null), 3000);
    } finally {
      setSyncing(false);
    }
  };

  // Show offline banner
  if (isOffline) {
    return (
      <Animated.View
        entering={FadeInDown.duration(300)}
        exiting={FadeOutUp.duration(300)}
        className="bg-red-500 px-4 py-3 flex-row items-center justify-between"
      >
        <View className="flex-row items-center">
          <WifiOff size={18} color="#FFFFFF" />
          <View className="ml-3">
            <Text className="text-white font-semibold">You're offline</Text>
            <Text className="text-white/80 text-xs">
              {pendingActionsCount > 0
                ? `${pendingActionsCount} pending action${pendingActionsCount !== 1 ? 's' : ''}`
                : 'Changes will sync when online'}
            </Text>
          </View>
        </View>
        <CloudOff size={20} color="#FFFFFF" />
      </Animated.View>
    );
  }

  // Show pending actions banner (online but has pending)
  if (pendingActionsCount > 0) {
    return (
      <Animated.View
        entering={FadeInDown.duration(300)}
        exiting={FadeOutUp.duration(300)}
        className="bg-yellow-500 px-4 py-3 flex-row items-center justify-between"
      >
        <View className="flex-row items-center flex-1">
          <RefreshCw size={18} color="#FFFFFF" className={syncing ? 'animate-spin' : ''} />
          <View className="ml-3 flex-1">
            <Text className="text-white font-semibold">
              {syncing ? 'Syncing...' : `${pendingActionsCount} pending action${pendingActionsCount !== 1 ? 's' : ''}`}
            </Text>
            <Text className="text-white/80 text-xs">Last synced: {lastSyncFormatted}</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={handleSync}
          disabled={syncing}
          className="bg-white/20 px-3 py-1.5 rounded-full"
        >
          <Text className="text-white font-medium">{syncing ? 'Syncing' : 'Sync Now'}</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  // Show sync result temporarily
  if (syncResult) {
    return (
      <Animated.View
        entering={FadeInDown.duration(300)}
        exiting={FadeOutUp.duration(300)}
        className="bg-green-500 px-4 py-3 flex-row items-center"
      >
        <Check size={18} color="#FFFFFF" />
        <Text className="text-white font-medium ml-2">
          Synced {syncResult.success} action{syncResult.success !== 1 ? 's' : ''}
          {syncResult.failed > 0 && ` (${syncResult.failed} failed)`}
        </Text>
      </Animated.View>
    );
  }

  return null;
}









