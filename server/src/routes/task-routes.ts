/**
 * Task Routes
 * 
 * These routes handle all task-related operations including:
 * - Creating and posting new tasks
 * - Updating task details
 * - Searching and filtering tasks
 * - Task lifecycle management (completion, cancellation)
 * - Task attachments and metadata
 */

import { Router, Request, Response, RequestHandler } from 'express';
import { body, param, query } from 'express-validator';
import { authenticateToken, optionalAuth, requireRoles } from '@/middleware/auth-middleware';
import { validate } from '@/middleware/validation-middleware';
import { taskController } from '@/controllers/task-controller';
import { UserRole, TaskStatus, TaskPriority, BudgetType } from '../../../shared/types/enums';

const router = Router();

/**
 * Create New Task
 * POST /api/v1/tasks
 */
router.post('/',
  authenticateToken,
  requireRoles([UserRole.USER]),
  validate([
    body('title').isString().trim().isLength({ min: 5, max: 100 })
      .withMessage('Title must be between 5 and 100 characters'),
    body('description').isString().trim().isLength({ min: 20, max: 2000 })
      .withMessage('Description must be between 20 and 2000 characters'),
    body('categoryId').isUUID().withMessage('Valid category ID is required'),
    body('budget').isFloat({ min: 0 }).withMessage('Budget must be a positive number'),
    body('budgetType').isIn(Object.values(BudgetType))
      .withMessage('Budget type must be one of: FIXED, HOURLY, NEGOTIABLE'),
    body('location').optional().isString().trim().isLength({ max: 100 })
      .withMessage('Location cannot exceed 100 characters'),
    body('dueDate').optional().isISO8601().toDate()
      .withMessage('Due date must be a valid date'),
    body('priority').optional().isIn(Object.values(TaskPriority))
      .withMessage('Priority must be one of: LOW, MEDIUM, HIGH, URGENT'),
    body('skills').optional().isArray().withMessage('Skills must be an array'),
    body('skills.*').optional().isString().trim().isLength({ min: 1, max: 50 })
      .withMessage('Each skill must be between 1 and 50 characters')
  ]),
  taskController.createTask
);

/**
 * Get Task by ID
 * GET /api/v1/tasks/:id
 */
router.get('/:id',
  optionalAuth,
  validate([
    param('id').isUUID().withMessage('Invalid task ID format')
  ]),
  taskController.getTaskById
);

/**
 * Update Task
 * PUT /api/v1/tasks/:id
 */
router.put('/:id',
  authenticateToken,
  validate([
    param('id').isUUID().withMessage('Invalid task ID format'),
    body('title').optional().isString().trim().isLength({ min: 5, max: 100 })
      .withMessage('Title must be between 5 and 100 characters'),
    body('description').optional().isString().trim().isLength({ min: 20, max: 2000 })
      .withMessage('Description must be between 20 and 2000 characters'),
    body('categoryId').optional().isUUID().withMessage('Valid category ID is required'),
    body('budget').optional().isFloat({ min: 0 }).withMessage('Budget must be a positive number'),
    body('budgetType').optional().isIn(Object.values(BudgetType))
      .withMessage('Budget type must be one of: FIXED, HOURLY, NEGOTIABLE'),
    body('location').optional().isString().trim().isLength({ max: 100 })
      .withMessage('Location cannot exceed 100 characters'),
    body('dueDate').optional().isISO8601().toDate()
      .withMessage('Due date must be a valid date'),
    body('priority').optional().isIn(Object.values(TaskPriority))
      .withMessage('Priority must be one of: LOW, MEDIUM, HIGH, URGENT'),
    body('skills').optional().isArray().withMessage('Skills must be an array'),
    body('skills.*').optional().isString().trim().isLength({ min: 1, max: 50 })
      .withMessage('Each skill must be between 1 and 50 characters')
  ]),
  taskController.updateTask
);

/**
 * Delete Task
 * DELETE /api/v1/tasks/:id
 */
router.delete('/:id',
  authenticateToken,
  validate([
    param('id').isUUID().withMessage('Invalid task ID format')
  ]),
  taskController.deleteTask
);

/**
 * Update Task Status
 * PATCH /api/v1/tasks/:id/status
 */
