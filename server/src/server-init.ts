/**
 * Server Initialization Module
 * 
 * This module handles all the initialization processes needed
 * when the server starts up, including database connections,
 * monitoring services, and other system components.
 */

import { Server } from 'http';
import { Application } from 'express';
import { initializeWebSockets } from './websockets';
import { startScheduledChecks } from './utils/monitoring/scheduled-checks';

/**
 * Initialize all server components
 * @param _app Express application instance (unused parameter)
 * @param server HTTP server instance
 */
export const initializeServer = async (_app: Application, server: Server): Promise<void> => {
  try {
    // Initialize metrics tracking (handled by middleware)
    console.info('✅ Metrics monitoring enabled');
    
    // Initialize WebSockets
    initializeWebSockets(server);
    console.info('✅ WebSocket server initialized');
    
    // Start scheduled migration monitoring checks
    startScheduledChecks();
    console.info('✅ Migration monitoring checks scheduled');
    
    // Add other initialization steps here as needed
    
    console.info('🚀 Server initialization complete');
  } catch (error) {
    console.error('❌ Server initialization failed:', error);
    throw error;
  }
};

/**
 * Graceful shutdown handler
 * @param server HTTP server instance
 */
export const gracefulShutdown = async (server: Server): Promise<void> => {
  try {
    // Close the HTTP server
    server.close();
    console.info('✅ HTTP server closed');
    
    // Perform other cleanup tasks here
    
    console.info('🛑 Server shutdown complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during server shutdown:', error);
    process.exit(1);
  }
};
