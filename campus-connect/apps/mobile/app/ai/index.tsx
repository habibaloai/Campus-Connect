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
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
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
    <View className="flex-1 bg-gray-50">
      <Stack.Screen
        options={{
          title: 'AI Assistant',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} className="p-2">
              <ChevronLeft size={24} color="#374151" />
            </TouchableOpacity>
          ),
        }}
      />

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={100}
      >
        <ScrollView
          ref={scrollViewRef}
          className="flex-1 px-4"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
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
                <View className="w-8 h-8 rounded-full bg-purple-100 items-center justify-center mr-2 mt-1">
                  <Bot size={18} color="#7C3AED" />
                </View>
              )}
              <View
                className={`max-w-[80%] rounded-2xl p-4 ${message.role === 'user'
                    ? 'bg-blue-500 rounded-br-sm'
                    : 'bg-white shadow-sm rounded-bl-sm'
                  }`}
              >
                <Text
                  className={`text-base ${message.role === 'user' ? 'text-white' : 'text-gray-800'
                    }`}
                >
                  {message.content}
                </Text>
                <Text
                  className={`text-xs mt-2 ${message.role === 'user' ? 'text-white/60' : 'text-gray-400'
                    }`}
                >
                  {message.timestamp.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
              {message.role === 'user' && (
                <View className="w-8 h-8 rounded-full bg-blue-100 items-center justify-center ml-2 mt-1">
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
              <View className="w-8 h-8 rounded-full bg-purple-100 items-center justify-center mr-2">
                <Bot size={18} color="#7C3AED" />
              </View>
              <View className="bg-white rounded-2xl rounded-bl-sm p-4 shadow-sm">
                <View className="flex-row items-center">
                  <ActivityIndicator size="small" color="#7C3AED" />
                  <Text className="text-gray-500 ml-2">Thinking...</Text>
                </View>
              </View>
            </Animated.View>
          )}

          {/* Suggested Questions (show only if few messages) */}
          {messages.length <= 2 && !isLoading && (
            <Animated.View entering={FadeInDown.duration(500).delay(200)} className="mt-4">
              <Text className="text-sm text-gray-500 mb-3">Try asking:</Text>
              {suggestedQuestions.map((question, index) => (
                <TouchableOpacity
                  key={index}
                  className="flex-row items-center bg-white rounded-xl p-4 mb-2 shadow-sm"
                  onPress={() => handleSuggestedQuestion(question.text)}
                >
                  <View className="w-10 h-10 rounded-full bg-purple-50 items-center justify-center mr-3">
                    <question.icon size={20} color="#7C3AED" />
                  </View>
                  <Text className="text-gray-700 flex-1">{question.text}</Text>
                  <Sparkles size={16} color="#D1D5DB" />
                </TouchableOpacity>
              ))}
            </Animated.View>
          )}
        </ScrollView>

        {/* Input Area */}
        <View className="px-4 py-3 bg-white border-t border-gray-100">
          <View className="flex-row items-end">
            <View className="flex-1 bg-gray-100 rounded-2xl px-4 py-3 mr-3 max-h-24">
              <TextInput
                className="text-base text-gray-800"
                placeholder="Ask me anything..."
                placeholderTextColor="#9CA3AF"
                value={inputText}
                onChangeText={setInputText}
                multiline
                maxLength={500}
                editable={!isLoading}
              />
            </View>
            <TouchableOpacity
              className={`w-12 h-12 rounded-full items-center justify-center ${inputText.trim() && !isLoading ? 'bg-purple-500' : 'bg-gray-200'
                }`}
              onPress={sendMessage}
              disabled={!inputText.trim() || isLoading}
            >
              <Send
                size={20}
                color={inputText.trim() && !isLoading ? '#FFFFFF' : '#9CA3AF'}
              />
            </TouchableOpacity>
          </View>
          <Text className="text-xs text-gray-400 text-center mt-2">
            AI responses are for guidance only. Verify important information.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}










