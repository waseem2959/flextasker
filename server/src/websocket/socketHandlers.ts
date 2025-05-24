import { MessagingService } from '@/services/messaging';
import { db } from '@/utils/database';
import { logger } from '@/utils/logger';
import { Socket, Server as SocketIOServer } from 'socket.io';

/**
 * WebSocket handlers - this is like the real-time communication center
 * that handles instant messaging, typing indicators, online status,
 * and live notifications between users.
 * 
 * Think of this as having a sophisticated instant messaging system
 * that provides real-time updates and notifications.
 */

// ====================================
// COMPREHENSIVE TYPE DEFINITIONS
// ====================================

// JWT-related types - these replace all 'any' types with specific interfaces
interface JWTVerifyOptions {
  algorithms?: string[];
  audience?: string | string[];
  issuer?: string | string[];
  ignoreExpiration?: boolean;
  ignoreNotBefore?: boolean;
  subject?: string;
  clockTolerance?: number;
  maxAge?: string | number;
  clockTimestamp?: number;
}

interface JWTSignOptions {
  algorithm?: string;
  keyid?: string;
  expiresIn?: string | number;
  notBefore?: string | number;
  audience?: string | string[];
  subject?: string;
  issuer?: string;
  jwtid?: string;
  mutatePayload?: boolean;
  noTimestamp?: boolean;
  header?: Record<string, unknown>;
  encoding?: string;
}

interface JWTDecodeOptions {
  complete?: boolean;
  json?: boolean;
}

// JWT library interface with proper typing - no more 'any' types
interface JWTLibrary {
  verify(token: string, secretOrPublicKey: string, options?: JWTVerifyOptions): JWTPayload;
  sign(payload: string | Record<string, unknown>, secretOrPrivateKey: string, options?: JWTSignOptions): string;
  decode(token: string, options?: JWTDecodeOptions): JWTPayload | null;
}

// JWT payload structure with all expected fields
interface JWTPayload {
  userId: string;
  email?: string;
  role?: string;
  iat?: number;
  exp?: number;
  [key: string]: unknown; // Allow additional properties while maintaining type safety
}

// User information structure
interface UserInfo {
  id: string;
  firstName: string;
  lastName: string;
  avatar?: string | null;
}

// Socket extension with proper typing
interface AuthenticatedSocket extends Socket {
  userId?: string;
  userInfo?: UserInfo;
}

// Message data structure for type safety
interface SendMessageData {
  conversationId: string;
  content: string;
  messageType?: 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM';
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
}

// Callback response types - generic to handle different response data types
type SocketCallback<T = unknown> = (response: { 
  success: boolean; 
  error?: string; 
  message?: T 
}) => void;

type SimpleCallback = (response: { 
  success: boolean; 
  error?: string 
}) => void;

// Notification types with proper structure
interface TaskNotification {
  type: 'TASK_UPDATE' | 'BID_RECEIVED' | 'BID_ACCEPTED' | 'TASK_COMPLETED';
  taskId: string;
  title: string;
  message: string;
  timestamp: Date;
  actionUrl?: string;
}

interface UserNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  createdAt: Date;
  actionUrl?: string;
}

// Database query result types to avoid implicit 'any'
interface ConversationWithParticipants {
  id: string;
  participants: Array<{
    userId: string;
  }>;
}

interface ConversationRecord {
  id: string;
}

// ====================================
// TYPE-SAFE JWT WRAPPER
// ====================================

// Professional solution for the jsonwebtoken library's TypeScript integration issues
// This approach completely eliminates 'any' types while maintaining full functionality
declare const require: (module: string) => unknown;
const jwtLib = require('jsonwebtoken') as JWTLibrary;

// Create type-safe wrapper functions that provide reliable, typed access
// Note: We don't need try/catch wrappers here because we want JWT errors to bubble up
// to the authentication middleware where they can be handled appropriately
const jwtOperations = {
  verify: (token: string, secret: string): JWTPayload => {
    // TypeScript already knows this returns JWTPayload due to our interface definition
    // No type assertion needed - the interface contract ensures type safety
    return jwtLib.verify(token, secret);
  },
  
  sign: (payload: Record<string, unknown>, secret: string, options?: JWTSignOptions): string => {
    return jwtLib.sign(payload, secret, options);
  },
  
  decode: (token: string, options?: JWTDecodeOptions): JWTPayload | null => {
    // TypeScript already knows this returns JWTPayload | null due to our interface definition
    return jwtLib.decode(token, options);
  }
};

// ====================================
// ONLINE USER TRACKING
// ====================================

