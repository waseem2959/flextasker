import { authenticateToken, optionalAuth } from '@/middleware/auth';
import { validate } from '@/middleware/validation';
import { TaskService } from '@/services/task';
import { NextFunction, Request, Response, Router } from 'express';
import { body, param, query } from 'express-validator';
// Removed unused uploadAttachments import - following clean code practices
import { sendSuccess } from '@/utils/response';

/**
 * Task routes - these are like different service desks in a job placement office
 * where clients can post work opportunities and workers can browse and apply
 * for jobs that match their skills and interests.
 */

const router = Router();
const taskService = new TaskService();

// Define comprehensive type system for task-related enums
// This creates a robust foundation for type-safe task management
type TaskStatus = 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
type BudgetType = 'FIXED' | 'HOURLY' | 'NEGOTIABLE';

/**
 * Validation helper for task status values
 * 
 * This function acts as a type-safe gateway, ensuring that only valid
 * task statuses can pass through to your business logic. Think of it
 * as a quality control checkpoint that protects your entire system
 * from invalid state transitions.
 * 
 * @param status - The potentially unsafe status value from user input
 * @returns A properly typed status or undefined if invalid
 */
function validateTaskStatus(status: unknown): TaskStatus | undefined {
  const validStatuses: TaskStatus[] = ['OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
  
  if (typeof status === 'string' && validStatuses.includes(status as TaskStatus)) {
    return status as TaskStatus;
  }
  
  return undefined;
}

/**
 * Validation helper for task priority values
 * 
 * Task priorities drive important business decisions like search ranking
 * and notification urgency. This validator ensures that only legitimate
 * priority values influence these critical systems.
 * 
 * @param priority - The potentially unsafe priority value from user input
 * @returns A properly typed priority or undefined if invalid
 */
function validateTaskPriority(priority: unknown): TaskPriority | undefined {
  const validPriorities: TaskPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
  
  if (typeof priority === 'string' && validPriorities.includes(priority as TaskPriority)) {
    return priority as TaskPriority;
  }
  
  return undefined;
}

/**
 * Validation helper for budget type values
 * 
 * Budget types affect how payments are calculated and how tasks are
 * presented to potential workers. Ensuring validity here prevents
 * financial calculation errors and improves user experience.
 * 
 * @param budgetType - The potentially unsafe budget type value from user input
 * @returns A properly typed budget type or undefined if invalid
 */
function validateBudgetType(budgetType: unknown): BudgetType | undefined {
  const validBudgetTypes: BudgetType[] = ['FIXED', 'HOURLY', 'NEGOTIABLE'];
  
  if (typeof budgetType === 'string' && validBudgetTypes.includes(budgetType as BudgetType)) {
    return budgetType as BudgetType;
  }
  
  return undefined;
}

/**
 * Create New Task
 * POST /api/v1/tasks
 * 
 * This is like posting a job opening - clients describe what work they need done,
 * set a budget, specify requirements, and publish it for taskers to see.
 * 
 * Notice how we validate enum values at the API boundary to ensure data integrity
 * throughout the entire task lifecycle.
 */
router.post('/',
  authenticateToken,
  validate([
    body('title')
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage('Title must be between 5 and 200 characters'),
    
    body('description')
      .trim()
      .isLength({ min: 20, max: 2000 })
      .withMessage('Description must be between 20 and 2000 characters'),
    
    body('categoryId')
      .notEmpty()
      .withMessage('Category is required'),
    
    body('budget')
      .isFloat({ min: 1 })
      .withMessage('Budget must be greater than 0'),
    
    body('budgetType')
      .isIn(['FIXED', 'HOURLY', 'NEGOTIABLE'])
      .withMessage('Budget type must be FIXED, HOURLY, or NEGOTIABLE'),
    
    body('isRemote')
      .isBoolean()
      .withMessage('isRemote must be a boolean'),
    
    body('priority')
      .isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
      .withMessage('Priority must be LOW, MEDIUM, HIGH, or URGENT'),
    
    body('deadline')
      .optional()
      .isISO8601()
      .withMessage('Deadline must be a valid date'),
    
    body('estimatedHours')
      .optional()
      .isFloat({ min: 0.5, max: 1000 })
      .withMessage('Estimated hours must be between 0.5 and 1000'),
    
    body('tags')
      .isArray()
      .withMessage('Tags must be an array'),
    
    body('requirements')
      .isArray()
      .withMessage('Requirements must be an array'),
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const task = await taskService.createTask(req.user!.id, req.body);
      
      sendSuccess(res, task, 'Task created successfully', 201);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Get Task by ID
 * GET /api/v1/tasks/:id
 * 
 * This is like opening a detailed job posting to see all information,
 * including current bids, requirements, and applicant details.
 */
router.get('/:id',
  optionalAuth,
  validate([
    param('id')
      .notEmpty()
      .withMessage('Task ID is required'),
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const task = await taskService.getTaskById(req.params.id, req.user?.id);
      
      sendSuccess(res, task, 'Task retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Update Task
 * PUT /api/v1/tasks/:id
 * 
 * This allows task owners to modify their job postings, like updating
 * the description, changing the budget, or adjusting the deadline.
 */
router.put('/:id',
  authenticateToken,
  validate([
    param('id')
      .notEmpty()
      .withMessage('Task ID is required'),
    
    body('title')
      .optional()
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage('Title must be between 5 and 200 characters'),
    
    body('description')
      .optional()
      .trim()
      .isLength({ min: 20, max: 2000 })
      .withMessage('Description must be between 20 and 2000 characters'),
    
    body('budget')
      .optional()
      .isFloat({ min: 1 })
      .withMessage('Budget must be greater than 0'),
    
    body('budgetType')
      .optional()
      .isIn(['FIXED', 'HOURLY', 'NEGOTIABLE'])
      .withMessage('Budget type must be FIXED, HOURLY, or NEGOTIABLE'),
    
    body('deadline')
      .optional()
      .isISO8601()
      .withMessage('Deadline must be a valid date'),
    
    body('estimatedHours')
      .optional()
      .isFloat({ min: 0.5, max: 1000 })
      .withMessage('Estimated hours must be between 0.5 and 1000'),
    
    body('priority')
      .optional()
      .isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
      .withMessage('Priority must be LOW, MEDIUM, HIGH, or URGENT'),
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const task = await taskService.updateTask(req.params.id, req.user!.id, req.body);
      
      sendSuccess(res, task, 'Task updated successfully');
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Search Tasks
 * GET /api/v1/tasks/search
 * 
 * This is like browsing a job board with filters - users can search for
 * tasks by location, category, budget range, skills required, and more.
 * 
 * This route demonstrates the power of systematic enum validation.
 * Notice how we validate each enumerated filter value before passing
 * it to the service layer, creating a robust barrier against invalid data.
 */
router.get('/search',
  optionalAuth,
  validate([
    query('categoryId')
      .optional()
      .notEmpty()
      .withMessage('Category ID cannot be empty'),
    
    query('budgetMin')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Minimum budget must be a positive number'),
    
    query('budgetMax')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Maximum budget must be a positive number'),
    
    query('budgetType')
      .optional()
      .isIn(['FIXED', 'HOURLY', 'NEGOTIABLE'])
      .withMessage('Budget type must be FIXED, HOURLY, or NEGOTIABLE'),
    
    query('isRemote')
      .optional()
      .isBoolean()
      .withMessage('isRemote must be a boolean'),
    
    query('maxDistance')
      .optional()
      .isFloat({ min: 0, max: 1000 })
      .withMessage('Max distance must be between 0 and 1000 km'),
    
    query('priority')
      .optional()
      .isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
      .withMessage('Priority must be LOW, MEDIUM, HIGH, or URGENT'),
    
    query('status')
      .optional()
      .isIn(['OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])
      .withMessage('Invalid status'),
    
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Limit must be between 1 and 50'),
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Apply systematic enum validation to create a type-safe filter object
      // This approach ensures that only valid enumerated values reach your business logic
      const validatedBudgetType = validateBudgetType(req.query.budgetType);
      const validatedPriority = validateTaskPriority(req.query.priority);
      const validatedStatus = validateTaskStatus(req.query.status);
      
      const filters = {
        categoryId: req.query.categoryId as string,
        budgetMin: req.query.budgetMin ? parseFloat(req.query.budgetMin as string) : undefined,
        budgetMax: req.query.budgetMax ? parseFloat(req.query.budgetMax as string) : undefined,
        budgetType: validatedBudgetType, // Now properly typed instead of using 'as any'
        isRemote: req.query.isRemote === 'true',
        city: req.query.city as string,
        state: req.query.state as string,
        country: req.query.country as string,
        maxDistance: req.query.maxDistance ? parseFloat(req.query.maxDistance as string) : undefined,
        priority: validatedPriority, // Type-safe priority handling
        status: validatedStatus, // Type-safe status handling
        tags: req.query.tags ? (req.query.tags as string).split(',') : undefined,
        requirements: req.query.requirements ? (req.query.requirements as string).split(',') : undefined,
      };

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await taskService.searchTasks(filters, req.user?.id, page, limit);
      
      sendSuccess(res, result, 'Task search completed');
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Update Task Status
 * PATCH /api/v1/tasks/:id/status
 * 
 * This handles moving tasks through their workflow - from open to in-progress
 * to completed or cancelled. It's like updating a project's stage in a workflow.
 * 
 * Status transitions are critical business operations that affect payments,
 * notifications, and user experience. The type validation here prevents
 * invalid state transitions that could corrupt your business logic.
 */
router.patch('/:id/status',
  authenticateToken,
  validate([
    param('id')
      .notEmpty()
      .withMessage('Task ID is required'),
    
    body('status')
      .isIn(['OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])
      .withMessage('Status must be OPEN, IN_PROGRESS, COMPLETED, or CANCELLED'),
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate the status transition at the API boundary
      // This creates a protective barrier around your critical business logic
      const validatedStatus = validateTaskStatus(req.body.status);
      
      if (!validatedStatus) {
        return sendSuccess(res, null, 'Invalid task status provided', 400);
      }
      
      const task = await taskService.updateTaskStatus(
        req.params.id,
        validatedStatus, // Pass the validated, properly typed status
        req.user!.id
      );
      
      sendSuccess(res, task, 'Task status updated successfully');
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Delete Task
 * DELETE /api/v1/tasks/:id
 * 
 * This allows task owners to remove their job postings, but only under
 * certain conditions (like when no bids have been accepted).
 */
router.delete('/:id',
  authenticateToken,
  validate([
    param('id')
      .notEmpty()
      .withMessage('Task ID is required'),
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await taskService.deleteTask(req.params.id, req.user!.id);
      
      sendSuccess(res, null, 'Task deleted successfully');
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Get My Tasks
 * GET /api/v1/tasks/my/:type
 * 
 * This is like viewing your personal job history - shows tasks you've posted,
 * tasks you're working on, or all tasks associated with your account.
 */
router.get('/my/:type',
  authenticateToken,
  validate([
    param('type')
      .isIn(['posted', 'assigned', 'all'])
      .withMessage('Type must be posted, assigned, or all'),
    
    query('status')
      .optional()
      .isIn(['OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])
      .withMessage('Invalid status'),
    
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Limit must be between 1 and 50'),
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const type = req.params.type as 'posted' | 'assigned' | 'all';
      
      // Apply consistent status validation even for personal task queries
      // This ensures that invalid status filters don't cause unexpected results
      const validatedStatus = validateTaskStatus(req.query.status);
     const statusFilter = validatedStatus ?? (req.query.status as string);
      
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await taskService.getTasksByUser(
        req.user!.id,
        type,
        statusFilter,
        page,
        limit
      );
      
      sendSuccess(res, result, 'User tasks retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
);

export default router;