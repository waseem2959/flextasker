/**
 * Realtime Communication Service Types
 */

import { User } from '@/types';

// Event types for real-time updates
export enum SocketEventType {
  TASK_UPDATED = 'TASK_UPDATED',
  TASK_CREATED = 'TASK_CREATED',
  BID_RECEIVED = 'BID_RECEIVED',
  BID_UPDATED = 'BID_UPDATED',
  REVIEW_RECEIVED = 'REVIEW_RECEIVED',
  NOTIFICATION_RECEIVED = 'NOTIFICATION_RECEIVED',
  MESSAGE_RECEIVED = 'MESSAGE_RECEIVED',
  USER_STATUS_CHANGED = 'USER_STATUS_CHANGED',
  TYPING_STARTED = 'TYPING_STARTED',
  TYPING_STOPPED = 'TYPING_STOPPED'
}

// Socket connection states
export enum ConnectionState {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  RECONNECTING = 'RECONNECTING',
  ERROR = 'ERROR'
}

// Interface for socket events
export interface SocketEvent<T = any> {
  type: SocketEventType;
  data: T;
  timestamp: string;
}

// Chat message interface
export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: Date;
  read: boolean;
}

// Conversation interface
export interface Conversation {
  id: string;
  participants: User[];
  lastMessage?: ChatMessage;
  unreadCount: number;
}

// Notification interface
export interface Notification {
  id: string;
  userId: string;
  type: string;
  message: string;
  read: boolean;
  relatedId?: string;
  createdAt: Date;
}

// Bid submission parameters
export interface BidSubmission {
  taskId: string;
  amount: number;
  description: string;
  timeline: string;
}
