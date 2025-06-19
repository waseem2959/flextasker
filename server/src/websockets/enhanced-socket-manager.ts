/**
 * Enhanced Socket Manager
 * 
 * Advanced WebSocket management with presence tracking, room management,
 * message delivery guarantees, and connection optimization.
 */

import { Server, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { Redis } from 'ioredis';
import { z } from 'zod';
import { RateLimiterRedis } from 'rate-limiter-flexible';
import { performanceMonitor } from '../monitoring/performance-monitor';
import { errorTracker } from '../../../src/services/monitoring/error-tracking';

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
  };
}

interface MessageDeliveryStatus {
  messageId: string;
  senderId: string;
  recipientId: string;
  status: 'sent' | 'delivered' | 'read';
  timestamp: Date;
}

interface TypingIndicator {
  userId: string;
  roomId: string;
  isTyping: boolean;
  lastUpdate: Date;
}

interface RoomMember {
  userId: string;
  socketId: string;
  role: 'owner' | 'participant' | 'observer';
  joinedAt: Date;
  permissions: string[];
}

interface SocketRoom {
  id: string;
  type: 'chat' | 'task' | 'notification' | 'admin';
  members: Map<string, RoomMember>;
  metadata: any;
  createdAt: Date;
  lastActivity: Date;
}

// Validation schemas
const joinRoomSchema = z.object({
  roomId: z.string().min(1),
  roomType: z.enum(['chat', 'task', 'notification', 'admin']),
  permissions: z.array(z.string()).optional()
});

const sendMessageSchema = z.object({
  roomId: z.string().min(1),
  content: z.string().min(1).max(5000),
  type: z.enum(['text', 'image', 'file', 'system']).default('text'),
  replyTo: z.string().optional(),
  metadata: z.record(z.any()).optional()
});

const typingSchema = z.object({
  roomId: z.string().min(1),
  isTyping: z.boolean()
});

const presenceSchema = z.object({
  status: z.enum(['online', 'away', 'busy', 'offline']),
  metadata: z.record(z.any()).optional()
});

class EnhancedSocketManager {
  private io: Server;
  private redis: Redis;
  private presence: Map<string, UserPresence> = new Map();
  private rooms: Map<string, SocketRoom> = new Map();
  private typingIndicators: Map<string, TypingIndicator> = new Map();
  private messageDelivery: Map<string, MessageDeliveryStatus> = new Map();
  private connectionLimiter: RateLimiterRedis;
  private messageLimiter: RateLimiterRedis;

  constructor(io: Server) {
    this.io = io;
    this.initializeRedis();
    this.setupRateLimiters();
    this.setupMiddleware();
    this.setupEventHandlers();
    this.startCleanupTasks();
  }

  /**
   * Initialize Redis adapter and connection
   */
  private async initializeRedis(): Promise<void> {
    try {
      if (process.env.REDIS_URL) {
        this.redis = new Redis(process.env.REDIS_URL);
        
        // Setup Redis adapter for horizontal scaling
        const pubClient = new Redis(process.env.REDIS_URL);
        const subClient = pubClient.duplicate();
        
        this.io.adapter(createAdapter(pubClient, subClient));
        
        console.log('✅ Socket.IO Redis adapter initialized');
      } else {
        console.warn('⚠️ Redis not configured for Socket.IO, using memory adapter');
      }
    } catch (error) {
      console.error('❌ Failed to initialize Redis adapter:', error);
    }
  }

  /**
   * Setup rate limiters for connection and message sending
   */
  private setupRateLimiters(): void {
    this.connectionLimiter = new RateLimiterRedis({
      storeClient: this.redis,
      keyGenerator: (req) => req.ip,
      points: 10, // 10 connections
      duration: 60, // per minute
      blockDuration: 60 * 5 // block for 5 minutes
    });

    this.messageLimiter = new RateLimiterRedis({
      storeClient: this.redis,
      keyGenerator: (req) => req.userId,
      points: 60, // 60 messages
      duration: 60, // per minute
      blockDuration: 60 // block for 1 minute
    });
  }

