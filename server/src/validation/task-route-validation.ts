/**
 * Task Route Validation Rules
 * Centralized validation rules for task-related routes using shared schemas
 */

import { z } from 'zod';
import { 
  taskCreateSchema, 
  taskUpdateSchema, 
  taskSearchSchema, 
  taskStatusUpdateSchema 
} from '../../../shared/validation/task-validation';
import { commonSchemas } from '../middleware/zod-validation-middleware';

/**
 * Parameter validation schemas
 */
export const taskParamSchemas = {
  taskId: z.object({
    id: z.string().uuid('Invalid task ID format'),
  }),
  
  taskIdWithAttachmentId: z.object({
    id: z.string().uuid('Invalid task ID format'),
    attachmentId: z.string().uuid('Invalid attachment ID format'),
  }),
};

/**
 * Query validation schemas
 */
export const taskQuerySchemas = {
  search: taskSearchSchema,
  
  pagination: commonSchemas.paginationQuery,
  
  myTasks: z.object({
    status: z.string().optional(),
    page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
    limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 20),
  }),
  
  featuredTasks: z.object({
    limit: z.string().optional().transform(val => val ? Math.min(parseInt(val, 10), 10) : 5),
  }),
};

/**
 * Body validation schemas
 */
export const taskBodySchemas = {
  create: taskCreateSchema,
  update: taskUpdateSchema,
  statusUpdate: taskStatusUpdateSchema,
  
  attachment: z.object({
    filename: z.string().min(1, 'Filename is required').max(255, 'Filename too long'),
    fileUrl: z.string().url('Valid file URL is required'),
    fileSize: z.number().int().min(0, 'File size must be positive').optional(),
    mimeType: z.string().min(1, 'MIME type is required').optional(),
  }),
};

/**
 * Combined validation configurations for routes
 */
export const taskValidationConfigs = {
  // POST /api/v1/tasks
  createTask: {
    body: taskBodySchemas.create,
  },
  
  // GET /api/v1/tasks/:id
  getTaskById: {
    params: taskParamSchemas.taskId,
  },
  
  // PUT /api/v1/tasks/:id
  updateTask: {
    params: taskParamSchemas.taskId,
    body: taskBodySchemas.update,
  },
  
  // DELETE /api/v1/tasks/:id
  deleteTask: {
    params: taskParamSchemas.taskId,
  },
  
  // PATCH /api/v1/tasks/:id/status
  updateTaskStatus: {
    params: taskParamSchemas.taskId,
    body: taskBodySchemas.statusUpdate,
  },
  
  // GET /api/v1/tasks/search
  searchTasks: {
    query: taskQuerySchemas.search,
  },
  
  // GET /api/v1/tasks/my-tasks
  getMyTasks: {
    query: taskQuerySchemas.myTasks,
  },
  
  // GET /api/v1/tasks/working-on
  getTasksImWorkingOn: {
    query: taskQuerySchemas.myTasks,
  },
  
  // POST /api/v1/tasks/:id/attachments
  addTaskAttachment: {
    params: taskParamSchemas.taskId,
    body: taskBodySchemas.attachment,
  },
  
  // DELETE /api/v1/tasks/:id/attachments/:attachmentId
  removeTaskAttachment: {
    params: taskParamSchemas.taskIdWithAttachmentId,
  },
  
  // GET /api/v1/tasks/featured
  getFeaturedTasks: {
    query: taskQuerySchemas.featuredTasks,
  },
};

/**
 * Express-validator style rules for backward compatibility
 */
export const taskExpressValidatorRules = {
  createTask: [
    // Title validation
    {
      field: 'title',
      isString: true,
      trim: true,
      isLength: { options: { min: 5, max: 100 } },
      errorMessage: 'Title must be between 5 and 100 characters',
    },
    
    // Description validation
    {
      field: 'description',
      isString: true,
      trim: true,
      isLength: { options: { min: 20, max: 2000 } },
      errorMessage: 'Description must be between 20 and 2000 characters',
    },
    
    // Category validation
    {
      field: 'category',
      isUUID: true,
      errorMessage: 'Valid category ID is required',
    },
    
    // Budget validation
    {
      field: 'budget.amount',
      isFloat: { options: { min: 5, max: 10000 } },
      errorMessage: 'Budget must be between $5 and $10,000',
    },
    
    // Budget type validation
    {
      field: 'budget.type',
      isIn: { options: [['FIXED', 'HOURLY', 'NEGOTIABLE']] },
      errorMessage: 'Budget type must be FIXED, HOURLY, or NEGOTIABLE',
    },
    
    // Location validation
    {
      field: 'location.address',
      optional: true,
      isString: true,
      isLength: { options: { max: 200 } },
      errorMessage: 'Address cannot exceed 200 characters',
    },
    
    // Tags validation
    {
      field: 'tags',
      optional: true,
      isArray: true,
      custom: {
        options: (value: string[]) => {
          if (value.length > 10) {
            throw new Error('Too many tags (max 10)');
          }
          return true;
        },
      },
    },
  ],
  
  updateTask: [
    // All create task rules but optional
    {
      field: 'title',
      optional: true,
      isString: true,
      trim: true,
      isLength: { options: { min: 5, max: 100 } },
      errorMessage: 'Title must be between 5 and 100 characters',
    },
    // ... other rules made optional
  ],
  
  searchTasks: [
    {
      field: 'query',
      optional: true,
      isString: true,
      isLength: { options: { min: 2 } },
      errorMessage: 'Search query must be at least 2 characters',
    },
    
    {
      field: 'page',
      optional: true,
      isInt: { options: { min: 1 } },
      toInt: true,
      errorMessage: 'Page must be a positive integer',
    },
    
    {
      field: 'limit',
      optional: true,
      isInt: { options: { min: 1, max: 100 } },
      toInt: true,
      errorMessage: 'Limit must be between 1 and 100',
    },
  ],
};

/**
 * Validation rule factory for different HTTP methods
 */
export const createTaskValidationRules = (method: string, route: string) => {
  const key = `${method.toLowerCase()}${route.replace(/[^a-zA-Z]/g, '')}`;
  return taskExpressValidatorRules[key as keyof typeof taskExpressValidatorRules] || [];
};