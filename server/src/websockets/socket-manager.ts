/**
 * WebSocket Manager
 * 
 * This module manages WebSocket connections, rooms, and events.
 * It provides a centralized way to handle real-time communication.
 */

import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import { verifyJwt } from '../utils/auth';
import { logger } from '../utils/logger';
import { monitorError } from '../utils/monitoring';
import { UserRole } from '../../../shared/types/enums';

// Import event handlers
import { registerNotificationHandlers } from './handlers/notification-handlers';
import { registerChatHandlers } from './handlers/chat-handlers';
import { registerTaskHandlers } from './handlers/task-handlers';

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
  private io: SocketServer;
  private userConnections: UserConnections = {};
  
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
    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        
        if (!token) {
          return next(new Error('Authentication error: No token provided'));
        }
        
        // Verify JWT token
        const decoded = await verifyJwt(token);
        
        if (!decoded || !decoded.id) {
          return next(new Error('Authentication error: Invalid token'));
        }
        
        // Attach user data to socket
        socket.data.user = {
          id: decoded.id,
          role: decoded.role
        };
        
        next();
      } catch (error) {
        logger.warn('Socket authentication failed', { error: error.message });
        next(new Error('Authentication error'));
      }
    });
  }
  
  /**
   * Sets up event listeners for connections and disconnections
   */
  private setupEventListeners(): void {
    this.io.on('connection', (socket: Socket) => {
      const user = socket.data.user as SocketUser;
      
      // Log connection
      logger.info('Client connected to socket', { 
        socketId: socket.id,
        userId: user.id
      });
      
      // Track user connection
      this.addUserConnection(user.id, socket.id);
      
      // Join user's room for private messages
      socket.join(`user:${user.id}`);
      
      // Register event handlers
      this.registerEventHandlers(socket);
      
      // Handle disconnection
      socket.on('disconnect', (reason) => {
        logger.info('Client disconnected from socket', { 
          socketId: socket.id,
          userId: user.id,
          reason
        });
        
        // Remove user connection
        this.removeUserConnection(user.id, socket.id);
      });
    });
  }
  
  /**
   * Registers all event handlers for a socket
   */
  private registerEventHandlers(socket: Socket): void {
    try {
      registerNotificationHandlers(socket, this);
      registerChatHandlers(socket, this);
      registerTaskHandlers(socket, this);
    } catch (error) {
      monitorError(error, { component: 'SocketManager.registerEventHandlers' });
      logger.error('Error registering socket event handlers', { error });
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
