/**
 * Realtime service types
 */

/**
 * Connection states for the realtime service
 */
export enum ConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting',
  ERROR = 'error'
}

/**
 * Connection options interface
 */
export interface ConnectionOptions {
  autoReconnect?: boolean;
  reconnectAttempts?: number;
  reconnectDelay?: number;
  timeout?: number;
  query?: Record<string, string>;
  auth?: {
    token: string;
  };
}

/**
 * Realtime client configuration
 */
export interface RealtimeConfig {
  url: string;
  options?: ConnectionOptions;
  debug?: boolean;
}

/**
 * Connection status interface
 */
export interface ConnectionStatus {
  state: ConnectionState;
  lastConnected: Date | null;
  reconnectAttempt: number;
  error: Error | null;
}

/**
 * Socket message interface
 */
export interface SocketMessage<T = any> {
  event: string;
  data: T;
  timestamp: number;
}

/**
 * Subscription handler type
 */
export type SubscriptionHandler<T = any> = (data: T) => void;

/**
 * Subscription options
 */
export interface SubscriptionOptions {
  once?: boolean;
  priority?: number;
}

/**
 * Subscription interface
 */
export interface Subscription {
  id: string;
  event: string;
  handler: SubscriptionHandler;
  options: SubscriptionOptions;
  unsubscribe: () => void;
}