  /**
   * Setup middleware for authentication and rate limiting
   */
  private setupMiddleware(): void {
    this.io.use(async (socket, next) => {
      try {
        // Rate limiting by IP
        await this.connectionLimiter.consume(socket.handshake.address);

        // Authentication
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('Authentication required'));
        }

        // Verify token and get user info
        const user = await this.verifyToken(token);
        if (!user) {
          return next(new Error('Invalid token'));
        }

        socket.userId = user.id;
        socket.userRole = user.role;
        next();

      } catch (error) {
        if (error.name === 'RateLimiterError') {
          next(new Error('Too many connection attempts'));
        } else {
          next(error);
        }
      }
    });
  }

  /**
   * Setup main event handlers
   */
  private setupEventHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      this.handleConnection(socket);
      
      // Core events
      socket.on('join_room', (data) => this.handleJoinRoom(socket, data));
      socket.on('leave_room', (data) => this.handleLeaveRoom(socket, data));
      socket.on('send_message', (data) => this.handleSendMessage(socket, data));
      socket.on('typing', (data) => this.handleTyping(socket, data));
      socket.on('presence', (data) => this.handlePresenceUpdate(socket, data));
      socket.on('message_read', (data) => this.handleMessageRead(socket, data));
      
      // Connection events
      socket.on('disconnect', () => this.handleDisconnection(socket));
      socket.on('error', (error) => this.handleError(socket, error));
    });
  }

  /**
   * Handle new socket connection
   */
  private async handleConnection(socket: Socket): Promise<void> {
    const timer = performanceMonitor.startTimer();
    
    try {
      const userId = socket.userId;
      const userAgent = socket.handshake.headers['user-agent'] || 'Unknown';
      const ipAddress = socket.handshake.address;
      
      // Update user presence
      const presence: UserPresence = {
        userId,
        socketId: socket.id,
        status: 'online',
        lastSeen: new Date(),
        metadata: {
          userAgent,
          ipAddress,
          platform: this.detectPlatform(userAgent)
        }
      };
      
      this.presence.set(userId, presence);
      
      // Join user to their personal notification room
      await socket.join(`user:${userId}`);
      
      // Emit user online status to relevant rooms
      await this.broadcastPresenceUpdate(userId, presence);
      
      // Send initial data to client
      socket.emit('connection_established', {
        socketId: socket.id,
        presence: this.getPublicPresence(presence),
        unreadCount: await this.getUnreadCount(userId)
      });

      timer();
      
      console.log(`✅ User ${userId} connected (${socket.id})`);

    } catch (error) {
      timer();
      errorTracker.reportError(error as Error, {
        customTags: {
          context: 'socket_connection',
          userId: socket.userId,
          socketId: socket.id
        }
      });
    }
  }

  /**
   * Handle user joining a room
   */
  private async handleJoinRoom(socket: Socket, data: any): Promise<void> {
    try {
      const { roomId, roomType, permissions = [] } = joinRoomSchema.parse(data);
      const userId = socket.userId;

      // Check permissions
      const canJoin = await this.checkRoomPermissions(userId, roomId, roomType);
      if (!canJoin) {
        socket.emit('error', { message: 'Insufficient permissions to join room' });
        return;
      }

      // Leave current room if in one
      if (socket.currentRoom) {
        await this.handleLeaveRoom(socket, { roomId: socket.currentRoom });
      }

      // Join the room
      await socket.join(roomId);
      socket.currentRoom = roomId;

      // Update room data
      if (!this.rooms.has(roomId)) {
        this.rooms.set(roomId, {
          id: roomId,
          type: roomType,
          members: new Map(),
          metadata: {},
          createdAt: new Date(),
          lastActivity: new Date()
        });
      }

      const room = this.rooms.get(roomId)!;
      room.members.set(userId, {
        userId,
        socketId: socket.id,
        role: permissions.includes('admin') ? 'owner' : 'participant',
        joinedAt: new Date(),
        permissions
      });
      room.lastActivity = new Date();

      // Update presence
      const presence = this.presence.get(userId);
      if (presence) {
        presence.currentRoom = roomId;
      }

      // Notify room members
      socket.to(roomId).emit('user_joined', {
        userId,
        roomId,
        timestamp: new Date().toISOString()
      });

      // Send room data to user
      socket.emit('room_joined', {
        roomId,
        roomType,
        memberCount: room.members.size,
        members: Array.from(room.members.values()).map(m => ({
          userId: m.userId,
          role: m.role,
          joinedAt: m.joinedAt
        }))
      });

      console.log(`📍 User ${userId} joined room ${roomId}`);

    } catch (error) {
      socket.emit('error', { 
        message: 'Failed to join room',
        details: error instanceof z.ZodError ? error.errors : 'Invalid request'
      });
    }
  }

  /**
   * Handle user leaving a room
   */
  private async handleLeaveRoom(socket: Socket, data: any): Promise<void> {
    try {
      const { roomId } = data;
      const userId = socket.userId;

      await socket.leave(roomId);
      socket.currentRoom = undefined;

      // Update room data
      const room = this.rooms.get(roomId);
      if (room) {
        room.members.delete(userId);
        
        // Remove room if empty
        if (room.members.size === 0) {
          this.rooms.delete(roomId);
        }
      }

      // Update presence
      const presence = this.presence.get(userId);
      if (presence) {
        presence.currentRoom = undefined;
      }

      // Notify room members
      socket.to(roomId).emit('user_left', {
        userId,
        roomId,
        timestamp: new Date().toISOString()
      });

      socket.emit('room_left', { roomId });

      console.log(`📍 User ${userId} left room ${roomId}`);

    } catch (error) {
      socket.emit('error', { message: 'Failed to leave room' });
    }
  }

  /**
   * Handle message sending
   */
  private async handleSendMessage(socket: Socket, data: any): Promise<void> {
    try {
      // Rate limiting
      await this.messageLimiter.consume(socket.userId);

      const messageData = sendMessageSchema.parse(data);
      const userId = socket.userId;
      const messageId = this.generateMessageId();

      // Validate room membership
      const room = this.rooms.get(messageData.roomId);
      if (!room || !room.members.has(userId)) {
        socket.emit('error', { message: 'Not a member of this room' });
        return;
      }

      // Create message object
      const message = {
        id: messageId,
        senderId: userId,
        roomId: messageData.roomId,
        content: messageData.content,
        type: messageData.type,
        replyTo: messageData.replyTo,
        metadata: messageData.metadata,
        timestamp: new Date().toISOString(),
        editedAt: null,
        deliveryStatus: 'sent' as const
      };

      // Save message to database
      await this.saveMessage(message);

      // Track delivery status for each room member
      for (const member of room.members.values()) {
        if (member.userId !== userId) {
          this.messageDelivery.set(`${messageId}:${member.userId}`, {
            messageId,
            senderId: userId,
            recipientId: member.userId,
            status: 'sent',
            timestamp: new Date()
          });
        }
      }

      // Broadcast message to room
      this.io.to(messageData.roomId).emit('message', message);

      // Update room activity
      room.lastActivity = new Date();

      // Clear typing indicator for sender
      const typingKey = `${userId}:${messageData.roomId}`;
      if (this.typingIndicators.has(typingKey)) {
        this.typingIndicators.delete(typingKey);
        socket.to(messageData.roomId).emit('typing_stopped', {
          userId,
          roomId: messageData.roomId
        });
      }

      // Send delivery confirmation to sender
      socket.emit('message_sent', {
        messageId,
        tempId: data.tempId, // Client-side temporary ID
        timestamp: message.timestamp
      });

      console.log(`💬 Message sent by ${userId} to room ${messageData.roomId}`);

    } catch (error) {
      if (error.name === 'RateLimiterError') {
        socket.emit('error', { message: 'Message rate limit exceeded' });
      } else {
        socket.emit('error', { 
          message: 'Failed to send message',
          details: error instanceof z.ZodError ? error.errors : 'Invalid message format'
        });
      }
    }
  }

  /**
   * Handle typing indicators
   */
  private async handleTyping(socket: Socket, data: any): Promise<void> {
    try {
      const { roomId, isTyping } = typingSchema.parse(data);
      const userId = socket.userId;
      const typingKey = `${userId}:${roomId}`;

      // Validate room membership
      const room = this.rooms.get(roomId);
      if (!room || !room.members.has(userId)) {
        return;
      }

      if (isTyping) {
        this.typingIndicators.set(typingKey, {
          userId,
          roomId,
          isTyping: true,
          lastUpdate: new Date()
        });

        socket.to(roomId).emit('typing_started', {
          userId,
          roomId,
          timestamp: new Date().toISOString()
        });

        // Auto-clear typing after 3 seconds
        setTimeout(() => {
          if (this.typingIndicators.get(typingKey)?.isTyping) {
            this.handleTyping(socket, { roomId, isTyping: false });
          }
        }, 3000);

      } else {
        this.typingIndicators.delete(typingKey);
        socket.to(roomId).emit('typing_stopped', {
          userId,
          roomId,
          timestamp: new Date().toISOString()
        });
      }

    } catch (error) {
      // Silently ignore typing errors
    }
  }

  /**
   * Handle presence updates
   */
  private async handlePresenceUpdate(socket: Socket, data: any): Promise<void> {
    try {
      const { status, metadata = {} } = presenceSchema.parse(data);
      const userId = socket.userId;
      
      const presence = this.presence.get(userId);
      if (presence) {
        presence.status = status;
        presence.lastSeen = new Date();
        presence.metadata = { ...presence.metadata, ...metadata };

        await this.broadcastPresenceUpdate(userId, presence);
        
        socket.emit('presence_updated', {
          status,
          timestamp: presence.lastSeen.toISOString()
        });
      }

    } catch (error) {
      socket.emit('error', { message: 'Invalid presence data' });
    }
  }

  /**
   * Handle message read receipts
   */
  private async handleMessageRead(socket: Socket, data: any): Promise<void> {
    try {
      const { messageId, roomId } = data;
      const userId = socket.userId;

      // Update delivery status
      const deliveryKey = `${messageId}:${userId}`;
      const delivery = this.messageDelivery.get(deliveryKey);
      
      if (delivery) {
        delivery.status = 'read';
        delivery.timestamp = new Date();

        // Notify sender about read receipt
        const room = this.rooms.get(roomId);
        if (room) {
          socket.to(roomId).emit('message_read', {
            messageId,
            readerId: userId,
            timestamp: delivery.timestamp.toISOString()
          });
        }
      }

    } catch (error) {
      // Silently ignore read receipt errors
    }
  }

  /**
   * Handle socket disconnection
   */
  private async handleDisconnection(socket: Socket): Promise<void> {
    const timer = performanceMonitor.startTimer();
    
    try {
      const userId = socket.userId;
      
      if (!userId) return;

      // Update presence to offline
      const presence = this.presence.get(userId);
      if (presence) {
        presence.status = 'offline';
        presence.lastSeen = new Date();
        
        // Broadcast offline status after a delay (grace period for reconnection)
        setTimeout(async () => {
          const currentPresence = this.presence.get(userId);
          if (currentPresence && currentPresence.socketId === socket.id) {
            await this.broadcastPresenceUpdate(userId, currentPresence);
            this.presence.delete(userId);
          }
        }, 30000); // 30 second grace period
      }

      // Remove from all rooms
      if (socket.currentRoom) {
        await this.handleLeaveRoom(socket, { roomId: socket.currentRoom });
      }

      // Clear typing indicators
      for (const [key, indicator] of this.typingIndicators.entries()) {
        if (indicator.userId === userId) {
          this.typingIndicators.delete(key);
          socket.to(indicator.roomId).emit('typing_stopped', {
            userId,
            roomId: indicator.roomId
          });
        }
      }

      timer();
      console.log(`❌ User ${userId} disconnected (${socket.id})`);

    } catch (error) {
      timer();
      errorTracker.reportError(error as Error, {
        customTags: {
          context: 'socket_disconnection',
          userId: socket.userId,
          socketId: socket.id
        }
      });
    }
  }

  /**
   * Handle socket errors
   */
  private handleError(socket: Socket, error: Error): void {
    errorTracker.reportError(error, {
      customTags: {
        context: 'socket_error',
        userId: socket.userId,
        socketId: socket.id
      }
    });
    
    console.error(`⚠️ Socket error for user ${socket.userId}:`, error);
  }

  // Helper methods

  private async verifyToken(token: string): Promise<any> {
    // Implement JWT verification
    // This should validate the token and return user info
    return { id: 'user123', role: 'user' }; // Placeholder
  }

  private detectPlatform(userAgent: string): string {
    if (userAgent.includes('Mobile')) return 'mobile';
    if (userAgent.includes('Tablet')) return 'tablet';
    return 'desktop';
  }

  private async checkRoomPermissions(userId: string, roomId: string, roomType: string): Promise<boolean> {
    // Implement permission checking logic
    return true; // Placeholder
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async saveMessage(message: any): Promise<void> {
    // Implement message persistence
    console.log('Saving message:', message.id);
  }

  private async getUnreadCount(userId: string): Promise<number> {
    // Implement unread count logic
    return 0; // Placeholder
  }

  private getPublicPresence(presence: UserPresence): any {
    return {
      userId: presence.userId,
      status: presence.status,
      lastSeen: presence.lastSeen,
      platform: presence.metadata.platform
    };
  }

  private async broadcastPresenceUpdate(userId: string, presence: UserPresence): Promise<void> {
    // Broadcast to all rooms where user is a member
    const publicPresence = this.getPublicPresence(presence);
    
    for (const room of this.rooms.values()) {
      if (room.members.has(userId)) {
        this.io.to(room.id).emit('presence_update', publicPresence);
      }
    }
    
    // Also broadcast to user's personal room
    this.io.to(`user:${userId}`).emit('presence_update', publicPresence);
  }

  /**
   * Cleanup tasks for expired data
   */
  private startCleanupTasks(): void {
    // Clean up old typing indicators every 30 seconds
    setInterval(() => {
      const now = new Date();
      for (const [key, indicator] of this.typingIndicators.entries()) {
        if (now.getTime() - indicator.lastUpdate.getTime() > 5000) {
          this.typingIndicators.delete(key);
          this.io.to(indicator.roomId).emit('typing_stopped', {
            userId: indicator.userId,
            roomId: indicator.roomId
          });
        }
      }
    }, 30000);

    // Clean up old delivery statuses every 5 minutes
    setInterval(() => {
      const now = new Date();
      for (const [key, delivery] of this.messageDelivery.entries()) {
        if (now.getTime() - delivery.timestamp.getTime() > 24 * 60 * 60 * 1000) {
          this.messageDelivery.delete(key);
        }
      }
    }, 5 * 60 * 1000);
  }

  /**
   * Public API methods
   */

  public async sendNotification(userId: string, notification: any): Promise<void> {
    this.io.to(`user:${userId}`).emit('notification', {
      ...notification,
      timestamp: new Date().toISOString()
    });
  }

  public async broadcastToRoom(roomId: string, event: string, data: any): Promise<void> {
    this.io.to(roomId).emit(event, {
      ...data,
      timestamp: new Date().toISOString()
    });
  }

  public getUserPresence(userId: string): UserPresence | null {
    return this.presence.get(userId) || null;
  }

  public getRoomInfo(roomId: string): SocketRoom | null {
    return this.rooms.get(roomId) || null;
  }

  public getConnectedUsers(): string[] {
    return Array.from(this.presence.keys());
  }

  public async disconnectUser(userId: string, reason?: string): Promise<void> {
    const presence = this.presence.get(userId);
    if (presence) {
      const socket = this.io.sockets.sockets.get(presence.socketId);
      if (socket) {
        socket.emit('force_disconnect', { reason });
        socket.disconnect(true);
      }
    }
  }
}

export default EnhancedSocketManager;