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
  Image,
} from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Send, User, ChevronLeft, Users, Camera, MoreVertical } from 'lucide-react-native';
import { useColorScheme } from '@/components/useColorScheme';
import { useAuth } from '@/providers';
import { api, supabase } from '@/lib/supabase';
import PageHeader from '@/components/ui/PageHeader';
import MessageBubble from '@/components/ui/MessageBubble';
import BackgroundImage from '@/components/BackgroundImage';

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
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    }, 2000) as any;
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

  if (loading) {
    return (
      <BackgroundImage overlayOpacity={isDark ? 0.7 : 0.4}>
        <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#0066cc" />
          <Text style={{ marginTop: 16, color: isDark ? '#94a3b8' : '#64748b' }}>Loading messages...</Text>
        </SafeAreaView>
      </BackgroundImage>
    );
  }

  const otherParticipant = getOtherParticipant();

  return (
    <BackgroundImage overlayOpacity={isDark ? 0.7 : 0.4}>
      <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
        <Stack.Screen options={{ headerShown: false }} />
        
        {/* Custom Header matching Figma */}
        <PageHeader
          title={getTitle()}
          showBack={true}
          rightAction="more"
          onRightActionPress={() => {}}
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
                  <View className={`px-3 py-1 rounded-full ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}>
                    <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {group.date}
                    </Text>
                  </View>
                </View>

                {/* Messages for this date */}
                {group.messages.map((message) => {
                  const isOwnMessage = message.sender_id === currentUserId;
                  return (
                    <MessageBubble
                      key={message.id}
                      message={message.content}
                      isSent={isOwnMessage}
                      timestamp={formatTime(message.created_at)}
                      senderName={message.sender?.name}
                      senderAvatar={message.sender?.avatar_url}
                    />
                  );
                })}
              </View>
            ))
          )}

          {/* Typing Indicator - matching Figma design */}
          {typingUsers.length > 0 && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, paddingHorizontal: 20 }}>
              {otherParticipant?.avatar_url ? (
                <Image source={{ uri: otherParticipant.avatar_url }} style={{ width: 32, height: 32, borderRadius: 16, marginRight: 8 }} />
              ) : (
                <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#64748b' }}>{otherParticipant?.name?.[0] || 'U'}</Text>
                </View>
              )}
              <View
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 16,
                  backgroundColor: isDark ? '#1e293b' : '#ffffff',
                  borderWidth: 1,
                  borderColor: 'rgba(0, 0, 0, 0.05)',
                }}
              >
                <Text style={{ fontStyle: 'italic', color: isDark ? '#94a3b8' : '#64748b' }}>
                  {otherParticipant?.name || 'Someone'} is typing...
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Message Input - matching Figma design */}
        <View
          style={{
            paddingHorizontal: 16,
            paddingVertical: 12,
            backgroundColor: isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            borderTopWidth: 1,
            borderTopColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
            <TextInput
              style={{
                flex: 1,
                maxHeight: 96,
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderRadius: 24,
                backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
                color: isDark ? '#ffffff' : '#1e293b',
                fontSize: 15,
              }}
              placeholder="Type something"
              placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
              value={messageText}
              onChangeText={(text) => {
                setMessageText(text);
                handleTyping();
              }}
              multiline
              textAlignVertical="center"
              editable={!sending}
            />
            <TouchableOpacity
              onPress={sendMessage}
              disabled={!messageText.trim() || sending}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: messageText.trim() && !sending ? '#0066cc' : (isDark ? '#1e293b' : '#e2e8f0'),
                alignItems: 'center',
                justifyContent: 'center',
              }}
              activeOpacity={0.8}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Camera
                  size={20}
                  color={messageText.trim() ? '#ffffff' : (isDark ? '#6b7280' : '#9ca3af')}
                />
              )}
            </TouchableOpacity>
            {messageText.trim() && (
              <TouchableOpacity
                onPress={sendMessage}
                disabled={sending}
                style={{
                  paddingHorizontal: 20,
                  paddingVertical: 12,
                  borderRadius: 8,
                  backgroundColor: '#0066cc',
                }}
                activeOpacity={0.8}
              >
                <Text style={{ color: '#ffffff', fontWeight: '600', fontSize: 15 }}>Post</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
      </SafeAreaView>
    </BackgroundImage>
  );
}
