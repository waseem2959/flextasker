/**
 * API Services Index
 * 
 * This file exports all API services in a structured way.
 * It provides a centralized entry point for accessing specific API services.
 * 
 * USAGE:
 * 
 * Import the specific service you need:
 * ```typescript
 * import { userService } from '@/services/api/services';
 * 
 * // Then use the service
 * const user = await userService.getCurrentUser();
 * ```
 * 
 * Or import the entire API services object:
 * ```typescript
 * import apiServices from '@/services/api/services';
 * 
 * // Then access the services through the object
 * const task = await apiServices.taskService.getTaskById(id);
 * ```
 */

// Import individual services
import userServiceModule from './userService';
import taskServiceModule from './taskService';
import bidServiceModule from './bidService';

// Re-export the individual services
export const userService = userServiceModule;
export const taskService = taskServiceModule;
export const bidService = bidServiceModule;

// Create and export the services object
const apiServices = {
  userService,
  taskService,
  bidService
};

// Default export
export default apiServices;
