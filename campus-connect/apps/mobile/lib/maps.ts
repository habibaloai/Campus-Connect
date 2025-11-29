/**
 * Google Maps and Street View utilities for Campus Connect
 * Provides functions to open Google Maps, Street View, and navigation
 */

import * as Linking from 'expo-linking';

export interface Location {
  name: string;
  latitude: number;
  longitude: number;
  address?: string;
}

export interface BusStop extends Location {
  id: string;
  buses: string[];
  description?: string;
}

export interface BusDirection {
  busLine: string;
  direction: 'toward-harmonie' | 'opposite';
  destination?: string;
}

export interface BuildingLocation extends Location {
  id: string;
  type: 'building' | 'street';
}

export interface BusSchedule {
  stopId: string;
  busLine: string;
  weekdayTimes: string[]; // Times in HH:MM format
  weekendTimes: string[]; // Times in HH:MM format
  frequency?: string; // e.g., "Every 10 min"
  direction?: 'toward-harmonie' | 'opposite'; // Direction the bus is going
}

export interface NextArrival {
  busLine: string;
  arrivalTime: Date;
  minutesUntil: number;
  isToday: boolean;
  direction?: 'toward-harmonie' | 'opposite';
}

/**
 * Campus building and street locations
 */
export const BUILDING_LOCATIONS: BuildingLocation[] = [
  {
    id: 'mensa',
    name: 'Mensa',
    type: 'building',
    latitude: 49.1428,
    longitude: 9.2108,
    address: 'L Building, Bildungs Campus, 74076 Heilbronn, Germany',
  },
  {
    id: 'd-building',
    name: 'D Building',
    type: 'building',
    latitude: 49.1420,
    longitude: 9.2100,
    address: 'Bildungscampus 2, Gebäude D, 74076 Heilbronn, Germany',
  },
  {
    id: 'l-building',
    name: 'L Building',
    type: 'building',
    latitude: 49.1428,
    longitude: 9.2108,
    address: 'L Building, Bildungs Campus, 74076 Heilbronn, Germany',
  },
  {
    id: 'library',
    name: 'Library',
    type: 'building',
    latitude: 49.1430,
    longitude: 9.2110,
    address: 'Bibliothek LIV, Bildungscampus, 74076 Heilbronn, Germany',
  },
  {
    id: 'weiperstr',
    name: 'Weiperstraße',
    type: 'street',
    latitude: 49.1410,
    longitude: 9.2095,
    address: 'OpenSpace Heilbronn, 74076 Heilbronn, Germany',
  },
  {
    id: 'etzelstr-building',
    name: 'Etzelstraße',
    type: 'street',
    latitude: 49.1415,
    longitude: 9.2115,
    address: 'Etzelstraße 38, 74076 Heilbronn, Germany',
  },
];

/**
 * Bus stops in the Bildungs Campus area, Heilbronn
 * Real bus lines: 5, 12, 31, 32, 33, 41, 42 (in increasing order)
 * Coordinates updated for accurate locations
 */
export const BUS_STOPS: BusStop[] = [
  {
    id: 'etzelstr-1',
    name: 'Etzelstraße (Stop 1)',
    latitude: 49.1418,
    longitude: 9.2113,
    address: 'Etzelstraße, 74076 Heilbronn, Germany',
    buses: ['12', '31', '32', '33', '41'],
    description: 'Bus stop on Etzelstraße',
  },
  {
    id: 'etzelstr-2',
    name: 'Etzelstraße (Stop 2)',
    latitude: 49.1420,
    longitude: 9.2117,
    address: 'Etzelstraße, 74076 Heilbronn, Germany',
    buses: ['12', '31', '32', '33', '42'],
    description: 'Second bus stop on Etzelstraße',
  },
  {
    id: 'fuegerstrasse',
    name: 'Fügerstraße',
    latitude: 49.1410,
    longitude: 9.2109,
    address: 'Fügerstraße, 74076 Heilbronn, Germany',
    buses: ['31', '32', '33', '41', '42'],
    description: 'Bus stop on Fügerstraße',
  },
  {
    id: 'europaplatz-west',
    name: 'Europaplatz/Bildungscampus West',
    latitude: 49.1433,
    longitude: 9.2099,
    address: 'HN Europapl./Bildungscampus West, 74072 Heilbronn, Germany',
    buses: ['5', '12', '31', '32', '33', '42'],
    description: 'Central bus stop at Europaplatz West',
  },
  {
    id: 'industrieplatz-ost',
    name: 'Industrieplatz Ost',
    latitude: 49.1441,
    longitude: 9.2106,
    address: 'Heilbronn Industrieplatz Ost, 74076 Heilbronn, Germany',
    buses: ['5', '12', '31', '32', '41', '42'],
    description: 'Bus stop at Industrieplatz Ost',
  },
];

