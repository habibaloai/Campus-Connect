import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ImageBackground,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router, Stack } from 'expo-router';
import {
  ChevronLeft,
  DollarSign,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Calendar,
  ChevronRight,
  Wallet,
  UtensilsCrossed,
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useColorScheme } from '@/components/useColorScheme';

// Mock financial data
const mockTransactions = [
  {
    id: '1',
    type: 'payment',
    description: 'Tuition Payment - Spring 2024',
    amount: -12500,
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    category: 'tuition',
  },
  {
    id: '2',
    type: 'deposit',
    description: 'Financial Aid Credit',
    amount: 5000,
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    category: 'aid',
  },
  {
    id: '3',
    type: 'payment',
    description: 'Dining - Meal Plan',
    amount: -85.50,
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    category: 'dining',
  },
  {
    id: '4',
    type: 'payment',
    description: 'Bookstore Purchase',
    amount: -245.99,
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    category: 'books',
  },
  {
    id: '5',
    type: 'deposit',
    description: 'Campus Wallet Top-up',
    amount: 200,
    date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    category: 'wallet',
  },
];

export default function FinancialScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [refreshing, setRefreshing] = useState(false);

  // Mock balances
  const tuitionBalance = 7500;
  const campusWallet = 342.50;
  const mealPlanBalance = 485.75;
  const nextPaymentDue = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(Math.abs(amount));
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  // Use splash screen image as background (same as login page)
  const backgroundSource = require('@/assets/images/splash-screen.png');

  return (
    <ImageBackground
      source={backgroundSource}
      style={styles.background}
      resizeMode="cover"
    >
      {/* Blurred Background Overlay */}
      <View style={[styles.blurOverlay, { backgroundColor: isDark ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.1)' }]} />
      
      {/* Gradient Overlay */}
      <LinearGradient
        colors={isDark 
          ? ['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.3)']
          : ['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.05)']}
        style={styles.gradientOverlay}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />

      {/* Bottom gradient */}
      <LinearGradient
        colors={isDark
          ? ['rgba(17,17,16,0)', 'rgba(17,17,16,1)', 'rgba(17,17,16,1)']
          : ['rgba(0,0,0,0)', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.4)']}
        locations={[0, 0.4424, 1]}
        style={styles.bottomGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <StatusBar style={isDark ? "light" : "dark"} />
        <Stack.Screen
          options={{
            title: 'Financial',
            headerTransparent: true,
            headerTitleStyle: { color: isDark ? '#ffffff' : '#1e293b' },
            headerLeft: () => (
              <TouchableOpacity onPress={() => router.back()} className="p-2">
                <ChevronLeft size={24} color={isDark ? "#ffffff" : "#1e293b"} />
              </TouchableOpacity>
            ),
          }}
        />

        <ScrollView
          className="flex-1"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B82F6" />
          }
          showsVerticalScrollIndicator={false}
        >
        {/* Tuition Balance Card */}
        <Animated.View entering={FadeInDown.duration(500)} className="px-4 pt-4">
          <View className="bg-gradient-to-r from-green-500 to-emerald-600 bg-green-500 rounded-2xl p-5 shadow-lg">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-white/80 text-sm">Tuition Balance</Text>
              <View className="bg-white/20 rounded-full px-3 py-1">
                <Text className="text-white text-xs">Spring 2024</Text>
              </View>
            </View>
            <Text className="text-white text-4xl font-bold">{formatCurrency(tuitionBalance)}</Text>
            <View className="flex-row items-center mt-3 pt-3 border-t border-white/20">
              <Calendar size={14} color="#FFFFFF" />
              <Text className="text-white/80 text-sm ml-2">
                Next payment due: {formatDate(nextPaymentDue)}
              </Text>
            </View>
            <TouchableOpacity className="bg-white/20 rounded-xl py-3 mt-4 items-center">
              <Text className="text-white font-semibold">Make a Payment</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Quick Balance Cards */}
        <Animated.View entering={FadeInDown.duration(500).delay(100)} className="px-4 mt-4">
          <View className="flex-row gap-3">
            <View className="flex-1 rounded-xl p-4" style={{
              backgroundColor: isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: isDark ? 0.3 : 0.1,
              shadowRadius: 8,
              elevation: 4,
            }}>
              <View className="flex-row items-center mb-2">
                <View className="w-8 h-8 rounded-full items-center justify-center" style={{ backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(219, 234, 254, 0.8)' }}>
                  <Wallet size={16} color="#3B82F6" />
                </View>
                <Text className="text-sm ml-2" style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>Campus Wallet</Text>
              </View>
              <Text className="text-2xl font-bold" style={{ color: isDark ? '#ffffff' : '#1e293b' }}>{formatCurrency(campusWallet)}</Text>
              <TouchableOpacity className="mt-2">
                <Text className="text-sm font-medium" style={{ color: '#3b82f6' }}>Add Funds</Text>
              </TouchableOpacity>
            </View>

            <View className="flex-1 rounded-xl p-4" style={{
              backgroundColor: isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: isDark ? 0.3 : 0.1,
              shadowRadius: 8,
              elevation: 4,
            }}>
              <View className="flex-row items-center mb-2">
                <View className="w-8 h-8 rounded-full items-center justify-center" style={{ backgroundColor: isDark ? 'rgba(249, 115, 22, 0.2)' : 'rgba(255, 237, 213, 0.8)' }}>
                  <UtensilsCrossed size={16} color="#F97316" />
                </View>
                <Text className="text-sm ml-2" style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>Meal Plan</Text>
              </View>
              <Text className="text-2xl font-bold" style={{ color: isDark ? '#ffffff' : '#1e293b' }}>{formatCurrency(mealPlanBalance)}</Text>
              <Text className="text-sm mt-2" style={{ color: isDark ? '#6b7280' : '#9ca3af' }}>15 swipes left</Text>
            </View>
          </View>
        </Animated.View>

        {/* Recent Transactions */}
        <Animated.View entering={FadeInDown.duration(500).delay(200)} className="px-4 mt-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-semibold" style={{ color: isDark ? '#ffffff' : '#1e293b' }}>Recent Transactions</Text>
            <TouchableOpacity>
              <Text className="text-sm" style={{ color: '#3b82f6' }}>View All</Text>
            </TouchableOpacity>
          </View>

          <View className="rounded-xl overflow-hidden" style={{
            backgroundColor: isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: isDark ? 0.3 : 0.1,
            shadowRadius: 8,
            elevation: 4,
          }}>
            {mockTransactions.map((transaction, index) => (
              <TouchableOpacity
                key={transaction.id}
                className="flex-row items-center p-4"
                style={{
                  borderBottomWidth: index !== mockTransactions.length - 1 ? 1 : 0,
                  borderBottomColor: isDark ? '#374151' : '#e5e7eb',
                }}
                activeOpacity={0.7}
              >
                <View
                  className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
                    transaction.amount > 0 ? 'bg-green-100' : 'bg-red-100'
                  }`}
                >
                  {transaction.amount > 0 ? (
                    <TrendingUp size={20} color="#10B981" />
                  ) : (
                    <TrendingDown size={20} color="#EF4444" />
                  )}
                </View>
                <View className="flex-1">
                  <Text className="text-base font-medium" style={{ color: isDark ? '#ffffff' : '#1e293b' }} numberOfLines={1}>
                    {transaction.description}
                  </Text>
                  <Text className="text-sm" style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>{formatDate(transaction.date)}</Text>
                </View>
                <Text
                  className={`text-base font-semibold ${
                    transaction.amount > 0 ? 'text-green-500' : 'text-red-500'
                  }`}
                >
                  {transaction.amount > 0 ? '+' : '-'}{formatCurrency(transaction.amount)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Quick Actions */}
        <Animated.View entering={FadeInDown.duration(500).delay(300)} className="px-4 mt-6 mb-6">
          <Text className="text-lg font-semibold mb-3" style={{ color: isDark ? '#ffffff' : '#1e293b' }}>Quick Actions</Text>
          <View className="rounded-xl overflow-hidden" style={{
            backgroundColor: isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: isDark ? 0.3 : 0.1,
            shadowRadius: 8,
            elevation: 4,
          }}>
            {[
              { icon: CreditCard, title: 'Payment Methods', subtitle: '2 cards saved' },
              { icon: Calendar, title: 'Payment Schedule', subtitle: 'Set up auto-pay' },
              { icon: DollarSign, title: 'Financial Aid', subtitle: 'Check status' },
            ].map((action, index) => (
              <TouchableOpacity
                key={action.title}
                className="flex-row items-center p-4"
                style={{
                  borderBottomWidth: index !== 2 ? 1 : 0,
                  borderBottomColor: isDark ? '#374151' : '#e5e7eb',
                }}
                activeOpacity={0.7}
              >
                <View className="w-10 h-10 rounded-full items-center justify-center mr-3" style={{ backgroundColor: isDark ? '#374151' : '#f3f4f6' }}>
                  <action.icon size={20} color={isDark ? "#9ca3af" : "#6B7280"} />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-medium" style={{ color: isDark ? '#ffffff' : '#1e293b' }}>{action.title}</Text>
                  <Text className="text-sm" style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>{action.subtitle}</Text>
                </View>
                <ChevronRight size={20} color={isDark ? "#9ca3af" : "#9CA3AF"} />
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        <View className="h-8" />
      </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  bottomGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  safeArea: {
    flex: 1,
  },
});










