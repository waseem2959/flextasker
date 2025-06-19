/**
 * Task Routes (Refactored)
 * 
 * Updated routes using centralized validation schemas and proper route ordering
 */

import { enhancedTaskController } from '../controllers/enhanced-task-controller';
import { authenticateToken, optionalAuth, requireRoles } from '../middleware/auth-middleware';
import { validateRequest } from '../middleware/zod-validation-middleware';
import { taskValidationConfigs } from '../validation/task-route-validation';
import { Router } from 'express';
import { UserRole } from '../../../shared/types/enums';

const router = Router();

/**
 * Search Tasks
 * GET /api/v1/tasks/search
 * Note: This route must come before /:id to avoid conflicts
 */
router.get('/search',
  optionalAuth,
  validateRequest(taskValidationConfigs.searchTasks),
  enhancedTaskController.searchTasks
);

/**
 * Get Featured Tasks
 * GET /api/v1/tasks/featured
 */
router.get('/featured',
  optionalAuth,
  validateRequest(taskValidationConfigs.getFeaturedTasks),
  enhancedTaskController.getFeaturedTasks
);

/**
 * Get My Tasks (Client)
 * GET /api/v1/tasks/my-tasks
 */
router.get('/my-tasks',
  authenticateToken,
  requireRoles([UserRole.USER]),
  validateRequest(taskValidationConfigs.getMyTasks),
  enhancedTaskController.getMyTasks
);

/**
 * Get Tasks I'm Working On (Tasker)
 * GET /api/v1/tasks/working-on
 */
router.get('/working-on',
  authenticateToken,
  requireRoles([UserRole.TASKER]),
  validateRequest(taskValidationConfigs.getTasksImWorkingOn),
  enhancedTaskController.getTasksImWorkingOn
);

/**
 * Create New Task
 * POST /api/v1/tasks
 */
router.post('/',
  authenticateToken,
  requireRoles([UserRole.USER]),
  validateRequest(taskValidationConfigs.createTask),
  enhancedTaskController.createTask
);

/**
 * Get Task by ID
 * GET /api/v1/tasks/:id
 */
router.get('/:id',
  optionalAuth,
  validateRequest(taskValidationConfigs.getTaskById),
  enhancedTaskController.getTaskById
);

/**
 * Update Task
 * PUT /api/v1/tasks/:id
 */
router.put('/:id',
  authenticateToken,
  validateRequest(taskValidationConfigs.updateTask),
  enhancedTaskController.updateTask
);

/**
 * Delete Task
 * DELETE /api/v1/tasks/:id
 */
router.delete('/:id',
  authenticateToken,
  validateRequest(taskValidationConfigs.deleteTask),
  enhancedTaskController.deleteTask
);

/**
 * Update Task Status
 * PATCH /api/v1/tasks/:id/status
 */
router.patch('/:id/status',
  authenticateToken,
  validateRequest(taskValidationConfigs.updateTaskStatus),
  enhancedTaskController.updateTaskStatus
);

/**
 * Add Task Attachment
 * POST /api/v1/tasks/:id/attachments
 */
router.post('/:id/attachments',
  authenticateToken,
  validateRequest(taskValidationConfigs.addTaskAttachment),
  enhancedTaskController.addTaskAttachment
);

/**
 * Remove Task Attachment
 * DELETE /api/v1/tasks/:id/attachments/:attachmentId
 */
router.delete('/:id/attachments/:attachmentId',
  authenticateToken,
  validateRequest(taskValidationConfigs.removeTaskAttachment),
  enhancedTaskController.removeTaskAttachment
);

export default router;