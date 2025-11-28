import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { api, supabase } from '@/lib/supabase';

interface MessagesContextType {
  unreadMessagesCount: number;
  refreshUnreadCount: () => Promise<void>;
}

const MessagesContext = createContext<MessagesContextType | undefined>(undefined);

export function MessagesProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

  const refreshUnreadCount = useCallback(async () => {
    if (!user?.id) {
      setUnreadMessagesCount(0);
      return;
    }

    try {
      const { data } = await api.getConversations(user.id);
      if (data) {
        const totalUnread = data.reduce((sum, conv) => sum + conv.unreadCount, 0);
        setUnreadMessagesCount(totalUnread);
      }
    } catch (error) {
      console.error('Error fetching unread messages count:', error);
    }
  }, [user?.id]);

  // Subscribe to real-time updates for unread count
  useEffect(() => {
    if (!user?.id || !isAuthenticated) {
      setUnreadMessagesCount(0);
      return;
    }

    // Initial fetch
    refreshUnreadCount();

    // Subscribe to messages table changes to update unread count
    const messagesChannel = supabase
      .channel(`messages-unread:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        () => {
          // Refresh unread count when new messages arrive
          refreshUnreadCount();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
        },
        () => {
          // Refresh when messages are marked as read
          refreshUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
    };
  }, [user?.id, isAuthenticated, refreshUnreadCount]);

  return (
    <MessagesContext.Provider
      value={{
        unreadMessagesCount,
        refreshUnreadCount,
      }}
    >
      {children}
    </MessagesContext.Provider>
  );
}

export function useMessages() {
  const context = useContext(MessagesContext);
  
  if (context === undefined) {
    throw new Error('useMessages must be used within a MessagesProvider');
  }
  
  return context;
}



