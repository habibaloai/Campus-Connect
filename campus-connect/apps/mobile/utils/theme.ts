import { useColorScheme } from '@/components/useColorScheme';

/**
 * Theme-aware color utilities matching login screen design
 */
export function useThemeColors() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return {
    isDark,
    // Card backgrounds - translucent to show background image
    card: isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
    cardElevated: isDark ? 'rgba(30, 41, 59, 0.98)' : 'rgba(255, 255, 255, 0.98)',
    
    // Text colors
    text: {
      primary: isDark ? '#ffffff' : '#1e293b',
      secondary: isDark ? '#94a3b8' : '#64748b',
      tertiary: isDark ? '#64748b' : '#9ca3af',
      inverse: isDark ? '#1e293b' : '#ffffff',
      muted: isDark ? '#94a3b8' : '#9ca3af',
    },
    
    // Border colors
    border: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
    borderLight: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
    
    // Background overlay (for background image)
    overlay: isDark ? 0.7 : 0.5,
    
    // Input backgrounds
    input: isDark ? 'rgba(30, 41, 59, 0.8)' : '#f8fafc',
    
    // Shadows
    shadow: {
      color: '#000000',
      opacity: {
        light: isDark ? 0.3 : 0.15,
        medium: isDark ? 0.4 : 0.2,
        heavy: isDark ? 0.5 : 0.3,
      },
    },
    
    // Primary color (blue)
    primary: '#3b82f6',
    primaryDark: '#2563eb',
    
    // Status colors
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#0ea5e9',
  };
}

/**
 * Get theme-aware text shadow for better readability on background image
 */
export function getTextShadow(isDark: boolean) {
  return {
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: isDark ? 4 : 3,
  };
}
