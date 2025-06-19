/**
 * Enhanced Socket Hook
 * 
 * Advanced React hook for WebSocket management with automatic reconnection,
 * presence tracking, typing indicators, and message delivery guarantees.
 */

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './use-auth';
import { useToast } from './use-toast';

interface SocketState {
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string | null;
  reconnectAttempts: number;
  lastConnectedAt: Date | null;
}

interface UserPresence {
  userId: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  lastSeen: Date;
  platform: string;
  currentRoom?: string;
}

interface Message {
  id: string;
  senderId: string;
  roomId: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'system';
  timestamp: string;
  editedAt?: string;
  replyTo?: string;
  threadId?: string;
  attachments?: Array<{
    url: string;
    type: string;
    name: string;
    size?: number;
  }>;
  deliveryStatus: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  tempId?: string;
  reactions?: Array<{
    id: string;
    userId: string;
    reaction: string;
    user: {
      id: string;
      name: string;
      avatar?: string;
    };
  }>;
}

interface TypingUser {
  userId: string;
  roomId: string;
  timestamp: string;
}

interface EnhancedSocketOptions {
  autoConnect?: boolean;
  reconnectAttempts?: number;
  reconnectDelay?: number;
  presenceEnabled?: boolean;
  typingEnabled?: boolean;
  messageQueue?: boolean;
}

interface UseEnhancedSocketReturn {
  // Connection state
  socket: Socket | null;
  socketState: SocketState;
  
  // Presence
  userPresence: Map<string, UserPresence>;
  setPresenceStatus: (status: UserPresence['status']) => void;
  
  // Room management
  currentRoom: string | null;
  joinRoom: (roomId: string, roomType: string, permissions?: string[]) => Promise<void>;
  leaveRoom: (roomId?: string) => Promise<void>;
  
  // Messaging
  sendMessage: (content: string, options?: {
    type?: Message['type'];
    replyTo?: string;
    threadId?: string;
    attachments?: Message['attachments'];
    metadata?: Record<string, any>;
  }) => Promise<string>;
  editMessage: (messageId: string, content: string) => Promise<void>;
  deleteMessage: (messageId: string, reason?: string) => Promise<void>;
  markAsRead: (messageIds: string[]) => void;
  
  // Reactions
  addReaction: (messageId: string, reaction: string) => Promise<void>;
  removeReaction: (messageId: string, reaction: string) => Promise<void>;
  
  // Threading
  sendThreadReply: (parentMessageId: string, content: string, attachments?: Message['attachments']) => Promise<void>;
  
  // Typing indicators
  typingUsers: TypingUser[];
  setTyping: (isTyping: boolean, roomId?: string) => void;
  
  // Search
  searchMessages: (query: string, options?: {
    roomId?: string;
    limit?: number;
    offset?: number;
    dateFrom?: string;
    dateTo?: string;
    messageType?: Message['type'];
  }) => Promise<any>;
  
  // Connection management
  connect: () => void;
  disconnect: () => void;
  reconnect: () => void;
  
  // Event listeners
  on: (event: string, callback: (...args: any[]) => void) => void;
  off: (event: string, callback?: (...args: any[]) => void) => void;
  emit: (event: string, data?: any) => void;
}

const DEFAULT_OPTIONS: EnhancedSocketOptions = {
  autoConnect: true,
  reconnectAttempts: 5,
  reconnectDelay: 1000,
  presenceEnabled: true,
  typingEnabled: true,
  messageQueue: true
};

