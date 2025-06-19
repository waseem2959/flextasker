/**
 * Unified Socket Manager
 * 
 * Consolidated WebSocket management combining basic functionality with advanced features:
 * - Connection management and authentication
 * - Room and presence tracking
 * - Message delivery guarantees
 * - Rate limiting and optimization
 * - Event handling and monitoring
 */

import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { Redis } from 'ioredis';
import { z } from 'zod';
import { RateLimiterRedis } from 'rate-limiter-flexible';
import { UserRole } from '../../../shared/types/common/enums';
import { logger } from '../utils/logger';
import { verifyJwt } from '../utils/security/jwt';
import { performanceMonitor } from '../monitoring/performance-monitor';

// Import event handlers
import { registerChatHandlers } from './handlers/chat-handlers';
import { registerNotificationHandlers } from './handlers/notification-handlers';
import { registerTaskHandlers } from './handlers/task-handlers';
import { registerUserHandlers, updateUserOnlineStatus } from './handlers/user-handlers';

// Enhanced interfaces
interface SocketUser {
  id: string;
  role: UserRole;
  email?: string;
  name?: string;
}

interface UserPresence {
  userId: string;
  socketId: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  lastSeen: Date;
  currentRoom?: string;
  metadata: {
    userAgent: string;
    ipAddress: string;
    platform: string;
    connectedAt: Date;
  };
}

interface SocketRoom {
  id: string;
  name: string;
  type: 'chat' | 'task' | 'notification' | 'private';
  members: Set<string>;
  metadata: {
    createdAt: Date;
    lastActivity: Date;
    messageCount: number;
  };
}

interface MessageDeliveryStatus {
  messageId: string;
  recipients: string[];
  delivered: string[];
  failed: string[];
  timestamp: Date;
}

interface ConnectionStats {
  totalConnections: number;
  authenticatedConnections: number;
  activeRooms: number;
  messagesPerSecond: number;
  averageLatency: number;
}

// Message schemas for validation
const chatMessageSchema = z.object({
  content: z.string().min(1).max(1000),
  type: z.enum(['text', 'image', 'file']).default('text'),
  recipientId: z.string().uuid().optional(),
  roomId: z.string().optional(),
  metadata: z.record(z.any()).optional()
});

const roomJoinSchema = z.object({
  roomId: z.string().min(1),
  roomType: z.enum(['chat', 'task', 'notification', 'private']).optional()
});

const presenceUpdateSchema = z.object({
  status: z.enum(['online', 'away', 'busy']),
  currentActivity: z.string().optional()
});

class UnifiedSocketManager {
  private io: Server;
  private redis: Redis;
  private rateLimiter: RateLimiterRedis;
  private presence: Map<string, UserPresence> = new Map();
  private rooms: Map<string, SocketRoom> = new Map();
  private userConnections: Map<string, Set<string>> = new Map();
  private messageDelivery: Map<string, MessageDeliveryStatus> = new Map();
  private connectionStats: ConnectionStats = {
    totalConnections: 0,
    authenticatedConnections: 0,
    activeRooms: 0,
    messagesPerSecond: 0,
    averageLatency: 0
  };

