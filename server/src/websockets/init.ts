/**
 * WebSocket Initialization
 * 
 * This module initializes the WebSocket server and integrates it with the Express application.
 */

import { Server as HttpServer } from 'http';
import { SocketManager } from './socket-manager';
import { logger } from '../utils/logger';
import { monitorError } from '../utils/monitoring';

let socketManager: SocketManager | null = null;

/**
 * Initializes the WebSocket server
 * @param server HTTP server instance
 */
export function initializeWebSockets(server: HttpServer): SocketManager {
  try {
    logger.info('Initializing WebSocket server');
    
    // Create a new socket manager
    socketManager = new SocketManager(server);
    
    return socketManager;
  } catch (error) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    monitorError(errorObj, { component: 'initializeWebSockets' });
    logger.error('Failed to initialize WebSocket server', { error: errorObj });
    throw errorObj;
  }
}

/**
 * Gets the socket manager instance
 */
export function getSocketManager(): SocketManager {
  if (!socketManager) {
    throw new Error('Socket manager not initialized');
  }
  
  return socketManager;
}
