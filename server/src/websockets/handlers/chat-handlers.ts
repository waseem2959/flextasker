/**
 * Chat WebSocket Handlers
 * 
 * This module handles WebSocket events related to chat functionality.
 */

import { Socket } from 'socket.io';
import { logger } from '../../utils/logger';
import { monitorError } from '../../utils/monitoring';
import { SocketManager } from '../socket-manager';
import { PrismaClient } from '@prisma/client';
import { sanitizeText } from '../../utils/security/sanitization';
import { createNotification } from './notification-handlers';
import { NotificationType } from '../../../../shared/types/enums';

// Initialize Prisma client
const prisma = new PrismaClient();

/**
 * Registers chat-related event handlers for a socket
 */
export function registerChatHandlers(socket: Socket, socketManager: SocketManager): void {
  const user = socket.data.user;
  
  // Get user's messages
  socket.on('chat:getMessages', async (otherUserId, callback) => {
    try {
      logger.debug('Socket chat:getMessages', { 
        userId: user.id, 
        otherUserId 
      });
      
      // Validate the other user exists
      const otherUser = await prisma.user.findUnique({
        where: { id: otherUserId },
        select: { id: true }
      });
      
      if (!otherUser) {
        if (typeof callback === 'function') {
          return callback({
            success: false,
            message: 'User not found'
          });
        }
        return;
      }
      
      // Get messages between the two users
      const messages = await prisma.message.findMany({
        where: {
          OR: [
            { 
              senderId: user.id,
              receiverId: otherUserId
            },
            {
              senderId: otherUserId,
              receiverId: user.id
            }
          ]
        },
        orderBy: {
          createdAt: 'asc'
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
      
      // Mark received messages as read
      await prisma.message.updateMany({
        where: {
          senderId: otherUserId,
          receiverId: user.id,
          isRead: false
        },
        data: {
          isRead: true
        }
      });
      
      // Execute callback with messages
      if (typeof callback === 'function') {
        callback({
          success: true,
          data: messages
        });
      }
    } catch (error) {
      monitorError(error as Error, { 
        component: 'ChatHandlers.getMessages', 
        userId: user.id,
        otherUserId
      });
      
      // Return error to client
      if (typeof callback === 'function') {
        callback({
          success: false,
          message: 'Failed to fetch messages'
        });
      }
    }
  });
  
  // Send a message
  socket.on('chat:sendMessage', async (data, callback) => {
    try {
      const { receiverId, content } = data;
      
      logger.debug('Socket chat:sendMessage', { 
        senderId: user.id, 
        receiverId,
        contentLength: content?.length
      });
      
      // Validate input
      if (!receiverId || !content || content.trim().length === 0) {
        if (typeof callback === 'function') {
          return callback({
            success: false,
            message: 'Invalid message data'
          });
        }
        return;
      }
      
      // Validate the receiver exists
      const receiver = await prisma.user.findUnique({
        where: { id: receiverId },
        select: { id: true }
      });
      
      if (!receiver) {
        if (typeof callback === 'function') {
          return callback({
            success: false,
            message: 'Recipient not found'
          });
        }
        return;
      }
      
      // Sanitize message content
      const sanitizedContent = sanitizeText(content);
      
      // Create message in database
      const message = await prisma.message.create({
        data: {
          senderId: user.id,
          receiverId,
          content: sanitizedContent,
          isRead: false
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
      
      // Send message to receiver via WebSocket if they're online
      if (socketManager.isUserOnline(receiverId)) {
        socketManager.sendToUser(receiverId, 'chat:newMessage', message);
      }
      
      // Create notification for the receiver if they're not online
      if (!socketManager.isUserOnline(receiverId)) {
        const senderName = `${user.firstName} ${user.lastName}`;
        await createNotification(
          socketManager,
          receiverId,
          NotificationType.TASK_CREATED, // Using TASK_CREATED as a fallback since NEW_MESSAGE doesn't exist
          `You received a new message from ${senderName}`,
          message.id
        );
      }
      
      // Execute callback with message
      if (typeof callback === 'function') {
        callback({
          success: true,
          data: message
        });
      }
    } catch (error) {
      monitorError(error as Error, { 
        component: 'ChatHandlers.sendMessage', 
        userId: user.id,
        receiverId: data?.receiverId
      });
      
      // Return error to client
      if (typeof callback === 'function') {
        callback({
          success: false,
          message: 'Failed to send message'
        });
      }
    }
  });
  
  // Get user's conversations
  socket.on('chat:getConversations', async (callback) => {
    try {
      logger.debug('Socket chat:getConversations', { userId: user.id });
      
      // Get distinct conversation partners
      const sentMessages = await prisma.message.findMany({
        where: { senderId: user.id },
        select: { receiverId: true },
        distinct: ['receiverId']
      });
      
      const receivedMessages = await prisma.message.findMany({
        where: { receiverId: user.id },
        select: { senderId: true },
        distinct: ['senderId']
      });
      
      // Combine unique user IDs
      const userIds = new Set([
        ...sentMessages.map((msg: { receiverId: string }) => msg.receiverId),
        ...receivedMessages.map((msg: { senderId: string }) => msg.senderId)
      ]);
      
      // Get user details and latest message for each conversation
      const conversations = await Promise.all([...userIds].map(async (userId) => {
        // Get user details
        const conversationPartner = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        });
        
        // Get latest message
        const latestMessage = await prisma.message.findFirst({
          where: {
            OR: [
              { 
                senderId: user.id,
                receiverId: userId
              },
              {
                senderId: userId,
                receiverId: user.id
              }
            ]
          },
          orderBy: {
            createdAt: 'desc'
          }
        });
        
        // Get unread message count
        const unreadCount = await prisma.message.count({
          where: {
            senderId: userId,
            receiverId: user.id,
            isRead: false
          }
        });
        
        return {
          user: conversationPartner,
          latestMessage,
          unreadCount
        };
      }));
      
      // Sort conversations by latest message date
      conversations.sort((a, b) => {
        const dateA = a.latestMessage?.createdAt ?? new Date(0);
        const dateB = b.latestMessage?.createdAt ?? new Date(0);
        return dateB.getTime() - dateA.getTime();
      });
      
      // Execute callback with conversations
      if (typeof callback === 'function') {
        callback({
          success: true,
          data: conversations
        });
      }
    } catch (error) {
      monitorError(error as Error, { 
        component: 'ChatHandlers.getConversations', 
        userId: user.id
      });
      
      // Return error to client
      if (typeof callback === 'function') {
        callback({
          success: false,
          message: 'Failed to fetch conversations'
        });
      }
    }
  });
  
  // Mark messages as read
  socket.on('chat:markAsRead', async (otherUserId, callback) => {
    try {
      logger.debug('Socket chat:markAsRead', { 
        userId: user.id, 
        otherUserId 
      });
      
      // Update messages in database
      await prisma.message.updateMany({
        where: {
          senderId: otherUserId,
          receiverId: user.id,
          isRead: false
        },
        data: {
          isRead: true
        }
      });
      
      // Execute callback with result
      if (typeof callback === 'function') {
        callback({
          success: true
        });
      }
    } catch (error) {
      monitorError(error as Error, { 
        component: 'ChatHandlers.markAsRead', 
        userId: user.id,
        otherUserId
      });
      
      // Return error to client
      if (typeof callback === 'function') {
        callback({
          success: false,
          message: 'Failed to mark messages as read'
        });
      }
    }
  });
}
