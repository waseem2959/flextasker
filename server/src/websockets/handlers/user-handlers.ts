/**
 * User WebSocket Handlers
 * 
 * This module handles WebSocket events related to user presence, status, and activity.
 */

import { PrismaClient } from '@prisma/client';
import { Socket } from 'socket.io';
import { UserRole } from '../../../../shared/types/enums';
import { logger } from '../../utils/logger';
import { monitorError } from '../../utils/monitoring';
import { SocketManager } from '../socket-manager';

// Define UserStatus enum since it's not in the shared enums
enum UserStatus {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  AWAY = 'AWAY',
  BUSY = 'BUSY'
}

// Extend the existing SocketData interface from socket.io
declare module 'socket.io' {
  interface SocketData {
    user: {
      id: string;
      role: UserRole;
    };
  }
}

// Initialize Prisma client
const prisma = new PrismaClient();

// Keep track of users who are typing in conversations
const typingUsers: Record<string, Record<string, NodeJS.Timeout>> = {};

/**
 * Registers user-related event handlers for a socket
 */
export function registerUserHandlers(socket: Socket, socketManager: SocketManager): void {
  const user = socket.data.user;
  
  // Handle user status updates
  socket.on('user:status', async (status: UserStatus, callback) => {
    try {
      logger.debug('Socket user:status', { userId: user.id, status });
      
      // Update user status in memory and database
      await prisma.user.update({
        where: { id: user.id },
        data: { status }
      });
      
      // Send to all connected sockets of the user
      socketManager.sendToUser(user.id, 'user:statusChanged', {
        userId: user.id,
        status
      });
      
      // Note: To implement user contacts notification, you'll need to fetch the user's contacts
      // and send the status update to each one. This requires additional implementation.
      
      // Execute callback
      if (typeof callback === 'function') {
        callback({ success: true });
      }
    } catch (error) {
      monitorError(error instanceof Error ? error : new Error(String(error)), { 
        component: 'UserHandlers.status', 
        userId: user.id 
      });
      
      // Return error to client
      if (typeof callback === 'function') {
        callback({
          success: false,
          message: 'Failed to update status'
        });
      }
    }
  });
  
  // Handle typing indicator
  socket.on('user:typing', async (data: { conversationId: string, isTyping: boolean }) => {
    try {
      const { conversationId, isTyping } = data;
      logger.debug('Socket user:typing', { userId: user.id, conversationId, isTyping });
      
      // Initialize conversation typing users if needed
      if (!typingUsers[conversationId]) {
        typingUsers[conversationId] = {};
      }
      
      // Clear any existing timeout
      if (typingUsers[conversationId][user.id]) {
        clearTimeout(typingUsers[conversationId][user.id]);
      }
      
      if (isTyping) {
        // Set user as typing
        typingUsers[conversationId][user.id] = setTimeout(() => {
          // Automatically clear typing status after 5 seconds
          if (typingUsers[conversationId]) {
            delete typingUsers[conversationId][user.id];
            
            // Broadcast updated typing users
            socket.to(`conversation:${conversationId}`).emit('conversation:typingUsers', {
              conversationId,
              users: Object.keys(typingUsers[conversationId] || {})
            });
          }
        }, 5000);
        
        // Broadcast to conversation room
        socket.to(`conversation:${conversationId}`).emit('conversation:typingUsers', {
          conversationId,
          users: Object.keys(typingUsers[conversationId])
        });
      } else {
        // Remove user from typing
        delete typingUsers[conversationId][user.id];
        
        // Broadcast updated typing users to conversation room
        socket.to(`conversation:${conversationId}`).emit('conversation:typingUsers', {
          conversationId,
          users: Object.keys(typingUsers[conversationId] || {})
        });
      }
    } catch (error) {
      monitorError(error as Error, { 
        component: 'UserHandlers.typing', 
        userId: user.id, 
        conversationId: data.conversationId 
      });
    }
  });
  
  // Join conversation room when requested
  socket.on('conversation:join', (conversationId: string) => {
    try {
      logger.debug('User joined conversation', { userId: user.id, conversationId });
      socket.join(`conversation:${conversationId}`);
    } catch (error) {
      monitorError(error as Error, { component: 'UserHandlers.conversationJoin', userId: user.id });
    }
  });
  
  // Leave conversation room when requested
  socket.on('conversation:leave', (conversationId: string) => {
    try {
      logger.debug('User left conversation', { userId: user.id, conversationId });
      socket.leave(`conversation:${conversationId}`);
    } catch (error) {
      monitorError(error as Error, { component: 'UserHandlers.conversationLeave', userId: user.id });
    }
  });
  
  // Handle user activity/presence
  socket.on('user:activity', async () => {
    try {
      // Update last activity timestamp in database
      await prisma.user.update({
        where: { id: user.id },
        data: { lastActive: new Date() }
      });
    } catch (error) {
      monitorError(error instanceof Error ? error : new Error(String(error)), { 
        component: 'UserHandlers.activity', 
        userId: user.id 
      });
    }
  });
  
  // Get online users (for admin dashboard)
  socket.on('admin:onlineUsers', async (callback) => {
    try {
      // Only allow admins to access this
      if (user.role !== UserRole.ADMIN) {
        if (typeof callback === 'function') {
          callback({
            success: false,
            message: 'Unauthorized'
          });
        }
        return;
      }
      
      // Get all connected socket users
      const sockets = await socketManager.getIo().fetchSockets();
      const onlineUserIds = [...new Set(sockets.map(s => s.data.user.id))];
      
      // Get user details for online users
      const userDetails = await prisma.user.findMany({
        where: {
          id: { in: onlineUserIds }
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          avatar: true,
          role: true,
          status: true,
          lastActive: true
        }
      });
      
      if (typeof callback === 'function') {
        callback({
          success: true,
          data: userDetails
        });
      }
    } catch (error) {
      monitorError(error instanceof Error ? error : new Error(String(error)), { 
        component: 'UserHandlers.onlineUsers', 
        userId: user.id 
      });
      
      if (typeof callback === 'function') {
        callback({
          success: false,
          message: 'Failed to get online users'
        });
      }
    }
  });
}

/**
 * Updates a user's online status and notifies relevant users
 */
export async function updateUserOnlineStatus(
  socketManager: SocketManager,
  userId: string,
  isOnline: boolean
): Promise<void> {
  try {
    // Update user status in database
    await prisma.user.update({
      where: { id: userId },
      data: { 
        isOnline,
        lastActive: isOnline ? new Date() : undefined
      }
    });
    
    // Get user's contacts and notify them
    const contacts = await prisma.contact.findMany({
      where: {
        OR: [
          { userId: userId },
          { contactUserId: userId }
        ]
      }
    });

    // Notify each contact
    for (const contact of contacts) {
      const contactId = contact.userId === userId ? contact.contactUserId : contact.userId;
      if (contactId) {  // Add null check
        socketManager.sendToUser(contactId, 'user:onlineStatus', {
          userId: userId,
          isOnline,
          timestamp: new Date()
        });
      }
    }
    
    logger.debug('Updated user online status', { userId, isOnline });
  } catch (error) {
    monitorError(error instanceof Error ? error : new Error(String(error)), { 
      component: 'UserHandlers.updateOnlineStatus', 
      userId 
    });
  }
}
