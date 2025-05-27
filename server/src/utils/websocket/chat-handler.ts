/**
 * Chat WebSocket Handler
 * 
 * Manages real-time chat messaging via WebSocket.
 * Handles conversations, messages, typing indicators, and read receipts.
 */

import { Socket } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedSocket, SocketEvent, SocketRoom, socketManager } from './socket-manager';
import { logger } from '../logger';
import { cacheService, CachePrefix } from '../cache';
import { notificationHandler, NotificationType } from './notification-handler';

// Initialize Prisma client
const prisma = new PrismaClient();

// Cache TTL for messages (in seconds)
const MESSAGES_CACHE_TTL = 60 * 30; // 30 minutes
const CONVERSATION_CACHE_TTL = 60 * 60; // 1 hour

/**
 * Message data structure
 */
export interface MessageData {
  conversationId: string;
  senderId: string;
  content: string;
  attachment?: string;
}

/**
 * Typing indicator data
 */
export interface TypingData {
  conversationId: string;
  userId: string;
  isTyping: boolean;
}

/**
 * Chat handler for WebSocket events
 */
export class ChatHandler {
  /**
   * Set up chat event handlers for a socket
   */
  public setupEvents(socket: AuthenticatedSocket): void {
    if (!socket.user) return;
    
    const userId = socket.user.id;
    
    // Join user's conversations
    this.joinUserConversations(socket);
    
    // Handle new message
    socket.on(SocketEvent.CHAT_MESSAGE, async (data: MessageData) => {
      await this.handleNewMessage(socket, data);
    });
    
    // Handle typing indicator
    socket.on(SocketEvent.CHAT_TYPING, (data: TypingData) => {
      this.handleTypingIndicator(socket, data);
    });
    
    // Handle read receipts
    socket.on(SocketEvent.CHAT_READ, async (data: { conversationId: string }) => {
      await this.markConversationRead(socket, data.conversationId);
    });
    
    logger.debug('Chat event handlers set up', { userId });
  }
  
  /**
   * Join a user to their conversation rooms
   */
  private async joinUserConversations(socket: AuthenticatedSocket): Promise<void> {
    if (!socket.user) return;
    
    try {
      const userId = socket.user.id;
      
      // Find all conversations the user is part of
      const conversations = await prisma.conversation.findMany({
        where: {
          OR: [
            { user1Id: userId },
            { user2Id: userId }
          ]
        }
      });
      
      // Join each conversation room
      for (const conversation of conversations) {
        socketManager.joinRoom(socket, `${SocketRoom.CONVERSATION}${conversation.id}`);
      }
      
      logger.debug('User joined conversation rooms', { 
        userId, 
        count: conversations.length 
      });
    } catch (error) {
      logger.error('Failed to join user to conversation rooms', { 
        userId: socket.user.id, 
        error 
      });
    }
  }
  
