/**
 * Chat Service
 * 
 * This service provides functionality for real-time chat messaging
 * including message sending, typing indicators, and history management.
 */

import { apiClient } from '../api/api-client';
import { socketService } from '../realtime/socket-service';
import { User } from '@/types';
import { ApiResponse, PaginatedApiResponse } from '@/types/api';
import { errorService } from '../error/error-service';

/**
 * Message interface for chat functionality
 */
export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  sender?: User;
  content: string;
  createdAt: string;
  readAt?: string;
  attachments?: string[];
}

/**
 * Conversation interface
 */
export interface Conversation {
  id: string;
  participants: User[];
  lastMessage?: Message;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
  title?: string;
  taskId?: string;
}

/**
 * Message creation request
 */
export interface SendMessageRequest {
  content: string;
  attachments?: string[];
}

/**
 * Socket events for chat functionality
 */
export enum ChatEvent {
  NEW_MESSAGE = 'chat:new_message',
  MESSAGE_READ = 'chat:message_read',
  TYPING = 'chat:typing',
  STOP_TYPING = 'chat:stop_typing',
  JOIN_CONVERSATION = 'chat:join_conversation',
  LEAVE_CONVERSATION = 'chat:leave_conversation'
}

/**
 * Fetch conversations for the current user
 * 
 * @param page - Page number for pagination
 * @param limit - Number of conversations per page
 * @returns Promise with paginated conversations
 */
export async function getConversations(
  page: number = 1,
  limit: number = 20
): Promise<PaginatedApiResponse<Conversation>> {
  try {
    return await apiClient.get('/conversations', { page, limit }) as PaginatedApiResponse<Conversation>;
  } catch (error) {
    errorService.handleError(error, 'Failed to fetch conversations');
    throw error;
  }
}

/**
 * Get a specific conversation by ID
 * 
 * @param conversationId - The conversation ID
 * @returns Promise with the conversation details
 */
export async function getConversation(conversationId: string): Promise<ApiResponse<Conversation>> {
  try {
    return await apiClient.get(`/conversations/${conversationId}`);
  } catch (error) {
    errorService.handleError(error, 'Failed to fetch conversation');
    throw error;
  }
}

/**
 * Create a new conversation with selected participants
 * 
 * @param participantIds - Array of user IDs to include in the conversation
 * @param initialMessage - Optional initial message content
 * @param title - Optional conversation title
 * @param taskId - Optional related task ID
 * @returns Promise with the created conversation
 */
export async function createConversation(
  participantIds: string[],
  initialMessage?: string,
  title?: string,
  taskId?: string
): Promise<ApiResponse<Conversation>> {
  try {
    return await apiClient.post('/conversations', {
      participantIds,
      initialMessage,
      title,
      taskId
    });
  } catch (error) {
    errorService.handleError(error, 'Failed to create conversation');
    throw error;
  }
}

/**
 * Fetch messages for a specific conversation
 * 
 * @param conversationId - The conversation ID
 * @param page - Page number for pagination
 * @param limit - Number of messages per page
 * @returns Promise with paginated messages
 */
export async function getMessages(
  conversationId: string,
  page: number = 1,
  limit: number = 50
): Promise<PaginatedApiResponse<Message>> {
  try {
    return await apiClient.get(
      `/conversations/${conversationId}/messages`,
      { page, limit }
    ) as PaginatedApiResponse<Message>;
  } catch (error) {
    errorService.handleError(error, 'Failed to fetch messages');
    throw error;
  }
}

/**
 * Send a message in a conversation
 * 
 * @param conversationId - The conversation ID
 * @param message - The message data to send
 * @returns Promise with the sent message
 */
export async function sendMessage(
  conversationId: string,
  message: SendMessageRequest
): Promise<ApiResponse<Message>> {
  try {
    return await apiClient.post(`/conversations/${conversationId}/messages`, message);
  } catch (error) {
    errorService.handleError(error, 'Failed to send message');
    throw error;
  }
}

/**
 * Mark a message as read
 * 
 * @param conversationId - The conversation ID
 * @param messageId - The message ID
 * @returns Promise with the updated message
 */
export async function markMessageAsRead(
  conversationId: string,
  messageId: string
): Promise<ApiResponse<Message>> {
  try {
    return await apiClient.put(`/conversations/${conversationId}/messages/${messageId}/read`);
  } catch (error) {
    errorService.handleError(error, 'Failed to mark message as read');
    throw error;
  }
}

/**
 * Mark all messages in a conversation as read
 * 
 * @param conversationId - The conversation ID
 * @returns Promise with success response
 */
