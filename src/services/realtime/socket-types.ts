/**
 * Socket Service Types
 * 
 * This file provides type definitions for the socket service
 */

/**
 * Connection state enum
 */
export enum ConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting',
  ERROR = 'error'
}

/**
 * Connection options
 */
export interface ConnectionOptions {
  /**
   * Authentication token
   */
  token?: string;
  
  /**
   * URL to connect to
   */
  url?: string;
  
  /**
   * Maximum number of reconnect attempts
   */
  maxReconnectAttempts?: number;
  
  /**
   * Initial delay between reconnect attempts (in ms)
   */
  reconnectDelay?: number;
  
  /**
   * Whether to automatically authenticate
   */
  autoAuthenticate?: boolean;
  
  /**
   * Transport types to use (in order of preference)
   */
  transports?: string[];
  
  /**
   * Additional connection query parameters
   */
  query?: Record<string, string>;
}

/**
 * Socket service configuration
 */
export interface SocketServiceConfig {
  /**
   * Socket URL
   */
  socketUrl: string;
  
  /**
   * Maximum number of reconnect attempts
   */
  maxReconnectAttempts: number;
  
  /**
   * Initial delay between reconnect attempts (in ms)
   */
  reconnectDelay: number;
  
  /**
   * Whether to automatically reconnect
   */
  autoReconnect: boolean;
  
  /**
   * Transport types to use (in order of preference)
   */
  transports: string[];
  
  /**
   * Default query parameters
   */
  defaultQuery: Record<string, string>;
}

/**
 * Bid submission data
 */
export interface BidSubmission {
  /**
   * Task ID
   */
  taskId: string;
  
  /**
   * Bid amount
   */
  amount: number;
  
  /**
   * Bid message
   */
  message: string;
  
  /**
   * Estimated delivery time (in days)
   */
  estimatedDeliveryDays?: number;
  
  /**
   * Attachments
   */
  attachments?: string[];
}

/**
 * Notification data
 */
export interface Notification {
  /**
   * Notification ID
   */
  id: string;
  
  /**
   * Notification type
   */
  type: string;
  
  /**
   * Notification title
   */
  title: string;
  
  /**
   * Notification message
   */
  message: string;
  
  /**
   * Timestamp
   */
  timestamp: string;
  
  /**
   * Whether the notification has been read
   */
  read: boolean;
  
  /**
   * Entity ID (e.g., task ID, bid ID)
   */
  entityId?: string;
  
  /**
   * Entity type (e.g., 'task', 'bid')
   */
  entityType?: string;
  
  /**
   * Additional data
   */
  data?: Record<string, any>;
}

/**
 * Message data
 */
export interface Message {
  /**
   * Message ID
   */
  id: string;
  
  /**
   * Sender ID
   */
  senderId: string;
  
  /**
   * Sender name
   */
  senderName: string;
  
  /**
   * Chat room ID
   */
  roomId: string;
  
  /**
   * Message content
   */
  content: string;
  
  /**
   * Timestamp
   */
  timestamp: string;
  
  /**
   * Attachments
   */
  attachments?: string[];
  
  /**
   * Whether the message has been read
   */
  read?: boolean;
}

/**
 * User status
 */
export interface UserStatus {
  /**
   * User ID
   */
  userId: string;
  
  /**
   * Online status
   */
  online: boolean;
  
  /**
   * Last activity timestamp
   */
  lastActive?: string;
  
  /**
   * Current status message
   */
  statusMessage?: string;
}
