/**
 * Socket Manager
 * 
 * This module provides centralized socket.io management for the application.
 * It handles connection setup, authentication, room management, and event broadcasting.
 */

import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import { verify } from 'jsonwebtoken';
import { logger } from '../logger';
import { monitorError } from '../monitoring';
import { UserRole } from '../../../../shared/types/enums';

// Event types for typed event handling
export enum SocketEvent {
  // Connection events
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  ERROR = 'error',
  
  // Authentication events
  AUTHENTICATE = 'authenticate',
  AUTHENTICATION_ERROR = 'authentication_error',
  
  // Notification events
  NOTIFICATION_NEW = 'notification:new',
  NOTIFICATION_READ = 'notification:read',
  NOTIFICATION_DELETE = 'notification:delete',
  
  // Task events
  TASK_CREATED = 'task:created',
  TASK_UPDATED = 'task:updated',
  TASK_DELETED = 'task:deleted',
  TASK_STATUS_CHANGED = 'task:status_changed',
  
  // Bid events
  BID_CREATED = 'bid:created',
  BID_UPDATED = 'bid:updated',
  BID_ACCEPTED = 'bid:accepted',
  BID_REJECTED = 'bid:rejected',
  BID_WITHDRAWN = 'bid:withdrawn',
  
  // Chat events
  CHAT_MESSAGE = 'chat:message',
  CHAT_TYPING = 'chat:typing',
  CHAT_READ = 'chat:read'
}

// Room types for consistent room naming
export enum SocketRoom {
  USER = 'user:',
  TASK = 'task:',
  CONVERSATION = 'conversation:'
}

// Socket connection with authenticated user data
export interface AuthenticatedSocket extends Socket {
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
  };
}

/**
 * Socket manager singleton for socket.io operations
 */
export class SocketManager {
  private io: SocketServer | null = null;
  private connectedUsers: Map<string, string[]> = new Map(); // userId -> socketIds[]
  
  /**
   * Initialize socket.io server
   * @param server HTTP server instance
   */
  public initialize(server: HttpServer): SocketServer {
    if (this.io) {
      return this.io;
    }
    
    // Create socket.io server with CORS configuration
    this.io = new SocketServer(server, {
      cors: {
        origin: process.env.NODE_ENV === 'production' 
          ? process.env.CLIENT_URL 
          : 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });
    
    // Set up middleware for authentication
    this.io.use(this.authMiddleware.bind(this));
    
    // Set up connection handler
    this.io.on(SocketEvent.CONNECT, this.handleConnection.bind(this));
    
    logger.info('Socket.IO server initialized');
    
    return this.io;
  }
  
  /**
   * Get the socket.io server instance
   */
  public getIO(): SocketServer {
    if (!this.io) {
      throw new Error('Socket.IO not initialized');
    }
    return this.io;
  }
  
  /**
   * Authentication middleware for socket connections
   */
  private async authMiddleware(socket: AuthenticatedSocket, next: (err?: Error) => void) {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
      
      if (!token) {
        logger.debug('Socket authentication failed: No token provided');
        return next(new Error('Authentication required'));
      }
      
      // Verify JWT token
      const decoded = verify(token, process.env.JWT_SECRET || 'default_secret') as any;
      
      // Add user data to socket
      socket.user = {
        id: decoded.id,
        email: decoded.email,
        firstName: decoded.firstName,
        lastName: decoded.lastName,
        role: decoded.role
      };
      
      next();
    } catch (error) {
      logger.error('Socket authentication error', { error });
      monitorError(error, { component: 'SocketManager.authMiddleware' });
      next(new Error('Authentication failed'));
    }
  }
  
  /**
   * Handle new socket connections
   */
  private handleConnection(socket: AuthenticatedSocket) {
    if (!socket.user) {
      logger.debug('Unauthenticated socket connection, disconnecting');
      socket.emit(SocketEvent.AUTHENTICATION_ERROR, { message: 'Authentication required' });
      socket.disconnect(true);
      return;
    }
    
    const { id: userId } = socket.user;
    
    logger.debug('Socket connected', { userId, socketId: socket.id });
    
    // Add to user's room for direct messages
    this.joinRoom(socket, `${SocketRoom.USER}${userId}`);
    
    // Track connected user
    if (!this.connectedUsers.has(userId)) {
      this.connectedUsers.set(userId, []);
    }
    this.connectedUsers.get(userId)?.push(socket.id);
    
    // Set up disconnect handler
    socket.on(SocketEvent.DISCONNECT, () => this.handleDisconnect(socket));
    
    // Emit successful connection
    socket.emit(SocketEvent.CONNECT, { 
      message: 'Successfully connected to WebSocket server',
      user: {
        id: socket.user.id,
        firstName: socket.user.firstName,
        lastName: socket.user.lastName
      }
    });
  }
  
  /**
   * Handle socket disconnections
   */
  private handleDisconnect(socket: AuthenticatedSocket) {
    if (!socket.user) return;
    
    const { id: userId } = socket.user;
    
    logger.debug('Socket disconnected', { userId, socketId: socket.id });
    
    // Remove from tracked connections
    const sockets = this.connectedUsers.get(userId);
    if (sockets) {
      const updated = sockets.filter(id => id !== socket.id);
      
      if (updated.length === 0) {
        this.connectedUsers.delete(userId);
      } else {
        this.connectedUsers.set(userId, updated);
      }
    }
  }
  
  /**
   * Join a socket to a room
   */
  public joinRoom(socket: Socket, room: string): void {
    socket.join(room);
    logger.debug('Socket joined room', { socketId: socket.id, room });
  }
  
  /**
   * Leave a room
   */
  public leaveRoom(socket: Socket, room: string): void {
    socket.leave(room);
    logger.debug('Socket left room', { socketId: socket.id, room });
  }
  
  /**
   * Emit an event to a specific user
   */
  public emitToUser(userId: string, event: SocketEvent, data: any): void {
    if (!this.io) return;
    
    this.io.to(`${SocketRoom.USER}${userId}`).emit(event, data);
    logger.debug('Emitted event to user', { userId, event });
  }
  
  /**
   * Emit an event to a specific task room
   */
  public emitToTask(taskId: string, event: SocketEvent, data: any): void {
    if (!this.io) return;
    
    this.io.to(`${SocketRoom.TASK}${taskId}`).emit(event, data);
    logger.debug('Emitted event to task room', { taskId, event });
  }
  
  /**
   * Emit an event to a conversation room
   */
  public emitToConversation(conversationId: string, event: SocketEvent, data: any): void {
    if (!this.io) return;
    
    this.io.to(`${SocketRoom.CONVERSATION}${conversationId}`).emit(event, data);
    logger.debug('Emitted event to conversation', { conversationId, event });
  }
  
  /**
   * Broadcast an event to all connected clients
   */
  public broadcast(event: SocketEvent, data: any): void {
    if (!this.io) return;
    
    this.io.emit(event, data);
    logger.debug('Broadcasted event to all clients', { event });
  }
  
  /**
   * Check if a user is online (has active sockets)
   */
  public isUserOnline(userId: string): boolean {
    return this.connectedUsers.has(userId) && 
           (this.connectedUsers.get(userId)?.length || 0) > 0;
  }
  
  /**
   * Get count of connected users
   */
  public getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }
  
  /**
   * Get all connected socket IDs for a user
   */
  public getUserSocketIds(userId: string): string[] {
    return this.connectedUsers.get(userId) || [];
  }
}

// Export singleton instance
export const socketManager = new SocketManager();

export default socketManager;
