import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ImageBackground,
  StyleSheet,
} from 'react-native';
import { router, Stack } from 'expo-router';
import {
  ChevronLeft,
  Send,
  Bot,
  User,
  Sparkles,
  BookOpen,
  Calendar,
  HelpCircle,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from '@/components/useColorScheme';
import { useAuth } from '@/providers';
import { aiService } from '@/lib/ai-service';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const suggestedQuestions = [
  { icon: BookOpen, text: 'Help me study for my CS exam' },
  { icon: Calendar, text: 'What events are happening this week?' },
  { icon: HelpCircle, text: 'How do I drop a class?' },
];

export default function AIScreen() {
  const { profile } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const backgroundSource = require('@/assets/images/splash-screen.png');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hi ${profile?.name?.split(' ')[0] || 'there'}! 👋 I'm your Campus Connect AI assistant. I can help you with:\n\n• Study tips and academic questions\n• Campus information and resources\n• Event recommendations\n• General questions about university life\n\nHow can I help you today?`,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    // Call AI API
    try {
      const response = await aiService.sendMessageToBot(inputText.trim());

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.error
          ? "I'm having trouble connecting to the server right now. Please try again later."
          : response.reply,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Sorry, something went wrong. Please check your internet connection.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    setInputText(question);
  };

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
      
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <StatusBar style={isDark ? "light" : "dark"} />
        <Stack.Screen
          options={{
            headerShown: false,
          }}
        />

        {/* Header with Title and Back Button */}
        <View className="flex-row items-center px-4 py-3">
          <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
            <ChevronLeft size={24} color={isDark ? '#FFFFFF' : '#374151'} />
          </TouchableOpacity>
          <Text className={`text-2xl font-bold flex-1 ml-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            AI Assistant
          </Text>
        </View>

        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
          style={{ flex: 1 }}
        >
          <ScrollView
            ref={scrollViewRef}
            className="flex-1 px-4"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20, paddingTop: 16 }}
          >
          {/* Messages */}
          {messages.map((message, index) => (
            <Animated.View
              key={message.id}
              entering={FadeInDown.duration(400).delay(index * 50)}
              className={`flex-row mb-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
            >
              {message.role === 'assistant' && (
                <View className="w-8 h-8 rounded-full items-center justify-center mr-2 mt-1" style={{ backgroundColor: isDark ? 'rgba(124, 58, 237, 0.2)' : 'rgba(124, 58, 237, 0.1)' }}>
                  <Bot size={18} color="#7C3AED" />
                </View>
              )}
              {message.role === 'user' ? (
                <LinearGradient
                  colors={['#3b82f6', '#2563eb']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    maxWidth: '80%',
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderRadius: 16,
                    borderBottomRightRadius: 4,
                  }}
                >
                  <Text className="text-base text-white">
                    {message.content}
                  </Text>
                  <Text className="text-xs mt-2 text-white/60">
                    {message.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </LinearGradient>
              ) : (
                <View
                  className="max-w-[80%] rounded-2xl rounded-bl-sm p-4"
                  style={{
                    backgroundColor: isDark ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 3,
                  }}
                >
                  <Text className={`text-base ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {message.content}
                  </Text>
                  <Text className={`text-xs mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {message.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
              )}
              {message.role === 'user' && (
                <View className="w-8 h-8 rounded-full items-center justify-center ml-2 mt-1" style={{ backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)' }}>
                  <User size={18} color="#3B82F6" />
                </View>
              )}
            </Animated.View>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <Animated.View
              entering={FadeInUp.duration(300)}
              className="flex-row items-center mb-4"
            >
              <View className="w-8 h-8 rounded-full items-center justify-center mr-2" style={{ backgroundColor: isDark ? 'rgba(124, 58, 237, 0.2)' : 'rgba(124, 58, 237, 0.1)' }}>
                <Bot size={18} color="#7C3AED" />
              </View>
              <LinearGradient
                colors={isDark
                  ? ['rgba(0, 102, 204, 0.25)', 'rgba(0, 102, 204, 0.15)']
                  : ['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.85)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderRadius: 16,
                  borderBottomLeftRadius: 4,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 3,
                }}
              >
                <View className="flex-row items-center">
                  <ActivityIndicator size="small" color="#7C3AED" />
                  <Text className={`ml-2 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Thinking...</Text>
                </View>
              </LinearGradient>
            </Animated.View>
          )}

          {/* Suggested Questions (show only if few messages) */}
          {messages.length <= 2 && !isLoading && (
            <Animated.View entering={FadeInDown.duration(500).delay(200)} className="mt-4">
              <Text className={`text-sm mb-3 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Try asking:</Text>
              {suggestedQuestions.map((question, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleSuggestedQuestion(question.text)}
                  activeOpacity={0.7}
                  style={{ marginBottom: 8 }}
                >
                  <LinearGradient
                    colors={isDark
                      ? ['rgba(0, 102, 204, 0.25)', 'rgba(0, 102, 204, 0.15)']
                      : ['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.85)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      padding: 16,
                      borderRadius: 16,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 4,
                      elevation: 3,
                    }}
                  >
                    <View className="w-10 h-10 rounded-full items-center justify-center mr-3" style={{ backgroundColor: isDark ? 'rgba(124, 58, 237, 0.2)' : 'rgba(124, 58, 237, 0.1)' }}>
                      <question.icon size={20} color="#7C3AED" />
                    </View>
                    <Text className={`flex-1 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{question.text}</Text>
                    <Sparkles size={16} color={isDark ? '#9ca3af' : '#D1D5DB'} />
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </Animated.View>
          )}
        </ScrollView>

          {/* Input Area */}
          <LinearGradient
            colors={isDark
              ? ['rgba(0, 102, 204, 0.25)', 'rgba(0, 102, 204, 0.15)']
              : ['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.85)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              paddingHorizontal: 16,
              paddingTop: 12,
              paddingBottom: 12,
              borderTopWidth: 1,
              borderTopColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
            }}
          >
            <View className="flex-row items-end">
              <TextInput
                className={`flex-1 max-h-24 px-4 py-3 rounded-2xl mr-2 ${
                  isDark ? 'bg-gray-800/90 text-white' : 'bg-white/90 text-gray-900'
                }`}
                placeholder="Ask me anything..."
                placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                value={inputText}
                onChangeText={setInputText}
                multiline
                maxLength={500}
                editable={!isLoading}
                textAlignVertical="center"
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 3,
                }}
              />
              <TouchableOpacity
                className={`w-12 h-12 rounded-full items-center justify-center ${
                  inputText.trim() && !isLoading ? 'bg-blue-500' : isDark ? 'bg-gray-800' : 'bg-gray-200'
                }`}
                onPress={sendMessage}
                disabled={!inputText.trim() || isLoading}
                activeOpacity={0.8}
                style={{
                  shadowColor: inputText.trim() && !isLoading ? '#3b82f6' : '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.2,
                  shadowRadius: 4,
                  elevation: 3,
                }}
              >
                <Send
                  size={20}
                  color={inputText.trim() && !isLoading ? '#FFFFFF' : isDark ? '#6b7280' : '#9CA3AF'}
                />
              </TouchableOpacity>
            </View>
            <Text className={`text-xs text-center mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              AI responses are for guidance only. Verify important information.
            </Text>
          </LinearGradient>
        </KeyboardAvoidingView>
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
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '60%',
  },
  safeArea: {
    flex: 1,
  },
});