  /**
   * Handle a new chat message
   */
  private async handleNewMessage(socket: AuthenticatedSocket, data: MessageData): Promise<void> {
    if (!socket.user) return;
    
    try {
      const { conversationId, content, attachment } = data;
      const senderId = socket.user.id;
      
      // Validate conversation exists and user is part of it
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId }
      });
      
      if (!conversation) {
        socket.emit(SocketEvent.ERROR, { message: 'Conversation not found' });
        return;
      }
      
      if (conversation.user1Id !== senderId && conversation.user2Id !== senderId) {
        socket.emit(SocketEvent.ERROR, { message: 'Not authorized to send message to this conversation' });
        return;
      }
      
      // Create message in database
      const message = await prisma.message.create({
        data: {
          conversationId,
          senderId,
          content,
          attachment
        },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true
            }
          }
        }
      });
      
      // Update conversation last message
      await prisma.conversation.update({
        where: { id: conversationId },
        data: {
          lastMessageId: message.id,
          lastMessageAt: message.createdAt,
          // Mark as unread for the recipient
          unreadCount: {
            increment: conversation.user1Id === senderId ? 2 : 1 // Increment field 1 or 2 based on sender
          }
        }
      });
      
      // Invalidate cache
      await cacheService.deletePattern(`${CachePrefix.CONVERSATION}${conversationId}*`);
      await cacheService.deletePattern(`${CachePrefix.USER}${conversation.user1Id}:conversations*`);
      await cacheService.deletePattern(`${CachePrefix.USER}${conversation.user2Id}:conversations*`);
      
      // Emit to the conversation room
      socketManager.emitToConversation(conversationId, SocketEvent.CHAT_MESSAGE, message);
      
      // Determine recipient ID
      const recipientId = conversation.user1Id === senderId ? conversation.user2Id : conversation.user1Id;
      
      // Send notification to recipient
      await notificationHandler.createNotification({
        userId: recipientId,
        type: NotificationType.MESSAGE_RECEIVED,
        title: 'New Message',
        message: `${socket.user.firstName} ${socket.user.lastName}: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`,
        data: {
          conversationId,
          messageId: message.id,
          senderId,
          senderName: `${socket.user.firstName} ${socket.user.lastName}`
        }
      });
      
      logger.debug('New message sent', { 
        messageId: message.id, 
        conversationId, 
        senderId 
      });
    } catch (error) {
      logger.error('Failed to send message', { error, data });
      socket.emit(SocketEvent.ERROR, { message: 'Failed to send message' });
    }
  }
  
  /**
   * Handle typing indicator
   */
  private handleTypingIndicator(socket: AuthenticatedSocket, data: TypingData): void {
    if (!socket.user) return;
    
    try {
      const { conversationId, isTyping } = data;
      const userId = socket.user.id;
      
      // Broadcast typing indicator to conversation
      socketManager.emitToConversation(conversationId, SocketEvent.CHAT_TYPING, {
        userId,
        userName: `${socket.user.firstName} ${socket.user.lastName}`,
        isTyping
      });
      
      logger.debug('Typing indicator broadcasted', { 
        userId, 
        conversationId, 
        isTyping 
      });
    } catch (error) {
      logger.error('Failed to broadcast typing indicator', { error, data });
    }
  }
  
  /**
   * Mark a conversation as read
   */
  private async markConversationRead(socket: AuthenticatedSocket, conversationId: string): Promise<void> {
    if (!socket.user) return;
    
    try {
      const userId = socket.user.id;
      
      // Get conversation
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId }
      });
      
      if (!conversation) {
        socket.emit(SocketEvent.ERROR, { message: 'Conversation not found' });
        return;
      }
      
      // Ensure user is part of conversation
      if (conversation.user1Id !== userId && conversation.user2Id !== userId) {
        socket.emit(SocketEvent.ERROR, { message: 'Not authorized to access this conversation' });
        return;
      }
      
      // Update the appropriate unread count field
      const updateData: any = {};
      if (conversation.user1Id === userId) {
        updateData.user1UnreadCount = 0;
      } else {
        updateData.user2UnreadCount = 0;
      }
      
      // Update conversation
      await prisma.conversation.update({
        where: { id: conversationId },
        data: updateData
      });
      
      // Invalidate cache
      await cacheService.deletePattern(`${CachePrefix.CONVERSATION}${conversationId}*`);
      await cacheService.deletePattern(`${CachePrefix.USER}${userId}:conversations*`);
      
      // Emit read receipt to conversation
      socketManager.emitToConversation(conversationId, SocketEvent.CHAT_READ, {
        userId,
        conversationId
      });
      
      logger.debug('Conversation marked as read', { 
        userId, 
        conversationId 
      });
    } catch (error) {
      logger.error('Failed to mark conversation as read', { error, conversationId });
      socket.emit(SocketEvent.ERROR, { message: 'Failed to mark conversation as read' });
    }
  }
  
  /**
   * Get or create a conversation between two users
   */
  public async getOrCreateConversation(user1Id: string, user2Id: string): Promise<any> {
    try {
      // Sort user IDs to ensure consistent query regardless of order
      const [sortedUser1, sortedUser2] = [user1Id, user2Id].sort();
      
      // Check cache
      const cacheKey = `${CachePrefix.USER}${user1Id}:conversation:${user2Id}`;
      const cachedConversation = await cacheService.get<any>(cacheKey);
      
      if (cachedConversation) {
        logger.debug('Cache hit for conversation', { user1Id, user2Id });
        return cachedConversation;
      }
      
      // Look for existing conversation
      let conversation = await prisma.conversation.findFirst({
        where: {
          OR: [
            { user1Id: sortedUser1, user2Id: sortedUser2 },
            { user1Id: sortedUser2, user2Id: sortedUser1 }
          ]
        },
        include: {
          user1: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true
            }
          },
          user2: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true
            }
          },
          lastMessage: true
        }
      });
      
      // Create new conversation if it doesn't exist
      if (!conversation) {
        conversation = await prisma.conversation.create({
          data: {
            user1Id: sortedUser1,
            user2Id: sortedUser2,
            user1UnreadCount: 0,
            user2UnreadCount: 0
          },
          include: {
            user1: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true
              }
            },
            user2: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true
              }
            }
          }
        });
        
        logger.debug('New conversation created', { 
          conversationId: conversation.id, 
          user1Id: sortedUser1, 
          user2Id: sortedUser2 
        });
      }
      
      // Cache the conversation
      await cacheService.set(cacheKey, conversation, CONVERSATION_CACHE_TTL);
      await cacheService.set(`${CachePrefix.USER}${user2Id}:conversation:${user1Id}`, conversation, CONVERSATION_CACHE_TTL);
      
      return conversation;
    } catch (error) {
      logger.error('Failed to get or create conversation', { user1Id, user2Id, error });
      throw error;
    }
  }
  
  /**
   * Get conversation messages with pagination and caching
   */
  public async getConversationMessages(conversationId: string, page = 1, limit = 20): Promise<any> {
    try {
      const cacheKey = `${CachePrefix.CONVERSATION}${conversationId}:messages:${page}:${limit}`;
      
      // Try to get from cache first
      const cachedMessages = await cacheService.get<any>(cacheKey);
      if (cachedMessages) {
        logger.debug('Cache hit for conversation messages', { conversationId });
        return cachedMessages;
      }
      
      // Calculate pagination
      const skip = (page - 1) * limit;
      
      const [messages, total] = await Promise.all([
        prisma.message.findMany({
          where: { conversationId },
          orderBy: { createdAt: 'desc' }, // Most recent first
          skip,
          take: limit,
          include: {
            sender: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true
              }
            }
          }
        }),
        prisma.message.count({ where: { conversationId } })
      ]);
      
      // Reverse the messages to have oldest first for client display
      const reversedMessages = [...messages].reverse();
      
      const result = {
        messages: reversedMessages,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
      
      // Cache the result
      await cacheService.set(cacheKey, result, MESSAGES_CACHE_TTL);
      logger.debug('Cached conversation messages', { conversationId, count: messages.length });
      
      return result;
    } catch (error) {
      logger.error('Failed to get conversation messages', { conversationId, error });
      throw error;
    }
  }
  
  /**
   * Get user conversations with caching
   */
  public async getUserConversations(userId: string): Promise<any[]> {
    try {
      const cacheKey = `${CachePrefix.USER}${userId}:conversations`;
      
      // Try to get from cache first
      const cachedConversations = await cacheService.get<any[]>(cacheKey);
      if (cachedConversations) {
        logger.debug('Cache hit for user conversations', { userId });
        return cachedConversations;
      }
      
      // Get all conversations for user
      const conversations = await prisma.conversation.findMany({
        where: {
          OR: [
            { user1Id: userId },
            { user2Id: userId }
          ]
        },
        orderBy: { lastMessageAt: 'desc' },
        include: {
          user1: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true
            }
          },
          user2: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true
            }
          },
          lastMessage: true
        }
      });
      
      // Process conversations to add helper properties
      const processedConversations = conversations.map(conversation => {
        // Determine other user
        const otherUser = conversation.user1Id === userId ? conversation.user2 : conversation.user1;
        
        // Determine unread count for this user
        const unreadCount = conversation.user1Id === userId 
          ? conversation.user1UnreadCount 
          : conversation.user2UnreadCount;
        
        return {
          ...conversation,
          otherUser,
          unreadCount
        };
      });
      
      // Cache the result
      await cacheService.set(cacheKey, processedConversations, CONVERSATION_CACHE_TTL);
      logger.debug('Cached user conversations', { userId, count: conversations.length });
      
      return processedConversations;
    } catch (error) {
      logger.error('Failed to get user conversations', { userId, error });
      throw error;
    }
  }
}

// Export singleton instance
export const chatHandler = new ChatHandler();

export default chatHandler;
