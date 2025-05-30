/**
 * Chat Hook
 * 
 * This hook provides functionality for real-time chat messaging
 * including message sending, typing indicators, and history management.
 */

import { useState, useCallback, useEffect } from 'react';
import { socketService } from '@/services/socket';
import { apiClient } from '@/services/api/client';
import { Message, User } from '@/types';
import { showErrorNotification } from '@/services/error';

/**
 * Hook for chat functionality
 */
export function useChat(conversationId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [typingUsers, setTypingUsers] = useState<User[]>([]);
  
  // Load chat history on mount
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.get(`/conversations/${conversationId}/messages`);
        if (response.success && response.data) {
          setMessages(response.data);
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to load messages');
        setError(error);
        showErrorNotification(error.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMessages();
  }, [conversationId]);
  
  // Subscribe to new messages
  useEffect(() => {
    // Subscribe to new message events
    const unsubscribeMessage = socketService.on(
      `conversation:${conversationId}:message`,
      (message: Message) => {
        setMessages((prevMessages) => [...prevMessages, message]);
      }
    );
    
    // Subscribe to typing start events
    const unsubscribeTypingStart = socketService.on(
      `conversation:${conversationId}:typing:start`,
      ({ user }: { user: User }) => {
        setTypingUsers((prevUsers) => {
          if (!prevUsers.some((u) => u.id === user.id)) {
            return [...prevUsers, user];
          }
          return prevUsers;
        });
      }
    );
    
    // Subscribe to typing stop events
    const unsubscribeTypingStop = socketService.on(
      `conversation:${conversationId}:typing:stop`,
      ({ user }: { user: User }) => {
        setTypingUsers((prevUsers) => 
          prevUsers.filter((u) => u.id !== user.id)
        );
      }
    );
    
    // Cleanup on unmount
    return () => {
      unsubscribeMessage();
      unsubscribeTypingStart();
      unsubscribeTypingStop();
    };
  }, [conversationId]);
  
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
        const response = await apiClient.post(`/conversations/${conversationId}/messages`, {
          content,
          conversationId
        });
        
        // If successful, the message will come back through the socket
        // But we can also add it optimistically
        if (response.success && response.data) {
          // The API might return the created message
          setMessages((prevMessages) => [...prevMessages, response.data]);
        }
        
        setError(null);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to send message');
        setError(error);
        showErrorNotification(error.message);
      } finally {
        setIsLoading(false);
      }
    },
    [conversationId]
  );
  
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
