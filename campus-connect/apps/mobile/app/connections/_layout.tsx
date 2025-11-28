import { Stack } from 'expo-router';

export default function ConnectionsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="requests" />
      <Stack.Screen name="map" />
    </Stack>
  );
}

