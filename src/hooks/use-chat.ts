/**
 * Chat Hook
 * 
 * This hook provides functionality for real-time chat messaging
 * including message sending, typing indicators, and history management.
 */

import { apiClient as consolidatedApiClient } from '@/services/api/api-client';
// Error notification simplified
import { toast } from '@/hooks/use-toast';
import { realtimeService as socketService } from '@/services/realtime/socket-service';
import { User } from '@/types';
import { useCallback, useEffect, useState } from 'react';

/**
 * Message interface for chat functionality
 */
interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  sender?: User;
  content: string;
  createdAt: string;
  readAt?: string;
}

/**
 * Hook for chat functionality
 */
export function useChat(conversationId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [typingUsers, setTypingUsers] = useState<User[]>([]);
  
  // Function to fetch message history
  const fetchMessages = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await consolidatedApiClient.get(`/conversations/${conversationId}/messages`);
      if (response.success && response.data) {
        setMessages(response.data as Message[]);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load messages');
      setError(error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [conversationId]);
  
  // Load chat history on mount
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);
  
  // Handler for new messages
  const handleNewMessage = useCallback((message: Message) => {
    setMessages((prevMessages) => [...prevMessages, message]);
  }, []);

  // Handler for typing start events
  const handleTypingStart = useCallback(({ user }: { user: User }) => {
    setTypingUsers((prevUsers) => {
      if (!prevUsers.some((u) => u.id === user.id)) {
        return [...prevUsers, user];
      }
      return prevUsers;
    });
  }, []);

  // Handler for typing stop events
  const handleTypingStop = useCallback(({ user }: { user: User }) => {
    setTypingUsers((prevUsers) => 
      prevUsers.filter((u) => u.id !== user.id)
    );
  }, []);
  
  // Subscribe to socket events
  useEffect(() => {
    // Subscribe to new message events
    const unsubscribeMessage = socketService.on(
      `conversation:${conversationId}:message`,
      handleNewMessage
    );
    
    // Subscribe to typing start events
    const unsubscribeTypingStart = socketService.on(
      `conversation:${conversationId}:typing:start`,
      handleTypingStart
    );
    
    // Subscribe to typing stop events
    const unsubscribeTypingStop = socketService.on(
      `conversation:${conversationId}:typing:stop`,
      handleTypingStop
    );
    
    // Cleanup on unmount
    return () => {
      unsubscribeMessage();
      unsubscribeTypingStart();
      unsubscribeTypingStop();
    };
  }, [conversationId, handleNewMessage, handleTypingStart, handleTypingStop]);
  
  // Function to indicate typing status
  const setTyping = useCallback(
    (isTyping: boolean) => {
      const eventName = isTyping
        ? `conversation:${conversationId}:typing:start`
        : `conversation:${conversationId}:typing:stop`;
      
      socketService.emit(eventName, { conversationId });
    },
    [conversationId]
  );
  
  // Function to send a message
  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) {
        return;
      }
      
      try {
        setIsLoading(true);
        
        // First, stop typing indicator
        setTyping(false);
        
        // Send the message using the API
        const response = await consolidatedApiClient.post(`/conversations/${conversationId}/messages`, {
          content,
          conversationId
        });
        
        // If successful, the message will come back through the socket
        // But we can also add it optimistically
        if (response.success && response.data) {
          // The API might return the created message
          setMessages((prevMessages) => [...prevMessages, response.data as Message]);
        }
        
        setError(null);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to send message');
        setError(error);
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    },
    [conversationId, setTyping]
  );
  
  // Debounced typing function for better UX
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  
  const handleTyping = useCallback(
    () => {
      // Clear existing timeout
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
      
      // Set typing status to true
      setTyping(true);
      
      // Set a new timeout to stop typing after 2 seconds of inactivity
      const timeout = setTimeout(() => {
        setTyping(false);
      }, 2000);
      
      setTypingTimeout(timeout as unknown as NodeJS.Timeout);
    },
    [setTyping, typingTimeout]
  );
  
  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
    };
  }, [typingTimeout]);
  
  return {
    messages,
    typingUsers,
    isLoading,
    error,
    sendMessage,
    handleTyping
  };
}

export default useChat;