/**
 * Opens Google Maps with the specified location
 */
export function openGoogleMaps(location: Location | BusStop | string): void {
  let url: string;
  
  if (typeof location === 'string') {
    url = `https://maps.google.com/?q=${encodeURIComponent(location)}`;
  } else if ('buses' in location) {
    // Use the address if available (contains official HNV stop names), otherwise use name
    // The address field contains official stop names like "HN Europapl./Bildungscampus West"
    const searchQuery = location.address || `${location.name} Heilbronn HNV bus stop`;
    url = `https://maps.google.com/?q=${encodeURIComponent(searchQuery)}`;
  } else {
    url = `https://maps.google.com/?q=${location.latitude},${location.longitude}`;
  }
  
  Linking.openURL(url).catch((err) => {
    console.error('Failed to open Google Maps:', err);
  });
}

/**
 * Opens Google Maps Street View for the specified location
 * For bus stops, uses search query for better accuracy
 */
export function openStreetView(location: Location | BusStop): void {
  let url: string;
  
  // If it's a bus stop, use search query for better accuracy
  if ('buses' in location) {
    // Use the address if available (contains official HNV stop names), otherwise use name
    // The address field contains official stop names like "HN Europapl./Bildungscampus West"
    const searchQuery = location.address || `${location.name} Heilbronn HNV bus stop`;
    // First search for the location, then open Street View
    // Using the search parameter to help Google Maps find the exact bus stop
    url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(searchQuery)}`;
  } else {
    url = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${location.latitude},${location.longitude}`;
  }
  
  Linking.openURL(url).catch((err) => {
    console.error('Failed to open Street View:', err);
  });
}

/**
 * Opens Google Maps with navigation to the specified location
 * For bus stops, uses search query for better accuracy
 */
export function openNavigation(location: Location | BusStop | string): void {
  let url: string;
  
  if (typeof location === 'string') {
    url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(location)}`;
  } else if ('buses' in location) {
    // Use the address if available (contains official HNV stop names), otherwise use name
    // The address field contains official stop names like "HN Europapl./Bildungscampus West"
    const searchQuery = location.address || `${location.name} Heilbronn HNV bus stop`;
    url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(searchQuery)}`;
  } else {
    url = `https://www.google.com/maps/dir/?api=1&destination=${location.latitude},${location.longitude}`;
  }
  
  Linking.openURL(url).catch((err) => {
    console.error('Failed to open navigation:', err);
  });
}

/**
 * Gets Street View image URL (for embedding in web views)
 * Note: This requires a Google Maps API key for production use
 */
export function getStreetViewImageUrl(
  location: Location,
  width: number = 640,
  height: number = 400,
  fov: number = 90,
  pitch: number = 0
): string {
  // For production, you would use: `https://maps.googleapis.com/maps/api/streetview?size=${width}x${height}&location=${location.latitude},${location.longitude}&fov=${fov}&pitch=${pitch}&key=YOUR_API_KEY`
  // For now, we'll use the embed URL which doesn't require an API key
  return `https://www.google.com/maps/embed/v1/streetview?key=&location=${location.latitude},${location.longitude}&fov=${fov}&pitch=${pitch}`;
}

/**
 * Gets all bus stops for a specific bus line
 */
export function getBusStopsForLine(busLine: string): BusStop[] {
  return BUS_STOPS.filter((stop) => stop.buses.includes(busLine));
}

/**
 * Gets all bus lines that stop at a specific location
 */
export function getBusLinesForStop(stopId: string): string[] {
  const stop = BUS_STOPS.find((s) => s.id === stopId);
  return stop?.buses || [];
}

/**
 * Bus schedules for Heilbronn Bildungs Campus area
 * Real bus lines: 5, 12, 31, 32, 33, 41, 42 (in increasing order)
 * Schedules organized by stop, then by bus line number in increasing order
 */
