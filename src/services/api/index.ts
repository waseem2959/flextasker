/**
 * API Services Index
 * 
 * This file exports all API-related services and hooks.
 */

// Core API client
import { ApiClient, apiClient } from './api-client';

// Service modules
import { bidService } from './bid-service';
import { reviewService } from './review-service';
import { taskService } from './task-service';
import { userService } from './user-service';

// Re-export for external use
export { ApiClient, apiClient, bidService, reviewService, taskService, userService };

// Utility services (simplified)
    export { rateLimiter } from './rate-limiter-service';

// Hooks (removed complex rate limiter hooks for simplicity)

// Default export for convenience (simplified)
export default {
  apiClient,
  userService,
  taskService,
  bidService,
  reviewService
};