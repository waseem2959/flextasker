/**
 * WebSocket Metrics Handler
 * 
 * This module provides utility functions for tracking WebSocket usage metrics,
 * specifically for monitoring the migration from legacy to consolidated services.
 * 
 * NOTE: This is now a thin wrapper around the unified metrics service to maintain
 * backward compatibility with existing code while eliminating duplication.
 */

import { Socket } from 'socket.io';
import metricsService from '../../utils/monitoring/metrics-service';

/**
 * Helper function to track socket event usage and monitor migration patterns
 * 
 * @param socket The socket instance
 * @param event The event name being tracked
 * @param isConsolidated Whether this is a consolidated service event
 * @param serviceName The service name (e.g., 'chat', 'bid', 'notification')
 */
export const trackSocketEvent = (
  socket: Socket, 
  event: string, 
  isConsolidated: boolean,
  serviceName: string
) => {
  try {
    // Use the unified metrics service
    metricsService.trackWebSocketEvent(
      `${serviceName}:${event}`, 
      isConsolidated, 
      serviceName, 
      socket.data?.user?.id
    );
  } catch (error) {
    // Don't let tracking errors affect functionality
    console.error('Error tracking WebSocket event:', error);
  }
};

/**
 * Helper to wrap WebSocket event handlers with metrics tracking
 * 
 * @param socket The socket instance
 * @param event The event name
 * @param handler The event handler function
 * @param isConsolidated Whether this is a consolidated service event
 * @param serviceName The service name
 */
export const withMetrics = <T extends any[]>(
  socket: Socket,
  event: string,
  handler: (...args: T) => void,
  isConsolidated: boolean,
  serviceName: string
) => {
  // Create a wrapper that includes the socket in the handler call
  // We ignore the socket parameter as the original handler doesn't use it
  const wrappedHandler = (_: Socket, ...args: T) => handler(...args);
  
  // Use the unified metrics service
  const metricsWrappedHandler = metricsService.withSocketMetrics(
    event,
    wrappedHandler,
    isConsolidated,
    serviceName
  );
  
  // Return a function that maintains the original signature expected by callers
  return (...args: T) => metricsWrappedHandler(socket, ...args);
};

/**
 * Helper to wrap socket emit calls with metrics tracking
 * 
 * @param socket The socket instance
 */
export const wrapSocketEmit = (socket: Socket) => {
  // Use the unified metrics service
  metricsService.wrapSocketEmit(socket);
};

export default {
  trackSocketEvent,
  withMetrics,
  wrapSocketEmit
};
