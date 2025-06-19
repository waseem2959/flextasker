/**
 * Shared Type Definitions
 * 
 * This file contains types that are shared between the frontend and backend.
 * These types ensure consistency and type safety across the codebase.
 */

// Import and re-export types as namespaces to avoid naming conflicts
import * as ApiTypes from './api-types';
import * as Enums from './enums';
import * as ErrorTypes from './error-types';
import * as TaskTypes from '../task/unified-task-types';
import * as UserTypes from './user-types';

// Export all imported types as namespaces
export { ApiTypes, Enums, ErrorTypes, TaskTypes, UserTypes };

// Re-export enums directly as they're unlikely to have conflicts
    export * from './enums';