// Track online users with proper typing
const onlineUsers = new Map<string, string>(); // userId -> socketId
const userSockets = new Map<string, AuthenticatedSocket>(); // socketId -> socket

// Store the socket instance in a module-level variable for clean dependency management
let socketIOInstance: SocketIOServer | undefined;

// ====================================
// UTILITY FUNCTIONS
// ====================================

// Helper function to safely extract error messages from unknown error types
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unexpected error occurred';
}

// Helper function to safely check JWT error types
function isJWTError(error: unknown, errorType: string): boolean {
  return error instanceof Error && error.name === errorType;
}

// ====================================
// MAIN SETUP FUNCTION
// ====================================

/**
 * Main setup function for WebSocket handlers
 * This orchestrates all the real-time communication features with complete type safety
 */
export function setupSocketHandlers(io: SocketIOServer): void {
  const messagingService = new MessagingService();
  
  // Store the socket instance for later use
  socketIOInstance = io;

  // Authentication middleware with comprehensive error handling and type safety
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token || typeof token !== 'string') {
        return next(new Error('Authentication token required'));
      }

      // Verify JWT token using our type-safe wrapper function
      const decoded = jwtOperations.verify(token, process.env.JWT_SECRET!);
      
      // Get user information with proper error handling
      const user = await db.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatar: true,
          isActive: true,
        },
      });

      if (!user?.isActive) {
        return next(new Error('User not found or inactive'));
      }

      // Attach user data to socket with proper typing
      socket.userId = user.id;
      socket.userInfo = {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
      };

      next();
    } catch (error) {
      // Comprehensive JWT error handling without relying on specific error types
      if (isJWTError(error, 'JsonWebTokenError')) {
        next(new Error('Invalid authentication token'));
      } else if (isJWTError(error, 'TokenExpiredError')) {
        next(new Error('Authentication token expired'));
      } else if (isJWTError(error, 'NotBeforeError')) {
        next(new Error('Authentication token not yet valid'));
      } else {
        next(new Error(`Authentication failed: ${getErrorMessage(error)}`));
      }
    }
  });

  // Connection handler with comprehensive type safety
  io.on('connection', (socket: AuthenticatedSocket) => {
    // Validate that authentication completed successfully
    // Using explicit checks instead of optional chaining here because we want to fail fast
    // if authentication didn't complete properly - this is a security requirement
    if (!socket.userId || !socket.userInfo) {
      socket.disconnect();
      return;
    }

    logger.info('User connected to WebSocket:', {
      userId: socket.userId,
      socketId: socket.id,
    });

    // Track online status
    onlineUsers.set(socket.userId, socket.id);
    userSockets.set(socket.id, socket);

    // Broadcast user online status to their contacts
    broadcastUserOnlineStatus(socket.userId, true);

    // Join user to their conversation rooms
    joinUserConversations(socket);

    // Handle sending messages with proper type safety
    socket.on('send_message', async (data: SendMessageData, callback: SocketCallback) => {
      try {
        const message = await messagingService.sendMessage(socket.userId!, data);
        
        // Send message to all participants in the conversation
        socket.to(`conversation_${data.conversationId}`).emit('new_message', {
          ...message,
          isOwnMessage: false,
        });

        // Send confirmation to sender
        callback({ success: true, message });

        logger.info('Message sent via WebSocket:', {
          messageId: message.id,
          conversationId: data.conversationId,
          senderId: socket.userId,
        });

      } catch (error) {
        logger.error('Failed to send message via WebSocket:', error);
        callback({ success: false, error: getErrorMessage(error) });
      }
    });

    // Handle joining conversations with proper type safety
    socket.on('join_conversation', async (conversationId: string, callback: SimpleCallback) => {
      try {
        // Verify user is a participant
        const participant = await db.conversationParticipant.findUnique({
          where: {
            conversationId_userId: {
              conversationId,
              userId: socket.userId!,
            },
          },
        });

        // Using optional chaining here as suggested by SonarLint - this is appropriate
        // because we're checking a database query result that could be null
        if (!participant?.isActive) {
          callback({ success: false, error: 'Not authorized to join this conversation' });
          return;
        }

        socket.join(`conversation_${conversationId}`);
        callback({ success: true });

        logger.info('User joined conversation room:', {
          userId: socket.userId,
          conversationId,
        });

      } catch (error) {
        logger.error('Failed to join conversation:', error);
        callback({ success: false, error: getErrorMessage(error) });
      }
    });

    // Handle leaving conversations
    socket.on('leave_conversation', (conversationId: string) => {
      socket.leave(`conversation_${conversationId}`);
      
      logger.info('User left conversation room:', {
        userId: socket.userId,
        conversationId,
      });
    });

    // Handle typing indicators
    socket.on('start_typing', (conversationId: string) => {
      socket.to(`conversation_${conversationId}`).emit('user_typing', {
        userId: socket.userId,
        userInfo: socket.userInfo,
        conversationId,
      });
    });

    socket.on('stop_typing', (conversationId: string) => {
      socket.to(`conversation_${conversationId}`).emit('user_stopped_typing', {
        userId: socket.userId,
        conversationId,
      });
    });

    // Handle marking messages as read
    socket.on('mark_messages_read', async (conversationId: string, callback: SimpleCallback) => {
      try {
        await messagingService.markMessagesAsRead(conversationId, socket.userId!);
        
        // Notify other participants that messages were read
        socket.to(`conversation_${conversationId}`).emit('messages_read', {
          userId: socket.userId,
          conversationId,
          readAt: new Date(),
        });

        callback({ success: true });

      } catch (error) {
        logger.error('Failed to mark messages as read:', error);
        callback({ success: false, error: getErrorMessage(error) });
      }
    });

    // Handle task-related notifications
    socket.on('join_task_room', (taskId: string) => {
      socket.join(`task_${taskId}`);
    });

    socket.on('leave_task_room', (taskId: string) => {
      socket.leave(`task_${taskId}`);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      logger.info('User disconnected from WebSocket:', {
        userId: socket.userId,
        socketId: socket.id,
      });

      // Remove from online tracking
      if (socket.userId) {
        onlineUsers.delete(socket.userId);
        broadcastUserOnlineStatus(socket.userId, false);
      }
      
      userSockets.delete(socket.id);
    });
  });

  // ====================================
  // HELPER FUNCTIONS WITH PROPER TYPING
  // ====================================

  /**
   * Broadcast user online status to their contacts
   * Now with complete type safety for database queries
   */
  async function broadcastUserOnlineStatus(userId: string, isOnline: boolean): Promise<void> {
    try {
      // Get user's conversations to find their contacts
      const conversations = await db.conversation.findMany({
        where: {
          participants: {
            some: {
              userId,
              isActive: true,
            },
          },
        },
        include: {
          participants: {
            where: {
              isActive: true,
              userId: { not: userId },
            },
            select: { userId: true },
          },
        },
      });

      // Get all contact user IDs with proper typing
      const contactIds = new Set<string>();
      
      // Type the callback parameters explicitly to avoid implicit 'any'
      conversations.forEach((conversation: ConversationWithParticipants) => {
        conversation.participants.forEach((participant: { userId: string }) => {
          contactIds.add(participant.userId);
        });
      });

      // Send online status to contacts who are online
      contactIds.forEach(contactId => {
        const contactSocketId = onlineUsers.get(contactId);
        if (contactSocketId) {
          const contactSocket = userSockets.get(contactSocketId);
          if (contactSocket) {
            contactSocket.emit('user_online_status', {
              userId,
              isOnline,
            });
          }
        }
      });

    } catch (error) {
      logger.error('Failed to broadcast user online status:', error);
    }
  }

  /**
   * Join user to all their conversation rooms
   * With proper typing for database results
   */
  async function joinUserConversations(socket: AuthenticatedSocket): Promise<void> {
    try {
      const conversations = await db.conversation.findMany({
        where: {
          participants: {
            some: {
              userId: socket.userId!,
              isActive: true,
            },
          },
        },
        select: { id: true },
      });

      // Type the callback parameter explicitly
      conversations.forEach((conversation: ConversationRecord) => {
        socket.join(`conversation_${conversation.id}`);
      });

      logger.info('User joined conversation rooms:', {
        userId: socket.userId,
        conversationCount: conversations.length,
      });

    } catch (error) {
      logger.error('Failed to join user conversations:', error);
    }
  }
}

// ====================================
// EXTERNAL UTILITY FUNCTIONS
// ====================================

// Function to set the socket instance (called from server.ts)
export function setSocketIOInstance(io: SocketIOServer): void {
  socketIOInstance = io;
}

// Utility functions for external services to send notifications with proper typing
export function sendTaskNotification(taskId: string, notification: TaskNotification): void {
  // Send notification to all users in the task room
  if (socketIOInstance) {
    socketIOInstance.to(`task_${taskId}`).emit('task_notification', notification);
  }
}

export function sendUserNotification(userId: string, notification: UserNotification): void {
  // Send notification to specific user if they're online
  const socketId = onlineUsers.get(userId);
  if (socketId) {
    const socket = userSockets.get(socketId);
    if (socket) {
      socket.emit('notification', notification);
    }
  }
}