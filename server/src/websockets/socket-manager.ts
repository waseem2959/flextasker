/**
 * WebSocket Manager
 * 
 * This module manages WebSocket connections, rooms, and events.
 * It provides a centralized way to handle real-time communication.
 */

import { Server as HttpServer } from 'http';
import { Socket, Server as SocketServer } from 'socket.io';
import { UserRole } from '../../../shared/types/enums';
import { logger } from '../utils/logger';
import { monitorError } from '../utils/monitoring';
import metricsService from '../utils/monitoring/metrics-service';
import { verifyJwt } from '../utils/security/jwt';

// Import event handlers
import { registerChatHandlers } from './handlers/chat-handlers';
import { registerNotificationHandlers } from './handlers/notification-handlers';
import { registerTaskHandlers } from './handlers/task-handlers';
import { registerUserHandlers, updateUserOnlineStatus } from './handlers/user-handlers';

// Socket user data interface
interface SocketUser {
  id: string;
  role: UserRole;
}

// User connection mapping
interface UserConnections {
  [userId: string]: string[]; // Array of socket IDs for each user
}

export class SocketManager {
  private readonly io: SocketServer;
  private readonly userConnections: UserConnections = {};
  
  constructor(server: HttpServer) {
    // Initialize Socket.IO with CORS configuration
    this.io = new SocketServer(server, {
      cors: {
        origin: process.env.NODE_ENV === 'production' 
          ? ['https://flextasker.com', 'https://www.flextasker.com'] 
          : ['http://localhost:3000'],
        methods: ['GET', 'POST'],
        credentials: true
      },
      // Ping timeout settings to detect disconnections
      pingTimeout: 30000,
      pingInterval: 25000
    });
    
    // Set up middleware and event listeners
    this.setupMiddleware();
    this.setupEventListeners();
    
    logger.info('SocketManager initialized');
  }
  
  /**
   * Sets up authentication middleware and other middleware
   */
  private setupMiddleware(): void {
    // Add authentication middleware to validate JWT tokens
    this.io.use((socket, next) => {
      try {
        const token = socket.handshake.auth.token ?? 
                      socket.handshake.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          return next(new Error('Authentication required'));
        }
        
        // Verify JWT token
        const decoded = verifyJwt(token);
        
        // Set user data on socket
        socket.data.user = {
          id: decoded.userId,
          role: decoded.role ?? UserRole.USER
        };
        
        // Join user's personal room
        socket.join(`user:${decoded.userId}`);
        
        // Add to user connections mapping
        this.addUserConnection(decoded.userId, socket.id);
        
        next();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.warn('Socket authentication failed', { error: errorMessage });
        next(new Error('Authentication failed'));
      }
    });
  }
  
  /**
   * Sets up event listeners for connections and disconnections
   */
  private setupEventListeners(): void {
    this.io.on('connection', (socket) => {
      try {
        const user = socket.data.user;
        logger.info('Socket connected', { userId: user.id, socketId: socket.id });
        
        // Wrap socket emit with metrics tracking
        metricsService.wrapSocketEmit(socket);
        
        // Track connection event
        metricsService.trackWebSocketEvent('connection', false, 'system', socket.data?.user?.id);
        
        // Update user online status and notify contacts
        updateUserOnlineStatus(this, user.id, true);
        
        // Set up disconnect handler
        socket.on('disconnect', () => {
          // Track disconnect event
          metricsService.trackWebSocketEvent('disconnect', false, 'system', socket.data?.user?.id);
          this.handleDisconnect(socket);
        });
        
        // Register event handlers
        registerNotificationHandlers(socket, this);
        registerChatHandlers(socket, this);
        registerTaskHandlers(socket, this);
        registerUserHandlers(socket, this);
        
        // Track handlers registration
        metricsService.trackWebSocketEvent('handlers_registered', true, 'system', socket.data?.user?.id);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error('Error setting up socket event handlers', { error: errorMessage });
      }
    });
  }
  
  /**
   * Handles socket disconnection
   */
  private handleDisconnect(socket: Socket): void {
    try {
      logger.debug('Socket disconnected', { socketId: socket.id });
      
      // Get user info before removing connection
      const userId = Object.keys(this.userConnections).find(userId => 
        this.userConnections[userId]?.includes(socket.id)
      );
      
      // Remove from connections and notify if it was the last connection
      if (userId) {
        this.removeUserConnection(userId, socket.id);
        
        // If user has no more connections, notify others they went offline
        if (!this.userConnections[userId] || this.userConnections[userId].length === 0) {
          // Update user online status and notify contacts
          updateUserOnlineStatus(this, userId, false);
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      monitorError(new Error(errorMessage), { component: 'SocketManager.handleDisconnect' });
    }
  }
  
  /**
   * Adds a user connection to the tracking map
   */
  private addUserConnection(userId: string, socketId: string): void {
    if (!this.userConnections[userId]) {
      this.userConnections[userId] = [];
    }
    
    this.userConnections[userId].push(socketId);
  }
  
  /**
   * Removes a user connection from the tracking map
   */
  private removeUserConnection(userId: string, socketId: string): void {
    if (this.userConnections[userId]) {
      this.userConnections[userId] = this.userConnections[userId].filter(
        id => id !== socketId
      );
      
      // Clean up if user has no connections
      if (this.userConnections[userId].length === 0) {
        delete this.userConnections[userId];
      }
    }
  }
  
  /**
   * Sends an event to a specific user
   */
  public sendToUser(userId: string, event: string, data: any): void {
    this.io.to(`user:${userId}`).emit(event, data);
  }
  
  /**
   * Sends an event to multiple users
   */
  public sendToUsers(userIds: string[], event: string, data: any): void {
    userIds.forEach(userId => {
      this.sendToUser(userId, event, data);
    });
  }
  
  /**
   * Sends an event to a specific task room
   */
  public sendToTask(taskId: string, event: string, data: any): void {
    this.io.to(`task:${taskId}`).emit(event, data);
  }
  
  /**
   * Sends an event to all connected clients
   */
  public broadcast(event: string, data: any): void {
    this.io.emit(event, data);
  }
  
  /**
   * Sends an event to all clients with a specific role
   */
  public broadcastToRole(role: UserRole, event: string, data: any): void {
    // Get all sockets
    this.io.fetchSockets().then(sockets => {
      sockets.forEach(socket => {
        const user = socket.data.user as SocketUser;
        if (user && user.role === role) {
          socket.emit(event, data);
        }
      });
    }).catch(error => {
      monitorError(error, { component: 'SocketManager.broadcastToRole' });
    });
  }
  
  /**
   * Checks if a user is online (has active connections)
   */
  public isUserOnline(userId: string): boolean {
    return !!this.userConnections[userId] && this.userConnections[userId].length > 0;
  }
  
  /**
   * Gets the number of connections for a user
   */
  public getUserConnectionCount(userId: string): number {
    return this.userConnections[userId]?.length || 0;
  }
  
  /**
   * Gets the Socket.IO server instance
   */
  public getIo(): SocketServer {
    return this.io;
  }
}