export const BUS_SCHEDULES: BusSchedule[] = [
  // Etzelstraße Stop 1 schedules (ordered: 12, 31, 32, 33, 41)
  {
    stopId: 'etzelstr-1',
    busLine: '12',
    weekdayTimes: ['06:15', '06:30', '06:45', '07:00', '07:15', '07:30', '07:45', '08:00', '08:15', '08:30', '08:45', '09:00', '09:20', '09:40', '10:00', '10:20', '10:40', '11:00', '11:20', '11:40', '12:00', '12:20', '12:40', '13:00', '13:20', '13:40', '14:00', '14:20', '14:40', '15:00', '15:15', '15:30', '15:45', '16:00', '16:15', '16:30', '16:45', '17:00', '17:15', '17:30', '17:45', '18:00', '18:20', '18:40', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00', '22:30', '23:00'],
    weekendTimes: ['07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00', '22:30', '23:00'],
    frequency: 'Every 10-20 min',
    direction: 'toward-harmonie',
  },
  {
    stopId: 'etzelstr-1',
    busLine: '31',
    weekdayTimes: ['06:20', '06:40', '07:00', '07:20', '07:40', '08:00', '08:20', '08:40', '09:00', '09:25', '09:50', '10:15', '10:40', '11:05', '11:30', '11:55', '12:20', '12:45', '13:10', '13:35', '14:00', '14:25', '14:50', '15:15', '15:40', '16:05', '16:30', '16:55', '17:20', '17:45', '18:10', '18:35', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00', '22:30', '23:00'],
    weekendTimes: ['07:15', '07:45', '08:15', '08:45', '09:15', '09:45', '10:15', '10:45', '11:15', '11:45', '12:15', '12:45', '13:15', '13:45', '14:15', '14:45', '15:15', '15:45', '16:15', '16:45', '17:15', '17:45', '18:15', '18:45', '19:15', '19:45', '20:15', '20:45', '21:15', '21:45', '22:15', '22:45', '23:15'],
    frequency: 'Every 15-25 min',
    direction: 'toward-harmonie',
  },
  {
    stopId: 'etzelstr-1',
    busLine: '32',
    weekdayTimes: ['06:10', '06:35', '07:00', '07:25', '07:50', '08:15', '08:40', '09:05', '09:30', '09:55', '10:20', '10:45', '11:10', '11:35', '12:00', '12:25', '12:50', '13:15', '13:40', '14:05', '14:30', '14:55', '15:20', '15:45', '16:10', '16:35', '17:00', '17:25', '17:50', '18:15', '18:40', '19:05', '19:35', '20:05', '20:35', '21:05', '21:35', '22:05', '22:35', '23:05'],
    weekendTimes: ['07:20', '07:50', '08:20', '08:50', '09:20', '09:50', '10:20', '10:50', '11:20', '11:50', '12:20', '12:50', '13:20', '13:50', '14:20', '14:50', '15:20', '15:50', '16:20', '16:50', '17:20', '17:50', '18:20', '18:50', '19:20', '19:50', '20:20', '20:50', '21:20', '21:50', '22:20', '22:50', '23:20'],
    frequency: 'Every 25 min',
    direction: 'toward-harmonie',
  },
  {
    stopId: 'etzelstr-1',
    busLine: '33',
    weekdayTimes: ['06:22', '06:47', '07:12', '07:37', '08:02', '08:27', '08:52', '09:17', '09:42', '10:07', '10:32', '10:57', '11:22', '11:47', '12:12', '12:37', '13:02', '13:27', '13:52', '14:17', '14:42', '15:07', '15:32', '15:57', '16:22', '16:47', '17:12', '17:37', '18:02', '18:27', '18:52', '19:22', '19:52', '20:22', '20:52', '21:22', '21:52', '22:22', '22:52'],
    weekendTimes: ['07:07', '07:37', '08:07', '08:37', '09:07', '09:37', '10:07', '10:37', '11:07', '11:37', '12:07', '12:37', '13:07', '13:37', '14:07', '14:37', '15:07', '15:37', '16:07', '16:37', '17:07', '17:37', '18:07', '18:37', '19:07', '19:37', '20:07', '20:37', '21:07', '21:37', '22:07', '22:37', '23:07'],
    frequency: 'Every 25 min',
    direction: 'toward-harmonie',
  },
  {
    stopId: 'etzelstr-1',
    busLine: '41',
    weekdayTimes: ['06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00', '22:30', '23:00'],
    weekendTimes: ['07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00', '22:30', '23:00'],
    frequency: 'Every 30 min',
    direction: 'opposite',
  },
  // Etzelstraße Stop 2 schedules (ordered: 12, 31, 32, 33, 42)
  {
    stopId: 'etzelstr-2',
    busLine: '12',
    weekdayTimes: ['06:18', '06:33', '06:48', '07:03', '07:18', '07:33', '07:48', '08:03', '08:18', '08:33', '08:48', '09:03', '09:23', '09:43', '10:03', '10:23', '10:43', '11:03', '11:23', '11:43', '12:03', '12:23', '12:43', '13:03', '13:23', '13:43', '14:03', '14:23', '14:43', '15:03', '15:18', '15:33', '15:48', '16:03', '16:18', '16:33', '16:48', '17:03', '17:18', '17:33', '17:48', '18:03', '18:23', '18:43', '19:03', '19:33', '20:03', '20:33', '21:03', '21:33', '22:03', '22:33', '23:03'],
    weekendTimes: ['07:03', '07:33', '08:03', '08:33', '09:03', '09:33', '10:03', '10:33', '11:03', '11:33', '12:03', '12:33', '13:03', '13:33', '14:03', '14:33', '15:03', '15:33', '16:03', '16:33', '17:03', '17:33', '18:03', '18:33', '19:03', '19:33', '20:03', '20:33', '21:03', '21:33', '22:03', '22:33', '23:03'],
    frequency: 'Every 10-20 min',
    direction: 'opposite',
  },
  {
    stopId: 'etzelstr-2',
    busLine: '31',
    weekdayTimes: ['06:25', '06:50', '07:15', '07:40', '08:05', '08:30', '08:55', '09:20', '09:45', '10:10', '10:35', '11:00', '11:25', '11:50', '12:15', '12:40', '13:05', '13:30', '13:55', '14:20', '14:45', '15:10', '15:35', '16:00', '16:25', '16:50', '17:15', '17:40', '18:05', '18:30', '18:55', '19:25', '19:55', '20:25', '20:55', '21:25', '21:55', '22:25', '22:55'],
    weekendTimes: ['07:10', '07:40', '08:10', '08:40', '09:10', '09:40', '10:10', '10:40', '11:10', '11:40', '12:10', '12:40', '13:10', '13:40', '14:10', '14:40', '15:10', '15:40', '16:10', '16:40', '17:10', '17:40', '18:10', '18:40', '19:10', '19:40', '20:10', '20:40', '21:10', '21:40', '22:10', '22:40', '23:10'],
    frequency: 'Every 25 min',
    direction: 'opposite',
  },
  {
    stopId: 'etzelstr-2',
    busLine: '32',
    weekdayTimes: ['06:22', '06:47', '07:12', '07:37', '08:02', '08:27', '08:52', '09:17', '09:42', '10:07', '10:32', '10:57', '11:22', '11:47', '12:12', '12:37', '13:02', '13:27', '13:52', '14:17', '14:42', '15:07', '15:32', '15:57', '16:22', '16:47', '17:12', '17:37', '18:02', '18:27', '18:52', '19:22', '19:52', '20:22', '20:52', '21:22', '21:52', '22:22', '22:52'],
    weekendTimes: ['07:07', '07:37', '08:07', '08:37', '09:07', '09:37', '10:07', '10:37', '11:07', '11:37', '12:07', '12:37', '13:07', '13:37', '14:07', '14:37', '15:07', '15:37', '16:07', '16:37', '17:07', '17:37', '18:07', '18:37', '19:07', '19:37', '20:07', '20:37', '21:07', '21:37', '22:07', '22:37', '23:07'],
    frequency: 'Every 25 min',
    direction: 'opposite',
  },
  {
    stopId: 'etzelstr-2',
    busLine: '33',
    weekdayTimes: ['06:22', '06:47', '07:12', '07:37', '08:02', '08:27', '08:52', '09:17', '09:42', '10:07', '10:32', '10:57', '11:22', '11:47', '12:12', '12:37', '13:02', '13:27', '13:52', '14:17', '14:42', '15:07', '15:32', '15:57', '16:22', '16:47', '17:12', '17:37', '18:02', '18:27', '18:52', '19:22', '19:52', '20:22', '20:52', '21:22', '21:52', '22:22', '22:52'],
    weekendTimes: ['07:07', '07:37', '08:07', '08:37', '09:07', '09:37', '10:07', '10:37', '11:07', '11:37', '12:07', '12:37', '13:07', '13:37', '14:07', '14:37', '15:07', '15:37', '16:07', '16:37', '17:07', '17:37', '18:07', '18:37', '19:07', '19:37', '20:07', '20:37', '21:07', '21:37', '22:07', '22:37', '23:07'],
    frequency: 'Every 25 min',
    direction: 'opposite',
  },
  {
    stopId: 'etzelstr-2',
    busLine: '42',
    weekdayTimes: ['06:12', '06:42', '07:12', '07:42', '08:12', '08:42', '09:12', '09:42', '10:12', '10:42', '11:12', '11:42', '12:12', '12:42', '13:12', '13:42', '14:12', '14:42', '15:12', '15:42', '16:12', '16:42', '17:12', '17:42', '18:12', '18:42', '19:12', '19:42', '20:12', '20:42', '21:12', '21:42', '22:12', '22:42', '23:12'],
    weekendTimes: ['07:25', '07:55', '08:25', '08:55', '09:25', '09:55', '10:25', '10:55', '11:25', '11:55', '12:25', '12:55', '13:25', '13:55', '14:25', '14:55', '15:25', '15:55', '16:25', '16:55', '17:25', '17:55', '18:25', '18:55', '19:25', '19:55', '20:25', '20:55', '21:25', '21:55', '22:25', '22:55', '23:25'],
    frequency: 'Every 30 min',
    direction: 'toward-harmonie',
  },
  // Fügerstraße schedules (ordered: 31, 32, 33, 41, 42)
  {
    stopId: 'fuegerstrasse',
    busLine: '31',
    weekdayTimes: ['06:20', '06:40', '07:00', '07:20', '07:40', '08:00', '08:20', '08:40', '09:00', '09:25', '09:50', '10:15', '10:40', '11:05', '11:30', '11:55', '12:20', '12:45', '13:10', '13:35', '14:00', '14:25', '14:50', '15:15', '15:40', '16:05', '16:30', '16:55', '17:20', '17:45', '18:10', '18:35', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00', '22:30', '23:00'],
    weekendTimes: ['07:15', '07:45', '08:15', '08:45', '09:15', '09:45', '10:15', '10:45', '11:15', '11:45', '12:15', '12:45', '13:15', '13:45', '14:15', '14:45', '15:15', '15:45', '16:15', '16:45', '17:15', '17:45', '18:15', '18:45', '19:15', '19:45', '20:15', '20:45', '21:15', '21:45', '22:15', '22:45', '23:15'],
    frequency: 'Every 15-25 min',
    direction: 'toward-harmonie',
  },
  {
    stopId: 'fuegerstrasse',
    busLine: '32',
    weekdayTimes: ['06:22', '06:47', '07:12', '07:37', '08:02', '08:27', '08:52', '09:17', '09:42', '10:07', '10:32', '10:57', '11:22', '11:47', '12:12', '12:37', '13:02', '13:27', '13:52', '14:17', '14:42', '15:07', '15:32', '15:57', '16:22', '16:47', '17:12', '17:37', '18:02', '18:27', '18:52', '19:22', '19:52', '20:22', '20:52', '21:22', '21:52', '22:22', '22:52'],
    weekendTimes: ['07:07', '07:37', '08:07', '08:37', '09:07', '09:37', '10:07', '10:37', '11:07', '11:37', '12:07', '12:37', '13:07', '13:37', '14:07', '14:37', '15:07', '15:37', '16:07', '16:37', '17:07', '17:37', '18:07', '18:37', '19:07', '19:37', '20:07', '20:37', '21:07', '21:37', '22:07', '22:37', '23:07'],
    frequency: 'Every 25 min',
    direction: 'toward-harmonie',
  },
  {
    stopId: 'fuegerstrasse',
    busLine: '33',
    weekdayTimes: ['06:22', '06:47', '07:12', '07:37', '08:02', '08:27', '08:52', '09:17', '09:42', '10:07', '10:32', '10:57', '11:22', '11:47', '12:12', '12:37', '13:02', '13:27', '13:52', '14:17', '14:42', '15:07', '15:32', '15:57', '16:22', '16:47', '17:12', '17:37', '18:02', '18:27', '18:52', '19:22', '19:52', '20:22', '20:52', '21:22', '21:52', '22:22', '22:52'],
    weekendTimes: ['07:07', '07:37', '08:07', '08:37', '09:07', '09:37', '10:07', '10:37', '11:07', '11:37', '12:07', '12:37', '13:07', '13:37', '14:07', '14:37', '15:07', '15:37', '16:07', '16:37', '17:07', '17:37', '18:07', '18:37', '19:07', '19:37', '20:07', '20:37', '21:07', '21:37', '22:07', '22:37', '23:07'],
    frequency: 'Every 25 min',
    direction: 'toward-harmonie',
  },
  {
    stopId: 'fuegerstrasse',
    busLine: '41',
    weekdayTimes: ['06:12', '06:42', '07:12', '07:42', '08:12', '08:42', '09:12', '09:42', '10:12', '10:42', '11:12', '11:42', '12:12', '12:42', '13:12', '13:42', '14:12', '14:42', '15:12', '15:42', '16:12', '16:42', '17:12', '17:42', '18:12', '18:42', '19:12', '19:42', '20:12', '20:42', '21:12', '21:42', '22:12', '22:42', '23:12'],
    weekendTimes: ['07:25', '07:55', '08:25', '08:55', '09:25', '09:55', '10:25', '10:55', '11:25', '11:55', '12:25', '12:55', '13:25', '13:55', '14:25', '14:55', '15:25', '15:55', '16:25', '16:55', '17:25', '17:55', '18:25', '18:55', '19:25', '19:55', '20:25', '20:55', '21:25', '21:55', '22:25', '22:55', '23:25'],
    frequency: 'Every 30 min',
    direction: 'opposite',
  },
  {
    stopId: 'fuegerstrasse',
    busLine: '42',
    weekdayTimes: ['06:17', '06:37', '06:57', '07:17', '07:37', '07:57', '08:17', '08:37', '08:57', '09:22', '09:47', '10:12', '10:37', '11:02', '11:27', '11:52', '12:17', '12:42', '13:07', '13:32', '13:57', '14:22', '14:47', '15:12', '15:37', '16:02', '16:27', '16:52', '17:17', '17:42', '18:07', '18:32', '18:57', '19:27', '19:57', '20:27', '20:57', '21:27', '21:57', '22:27', '22:57'],
    weekendTimes: ['07:12', '07:42', '08:12', '08:42', '09:12', '09:42', '10:12', '10:42', '11:12', '11:42', '12:12', '12:42', '13:12', '13:42', '14:12', '14:42', '15:12', '15:42', '16:12', '16:42', '17:12', '17:42', '18:12', '18:42', '19:12', '19:42', '20:12', '20:42', '21:12', '21:42', '22:12', '22:42', '23:12'],
    frequency: 'Every 15-25 min',
    direction: 'toward-harmonie',
  },
  // Europaplatz/Bildungscampus West schedules (ordered: 5, 12, 31, 32, 33, 42)
  {
    stopId: 'europaplatz-west',
    busLine: '5',
    weekdayTimes: ['06:15', '06:45', '07:15', '07:45', '08:15', '08:45', '09:15', '09:45', '10:15', '10:45', '11:15', '11:45', '12:15', '12:45', '13:15', '13:45', '14:15', '14:45', '15:15', '15:45', '16:15', '16:45', '17:15', '17:45', '18:15', '18:45', '19:15', '19:45', '20:15', '20:45', '21:15', '21:45', '22:15', '22:45', '23:15'],
    weekendTimes: ['07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00', '22:30', '23:00', '23:30'],
    frequency: 'Every 30 min',
    direction: 'opposite',
  },
  {
    stopId: 'europaplatz-west',
    busLine: '12',
    weekdayTimes: ['06:15', '06:30', '06:45', '07:00', '07:15', '07:30', '07:45', '08:00', '08:15', '08:30', '08:45', '09:00', '09:20', '09:40', '10:00', '10:20', '10:40', '11:00', '11:20', '11:40', '12:00', '12:20', '12:40', '13:00', '13:20', '13:40', '14:00', '14:20', '14:40', '15:00', '15:15', '15:30', '15:45', '16:00', '16:15', '16:30', '16:45', '17:00', '17:15', '17:30', '17:45', '18:00', '18:20', '18:40', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00', '22:30', '23:00'],
    weekendTimes: ['07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00', '22:30', '23:00'],
    frequency: 'Every 10-20 min',
    direction: 'toward-harmonie',
  },
  {
    stopId: 'europaplatz-west',
    busLine: '31',
    weekdayTimes: ['06:20', '06:40', '07:00', '07:20', '07:40', '08:00', '08:20', '08:40', '09:00', '09:25', '09:50', '10:15', '10:40', '11:05', '11:30', '11:55', '12:20', '12:45', '13:10', '13:35', '14:00', '14:25', '14:50', '15:15', '15:40', '16:05', '16:30', '16:55', '17:20', '17:45', '18:10', '18:35', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00', '22:30', '23:00'],
    weekendTimes: ['07:15', '07:45', '08:15', '08:45', '09:15', '09:45', '10:15', '10:45', '11:15', '11:45', '12:15', '12:45', '13:15', '13:45', '14:15', '14:45', '15:15', '15:45', '16:15', '16:45', '17:15', '17:45', '18:15', '18:45', '19:15', '19:45', '20:15', '20:45', '21:15', '21:45', '22:15', '22:45', '23:15'],
    frequency: 'Every 15-25 min',
    direction: 'toward-harmonie',
  },
  {
    stopId: 'europaplatz-west',
    busLine: '32',
    weekdayTimes: ['06:05', '06:35', '07:05', '07:35', '08:05', '08:35', '09:05', '09:35', '10:05', '10:35', '11:05', '11:35', '12:05', '12:35', '13:05', '13:35', '14:05', '14:35', '15:05', '15:35', '16:05', '16:35', '17:05', '17:35', '18:05', '18:35', '19:05', '19:35', '20:05', '20:35', '21:05', '21:35', '22:05', '22:35', '23:05'],
    weekendTimes: ['07:15', '07:45', '08:15', '08:45', '09:15', '09:45', '10:15', '10:45', '11:15', '11:45', '12:15', '12:45', '13:15', '13:45', '14:15', '14:45', '15:15', '15:45', '16:15', '16:45', '17:15', '17:45', '18:15', '18:45', '19:15', '19:45', '20:15', '20:45', '21:15', '21:45', '22:15', '22:45', '23:15'],
    frequency: 'Every 30 min',
    direction: 'toward-harmonie',
  },
  {
    stopId: 'europaplatz-west',
    busLine: '33',
    weekdayTimes: ['06:22', '06:47', '07:12', '07:37', '08:02', '08:27', '08:52', '09:17', '09:42', '10:07', '10:32', '10:57', '11:22', '11:47', '12:12', '12:37', '13:02', '13:27', '13:52', '14:17', '14:42', '15:07', '15:32', '15:57', '16:22', '16:47', '17:12', '17:37', '18:02', '18:27', '18:52', '19:22', '19:52', '20:22', '20:52', '21:22', '21:52', '22:22', '22:52'],
    weekendTimes: ['07:07', '07:37', '08:07', '08:37', '09:07', '09:37', '10:07', '10:37', '11:07', '11:37', '12:07', '12:37', '13:07', '13:37', '14:07', '14:37', '15:07', '15:37', '16:07', '16:37', '17:07', '17:37', '18:07', '18:37', '19:07', '19:37', '20:07', '20:37', '21:07', '21:37', '22:07', '22:37', '23:07'],
    frequency: 'Every 25 min',
    direction: 'toward-harmonie',
  },
  {
    stopId: 'europaplatz-west',
    busLine: '42',
    weekdayTimes: ['06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00', '22:30', '23:00'],
    weekendTimes: ['07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00', '22:30', '23:00'],
    frequency: 'Every 30 min',
    direction: 'toward-harmonie',
  },
  // Industrieplatz Ost schedules (ordered: 5, 12, 31, 32, 41, 42)
  {
    stopId: 'industrieplatz-ost',
    busLine: '5',
    weekdayTimes: ['06:13', '06:38', '07:03', '07:28', '07:53', '08:18', '08:43', '09:08', '09:33', '09:58', '10:23', '10:48', '11:13', '11:38', '12:03', '12:28', '12:53', '13:18', '13:43', '14:08', '14:33', '14:58', '15:23', '15:48', '16:13', '16:38', '17:03', '17:28', '17:53', '18:18', '18:43', '19:08', '19:38', '20:08', '20:38', '21:08', '21:38', '22:08', '22:38', '23:08'],
    weekendTimes: ['07:23', '07:53', '08:23', '08:53', '09:23', '09:53', '10:23', '10:53', '11:23', '11:53', '12:23', '12:53', '13:23', '13:53', '14:23', '14:53', '15:23', '15:53', '16:23', '16:53', '17:23', '17:53', '18:23', '18:53', '19:23', '19:53', '20:23', '20:53', '21:23', '21:53', '22:23', '22:53', '23:23'],
    frequency: 'Every 25 min',
    direction: 'toward-harmonie',
  },
  {
    stopId: 'industrieplatz-ost',
    busLine: '12',
    weekdayTimes: ['06:15', '06:30', '06:45', '07:00', '07:15', '07:30', '07:45', '08:00', '08:15', '08:30', '08:45', '09:00', '09:20', '09:40', '10:00', '10:20', '10:40', '11:00', '11:20', '11:40', '12:00', '12:20', '12:40', '13:00', '13:20', '13:40', '14:00', '14:20', '14:40', '15:00', '15:15', '15:30', '15:45', '16:00', '16:15', '16:30', '16:45', '17:00', '17:15', '17:30', '17:45', '18:00', '18:20', '18:40', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00', '22:30', '23:00'],
    weekendTimes: ['07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00', '22:30', '23:00'],
    frequency: 'Every 10-20 min',
    direction: 'opposite',
  },
  {
    stopId: 'industrieplatz-ost',
    busLine: '31',
    weekdayTimes: ['06:20', '06:40', '07:00', '07:20', '07:40', '08:00', '08:20', '08:40', '09:00', '09:25', '09:50', '10:15', '10:40', '11:05', '11:30', '11:55', '12:20', '12:45', '13:10', '13:35', '14:00', '14:25', '14:50', '15:15', '15:40', '16:05', '16:30', '16:55', '17:20', '17:45', '18:10', '18:35', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00', '22:30', '23:00'],
    weekendTimes: ['07:15', '07:45', '08:15', '08:45', '09:15', '09:45', '10:15', '10:45', '11:15', '11:45', '12:15', '12:45', '13:15', '13:45', '14:15', '14:45', '15:15', '15:45', '16:15', '16:45', '17:15', '17:45', '18:15', '18:45', '19:15', '19:45', '20:15', '20:45', '21:15', '21:45', '22:15', '22:45', '23:15'],
    frequency: 'Every 15-25 min',
    direction: 'opposite',
  },
  {
    stopId: 'industrieplatz-ost',
    busLine: '32',
    weekdayTimes: ['06:10', '06:35', '07:00', '07:25', '07:50', '08:15', '08:40', '09:05', '09:30', '09:55', '10:20', '10:45', '11:10', '11:35', '12:00', '12:25', '12:50', '13:15', '13:40', '14:05', '14:30', '14:55', '15:20', '15:45', '16:10', '16:35', '17:00', '17:25', '17:50', '18:15', '18:40', '19:05', '19:35', '20:05', '20:35', '21:05', '21:35', '22:05', '22:35', '23:05'],
    weekendTimes: ['07:20', '07:50', '08:20', '08:50', '09:20', '09:50', '10:20', '10:50', '11:20', '11:50', '12:20', '12:50', '13:20', '13:50', '14:20', '14:50', '15:20', '15:50', '16:20', '16:50', '17:20', '17:50', '18:20', '18:50', '19:20', '19:50', '20:20', '20:50', '21:20', '21:50', '22:20', '22:50', '23:20'],
    frequency: 'Every 25 min',
    direction: 'opposite',
  },
  {
    stopId: 'industrieplatz-ost',
    busLine: '41',
    weekdayTimes: ['06:12', '06:42', '07:12', '07:42', '08:12', '08:42', '09:12', '09:42', '10:12', '10:42', '11:12', '11:42', '12:12', '12:42', '13:12', '13:42', '14:12', '14:42', '15:12', '15:42', '16:12', '16:42', '17:12', '17:42', '18:12', '18:42', '19:12', '19:42', '20:12', '20:42', '21:12', '21:42', '22:12', '22:42', '23:12'],
    weekendTimes: ['07:25', '07:55', '08:25', '08:55', '09:25', '09:55', '10:25', '10:55', '11:25', '11:55', '12:25', '12:55', '13:25', '13:55', '14:25', '14:55', '15:25', '15:55', '16:25', '16:55', '17:25', '17:55', '18:25', '18:55', '19:25', '19:55', '20:25', '20:55', '21:25', '21:55', '22:25', '22:55', '23:25'],
    frequency: 'Every 30 min',
    direction: 'toward-harmonie',
  },
  {
    stopId: 'industrieplatz-ost',
    busLine: '42',
    weekdayTimes: ['06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00', '22:30', '23:00'],
    weekendTimes: ['07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00', '22:30', '23:00'],
    frequency: 'Every 30 min',
    direction: 'opposite',
  },
];

/**
 * Converts time string (HH:MM) to Date object for today
 */
function timeStringToDate(timeString: string, date: Date = new Date()): Date {
  const [hours, minutes] = timeString.split(':').map(Number);
  const result = new Date(date);
  result.setHours(hours, minutes, 0, 0);
  return result;
}

/**
 * Checks if a date is a weekend (Saturday or Sunday)
 */
function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

/**
 * Gets the next arrivals for a specific bus stop
 */
export function getNextArrivals(stopId: string, limit: number = 5): NextArrival[] {
  const now = new Date();
  const isWeekendDay = isWeekend(now);
  const arrivals: NextArrival[] = [];

  // Get all schedules for this stop
  const stopSchedules = BUS_SCHEDULES.filter((schedule) => schedule.stopId === stopId);

  for (const schedule of stopSchedules) {
    const times = isWeekendDay ? schedule.weekendTimes : schedule.weekdayTimes;

    for (const timeStr of times) {
      let arrivalTime = timeStringToDate(timeStr, now);

      // If the time has passed today, check tomorrow
      if (arrivalTime < now) {
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        arrivalTime = timeStringToDate(timeStr, tomorrow);
      }

      const minutesUntil = Math.round((arrivalTime.getTime() - now.getTime()) / (1000 * 60));
      const isToday = arrivalTime.toDateString() === now.toDateString();

      arrivals.push({
        busLine: schedule.busLine,
        arrivalTime,
        minutesUntil,
        isToday,
        direction: schedule.direction,
      });
    }
  }

  // Sort by arrival time and take the next N
  return arrivals
    .sort((a, b) => a.arrivalTime.getTime() - b.arrivalTime.getTime())
    .slice(0, limit);
}

/**
 * Gets the next arrival for a specific bus line at a stop
 */
export function getNextArrivalForLine(stopId: string, busLine: string): NextArrival | null {
  const arrivals = getNextArrivals(stopId, 10);
  return arrivals.find((arrival) => arrival.busLine === busLine) || null;
}

/**
 * Formats arrival time for display
 */
export function formatArrivalTime(arrival: NextArrival): string {
  if (arrival.minutesUntil < 0) {
    return 'Departed';
  }
  if (arrival.minutesUntil === 0) {
    return 'Arriving now';
  }
  if (arrival.minutesUntil < 60) {
    return `${arrival.minutesUntil} min`;
  }
  
  const hours = Math.floor(arrival.minutesUntil / 60);
  const minutes = arrival.minutesUntil % 60;
  if (minutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${minutes}m`;
}

/**
 * Gets schedule frequency for a bus line at a stop
 */
export function getScheduleFrequency(stopId: string, busLine: string): string | undefined {
  const schedule = BUS_SCHEDULES.find(
    (s) => s.stopId === stopId && s.busLine === busLine
  );
  return schedule?.frequency;
}

