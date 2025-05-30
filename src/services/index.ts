/**
 * Services Module Index
 * 
 * This file exports all service modules in a structured way.
 * It provides a centralized entry point for accessing services and maintains
 * compatibility exports for code that hasn't been updated yet.
 * 
 * IMPORTANT: As part of our consolidation effort, several legacy services now
 * serve as bridges to their consolidated implementations. When creating new
 * code, always prefer the consolidated implementation as indicated in the
 * deprecation notices.
 */

/**
 * ===========================
 * CONSOLIDATED SERVICES (PREFERRED)
 * ===========================
 * Always use these consolidated implementations for new code
 */

// Core auth services - use explicit imports to avoid naming conflicts
import { 
  authService as authServiceCore,
  hasRole, hasAnyRole, isAdmin, isTasker, isClient,
  parseJwt, setupTokenRefresh, initializeAuth, cleanupAuth
} from './auth/service';
import * as authTypes from './auth/types';

// Realtime services
import { 
  realtimeService as realtimeServiceCore,
  useRealtimeEvent
} from './realtime';

// Configuration services
import { featureManager } from './configuration';

// File management
import { uploadService as uploadServiceCore } from './files';
import type { UploadStatus, FileType } from './files';

// Analytics services
import { performanceMonitor, usePerformanceMonitoring } from './analytics';

// API services - use explicit imports to avoid naming conflicts
import {
  userService,
  taskService,
  bidService as apiBidService
} from './api/services';

// Error handling
import {
  handleError, 
  formatErrorMessage,
  createErrorHandler 
} from './error/errorHandler';         // Error utilities

// Re-export consolidated services with explicit names
export {
  // Auth
  authServiceCore, hasRole, hasAnyRole, isAdmin, isTasker, isClient,
  parseJwt, setupTokenRefresh, initializeAuth, cleanupAuth,
  authTypes,
  
  // Realtime
  realtimeServiceCore, useRealtimeEvent,
  
  // Configuration
  featureManager,
  
  // File management
  uploadServiceCore, UploadStatus, FileType,
  
  // Analytics
  performanceMonitor, usePerformanceMonitoring,
  
  // API services
  userService, taskService, apiBidService,
  
  // Error handling
  handleError, formatErrorMessage, createErrorHandler
}

/**
 * ===========================
 * LEGACY BRIDGE EXPORTS
 * ===========================
 * These are maintained for backward compatibility 
 * while the codebase transitions to the consolidated implementations.
 * 
 * IMPORTANT: Do not use these in new code. Refer to CONSOLIDATION.md
 * for details on the preferred implementations.
 */

// Bridge services - will redirect to consolidated implementations
export * from './auth';                 // → auth/service.ts
export * from './bidService';          // → api/bids.service.ts
export * from './featureFlags';        // → configuration/featureManager.ts
export * from './uploadService';        // → files/uploadService.ts
// Export error handling
export * from './error';                // → utils/error-handler.ts

// Legacy compatibility exports for renamed services
// Create a named alias for realtimeServiceCore to maintain backward compatibility
export const socketService = realtimeServiceCore;  // → realtime service