export async function markAllMessagesAsRead(conversationId: string): Promise<ApiResponse<void>> {
  try {
    return await apiClient.put(`/conversations/${conversationId}/read-all`);
  } catch (error) {
    errorService.handleError(error, 'Failed to mark all messages as read');
    throw error;
  }
}

/**
 * Subscribe to messages in a conversation
 * 
 * @param conversationId - The conversation ID
 * @param onNewMessage - Callback for new messages
 * @returns Unsubscribe function
 */
export function subscribeToMessages(
  conversationId: string,
  onNewMessage: (message: Message) => void
): () => void {
  // Join the conversation room
  socketService.emit(ChatEvent.JOIN_CONVERSATION, { conversationId });
  
  // Listen for new messages
  const unsubscribe = socketService.on<Message>(
    ChatEvent.NEW_MESSAGE,
    (message) => {
      if (message.conversationId === conversationId) {
        onNewMessage(message);
      }
    }
  );
  
  // Return unsubscribe function that also leaves the room
  return () => {
    unsubscribe();
    socketService.emit(ChatEvent.LEAVE_CONVERSATION, { conversationId });
  };
}

/**
 * Send typing indicator in a conversation
 * 
 * @param conversationId - The conversation ID
 */
export function sendTypingIndicator(conversationId: string): void {
  socketService.emit(ChatEvent.TYPING, { conversationId });
}

/**
 * Send stop typing indicator in a conversation
 * 
 * @param conversationId - The conversation ID
 */
export function sendStopTypingIndicator(conversationId: string): void {
  socketService.emit(ChatEvent.STOP_TYPING, { conversationId });
}

/**
 * Subscribe to typing indicators in a conversation
 * 
 * @param conversationId - The conversation ID
 * @param onTyping - Callback for typing events
 * @param onStopTyping - Callback for stop typing events
 * @returns Unsubscribe function
 */
export function subscribeToTypingIndicators(
  conversationId: string,
  onTyping: (user: User) => void,
  onStopTyping: (user: User) => void
): () => void {
  // Listen for typing indicators
  const typingUnsubscribe = socketService.on<{ user: User; conversationId: string }>(
    ChatEvent.TYPING,
    (data) => {
      if (data.conversationId === conversationId) {
        onTyping(data.user);
      }
    }
  );
  
  // Listen for stop typing indicators
  const stopTypingUnsubscribe = socketService.on<{ user: User; conversationId: string }>(
    ChatEvent.STOP_TYPING,
    (data) => {
      if (data.conversationId === conversationId) {
        onStopTyping(data.user);
      }
    }
  );
  
  // Return combined unsubscribe function
  return () => {
    typingUnsubscribe();
    stopTypingUnsubscribe();
  };
}

/**
 * Delete a message
 * 
 * @param conversationId - The conversation ID
 * @param messageId - The message ID
 * @returns Promise with success response
 */
export async function deleteMessage(
  conversationId: string,
  messageId: string
): Promise<ApiResponse<void>> {
  try {
    return await apiClient.delete(`/conversations/${conversationId}/messages/${messageId}`);
  } catch (error) {
    errorService.handleError(error, 'Failed to delete message');
    throw error;
  }
}

/**
 * Leave a conversation
 * 
 * @param conversationId - The conversation ID
 * @returns Promise with success response
 */
export async function leaveConversation(conversationId: string): Promise<ApiResponse<void>> {
  try {
    return await apiClient.post(`/conversations/${conversationId}/leave`);
  } catch (error) {
    errorService.handleError(error, 'Failed to leave conversation');
    throw error;
  }
}

/**
 * Add participants to a conversation
 * 
 * @param conversationId - The conversation ID
 * @param participantIds - Array of user IDs to add
 * @returns Promise with the updated conversation
 */
export async function addParticipants(
  conversationId: string,
  participantIds: string[]
): Promise<ApiResponse<Conversation>> {
  try {
    return await apiClient.post(`/conversations/${conversationId}/participants`, {
      participantIds
    });
  } catch (error) {
    errorService.handleError(error, 'Failed to add participants');
    throw error;
  }
}

// Export service object for convenience
export const chatService = {
  getConversations,
  getConversation,
  createConversation,
  getMessages,
  sendMessage,
  markMessageAsRead,
  markAllMessagesAsRead,
  subscribeToMessages,
  sendTypingIndicator,
  sendStopTypingIndicator,
  subscribeToTypingIndicators,
  deleteMessage,
  leaveConversation,
  addParticipants,
  ChatEvent
};

export default chatService;
