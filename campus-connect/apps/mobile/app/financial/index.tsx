import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
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

  return (
    <View className="flex-1 bg-gray-50">
      <Stack.Screen
        options={{
          title: 'Financial',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} className="p-2">
              <ChevronLeft size={24} color="#374151" />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3B82F6']} />
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
            <View className="flex-1 bg-white rounded-xl p-4 shadow-sm">
              <View className="flex-row items-center mb-2">
                <View className="w-8 h-8 rounded-full bg-blue-100 items-center justify-center">
                  <Wallet size={16} color="#3B82F6" />
                </View>
                <Text className="text-sm text-gray-500 ml-2">Campus Wallet</Text>
              </View>
              <Text className="text-2xl font-bold text-gray-800">{formatCurrency(campusWallet)}</Text>
              <TouchableOpacity className="mt-2">
                <Text className="text-blue-500 text-sm font-medium">Add Funds</Text>
              </TouchableOpacity>
            </View>

            <View className="flex-1 bg-white rounded-xl p-4 shadow-sm">
              <View className="flex-row items-center mb-2">
                <View className="w-8 h-8 rounded-full bg-orange-100 items-center justify-center">
                  <UtensilsCrossed size={16} color="#F97316" />
                </View>
                <Text className="text-sm text-gray-500 ml-2">Meal Plan</Text>
              </View>
              <Text className="text-2xl font-bold text-gray-800">{formatCurrency(mealPlanBalance)}</Text>
              <Text className="text-sm text-gray-400 mt-2">15 swipes left</Text>
            </View>
          </View>
        </Animated.View>

        {/* Recent Transactions */}
        <Animated.View entering={FadeInDown.duration(500).delay(200)} className="px-4 mt-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-semibold text-gray-800">Recent Transactions</Text>
            <TouchableOpacity>
              <Text className="text-blue-500 text-sm">View All</Text>
            </TouchableOpacity>
          </View>

          <View className="bg-white rounded-xl shadow-sm overflow-hidden">
            {mockTransactions.map((transaction, index) => (
              <TouchableOpacity
                key={transaction.id}
                className={`flex-row items-center p-4 ${
                  index !== mockTransactions.length - 1 ? 'border-b border-gray-100' : ''
                }`}
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
                  <Text className="text-base font-medium text-gray-800" numberOfLines={1}>
                    {transaction.description}
                  </Text>
                  <Text className="text-sm text-gray-500">{formatDate(transaction.date)}</Text>
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
          <Text className="text-lg font-semibold text-gray-800 mb-3">Quick Actions</Text>
          <View className="bg-white rounded-xl shadow-sm overflow-hidden">
            {[
              { icon: CreditCard, title: 'Payment Methods', subtitle: '2 cards saved' },
              { icon: Calendar, title: 'Payment Schedule', subtitle: 'Set up auto-pay' },
              { icon: DollarSign, title: 'Financial Aid', subtitle: 'Check status' },
            ].map((action, index) => (
              <TouchableOpacity
                key={action.title}
                className={`flex-row items-center p-4 ${index !== 2 ? 'border-b border-gray-100' : ''}`}
                activeOpacity={0.7}
              >
                <View className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center mr-3">
                  <action.icon size={20} color="#6B7280" />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-medium text-gray-800">{action.title}</Text>
                  <Text className="text-sm text-gray-500">{action.subtitle}</Text>
                </View>
                <ChevronRight size={20} color="#9CA3AF" />
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        <View className="h-8" />
      </ScrollView>
    </View>
  );
}










