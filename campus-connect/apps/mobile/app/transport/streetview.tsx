import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Alert,
} from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft, X } from 'lucide-react-native';
import { useColorScheme } from '@/components/useColorScheme';
import { WebView } from 'react-native-webview';
import Constants from 'expo-constants';

const { width, height } = Dimensions.get('window');

export default function StreetViewScreen() {
  const params = useLocalSearchParams<{
    latitude: string;
    longitude: string;
    name: string;
    address: string;
  }>();
  
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [loading, setLoading] = useState(true);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [accuratePosition, setAccuratePosition] = useState<{ lat: number; lng: number } | null>(null);
  const [geocoding, setGeocoding] = useState(true);

  const initialLatitude = parseFloat(params.latitude);
  const initialLongitude = parseFloat(params.longitude);
  const name = params.name || 'Location';
  const address = params.address || '';

  // Get Google Maps API Key from environment variables
  // Try EXPO_PUBLIC_ first (recommended for Expo), then NEXT_PUBLIC_, then Constants.expoConfig.extra
  useEffect(() => {
    const key = 
      process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || 
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 
      Constants.expoConfig?.extra?.googleMapsApiKey;

    if (!key || !key.trim()) {
      Alert.alert(
        'Google Maps API Key Required',
        'Please add EXPO_PUBLIC_GOOGLE_MAPS_API_KEY to your .env.local file in apps/mobile/',
        [{ text: 'OK', onPress: () => router.back() }]
      );
      return;
    }

    setApiKey(key.trim());
  }, []);

  // Geocode address to get accurate coordinates
  useEffect(() => {
    if (!apiKey) {
      return;
    }

    if (!address) {
      // Use initial coordinates if no address
      setAccuratePosition({ lat: initialLatitude, lng: initialLongitude });
      setGeocoding(false);
      return;
    }

    // Geocode the address to get precise coordinates
    const geocodeAddress = async () => {
      try {
        const encodedAddress = encodeURIComponent(address);
        const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}`;
        
        const response = await fetch(geocodeUrl);
        const data = await response.json();
        
        if (data.status === 'OK' && data.results && data.results.length > 0) {
          const location = data.results[0].geometry.location;
          console.log('Geocoded position:', location);
          setAccuratePosition({ lat: location.lat, lng: location.lng });
        } else {
          console.warn('Geocoding failed, using initial coordinates:', data.status);
          setAccuratePosition({ lat: initialLatitude, lng: initialLongitude });
        }
      } catch (error) {
        console.error('Geocoding error:', error);
        setAccuratePosition({ lat: initialLatitude, lng: initialLongitude });
      } finally {
        setGeocoding(false);
      }
    };

    geocodeAddress();
  }, [apiKey, address, initialLatitude, initialLongitude]);

  // Use accurate position if available, otherwise use initial coordinates
  const finalLatitude = accuratePosition?.lat || initialLatitude;
  const finalLongitude = accuratePosition?.lng || initialLongitude;

  // Google Street View Embed with 360-degree view
  // Users can look around but cannot move to different locations
  const streetViewEmbedHtml = apiKey && !geocoding ? `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <meta http-equiv="Content-Security-Policy" content="default-src 'self' 'unsafe-inline' 'unsafe-eval' https://maps.googleapis.com https://maps.gstatic.com https://*.googleapis.com https://*.gstatic.com data: blob:;">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body, html {
          width: 100%;
          height: 100%;
          overflow: hidden;
          touch-action: none;
          background-color: #000;
        }
        #streetview {
          width: 100%;
          height: 100%;
        }
        #error {
          display: none;
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: #fff;
          text-align: center;
          padding: 20px;
          background: rgba(0, 0, 0, 0.8);
          border-radius: 8px;
        }
      </style>
    </head>
    <body>
      <div id="streetview"></div>
      <div id="error">
        <h3>Error loading Street View</h3>
        <p id="errorMsg"></p>
      </div>
      <script>
        let panorama = null;
        let loadTimeout = null;
        
        function showError(message) {
          const errorDiv = document.getElementById('error');
          const errorMsg = document.getElementById('errorMsg');
          errorDiv.style.display = 'block';
          errorMsg.textContent = message;
          console.error('Street View Error:', message);
          
          // Notify React Native
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'error',
              message: message
            }));
          }
        }
        
        function findNearestStreetView(lat, lng, callback) {
          const service = new google.maps.StreetViewService();
          service.getPanorama(
            { location: { lat: lat, lng: lng }, radius: 50 },
            function(data, status) {
              if (status === 'OK') {
                callback(data.location.latLng);
              } else {
                // Try with larger radius
                service.getPanorama(
                  { location: { lat: lat, lng: lng }, radius: 200 },
                  function(data2, status2) {
                    if (status2 === 'OK') {
                      callback(data2.location.latLng);
                    } else {
                      // Use original coordinates
                      callback({ lat: lat, lng: lng });
                    }
                  }
                );
              }
            }
          );
        }
        
        function initStreetView() {
          try {
            clearTimeout(loadTimeout);
            
            if (typeof google === 'undefined' || typeof google.maps === 'undefined') {
              showError('Google Maps API not loaded');
              return;
            }
            
            if (typeof google.maps.StreetViewPanorama === 'undefined') {
              showError('Street View API not available');
              return;
            }
            
            const targetLat = ${finalLatitude};
            const targetLng = ${finalLongitude};
            
            // Find nearest Street View panorama
            findNearestStreetView(targetLat, targetLng, function(position) {
              console.log('Using Street View position:', position);
              
              panorama = new google.maps.StreetViewPanorama(
                document.getElementById('streetview'),
                {
                  position: position,
                  pov: { heading: 0, pitch: 0 },
                  zoom: 1,
                  visible: true,
                  disableDefaultUI: false, // Enable some controls for better 3D view
                  showRoadLabels: true, // Show road labels for context
                  linksControl: false, // Disable navigation to other locations
                  panControl: true, // Enable pan control
                  enableCloseButton: false,
                  fullscreenControl: false,
                  zoomControl: true, // Enable zoom for better 3D view
                  addressControl: false,
                  clickToGo: false, // Disable clicking to move
                  scrollwheel: true, // Enable scrollwheel zoom
                  disableDoubleClickZoom: false, // Allow double-click zoom
                }
              );
              
              // Handle Street View status
              panorama.addListener('status_changed', function() {
                const status = panorama.getStatus();
                console.log('Street View status:', status);
                
                if (status === 'OK') {
                  // Successfully loaded
                  if (window.ReactNativeWebView) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                      type: 'loaded',
                      status: 'OK',
                      position: position
                    }));
                  }
                } else if (status === 'ZERO_RESULTS') {
                  showError('No Street View imagery available for this location. Try a nearby location.');
                } else if (status === 'UNKNOWN_ERROR') {
                  showError('Unknown error loading Street View');
                } else {
                  showError('Street View status: ' + status);
                }
              });
              
              // Prevent navigation to other Street View locations
              panorama.registerPanoProvider(function() {
                return null; // Return null to prevent loading other panoramas
              });
            });
            
          } catch (error) {
            console.error('Error initializing Street View:', error);
            showError('Error: ' + error.message);
          }
        }
        
        // Set timeout for loading
        loadTimeout = setTimeout(function() {
          if (!panorama) {
            showError('Timeout loading Google Maps API');
          }
        }, 15000);
        
        // Handle script load errors
        window.gm_authFailure = function() {
          showError('Google Maps API authentication failed. Please check your API key.');
        };
        
        // Make callback global
        window.initStreetView = initStreetView;
      </script>
      <script 
        async 
        defer
        src="https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initStreetView&libraries=geometry"
        onerror="showError('Failed to load Google Maps script')">
      </script>
    </body>
    </html>
  ` : '';

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-black'}`} edges={['top']}>
      <StatusBar style="light" />
      
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      {/* Header */}
      <View
        className={`absolute top-0 left-0 right-0 z-10 ${
          isDark ? 'bg-gray-900/95' : 'bg-black/90'
        }`}
        style={{ paddingTop: 8, paddingBottom: 8 }}
      >
        <View className="flex-row items-center justify-between px-4">
          <TouchableOpacity
            onPress={() => {
              console.log('Back button pressed - navigating back');
              router.back();
            }}
            className="flex-row items-center bg-black/30 px-3 py-2 rounded-lg"
            activeOpacity={0.7}
          >
            <ChevronLeft size={24} color="#ffffff" />
            <Text className="text-white font-medium ml-1">Back</Text>
          </TouchableOpacity>
          
          <View className="flex-1 mx-4">
            <Text className="text-white font-semibold text-sm" numberOfLines={1}>
              {name}
            </Text>
            {address && (
              <Text className="text-gray-300 text-xs" numberOfLines={1}>
                {address}
              </Text>
            )}
          </View>

          <TouchableOpacity
            onPress={() => {
              console.log('Close button pressed - navigating back');
              router.back();
            }}
            className="p-2 bg-black/30 rounded-lg"
            activeOpacity={0.7}
          >
            <X size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Back to Navigate Button - More visible, always on top */}
      <TouchableOpacity
        onPress={() => {
          console.log('Back to Navigate button pressed');
          router.back();
        }}
        className="absolute bottom-6 left-4 right-4 bg-blue-500 rounded-xl py-4 flex-row items-center justify-center"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 10,
          zIndex: 1000,
        }}
        activeOpacity={0.8}
      >
        <ChevronLeft size={20} color="#ffffff" />
        <Text className="text-white font-semibold ml-2">Back to Navigate</Text>
      </TouchableOpacity>

      {/* Street View Container */}
      <View className="flex-1" style={{ marginTop: 0 }}>
        {!apiKey ? (
          <View className="absolute inset-0 items-center justify-center z-20 bg-black">
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text className="text-white mt-4 text-sm">Loading API key...</Text>
          </View>
        ) : geocoding ? (
          <View className="absolute inset-0 items-center justify-center z-20 bg-black">
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text className="text-white mt-4 text-sm">Finding exact location...</Text>
            <Text className="text-gray-400 mt-2 text-xs text-center px-4">
              {address || 'Searching for bus stop position'}
            </Text>
          </View>
        ) : (
          <>
            {loading && (
              <View className="absolute inset-0 items-center justify-center z-20 bg-black">
                <ActivityIndicator size="large" color="#3b82f6" />
                <Text className="text-white mt-4 text-sm">Loading Street View...</Text>
              </View>
            )}
            
            <WebView
              source={{ html: streetViewEmbedHtml }}
              style={{ flex: 1, backgroundColor: '#000', marginBottom: 80 }}
              onLoadStart={() => {
                setLoading(true);
                console.log('WebView: Loading started');
              }}
              onLoadEnd={() => {
                setLoading(false);
                console.log('WebView: Loading ended');
              }}
              onError={(syntheticEvent) => {
                const { nativeEvent } = syntheticEvent;
                console.error('WebView error: ', nativeEvent);
                setLoading(false);
                Alert.alert(
                  'Street View Error',
                  `Failed to load Street View.\n\nError: ${nativeEvent.description || 'Unknown error'}\n\nPlease check:\n1. Your internet connection\n2. Google Maps API key is valid\n3. Maps JavaScript API is enabled in Google Cloud Console`,
                  [{ text: 'OK' }]
                );
              }}
              onHttpError={(syntheticEvent) => {
                const { nativeEvent } = syntheticEvent;
                console.error('WebView HTTP error: ', nativeEvent);
                setLoading(false);
                Alert.alert(
                  'HTTP Error',
                  `HTTP ${nativeEvent.statusCode}: ${nativeEvent.description || 'Failed to load resource'}`,
                  [{ text: 'OK' }]
                );
              }}
              onMessage={(event) => {
                try {
                  const data = JSON.parse(event.nativeEvent.data);
                  console.log('WebView message:', data);
                  
                  if (data.type === 'error') {
                    setLoading(false);
                    Alert.alert(
                      'Street View Error',
                      data.message || 'An error occurred loading Street View',
                      [{ text: 'OK' }]
                    );
                  } else if (data.type === 'loaded') {
                    setLoading(false);
                    console.log('Street View loaded successfully');
                  }
                } catch (error) {
                  console.log('WebView message (raw):', event.nativeEvent.data);
                }
              }}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              startInLoadingState={true}
              scalesPageToFit={true}
              showsHorizontalScrollIndicator={false}
              showsVerticalScrollIndicator={false}
              allowsInlineMediaPlayback={true}
              mediaPlaybackRequiresUserAction={false}
              originWhitelist={['*']}
              mixedContentMode="always"
              allowsBackForwardNavigationGestures={false}
            />
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

