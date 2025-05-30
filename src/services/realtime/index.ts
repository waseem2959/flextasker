/**
 * Realtime Communication Service
 * 
 * This module provides a unified interface for real-time communication,
 * consolidating previous socket implementations into a single cohesive service.
 */

export * from './socketService';
export * from './types';
export * from './hooks';
export { SocketEvent as SocketEventNames } from './socketEvents';