  constructor() {
    // Initialize Redis for scaling
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      retryDelayOnFailover: 100,
      enableReadyCheck: false,
      maxRetriesPerRequest: null
    });

    // Setup rate limiter
    this.rateLimiter = new RateLimiterRedis({
      storeClient: this.redis,
      keyPrefix: 'socket_rl',
      points: 100, // Number of requests
      duration: 60, // Per 60 seconds
      blockDuration: 60, // Block for 60 seconds if exceeded
      execEvenly: true
    });

    this.setupPerformanceMonitoring();
  }

  /**
   * Initialize the Socket.IO server
   */
  initialize(httpServer: HttpServer): Server {
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.CLIENT_URL || "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true
      },
      allowEIO3: true,
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 25000
    });

    // Setup Redis adapter for horizontal scaling
    this.io.adapter(createAdapter(this.redis, this.redis.duplicate()));

    // Setup middleware
    this.setupMiddleware();
    
    // Setup event handlers
    this.setupEventHandlers();
    
    // Setup cleanup processes
    this.setupCleanupProcesses();

    logger.info('Unified Socket Manager initialized');
    return this.io;
  }

  /**
   * Setup middleware for authentication and rate limiting
   */
  private setupMiddleware(): void {
    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          throw new Error('Authentication required');
        }

        const decoded = verifyJwt(token);
        if (!decoded || !decoded.userId) {
          throw new Error('Invalid token');
        }

        // Attach user data to socket
        socket.data.user = {
          id: decoded.userId,
          role: decoded.role,
          email: decoded.email,
          name: decoded.name
        };

        // Rate limiting check
        const clientIP = socket.handshake.address;
        await this.rateLimiter.consume(clientIP);

        next();
      } catch (error) {
        logger.warn('Socket authentication failed:', error);
        next(new Error('Authentication failed'));
      }
    });

    // Connection validation middleware
    this.io.use((socket, next) => {
      const userAgent = socket.handshake.headers['user-agent'] || 'Unknown';
      const platform = this.detectPlatform(userAgent);
      
      socket.data.metadata = {
        userAgent,
        platform,
        ipAddress: socket.handshake.address,
        connectedAt: new Date()
      };

      next();
    });
  }

  /**
   * Setup main event handlers
   */
  private setupEventHandlers(): void {
    this.io.on('connection', async (socket: Socket) => {
      const user: SocketUser = socket.data.user;
      const startTime = Date.now();

      try {
        // Update connection stats
        this.connectionStats.totalConnections++;
        if (user?.id) {
          this.connectionStats.authenticatedConnections++;
        }

        // Track user presence
        await this.handleUserConnection(socket, user);

        // Register specific event handlers
        this.registerSocketHandlers(socket);

        // Log successful connection
        logger.info(`User connected: ${user?.id || 'anonymous'} (${socket.id})`);

        // Record performance metric
        performanceMonitor.recordMetric('socket_connection_time', Date.now() - startTime);

        // Send welcome message
        socket.emit('connection_status', {
          status: 'connected',
          timestamp: new Date().toISOString(),
          connectionId: socket.id
        });

      } catch (error) {
        logger.error('Error handling socket connection:', error);
        socket.disconnect(true);
      }
    });
  }

  /**
   * Handle user connection and presence tracking
   */
  private async handleUserConnection(socket: Socket, user: SocketUser): Promise<void> {
    if (!user?.id) return;

    // Update user connections map
    if (!this.userConnections.has(user.id)) {
      this.userConnections.set(user.id, new Set());
    }
    this.userConnections.get(user.id)!.add(socket.id);

    // Update presence
    const presence: UserPresence = {
      userId: user.id,
      socketId: socket.id,
      status: 'online',
      lastSeen: new Date(),
      metadata: {
        ...socket.data.metadata,
        connectedAt: new Date()
      }
    };

    this.presence.set(socket.id, presence);

    // Update user online status in database
    try {
      await updateUserOnlineStatus(user.id, true);
    } catch (error) {
      logger.warn('Failed to update user online status:', error);
    }

    // Join user to their personal room
    socket.join(`user:${user.id}`);

    // Broadcast presence update to relevant rooms
    this.broadcastPresenceUpdate(user.id, 'online');
  }

  /**
   * Register event handlers for a specific socket
   */
  private registerSocketHandlers(socket: Socket): void {
    const user: SocketUser = socket.data.user;

    // Chat message handling
    socket.on('chat:message', async (data) => {
      try {
        const validatedData = chatMessageSchema.parse(data);
        await this.handleChatMessage(socket, validatedData);
      } catch (error) {
        socket.emit('error', { type: 'validation', message: 'Invalid message data' });
      }
    });

    // Room management
    socket.on('room:join', async (data) => {
      try {
        const validatedData = roomJoinSchema.parse(data);
        await this.handleRoomJoin(socket, validatedData);
      } catch (error) {
        socket.emit('error', { type: 'validation', message: 'Invalid room data' });
      }
    });

    socket.on('room:leave', async (data) => {
      await this.handleRoomLeave(socket, data.roomId);
    });

    // Presence updates
    socket.on('presence:update', async (data) => {
      try {
        const validatedData = presenceUpdateSchema.parse(data);
        await this.handlePresenceUpdate(socket, validatedData);
      } catch (error) {
        socket.emit('error', { type: 'validation', message: 'Invalid presence data' });
      }
    });

    // Typing indicators
    socket.on('typing:start', (data) => {
      this.handleTypingIndicator(socket, data, true);
    });

    socket.on('typing:stop', (data) => {
      this.handleTypingIndicator(socket, data, false);
    });

    // Message delivery confirmations
    socket.on('message:delivered', (data) => {
      this.handleMessageDelivered(socket, data.messageId);
    });

    // Disconnect handling
    socket.on('disconnect', async (reason) => {
      await this.handleUserDisconnection(socket, reason);
    });

    // Register specialized handlers
    registerChatHandlers(socket, this.io);
    registerNotificationHandlers(socket, this.io);
    registerTaskHandlers(socket, this.io);
    registerUserHandlers(socket, this.io);
  }

  /**
   * Handle chat message with delivery tracking
   */
  private async handleChatMessage(socket: Socket, data: any): Promise<void> {
    const user: SocketUser = socket.data.user;
    if (!user?.id) return;

    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date();

    try {
      // Create message object
      const message = {
        id: messageId,
        content: data.content,
        type: data.type,
        senderId: user.id,
        senderName: user.name,
        timestamp: timestamp.toISOString(),
        metadata: data.metadata
      };

      // Determine recipients
      let recipients: string[] = [];
      let targetRoom: string;

      if (data.recipientId) {
        // Private message
        recipients = [data.recipientId];
        targetRoom = `user:${data.recipientId}`;
      } else if (data.roomId) {
        // Room message
        const room = this.rooms.get(data.roomId);
        if (room) {
          recipients = Array.from(room.members);
          targetRoom = data.roomId;
        } else {
          socket.emit('error', { type: 'room_not_found', message: 'Room not found' });
          return;
        }
      } else {
        socket.emit('error', { type: 'invalid_recipient', message: 'No recipient specified' });
        return;
      }

      // Track message delivery
      this.messageDelivery.set(messageId, {
        messageId,
        recipients,
        delivered: [],
        failed: [],
        timestamp
      });

      // Send message to recipients
      if (data.recipientId) {
        this.io.to(targetRoom).emit('chat:message', message);
      } else {
        this.io.to(targetRoom).emit('chat:message', message);
      }

      // Confirm to sender
      socket.emit('message:sent', {
        messageId,
        status: 'sent',
        timestamp: timestamp.toISOString()
      });

      // Update room activity
      this.updateRoomActivity(data.roomId || targetRoom);

      // Record metrics
      this.connectionStats.messagesPerSecond++;

    } catch (error) {
      logger.error('Error handling chat message:', error);
      socket.emit('error', { type: 'message_failed', message: 'Failed to send message' });
    }
  }

  /**
   * Handle room join with validation
   */
  private async handleRoomJoin(socket: Socket, data: any): Promise<void> => {
    const user: SocketUser = socket.data.user;
    if (!user?.id) return;

    const { roomId, roomType } = data;

    try {
      // Check if room exists, create if not
      if (!this.rooms.has(roomId)) {
        this.rooms.set(roomId, {
          id: roomId,
          name: roomId,
          type: roomType || 'chat',
          members: new Set(),
          metadata: {
            createdAt: new Date(),
            lastActivity: new Date(),
            messageCount: 0
          }
        });
        this.connectionStats.activeRooms++;
      }

      const room = this.rooms.get(roomId)!;
      
      // Add user to room
      room.members.add(user.id);
      socket.join(roomId);

      // Update user presence
      const presence = this.presence.get(socket.id);
      if (presence) {
        presence.currentRoom = roomId;
      }

      // Notify room members
      socket.to(roomId).emit('room:user_joined', {
        userId: user.id,
        userName: user.name,
        roomId,
        timestamp: new Date().toISOString()
      });

      // Confirm to user
      socket.emit('room:joined', {
        roomId,
        memberCount: room.members.size,
        timestamp: new Date().toISOString()
      });

      logger.info(`User ${user.id} joined room ${roomId}`);

    } catch (error) {
      logger.error('Error handling room join:', error);
      socket.emit('error', { type: 'room_join_failed', message: 'Failed to join room' });
    }
  }

  /**
   * Handle room leave
   */
  private async handleRoomLeave(socket: Socket, roomId: string): Promise<void> {
    const user: SocketUser = socket.data.user;
    if (!user?.id || !roomId) return;

    try {
      const room = this.rooms.get(roomId);
      if (room) {
        room.members.delete(user.id);
        
        if (room.members.size === 0) {
          this.rooms.delete(roomId);
          this.connectionStats.activeRooms--;
        }
      }

      socket.leave(roomId);

      // Update presence
      const presence = this.presence.get(socket.id);
      if (presence && presence.currentRoom === roomId) {
        presence.currentRoom = undefined;
      }

      // Notify room members
      socket.to(roomId).emit('room:user_left', {
        userId: user.id,
        userName: user.name,
        roomId,
        timestamp: new Date().toISOString()
      });

      socket.emit('room:left', { roomId });

    } catch (error) {
      logger.error('Error handling room leave:', error);
    }
  }

  /**
   * Handle presence updates
   */
  private async handlePresenceUpdate(socket: Socket, data: any): Promise<void> => {
    const user: SocketUser = socket.data.user;
    if (!user?.id) return;

    const presence = this.presence.get(socket.id);
    if (presence) {
      presence.status = data.status;
      presence.lastSeen = new Date();
    }

    // Broadcast to relevant rooms
    this.broadcastPresenceUpdate(user.id, data.status);
  }

  /**
   * Handle typing indicators
   */
  private handleTypingIndicator(socket: Socket, data: any, isTyping: boolean): void {
    const user: SocketUser = socket.data.user;
    if (!user?.id) return;

    const { roomId, recipientId } = data;
    const targetRoom = recipientId ? `user:${recipientId}` : roomId;

    if (targetRoom) {
      socket.to(targetRoom).emit('typing:indicator', {
        userId: user.id,
        userName: user.name,
        isTyping,
        roomId: roomId || targetRoom,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Handle message delivery confirmation
   */
  private handleMessageDelivered(socket: Socket, messageId: string): void {
    const user: SocketUser = socket.data.user;
    if (!user?.id) return;

    const delivery = this.messageDelivery.get(messageId);
    if (delivery && !delivery.delivered.includes(user.id)) {
      delivery.delivered.push(user.id);
      
      // Notify sender if all recipients have received the message
      if (delivery.delivered.length === delivery.recipients.length) {
        this.io.emit('message:all_delivered', {
          messageId,
          deliveredAt: new Date().toISOString()
        });
      }
    }
  }

  /**
   * Handle user disconnection
   */
  private async handleUserDisconnection(socket: Socket, reason: string): Promise<void> {
    const user: SocketUser = socket.data.user;

    try {
      // Update connection stats
      this.connectionStats.totalConnections--;
      if (user?.id) {
        this.connectionStats.authenticatedConnections--;
      }

      if (user?.id) {
        // Remove from user connections
        const userSockets = this.userConnections.get(user.id);
        if (userSockets) {
          userSockets.delete(socket.id);
          
          // If user has no more connections, mark as offline
          if (userSockets.size === 0) {
            this.userConnections.delete(user.id);
            await updateUserOnlineStatus(user.id, false);
            this.broadcastPresenceUpdate(user.id, 'offline');
          }
        }

        // Remove from rooms
        const presence = this.presence.get(socket.id);
        if (presence?.currentRoom) {
          const room = this.rooms.get(presence.currentRoom);
          if (room) {
            room.members.delete(user.id);
            socket.to(presence.currentRoom).emit('room:user_left', {
              userId: user.id,
              userName: user.name,
              roomId: presence.currentRoom,
              reason: 'disconnected'
            });
          }
        }
      }

      // Clean up presence
      this.presence.delete(socket.id);

      logger.info(`User disconnected: ${user?.id || 'anonymous'} (${socket.id}) - Reason: ${reason}`);

    } catch (error) {
      logger.error('Error handling user disconnection:', error);
    }
  }

  /**
   * Broadcast presence update to relevant users
   */
  private broadcastPresenceUpdate(userId: string, status: string): void {
    // Broadcast to all rooms the user is in
    const userSockets = this.userConnections.get(userId);
    if (userSockets) {
      for (const socketId of userSockets) {
        const socket = this.io.sockets.sockets.get(socketId);
        if (socket) {
          socket.rooms.forEach(roomId => {
            if (roomId !== socketId) { // Skip the socket's own room
              socket.to(roomId).emit('presence:update', {
                userId,
                status,
                timestamp: new Date().toISOString()
              });
            }
          });
        }
      }
    }
  }

  /**
   * Update room activity timestamp
   */
  private updateRoomActivity(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (room) {
      room.metadata.lastActivity = new Date();
      room.metadata.messageCount++;
    }
  }

  /**
   * Detect platform from user agent
   */
  private detectPlatform(userAgent: string): string {
    if (/Mobile|Android|iPhone|iPad/.test(userAgent)) return 'mobile';
    if (/Electron/.test(userAgent)) return 'desktop';
    return 'web';
  }

  /**
   * Setup performance monitoring
   */
  private setupPerformanceMonitoring(): void {
    // Reset messages per second counter every second
    setInterval(() => {
      this.connectionStats.messagesPerSecond = 0;
    }, 1000);

    // Log connection stats every minute
    setInterval(() => {
      logger.info('Socket connection stats:', this.connectionStats);
      performanceMonitor.recordMetric('socket_total_connections', this.connectionStats.totalConnections);
      performanceMonitor.recordMetric('socket_authenticated_connections', this.connectionStats.authenticatedConnections);
      performanceMonitor.recordMetric('socket_active_rooms', this.connectionStats.activeRooms);
    }, 60000);
  }

  /**
   * Setup cleanup processes
   */
  private setupCleanupProcesses(): void {
    // Clean up old message delivery records every 10 minutes
    setInterval(() => {
      const now = Date.now();
      for (const [messageId, delivery] of this.messageDelivery.entries()) {
        if (now - delivery.timestamp.getTime() > 600000) { // 10 minutes
          this.messageDelivery.delete(messageId);
        }
      }
    }, 600000);

    // Clean up inactive rooms every hour
    setInterval(() => {
      const now = Date.now();
      for (const [roomId, room] of this.rooms.entries()) {
        if (room.members.size === 0 || now - room.metadata.lastActivity.getTime() > 3600000) { // 1 hour
          this.rooms.delete(roomId);
          this.connectionStats.activeRooms--;
        }
      }
    }, 3600000);
  }

  /**
   * Get current connection statistics
   */
  getConnectionStats(): ConnectionStats {
    return { ...this.connectionStats };
  }

  /**
   * Get user presence information
   */
  getUserPresence(userId: string): UserPresence[] {
    const userSockets = this.userConnections.get(userId);
    if (!userSockets) return [];

    return Array.from(userSockets)
      .map(socketId => this.presence.get(socketId))
      .filter(Boolean) as UserPresence[];
  }

  /**
   * Send message to specific user
   */
  sendToUser(userId: string, event: string, data: any): void {
    this.io.to(`user:${userId}`).emit(event, data);
  }

  /**
   * Send message to specific room
   */
  sendToRoom(roomId: string, event: string, data: any): void {
    this.io.to(roomId).emit(event, data);
  }

  /**
   * Broadcast to all connected users
   */
  broadcast(event: string, data: any): void {
    this.io.emit(event, data);
  }

  /**
   * Get Socket.IO server instance
   */
  getServer(): Server {
    return this.io;
  }
}

// Export singleton instance
export const unifiedSocketManager = new UnifiedSocketManager();
export default unifiedSocketManager;