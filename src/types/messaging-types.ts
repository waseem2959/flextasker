/**
 * Messaging Types
 * 
 * This file defines types related to messaging and chat functionality
 * throughout the application, ensuring consistent structure for message
 * and conversation objects.
 */

import { ConnectionState } from './app-enums';
import { User } from './models-types';

/**
 * Message type for chat functionality
 */
export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  sender?: User;
  receiverId?: string;
  content: string;
  timestamp?: string;
  createdAt: string;
  updatedAt?: string;
  isRead: boolean;
  read?: boolean; // Alias for isRead
  edited?: boolean;
  editedAt?: string;
  replyTo?: string;
  attachments?: string[] | MessageAttachment[];
  reactions?: MessageReaction[];
  type?: MessageType;
  metadata?: Record<string, any>;
}

/**
 * Message types
 */
export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  FILE = 'file',
  SYSTEM = 'system',
  TYPING = 'typing'
}

/**
 * Message attachment
 */
export interface MessageAttachment {
  id: string;
  url: string;
  filename: string;
  size: number;
  mimeType: string;
  type: AttachmentType;
}

/**
 * Attachment types
 */
export enum AttachmentType {
  IMAGE = 'image',
  DOCUMENT = 'document',
  VIDEO = 'video',
  AUDIO = 'audio'
}

/**
 * Message reaction
 */
export interface MessageReaction {
  emoji: string;
  userId: string;
  timestamp: string;
}

/**
 * Conversation type for chat functionality
 */
export interface Conversation {
  id: string;
  title?: string;
  participants: User[] | string[];
  lastMessage?: Message;
  lastMessageAt?: string;
  createdAt: string;
  updatedAt?: string;
  unreadCount: number;
  type?: ConversationType;
  isGroup?: boolean;
  avatar?: string;
  archived?: boolean;
  muted?: boolean;
  metadata?: Record<string, any>;
}

/**
 * Conversation types
 */
export enum ConversationType {
  DIRECT = 'direct',
  GROUP = 'group',
  CHANNEL = 'channel'
}

/**
 * Message request for sending new messages
 */
export interface SendMessageRequest {
  conversationId: string;
  content: string;
  attachments?: string[];
  metadata?: Record<string, any>;
  type?: MessageType;
  replyTo?: string;
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

/**
 * Real-time event payloads
 */
export interface MessageEvent {
  type: 'message_sent' | 'message_received' | 'message_read' | 'message_deleted';
  message: Message;
  conversationId: string;
}

export interface TypingEvent {
  type: 'typing_start' | 'typing_stop';
  userId: string;
  conversationId: string;
}

export interface PresenceEvent {
  type: 'user_online' | 'user_offline';
  userId: string;
  lastSeen?: string;
}

/**
 * Socket connection status
 */
export interface SocketConnectionStatus {
  connected: boolean;
  state: ConnectionState;
  reconnectAttempts: number;
  lastConnected?: string;
  error?: string;
}

/**
 * Chat hooks return types
 */
export interface UseChatReturn {
  messages: Message[];
  conversations: Conversation[];
  currentConversation?: Conversation;
  loading: boolean;
  error: Error | null;
  connectionStatus: SocketConnectionStatus;
  
  // Actions
  sendMessage: (content: string, type?: MessageType) => Promise<void>;
  markAsRead: (messageId: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  editMessage: (messageId: string, content: string) => Promise<void>;
  startTyping: () => void;
  stopTyping: () => void;
  
  // Conversation actions
  createConversation: (participantIds: string[]) => Promise<Conversation>;
  archiveConversation: (conversationId: string) => Promise<void>;
  muteConversation: (conversationId: string, muted: boolean) => Promise<void>;
}

/**
 * Message send options
 */
export interface SendMessageOptions {
  type?: MessageType;
  replyTo?: string;
  attachments?: File[];
  priority?: 'low' | 'normal' | 'high';
}

/**
 * Message search filters
 */
export interface MessageSearchFilters {
  query?: string;
  conversationId?: string;
  senderId?: string;
  type?: MessageType;
  hasAttachments?: boolean;
  dateFrom?: string;
  dateTo?: string;
}

/**
 * Message pagination
 */
export interface MessagePagination {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

/**
 * Chat notification settings
 */
export interface ChatNotificationSettings {
  enabled: boolean;
  sound: boolean;
  desktop: boolean;
  mobile: boolean;
  email: boolean;
  muteUntil?: string;
}

/**
 * Online presence status
 */
export interface UserPresence {
  userId: string;
  status: PresenceStatus;
  lastSeen: string;
  isTyping: boolean;
  activeConversations: string[];
}

/**
 * Presence status options
 */
export enum PresenceStatus {
  ONLINE = 'online',
  AWAY = 'away',
  BUSY = 'busy',
  OFFLINE = 'offline'
}

/**
 * Chat configuration
 */
export interface ChatConfig {
  maxMessageLength: number;
  allowedAttachmentTypes: string[];
  maxAttachmentSize: number;
  enableTypingIndicators: boolean;
  enableReadReceipts: boolean;
  enableReactions: boolean;
  autoReconnect: boolean;
  reconnectInterval: number;
  maxReconnectAttempts: number;
}

/**
 * Chat error types
 */
export interface ChatError extends Error {
  code: ChatErrorCode;
  conversationId?: string;
  messageId?: string;
  retryable: boolean;
}

/**
 * Chat error codes
 */
export enum ChatErrorCode {
  CONNECTION_FAILED = 'connection_failed',
  MESSAGE_SEND_FAILED = 'message_send_failed',
  MESSAGE_TOO_LONG = 'message_too_long',
  ATTACHMENT_TOO_LARGE = 'attachment_too_large',
  UNAUTHORIZED = 'unauthorized',
  CONVERSATION_NOT_FOUND = 'conversation_not_found',
  USER_BLOCKED = 'user_blocked',
  RATE_LIMITED = 'rate_limited'
}