router.patch('/:id/status',
  authenticateToken,
  validate([
    param('id').isUUID().withMessage('Invalid task ID format'),
    body('status').isIn(Object.values(TaskStatus))
      .withMessage('Status must be one of: OPEN, IN_PROGRESS, COMPLETED, CANCELLED'),
    body('notes').optional().isString().trim().isLength({ max: 500 })
      .withMessage('Notes cannot exceed 500 characters')
  ]),
  // TODO: Implement updateTaskStatus in task controller
  ((_req: Request, res: Response) => {
    res.status(501).json({ success: false, message: 'Not implemented' });
  }) as RequestHandler
);

/**
 * Search Tasks
 * GET /api/v1/tasks/search
 */
router.get('/search',
  optionalAuth,
  validate([
    query('categoryId').optional().isUUID().withMessage('Invalid category ID format'),
    query('status').optional().isIn(Object.values(TaskStatus))
      .withMessage('Invalid task status'),
    query('minBudget').optional().isFloat({ min: 0 })
      .withMessage('Minimum budget must be a positive number'),
    query('maxBudget').optional().isFloat({ min: 0 })
      .withMessage('Maximum budget must be a positive number'),
    query('location').optional().isString().trim(),
    query('skills').optional().isString().trim(),
    query('priority').optional().isIn(Object.values(TaskPriority))
      .withMessage('Invalid task priority'),
    query('page').optional().isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('sortBy').optional().isIn(['createdAt', 'dueDate', 'budget', 'title'])
      .withMessage('Invalid sort field'),
    query('sortOrder').optional().isIn(['asc', 'desc'])
      .withMessage('Sort order must be asc or desc')
  ]),
  taskController.searchTasks
);

/**
 * Get My Tasks (Client)
 * GET /api/v1/tasks/my-tasks
 */
router.get('/my-tasks',
  authenticateToken,
  requireRoles([UserRole.USER]),
  validate([
    query('status').optional().isIn(Object.values(TaskStatus))
      .withMessage('Invalid task status'),
    query('page').optional().isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
  ]),
  // TODO: Implement getMyTasks in task controller
  ((_req: Request, res: Response) => {
    res.status(501).json({ success: false, message: 'Not implemented' });
  }) as RequestHandler
);

/**
 * Get Tasks I'm Working On (Tasker)
 * GET /api/v1/tasks/working-on
 */
router.get('/working-on',
  authenticateToken,
  requireRoles([UserRole.TASKER]),
  validate([
    query('status').optional().isIn(Object.values(TaskStatus))
      .withMessage('Invalid task status'),
    query('page').optional().isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
  ]),
  // TODO: Implement getTasksImWorkingOn in task controller
  ((_req: Request, res: Response) => {
    res.status(501).json({ success: false, message: 'Not implemented' });
  }) as RequestHandler
);

/**
 * Add Task Attachment
 * POST /api/v1/tasks/:id/attachments
 */
router.post('/:id/attachments',
  authenticateToken,
  validate([
    param('id').isUUID().withMessage('Invalid task ID format')
  ]),
  // TODO: Implement addTaskAttachment in task controller
  ((_req: Request, res: Response) => {
    res.status(501).json({ success: false, message: 'Not implemented' });
  }) as RequestHandler
);

/**
 * Remove Task Attachment
 * DELETE /api/v1/tasks/:id/attachments/:attachmentId
 */
router.delete('/:id/attachments/:attachmentId',
  authenticateToken,
  validate([
    param('id').isUUID().withMessage('Invalid task ID format'),
    param('attachmentId').isUUID().withMessage('Invalid attachment ID format')
  ]),
  // TODO: Implement removeTaskAttachment in task controller
  ((_req: Request, res: Response) => {
    res.status(501).json({ success: false, message: 'Not implemented' });
  }) as RequestHandler
);

/**
 * Get Featured Tasks
 * GET /api/v1/tasks/featured
 */
router.get('/featured',
  optionalAuth,
  validate([
    query('limit').optional().isInt({ min: 1, max: 10 })
      .withMessage('Limit must be between 1 and 10')
  ]),
  // TODO: Implement getFeaturedTasks in task controller
  ((_req: Request, res: Response) => {
    res.status(501).json({ success: false, message: 'Not implemented' });
  }) as RequestHandler
);

export default router;
