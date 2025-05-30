/**
 * Messaging Types
 * 
 * This file defines types related to messaging and chat functionality.
 */

import { User } from './consolidated-models';

/**
 * Message type for chat functionality
 */
export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  sender?: User;
  content: string;
  createdAt: string;
  updatedAt?: string;
  isRead: boolean;
  attachments?: string[];
  metadata?: Record<string, any>;
}

/**
 * Conversation type for chat functionality
 */
export interface Conversation {
  id: string;
  title?: string;
  participants: User[];
  lastMessage?: Message;
  createdAt: string;
  updatedAt?: string;
  unreadCount: number;
  isGroup: boolean;
  metadata?: Record<string, any>;
}

/**
 * Message request for sending new messages
 */
export interface SendMessageRequest {
  conversationId: string;
  content: string;
  attachments?: string[];
  metadata?: Record<string, any>;
}

/**
 * Typing indicator type
 */
export interface TypingIndicator {
  conversationId: string;
  userId: string;
  user?: User;
  isTyping: boolean;
  timestamp: string;
}

// No need for default export with TypeScript interfaces
