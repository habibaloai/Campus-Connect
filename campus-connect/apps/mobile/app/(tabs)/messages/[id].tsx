import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  AppState,
  ImageBackground,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Send, User, ChevronLeft, Users } from 'lucide-react-native';
import { useColorScheme } from '@/components/useColorScheme';
import { useAuth } from '@/providers';
import { api, supabase } from '@/lib/supabase';

interface Message {
  id: string;
  conversation_id: string;
  content: string;
  sender_id: string;
  created_at: string;
  read: boolean;
  status?: 'sent' | 'delivered' | 'read';
  read_at?: string;
  sender?: {
    id: string;
    name: string;
    avatar_url?: string;
  };
}

interface Conversation {
  id: string;
  type: 'direct' | 'group';
  name?: string;
  participants: Array<{
    id: string;
    name: string;
    avatar_url?: string;
  }>;
}

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [isOnline, setIsOnline] = useState<boolean>(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const scrollViewRef = useRef<ScrollView>(null);
  const presenceChannelRef = useRef<any>(null);
  const presenceSubscriptionRef = useRef<any>(null);
  const typingChannelRef = useRef<any>(null);
  const typingSubscriptionRef = useRef<any>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const currentUserId = user?.id;

  // Fetch conversation details and messages
  const fetchData = useCallback(async () => {
    if (!id || !currentUserId) return;

    try {
      // Fetch messages
      const { data: messagesData, error: messagesError } = await api.getMessages(id);
      
      if (messagesError) {
        console.error('Error fetching messages:', messagesError);
      } else {
        setMessages(messagesData || []);
      }

      // Fetch conversation details for header
      const { data: convData } = await supabase
        .from('conversations')
        .select('id, type, name')
        .eq('id', id)
        .single();

      if (convData) {
        // Get participants
        const { data: participants } = await supabase
          .from('conversation_participants')
          .select('user:profiles(id, name, avatar_url)')
          .eq('conversation_id', id);

        setConversation({
          ...convData,
          participants: participants?.map((p: any) => p.user) || [],
        });
      }

      // Mark messages as read
      await api.markMessagesAsRead(id, currentUserId);
    } catch (err) {
      console.error('Error fetching chat data:', err);
    } finally {
      setLoading(false);
    }
  }, [id, currentUserId]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Subscribe to new messages (real-time)
  useEffect(() => {
    if (!id || !currentUserId) return;

    const channel = api.subscribeToMessages(id, async (newMessage) => {
      setMessages((prev) => {
        // Avoid duplicates
        if (prev.some((m) => m.id === newMessage.id)) return prev;
        return [...prev, newMessage];
      });
      
      // If message is from another user (incoming message)
      if (newMessage.sender_id !== currentUserId) {
        // Update sender's message status to 'delivered' (so sender can see it)
        // This will trigger a real-time update for the sender
        await api.updateMessageStatus(newMessage.id, 'delivered');
        // Mark conversation messages as read
        await api.markMessagesAsRead(id, currentUserId);
      }
    });

    return () => {
      api.unsubscribeFromMessages(id);
    };
  }, [id, currentUserId]);

  // Subscribe to message status updates
  useEffect(() => {
    if (!id) return;

    const statusChannel = api.subscribeToMessageStatus(id, (messageId, status) => {
      setMessages((prev) =>
        prev.map((msg) => (msg.id === messageId ? { ...msg, status: status as 'sent' | 'delivered' | 'read' } : msg))
      );
    });

    return () => {
      api.unsubscribeFromMessageStatus(statusChannel);
    };
  }, [id]);

  // Update message status to 'delivered' when recipient receives message
  // This will be handled by the real-time subscription on the recipient's device

  // Scroll to bottom when messages change
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  // Track presence and subscribe to online status
  useEffect(() => {
    if (!id || !currentUserId) return;

    // Track our own presence
    const presenceChannel = api.trackPresence(id, currentUserId);
    presenceChannelRef.current = presenceChannel;

    // Subscribe to other participants' presence (only for direct conversations)
    if (conversation?.type === 'direct') {
      const otherParticipant = getOtherParticipant();
      if (otherParticipant) {
        const subscriptionChannel = api.subscribeToPresence(id, (userId, online) => {
          if (userId === otherParticipant.id) {
            setIsOnline(online);
          }
        });
        presenceSubscriptionRef.current = subscriptionChannel;
      }
    }

    // Cleanup on unmount
    return () => {
      if (presenceChannelRef.current) {
        api.leavePresence(presenceChannelRef.current);
        presenceChannelRef.current = null;
      }
      if (presenceSubscriptionRef.current) {
        supabase.removeChannel(presenceSubscriptionRef.current);
        presenceSubscriptionRef.current = null;
      }
    };
  }, [id, currentUserId, conversation]);

  // Handle app state changes (foreground/background)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        // Leave presence when app goes to background
        if (presenceChannelRef.current) {
          api.leavePresence(presenceChannelRef.current);
        }
      } else if (nextAppState === 'active') {
        // Rejoin presence when app becomes active
        if (id && currentUserId) {
          const presenceChannel = api.trackPresence(id, currentUserId);
          presenceChannelRef.current = presenceChannel;
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, [id, currentUserId]);

  // Typing indicator subscription
  useEffect(() => {
    if (!id || !currentUserId) return;

    // Create typing channel for sending and subscribe to it
    const typingChannel = supabase.channel(`typing:${id}`);
    typingChannel.subscribe();
    typingChannelRef.current = typingChannel;

    // Subscribe to typing indicators from others
    const subscriptionChannel = api.subscribeToTyping(id, (userId, isTyping) => {
      // Don't show typing indicator for current user
      if (userId === currentUserId) return;

      setTypingUsers((prev) => {
        if (isTyping) {
          return prev.includes(userId) ? prev : [...prev, userId];
        } else {
          return prev.filter((id) => id !== userId);
        }
      });
    });

    typingSubscriptionRef.current = subscriptionChannel;

    return () => {
      api.unsubscribeFromTyping(subscriptionChannel);
      if (typingChannelRef.current) {
        supabase.removeChannel(typingChannelRef.current);
        typingChannelRef.current = null;
      }
      typingSubscriptionRef.current = null;
    };
  }, [id, currentUserId]);

  // Auto-hide typing indicator after 3 seconds
  useEffect(() => {
    if (typingUsers.length > 0) {
      const timeout = setTimeout(() => {
        setTypingUsers([]);
      }, 3000);

      return () => clearTimeout(timeout);
    }
  }, [typingUsers]);

  // Send typing indicator when user types
  const handleTyping = useCallback(() => {
    if (!id || !currentUserId || !typingChannelRef.current) return;

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Send typing indicator via the channel
    typingChannelRef.current.send({
      type: 'broadcast',
      event: 'typing',
      payload: { user_id: currentUserId, is_typing: true },
    });

    // Clear typing indicator after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      if (typingChannelRef.current) {
        typingChannelRef.current.send({
          type: 'broadcast',
          event: 'typing',
          payload: { user_id: currentUserId, is_typing: false },
        });
      }
    }, 2000);
  }, [id, currentUserId]);

  // Send message
  const sendMessage = async () => {
    if (!messageText.trim() || !id || !currentUserId || sending) return;

    // Stop typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    if (typingChannelRef.current) {
      typingChannelRef.current.send({
        type: 'broadcast',
        event: 'typing',
        payload: { user_id: currentUserId, is_typing: false },
      });
    }

    setSending(true);
    const content = messageText.trim();
    setMessageText('');

    try {
      const { data, error } = await api.sendMessage(id, currentUserId, content);
      
      if (error) {
        console.error('Error sending message:', error);
        setMessageText(content); // Restore message on error
      } else if (data) {
        // Add to local state (real-time subscription should also handle this)
        setMessages((prev) => {
          if (prev.some((m) => m.id === data.id)) return prev;
          return [...prev, data];
        });
      }
    } catch (err) {
      console.error('Error:', err);
      setMessageText(content);
    } finally {
      setSending(false);
    }
  };

  // Get conversation title and other participant
  const getOtherParticipant = () => {
    if (!conversation) return null;
    return conversation.participants.find((p) => p.id !== currentUserId);
  };

  const getTitle = () => {
    if (!conversation) return 'Chat';
    if (conversation.type === 'group' && conversation.name) {
      return conversation.name;
    }
    const otherParticipant = getOtherParticipant();
    return otherParticipant?.name || 'Chat';
  };

  // Format time
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  // Group messages by date
  const groupMessagesByDate = (msgs: Message[]) => {
    const groups: { date: string; messages: Message[] }[] = [];
    let currentDate = '';

    msgs.forEach((msg) => {
      const msgDate = new Date(msg.created_at).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      });

      if (msgDate !== currentDate) {
        currentDate = msgDate;
        groups.push({ date: msgDate, messages: [msg] });
      } else {
        groups[groups.length - 1].messages.push(msg);
      }
    });

    return groups;
  };

  const messageGroups = groupMessagesByDate(messages);

  // Use splash screen image as background (same as other tabs)
  const backgroundSource = require('@/assets/images/splash-screen.png');

  if (loading) {
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
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0066cc" />
            <Text style={[styles.loadingText, { color: isDark ? '#ffffff' : '#1e293b' }]}>Loading messages...</Text>
          </View>
        </SafeAreaView>
      </ImageBackground>
    );
  }

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
      <SafeAreaView style={styles.safeArea} edges={[]}>
        <StatusBar style={isDark ? "light" : "dark"} />
      <Stack.Screen
        options={{
          title: '',
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => router.back()} 
              className="p-2"
            >
              <ChevronLeft size={24} color={isDark ? '#FFFFFF' : '#374151'} />
            </TouchableOpacity>
          ),
          headerTitle: () => (
            <View className="flex-row items-center">
              <Text className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {getTitle()}
              </Text>
              {conversation?.type === 'direct' && (
                <View className="ml-2 flex-row items-center">
                  <View
                    className={`w-2 h-2 rounded-full ${
                      isOnline ? 'bg-green-500' : 'bg-gray-400'
                    }`}
                    style={{
                      shadowColor: isOnline ? '#10b981' : '#9ca3af',
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: 0.8,
                      shadowRadius: 4,
                    }}
                  />
                  <Text className={`text-xs ml-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {isOnline ? 'Online' : 'Offline'}
                  </Text>
                </View>
              )}
            </View>
          ),
        }}
      />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
        keyboardVerticalOffset={90}
      >
        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          className="flex-1 px-4"
          contentContainerStyle={{ paddingVertical: 16 }}
          showsVerticalScrollIndicator={false}
        >
          {messages.length === 0 ? (
            <View className="items-center justify-center py-12">
              <Text className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                No messages yet. Start the conversation!
              </Text>
            </View>
          ) : (
            messageGroups.map((group) => (
              <View key={group.date}>
                {/* Date separator */}
                <View className="items-center my-4">
                  <LinearGradient
                    colors={isDark
                      ? ['rgba(0, 102, 204, 0.25)', 'rgba(0, 102, 204, 0.15)']
                      : ['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.85)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 20,
                    }}
                  >
                    <Text className={`text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      {group.date}
                    </Text>
                  </LinearGradient>
                </View>

                {/* Messages for this date */}
                {group.messages.map((message) => {
                  const isOwnMessage = message.sender_id === currentUserId;
                  return (
                    <View
                      key={message.id}
                      className={`mb-3 ${isOwnMessage ? 'items-end' : 'items-start'}`}
                    >
                      {/* Sender name for group chats */}
                      {!isOwnMessage && conversation?.type === 'group' && message.sender?.name && (
                        <Text className={`text-xs mb-1 ml-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {message.sender.name}
                        </Text>
                      )}
                      
                      {isOwnMessage ? (
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
                        </LinearGradient>
                      ) : (
                        <View
                          className={`max-w-[80%] px-4 py-3 rounded-2xl rounded-bl-sm ${
                            isDark
                              ? 'bg-gray-800/90'
                              : 'bg-white/90'
                          }`}
                          style={{
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
                        </View>
                      )}
                      <View className={`flex-row items-center ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                        <Text
                          className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}
                        >
                          {formatTime(message.created_at)}
                        </Text>
                        {/* Message status for outgoing messages */}
                        {isOwnMessage && message.status && (
                          <Text
                            className={`text-xs mt-1 ml-2 ${
                              isDark ? 'text-gray-500' : 'text-gray-400'
                            }`}
                          >
                            {message.status === 'read'
                              ? 'Read'
                              : message.status === 'delivered'
                              ? 'Delivered'
                              : 'Sent'}
                          </Text>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            ))
          )}

          {/* Typing Indicator */}
          {typingUsers.length > 0 && (
            <View className="flex-row items-center mb-2 px-2">
              <LinearGradient
                colors={isDark
                  ? ['rgba(0, 102, 204, 0.25)', 'rgba(0, 102, 204, 0.15)']
                  : ['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.85)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 16,
                  borderBottomLeftRadius: 4,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 3,
                }}
              >
                <Text className={`italic text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  {typingUsers.length === 1 && conversation?.type === 'direct'
                    ? 'typing...'
                    : 'Someone is typing...'}
                </Text>
              </LinearGradient>
            </View>
          )}
        </ScrollView>

        {/* Message Input */}
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
              className={`flex-1 max-h-24 px-4 py-3 rounded-2xl ${
                isDark ? 'bg-gray-800/90 text-white' : 'bg-white/90 text-gray-900'
              }`}
              placeholder="Type a message..."
              placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
              value={messageText}
              onChangeText={(text) => {
                setMessageText(text);
                handleTyping();
              }}
              multiline
              textAlignVertical="center"
              editable={!sending}
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
              }}
            />
            <TouchableOpacity
              onPress={sendMessage}
              disabled={!messageText.trim() || sending}
              className={`ml-2 w-12 h-12 rounded-full items-center justify-center ${
                messageText.trim() && !sending ? 'bg-blue-500' : isDark ? 'bg-gray-800' : 'bg-gray-200'
              }`}
              activeOpacity={0.8}
              style={{
                shadowColor: messageText.trim() && !sending ? '#3b82f6' : '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
                elevation: 3,
              }}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Send
                  size={20}
                  color={messageText.trim() ? '#ffffff' : isDark ? '#6b7280' : '#9ca3af'}
                />
              )}
            </TouchableOpacity>
          </View>
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
    ...StyleSheet.absoluteFillObject,
  },
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
});
