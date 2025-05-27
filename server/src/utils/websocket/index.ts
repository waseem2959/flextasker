/**
 * WebSocket Infrastructure
 * 
 * This module exports all WebSocket-related functionality.
 * It provides a centralized initialization point for all WebSocket handlers.
 */

import { Server as HttpServer } from 'http';
import { socketManager, SocketEvent, SocketRoom, AuthenticatedSocket } from './socket-manager';
import { notificationHandler, NotificationType } from './notification-handler';
import { chatHandler } from './chat-handler';
import { taskHandler } from './task-handler';
import { logger } from '../logger';

/**
 * Initialize all WebSocket handlers and the socket.io server
 */
export function initializeWebSockets(server: HttpServer): void {
  // Initialize socket.io server
  const io = socketManager.initialize(server);
  
  // Set up connection handler to distribute events to specific handlers
  io.on(SocketEvent.CONNECT, (socket: AuthenticatedSocket) => {
    if (!socket.user) {
      logger.debug('Unauthenticated socket connection rejected');
      return;
    }
    
    logger.info('Socket connected', { 
      userId: socket.user.id, 
      socketId: socket.id 
    });
    
    // Set up handlers for this socket
    notificationHandler.setupEvents(socket);
    chatHandler.setupEvents(socket);
    taskHandler.setupEvents(socket);
    
    // Handle disconnection
    socket.on(SocketEvent.DISCONNECT, () => {
      logger.info('Socket disconnected', { 
        userId: socket.user?.id, 
        socketId: socket.id 
      });
    });
  });
  
  logger.info('WebSocket infrastructure initialized');
}

// Export all WebSocket-related modules
export {
  socketManager,
  SocketEvent,
  SocketRoom,
  AuthenticatedSocket,
  notificationHandler,
  NotificationType,
  chatHandler,
  taskHandler
};