export const useEnhancedSocket = (options: EnhancedSocketOptions = {}): UseEnhancedSocketReturn => {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const { user, token } = useAuth();
  const { toast } = useToast();
  
  // State
  const [socketState, setSocketState] = useState<SocketState>({
    isConnected: false,
    isConnecting: false,
    connectionError: null,
    reconnectAttempts: 0,
    lastConnectedAt: null
  });
  
  const [userPresence, setUserPresence] = useState<Map<string, UserPresence>>(new Map());
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  
  // Refs
  const socketRef = useRef<Socket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messageQueueRef = useRef<Array<{ event: string; data: any; resolve: Function; reject: Function }>>([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const eventListenersRef = useRef<Map<string, Function[]>>(new Map());

  // Generate temp ID for messages
  const generateTempId = useCallback(() => {
    return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Socket connection management
  const connect = useCallback(() => {
    if (socketRef.current?.connected || !user || !token) return;

    setSocketState(prev => ({ ...prev, isConnecting: true, connectionError: null }));

    const socket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001', {
      auth: { token },
      transports: ['websocket', 'polling'],
      upgrade: true,
      rememberUpgrade: true,
      timeout: 20000,
      autoConnect: false
    });

    socketRef.current = socket;

    // Connection events
    socket.on('connect', () => {
      setSocketState(prev => ({
        ...prev,
        isConnected: true,
        isConnecting: false,
        connectionError: null,
        reconnectAttempts: 0,
        lastConnectedAt: new Date()
      }));

      // Process queued messages
      if (opts.messageQueue) {
        const queue = messageQueueRef.current;
        messageQueueRef.current = [];
        
        queue.forEach(({ event, data, resolve, reject }) => {
          socket.emit(event, data, (response: any) => {
            if (response?.error) {
              reject(new Error(response.error));
            } else {
              resolve(response);
            }
          });
        });
      }

      console.log('🔌 Socket connected');
    });

    socket.on('disconnect', (reason) => {
      setSocketState(prev => ({
        ...prev,
        isConnected: false,
        isConnecting: false,
        connectionError: reason
      }));

      setCurrentRoom(null);
      setUserPresence(new Map());
      setTypingUsers([]);

      console.log('🔌 Socket disconnected:', reason);

      // Auto-reconnect for certain disconnect reasons
      if (['io server disconnect', 'transport close'].includes(reason) && 
          socketState.reconnectAttempts < opts.reconnectAttempts!) {
        scheduleReconnect();
      }
    });

    socket.on('connect_error', (error) => {
      setSocketState(prev => ({
        ...prev,
        isConnected: false,
        isConnecting: false,
        connectionError: error.message
      }));

      console.error('🔌 Socket connection error:', error);
      
      if (socketState.reconnectAttempts < opts.reconnectAttempts!) {
        scheduleReconnect();
      } else {
        toast({
          title: 'Connection Failed',
          description: 'Unable to connect to the server. Please check your internet connection.',
          variant: 'destructive'
        });
      }
    });

    // Enhanced message events
    socket.on('message_received', handleMessageReceived);
    socket.on('message_sent', handleMessageSent);
    socket.on('message_edited', handleMessageEdited);
    socket.on('message_deleted', handleMessageDeleted);
    socket.on('message_read', handleMessageRead);

    // Reaction events
    socket.on('reaction_added', handleReactionAdded);
    socket.on('reaction_removed', handleReactionRemoved);

    // Thread events
    socket.on('thread_reply', handleThreadReply);

    // Presence events
    if (opts.presenceEnabled) {
      socket.on('presence_update', handlePresenceUpdate);
    }

    // Typing events
    if (opts.typingEnabled) {
      socket.on('typing_started', handleTypingStarted);
      socket.on('typing_stopped', handleTypingStopped);
    }

    // Room events
    socket.on('room_joined', handleRoomJoined);
    socket.on('room_left', handleRoomLeft);
    socket.on('user_joined', handleUserJoined);
    socket.on('user_left', handleUserLeft);

    // Error handling
    socket.on('error', handleSocketError);

    socket.connect();
  }, [user, token, opts, socketState.reconnectAttempts, toast]);

  // Schedule reconnection
  const scheduleReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    const delay = opts.reconnectDelay! * Math.pow(2, socketState.reconnectAttempts);
    
    reconnectTimeoutRef.current = setTimeout(() => {
      setSocketState(prev => ({
        ...prev,
        reconnectAttempts: prev.reconnectAttempts + 1
      }));
      connect();
    }, delay);
  }, [connect, opts.reconnectDelay, socketState.reconnectAttempts]);

  // Event handlers
  const handleMessageReceived = useCallback((message: Message) => {
    // Trigger custom event listeners
    triggerEventListeners('message_received', message);
  }, []);

  const handleMessageSent = useCallback((data: { tempId: string; message: Message }) => {
    triggerEventListeners('message_sent', data);
  }, []);

  const handleMessageEdited = useCallback((data: any) => {
    triggerEventListeners('message_edited', data);
  }, []);

  const handleMessageDeleted = useCallback((data: any) => {
    triggerEventListeners('message_deleted', data);
  }, []);

  const handleMessageRead = useCallback((data: any) => {
    triggerEventListeners('message_read', data);
  }, []);

  const handleReactionAdded = useCallback((data: any) => {
    triggerEventListeners('reaction_added', data);
  }, []);

  const handleReactionRemoved = useCallback((data: any) => {
    triggerEventListeners('reaction_removed', data);
  }, []);

  const handleThreadReply = useCallback((data: any) => {
    triggerEventListeners('thread_reply', data);
  }, []);

  const handlePresenceUpdate = useCallback((presence: UserPresence) => {
    setUserPresence(prev => {
      const newMap = new Map(prev);
      newMap.set(presence.userId, presence);
      return newMap;
    });
    triggerEventListeners('presence_update', presence);
  }, []);

  const handleTypingStarted = useCallback((data: { userId: string; roomId: string; timestamp: string }) => {
    setTypingUsers(prev => {
      const filtered = prev.filter(user => !(user.userId === data.userId && user.roomId === data.roomId));
      return [...filtered, data];
    });
  }, []);

  const handleTypingStopped = useCallback((data: { userId: string; roomId: string }) => {
    setTypingUsers(prev => prev.filter(user => !(user.userId === data.userId && user.roomId === data.roomId)));
  }, []);

  const handleRoomJoined = useCallback((data: any) => {
    setCurrentRoom(data.roomId);
    triggerEventListeners('room_joined', data);
  }, []);

  const handleRoomLeft = useCallback((data: any) => {
    if (currentRoom === data.roomId) {
      setCurrentRoom(null);
    }
    triggerEventListeners('room_left', data);
  }, [currentRoom]);

  const handleUserJoined = useCallback((data: any) => {
    triggerEventListeners('user_joined', data);
  }, []);

  const handleUserLeft = useCallback((data: any) => {
    triggerEventListeners('user_left', data);
  }, []);

  const handleSocketError = useCallback((error: any) => {
    console.error('Socket error:', error);
    toast({
      title: 'Connection Error',
      description: error.message || 'An unexpected error occurred',
      variant: 'destructive'
    });
  }, [toast]);

  // Trigger custom event listeners
  const triggerEventListeners = useCallback((event: string, data: any) => {
    const listeners = eventListenersRef.current.get(event) || [];
    listeners.forEach(callback => callback(data));
  }, []);

  // Emit with queue support
  const emitWithQueue = useCallback((event: string, data?: any): Promise<any> => {
    return new Promise((resolve, reject) => {
      if (socketRef.current?.connected) {
        socketRef.current.emit(event, data, (response: any) => {
          if (response?.error) {
            reject(new Error(response.error));
          } else {
            resolve(response);
          }
        });
      } else if (opts.messageQueue) {
        messageQueueRef.current.push({ event, data, resolve, reject });
      } else {
        reject(new Error('Socket not connected'));
      }
    });
  }, [opts.messageQueue]);

  // Public methods
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    socketRef.current?.disconnect();
    socketRef.current = null;
  }, []);

  const reconnect = useCallback(() => {
    disconnect();
    setSocketState(prev => ({ ...prev, reconnectAttempts: 0 }));
    connect();
  }, [disconnect, connect]);

  const setPresenceStatus = useCallback((status: UserPresence['status']) => {
    if (opts.presenceEnabled && socketRef.current?.connected) {
      socketRef.current.emit('presence', { status });
    }
  }, [opts.presenceEnabled]);

  const joinRoom = useCallback(async (roomId: string, roomType: string, permissions?: string[]) => {
    await emitWithQueue('join_room', { roomId, roomType, permissions });
  }, [emitWithQueue]);

  const leaveRoom = useCallback(async (roomId?: string) => {
    const targetRoom = roomId || currentRoom;
    if (targetRoom) {
      await emitWithQueue('leave_room', { roomId: targetRoom });
    }
  }, [emitWithQueue, currentRoom]);

  const sendMessage = useCallback(async (content: string, options = {}): Promise<string> => {
    const tempId = generateTempId();
    const messageData = {
      content,
      roomId: currentRoom,
      tempId,
      ...options
    };

    await emitWithQueue('send_message', messageData);
    return tempId;
  }, [emitWithQueue, currentRoom, generateTempId]);

  const editMessage = useCallback(async (messageId: string, content: string) => {
    await emitWithQueue('edit_message', { messageId, content });
  }, [emitWithQueue]);

  const deleteMessage = useCallback(async (messageId: string, reason?: string) => {
    await emitWithQueue('delete_message', { messageId, reason });
  }, [emitWithQueue]);

  const markAsRead = useCallback((messageIds: string[]) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('mark_as_read', { messageIds });
    }
  }, []);

  const addReaction = useCallback(async (messageId: string, reaction: string) => {
    await emitWithQueue('message_reaction', { messageId, reaction, action: 'add' });
  }, [emitWithQueue]);

  const removeReaction = useCallback(async (messageId: string, reaction: string) => {
    await emitWithQueue('message_reaction', { messageId, reaction, action: 'remove' });
  }, [emitWithQueue]);

  const sendThreadReply = useCallback(async (parentMessageId: string, content: string, attachments?: Message['attachments']) => {
    await emitWithQueue('thread_reply', { messageId: parentMessageId, content, attachments });
  }, [emitWithQueue]);

  const setTyping = useCallback((isTyping: boolean, roomId?: string) => {
    const targetRoom = roomId || currentRoom;
    if (opts.typingEnabled && targetRoom && socketRef.current?.connected) {
      socketRef.current.emit('typing', { roomId: targetRoom, isTyping });
      
      // Auto-stop typing after 3 seconds
      if (isTyping) {
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        typingTimeoutRef.current = setTimeout(() => {
          setTyping(false, targetRoom);
        }, 3000);
      }
    }
  }, [opts.typingEnabled, currentRoom]);

  const searchMessages = useCallback(async (query: string, searchOptions = {}) => {
    return await emitWithQueue('search_messages', { query, ...searchOptions });
  }, [emitWithQueue]);

  const on = useCallback((event: string, callback: (...args: any[]) => void) => {
    const listeners = eventListenersRef.current.get(event) || [];
    listeners.push(callback);
    eventListenersRef.current.set(event, listeners);
  }, []);

  const off = useCallback((event: string, callback?: (...args: any[]) => void) => {
    if (callback) {
      const listeners = eventListenersRef.current.get(event) || [];
      const filtered = listeners.filter(cb => cb !== callback);
      eventListenersRef.current.set(event, filtered);
    } else {
      eventListenersRef.current.delete(event);
    }
  }, []);

  const emit = useCallback((event: string, data?: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    }
  }, []);

  // Auto-connect effect
  useEffect(() => {
    if (opts.autoConnect && user && token) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [opts.autoConnect, user, token, connect, disconnect]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return useMemo(() => ({
    socket: socketRef.current,
    socketState,
    userPresence,
    setPresenceStatus,
    currentRoom,
    joinRoom,
    leaveRoom,
    sendMessage,
    editMessage,
    deleteMessage,
    markAsRead,
    addReaction,
    removeReaction,
    sendThreadReply,
    typingUsers,
    setTyping,
    searchMessages,
    connect,
    disconnect,
    reconnect,
    on,
    off,
    emit
  }), [
    socketState,
    userPresence,
    setPresenceStatus,
    currentRoom,
    joinRoom,
    leaveRoom,
    sendMessage,
    editMessage,
    deleteMessage,
    markAsRead,
    addReaction,
    removeReaction,
    sendThreadReply,
    typingUsers,
    setTyping,
    searchMessages,
    connect,
    disconnect,
    reconnect,
    on,
    off,
    emit
  ]);
};

export default useEnhancedSocket;