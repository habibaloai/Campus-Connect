import { ExpoConfig, ConfigContext } from 'expo/config';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables from multiple sources
// Priority: .env in mobile directory > .env.local in root > process.env

// 1. Load from mobile directory .env file
try {
  const mobileEnvPath = path.resolve(__dirname, '.env');
  if (fs.existsSync(mobileEnvPath)) {
    const envConfig = fs.readFileSync(mobileEnvPath, 'utf8');
    envConfig.split('\n').forEach((line) => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const match = trimmedLine.match(/^([^=]+)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          const value = match[2].trim().replace(/^["'](.*)["']$/, '$1');
          if (!process.env[key]) {
            process.env[key] = value;
          }
        }
      }
    });
    console.log('✅ Loaded .env from mobile directory');
  }
} catch (error) {
  console.warn('⚠️ Error loading mobile .env:', error);
}

// 2. Load from root .env.local as fallback
try {
  const rootEnvPath = path.resolve(__dirname, '../../.env.local');
  if (fs.existsSync(rootEnvPath)) {
    const envConfig = fs.readFileSync(rootEnvPath, 'utf8');
    envConfig.split('\n').forEach((line) => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const match = trimmedLine.match(/^([^=]+)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          const value = match[2].trim().replace(/^["'](.*)["']$/, '$1');
          // Only use if it's EXPO_PUBLIC_ or if mobile .env didn't have it
          if (key.startsWith('EXPO_PUBLIC_') && !process.env[key]) {
            process.env[key] = value;
          }
        }
      }
    });
    console.log('✅ Loaded .env.local from root directory');
  }
} catch (error) {
  console.warn('⚠️ Error loading root .env.local:', error);
}

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Campus Connect',
  slug: 'campus-connect',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'campusconnect',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,

  // Splash screen configuration
  splash: {
    image: './assets/images/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#3B82F6',
  },

  // iOS configuration
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.campusconnect.app',
    buildNumber: '1',
    infoPlist: {
      NSCameraUsageDescription: 'Campus Connect needs access to your camera to take photos for your profile and posts.',
      NSPhotoLibraryUsageDescription: 'Campus Connect needs access to your photo library to share images in posts and messages.',
      NSLocationWhenInUseUsageDescription: 'Campus Connect uses your location to show nearby campus locations and transportation.',
      NSCalendarsUsageDescription: 'Campus Connect can add events to your calendar.',
      NSFaceIDUsageDescription: 'Campus Connect uses Face ID for secure login.',
    },
    associatedDomains: ['applinks:campusconnect.app'],
    config: {
      usesNonExemptEncryption: false,
    },
  },

  // Android configuration
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/images/adaptive-icon.png',
      backgroundColor: '#3B82F6',
    },
    package: 'com.campusconnect.app',
    versionCode: 1,
    permissions: [
      'android.permission.CAMERA',
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.WRITE_EXTERNAL_STORAGE',
      'android.permission.ACCESS_FINE_LOCATION',
      'android.permission.ACCESS_COARSE_LOCATION',
      'android.permission.READ_CALENDAR',
      'android.permission.WRITE_CALENDAR',
      'android.permission.VIBRATE',
      'android.permission.RECEIVE_BOOT_COMPLETED',
      'android.permission.USE_BIOMETRIC',
      'android.permission.USE_FINGERPRINT',
    ],
    intentFilters: [
      {
        action: 'VIEW',
        autoVerify: true,
        data: [
          {
            scheme: 'https',
            host: 'campusconnect.app',
            pathPrefix: '/',
          },
        ],
        category: ['BROWSABLE', 'DEFAULT'],
      },
    ],
  },

  // Web configuration
  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './assets/images/favicon.png',
  },

  // Plugins
  plugins: [
    'expo-router',
    'expo-secure-store',
    'expo-notifications',
    'expo-local-authentication',
    [
      'expo-calendar',
      {
        calendarPermission: 'Campus Connect needs access to your calendar to add events.',
      },
    ],
    [
      'expo-image-picker',
      {
        photosPermission: 'Campus Connect needs access to your photos to share images.',
        cameraPermission: 'Campus Connect needs access to your camera to take photos.',
      },
    ],
  ],

  // Experiments
  experiments: {
    typedRoutes: true,
  },

  // Extra configuration
  extra: {
    eas: {
      projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
    },
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
  },

  // Owner (for EAS)
  owner: 'campusconnect',

  // Updates configuration (for OTA updates)
  updates: {
    fallbackToCacheTimeout: 0,
    url: 'https://u.expo.dev/your-project-id',
  },

  // Runtime version for updates
  runtimeVersion: {
    policy: 'sdkVersion',
  },
});










