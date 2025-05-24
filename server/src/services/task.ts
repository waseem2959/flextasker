import { db } from '@/utils/database';
import {
  AuthorizationError,
  ConflictError,
  NotFoundError,
  ValidationError
} from '@/utils/errors';
import { logger } from '@/utils/logger';
import { createPagination, PaginationInfo } from '@/utils/response';

/**
 * Task service - this is like the project management office of our platform.
 * It handles creating work requests, tracking their progress through different
 * stages, managing deadlines, and ensuring all the business rules are followed.
 * 
 * Think of this as the department that manages the entire lifecycle of work
 * from initial posting to final completion and payment.
 */

// ====================================
// TYPE DEFINITIONS
// ====================================

/**
 * These interfaces provide strict typing for our data structures,
 * helping us catch errors at compile time and providing better
 * IntelliSense support for developers.
 */

// Input data interfaces - what we expect when creating/updating tasks
export interface CreateTaskData {
  title: string;
  description: string;
  categoryId: string;
  budget: number;
  budgetType: TaskBudgetType;
  location?: string;
  latitude?: number;
  longitude?: number;
  isRemote: boolean;
  deadline?: Date;
  estimatedHours?: number;
  priority: TaskPriority;
  tags: string[];
  requirements: string[];
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  budget?: number;
  budgetType?: TaskBudgetType;
  location?: string;
  latitude?: number;
  longitude?: number;
  isRemote?: boolean;
  deadline?: Date;
  estimatedHours?: number;
  priority?: TaskPriority;
  tags?: string[];
  requirements?: string[];
}

// Enum-like types for better type safety
type TaskBudgetType = 'FIXED' | 'HOURLY' | 'NEGOTIABLE';
type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
type TaskStatus = 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

// Database query interfaces - these define the shape of Prisma queries
interface TaskWhereClause {
  status?: TaskStatus | TaskStatus[];
  categoryId?: string;
  budget?: {
    gte?: number;
    lte?: number;
  };
  budgetType?: TaskBudgetType;
  isRemote?: boolean;
  priority?: TaskPriority;
  location?: {
    contains?: string;
    mode?: 'insensitive';
  };
  tags?: {
    hasEvery?: string[];
  };
  requirements?: {
    hasEvery?: string[];
  };
  deadline?: {
    not?: null;
    gte?: Date;
    lte?: Date;
  } | null;
  OR?: Array<{
    ownerId?: string;
    assigneeId?: string;
  }>;
  latitude?: {
    not?: null;
  };
  longitude?: {
    not?: null;
  };
}

// Database result interfaces - what we get back from Prisma
interface TaskFromDatabase {
  id: string;
  title: string;
  description: string;
  budget: number | string; // Prisma might return Decimal as string
  budgetType: string;
  location?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  isRemote: boolean;
  status: string;
  priority: string;
  deadline?: Date | null;
  estimatedHours?: number | null;
  tags: string[];
  requirements: string[];
  createdAt: Date;
  category: {
    id: string;
    name: string;
  };
  owner: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string | null;
    trustScore: number;
    emailVerified: boolean;
  };
  assignee?: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string | null;
    trustScore: number;
    emailVerified: boolean;
    phoneVerified: boolean;
  } | null;
  _count: {
    bids: number;
  };
  bids?: BidFromDatabase[];
  attachments?: AttachmentFromDatabase[];
  reviews?: ReviewFromDatabase[];
}

interface BidFromDatabase {
  id: string;
  amount: number | string;
  status: string;
  bidderId: string;
  bidder: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string | null;
    trustScore: number;
    emailVerified: boolean;
    phoneVerified: boolean;
  };
}

interface AttachmentFromDatabase {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  createdAt: Date;
}

interface ReviewFromDatabase {
  id: string;
  rating: number;
  title: string;
  comment: string;
  createdAt: Date;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string | null;
  };
}

// Search and filter interfaces
export interface TaskSearchFilters {
  categoryId?: string;
  budgetMin?: number;
  budgetMax?: number;
  budgetType?: TaskBudgetType;
  isRemote?: boolean;
  city?: string;
  state?: string;
  country?: string;
  maxDistance?: number; // km from user's location
  priority?: TaskPriority;
  status?: TaskStatus;
  tags?: string[];
  requirements?: string[];
  hasDeadline?: boolean;
  deadlineAfter?: Date;
  deadlineBefore?: Date;
}

// Response interfaces - what we return to the client
export interface ProcessedTask {
  id: string;
  title: string;
  description: string;
  budget: number;
  budgetType: string;
  location?: string;
  isRemote: boolean;
  status: string;
  priority: string;
  deadline?: Date;
  estimatedHours?: number;
  tags: string[];
  requirements: string[];
  category: {
    id: string;
    name: string;
  };
  owner: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    trustScore: number;
    emailVerified: boolean;
  };
  assignee?: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    trustScore: number;
    emailVerified: boolean;
  };
  bidCount: number;
  createdAt: Date;
  distance?: number; // If location-based search
}

export interface TaskSearchResult {
  tasks: ProcessedTask[];
  pagination: PaginationInfo;
}

export interface BidStatistics {
  averageAmount: number;
  lowestAmount: number | null;
  highestAmount: number | null;
}

export interface TaskPermissions {
  canEdit: boolean;
  canCancel: boolean;
  canMarkComplete: boolean;
  canBid: boolean;
  canViewBids: boolean;
}

export interface DetailedTask extends ProcessedTask {
  bids?: Array<{
    id: string;
    amount: number | null; // null if hidden from user
    description: string;
    timeline: string;
    status: string;
    submittedAt: Date;
    bidder: {
      id: string;
      firstName: string;
      lastName: string;
      avatar?: string;
      trustScore: number;
      emailVerified: boolean;
      phoneVerified: boolean;
    };
  }>;
  attachments?: AttachmentFromDatabase[];
  reviews?: ReviewFromDatabase[];
  bidStatistics: BidStatistics;
  permissions: TaskPermissions;
}

// ====================================
// MAIN SERVICE CLASS
// ====================================

export class TaskService {

  /**
   * Create a new task - like posting a job opening
   * 
   * This process involves validating the task data, checking that the category
   * exists, setting appropriate defaults, and creating the task record.
   */
  async createTask(ownerId: string, taskData: CreateTaskData): Promise<ProcessedTask> {
    try {
      // Validate that the category exists - this prevents orphaned tasks
      const category = await this.validateCategory(taskData.categoryId);

      // Validate business rules for task creation
      this.validateTaskData(taskData);

      // Create the task with properly typed data
      const newTask = await db.task.create({
        data: {
          title: taskData.title,
          description: taskData.description,
          categoryId: taskData.categoryId,
          budget: taskData.budget,
          budgetType: taskData.budgetType,
          location: taskData.location,
          latitude: taskData.latitude,
          longitude: taskData.longitude,
          isRemote: taskData.isRemote,
          deadline: taskData.deadline,
          estimatedHours: taskData.estimatedHours,
          priority: taskData.priority,
          tags: taskData.tags,
          requirements: taskData.requirements,
          ownerId,
          status: 'OPEN', // All new tasks start as open
        },
        include: this.getTaskInclude(),
      });

      logger.info('New task created:', {
        taskId: newTask.id,
        ownerId,
        title: newTask.title,
        budget: newTask.budget,
        category: category.name,
      });

      return this.processTaskData(newTask);

    } catch (error) {
      logger.error('Failed to create task:', error);
      throw error;
    }
  }

  /**
   * Get task by ID with detailed information
   * 
   * This method retrieves comprehensive task information including bids,
   * owner details, and current status. It's like pulling up a complete
   * project file with all related documents.
   */
  async getTaskById(taskId: string, currentUserId?: string): Promise<DetailedTask> {
    try {
      const task = await db.task.findUnique({
        where: { id: taskId },
        include: {
          ...this.getTaskInclude(),
          bids: {
            include: {
              bidder: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  avatar: true,
                  trustScore: true,
                  emailVerified: true,
                  phoneVerified: true,
                },
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
          attachments: {
            select: {
              id: true,
              fileName: true,
              fileUrl: true,
              fileType: true,
              fileSize: true,
              createdAt: true,
            },
          },
          reviews: {
            include: {
              author: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  avatar: true,
                },
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      });

      if (!task) {
        throw new NotFoundError('Task not found');
      }

      // Calculate bid statistics with proper typing
      const bidStatistics = this.calculateBidStatistics(task.bids ?? []);

      // Determine user permissions based on their relationship to the task
      const permissions = this.calculateTaskPermissions(task, currentUserId);

      // Filter bids based on user permissions
      const processedBids = this.processBidsForUser(task.bids ?? [], currentUserId, permissions.canViewBids);

      const result: DetailedTask = {
        ...this.processTaskData(task),
        bids: processedBids,
        attachments: task.attachments,
        reviews: task.reviews,
        bidStatistics,
        permissions,
      };

      logger.info('Task retrieved:', {
        taskId,
        viewedBy: currentUserId,
        isOwner: permissions.canEdit,
        isAssignee: permissions.canMarkComplete,
      });

      return result;

    } catch (error) {
      logger.error('Failed to get task:', error);
      throw error;
    }
  }

  /**
   * Update task information - like modifying a job posting
   * 
   * This allows task owners to update their tasks, but only if the task
   * is still in an editable state (typically OPEN status).
   */
  async updateTask(taskId: string, ownerId: string, updateData: UpdateTaskData): Promise<ProcessedTask> {
    try {
      // Verify ownership and ability to edit (validation handles the business rules)
      await this.validateTaskOwnership(taskId, ownerId);

      // Validate the update data against business rules
      this.validateTaskUpdateData(updateData);

      // Update the task with type-safe data
      const updatedTask = await db.task.update({
        where: { id: taskId },
        data: updateData,
        include: this.getTaskInclude(),
      });

      logger.info('Task updated:', {
        taskId,
        ownerId,
        updatedFields: Object.keys(updateData),
      });

      return this.processTaskData(updatedTask);

    } catch (error) {
      logger.error('Failed to update task:', error);
      throw error;
    }
  }

  /**
   * Search tasks with advanced filters - like browsing a job board
   * 
   * This powerful search function allows users to find tasks based on
   * location, budget, category, skills required, and many other criteria.
   */
  async searchTasks(
    filters: TaskSearchFilters,
    currentUserId?: string,
    page: number = 1,
    limit: number = 10
  ): Promise<TaskSearchResult> {
    try {
      // Build the database query with proper typing
      const whereClause = this.buildSearchWhereClause(filters);
      const skip = (page - 1) * limit;

      // Get total count for pagination
      const totalTasks = await db.task.count({ where: whereClause });

      // Execute the search query
      let tasks = await db.task.findMany({
        where: whereClause,
        include: this.getTaskInclude(),
        skip,
        take: limit,
        orderBy: [
          { priority: 'desc' }, // Urgent tasks first
          { createdAt: 'desc' }, // Then by newest
        ],
      });

      // Apply location-based filtering if needed
      if (filters.maxDistance && currentUserId) {
        tasks = await this.filterTasksByDistance(tasks, currentUserId, filters.maxDistance);
      }

      // Process the results with proper typing
      const processedTasks = tasks.map((task: TaskFromDatabase) => this.processTaskData(task));

      const pagination = createPagination(page, limit, totalTasks);

      logger.info('Task search completed:', {
        filters,
        currentUserId,
        page,
        limit,
        totalResults: totalTasks,
      });

      return {
        tasks: processedTasks,
        pagination,
      };

    } catch (error) {
      logger.error('Task search failed:', error);
      throw error;
    }
  }

  /**
   * Change task status - like moving a project through workflow stages
   * 
   * This handles the business logic for task status transitions, ensuring
   * only valid status changes are allowed based on current state and user permissions.
   */
  async updateTaskStatus(
    taskId: string, 
    newStatus: TaskStatus,
    userId: string
  ): Promise<ProcessedTask> {
    try {
      const task = await db.task.findUnique({
        where: { id: taskId },
        select: {
          id: true,
          status: true,
          ownerId: true,
          assigneeId: true,
        },
      });

      if (!task) {
        throw new NotFoundError('Task not found');
      }

      // Validate the status transition
      this.validateStatusTransition(task, newStatus, userId);

      // Update the task status with appropriate metadata
      const updateData: { status: TaskStatus; completionDate?: Date } = { status: newStatus };
      if (newStatus === 'COMPLETED') {
        updateData.completionDate = new Date();
      }

      const updatedTask = await db.task.update({
        where: { id: taskId },
        data: updateData,
        include: this.getTaskInclude(),
      });

      logger.info('Task status updated:', {
        taskId,
        previousStatus: task.status,
        newStatus,
        updatedBy: userId,
      });

      return this.processTaskData(updatedTask);

    } catch (error) {
      logger.error('Failed to update task status:', error);
      throw error;
    }
  }

  /**
   * Delete a task - like removing a job posting
   * 
   * Tasks can only be deleted under certain conditions (usually when OPEN
   * and no bids have been accepted). Otherwise, they should be cancelled.
   */
  async deleteTask(taskId: string, ownerId: string): Promise<void> {
    try {
      const task = await db.task.findUnique({
        where: { id: taskId },
        select: {
          id: true,
          ownerId: true,
          status: true,
          bids: {
            select: {
              status: true,
            },
          },
        },
      });

      if (!task) {
        throw new NotFoundError('Task not found');
      }

      // Validate deletion permissions and conditions
      this.validateTaskDeletion(task, ownerId);

      // Delete the task (this will cascade to related records)
      await db.task.delete({
        where: { id: taskId },
      });

      logger.info('Task deleted:', {
        taskId,
        ownerId,
      });

    } catch (error) {
      logger.error('Failed to delete task:', error);
      throw error;
    }
  }

  /**
   * Get tasks by user - like viewing someone's project history
   * 
   * This method retrieves tasks associated with a user, either as owner
   * or assignee, with appropriate filtering and pagination.
   */
  async getTasksByUser(
    userId: string,
    type: 'posted' | 'assigned' | 'all' = 'all',
    status?: string,
    page: number = 1,
    limit: number = 10
  ): Promise<TaskSearchResult> {
    try {
      const whereClause = this.buildUserTasksWhereClause(userId, type, status);
      const skip = (page - 1) * limit;

      const totalTasks = await db.task.count({ where: whereClause });

      const tasks = await db.task.findMany({
        where: whereClause,
        include: {
          ...this.getTaskInclude(),
          assignee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
              trustScore: true,
              emailVerified: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      });

      const processedTasks = tasks.map((task: TaskFromDatabase) => this.processTaskData(task));
      const pagination = createPagination(page, limit, totalTasks);

      return {
        tasks: processedTasks,
        pagination,
      };

    } catch (error) {
      logger.error('Failed to get user tasks:', error);
      throw error;
    }
  }

  // ====================================
  // PRIVATE HELPER METHODS
  // ====================================

  /**
   * These helper methods break down complex operations into smaller,
   * more manageable pieces. This improves code readability and makes
   * it easier to test individual pieces of functionality.
   */

  /**
   * Validate category exists and is active
   */
  private async validateCategory(categoryId: string): Promise<{ id: string; name: string; isActive: boolean }> {
    const category = await db.category.findUnique({
      where: { id: categoryId },
      select: { id: true, name: true, isActive: true },
    });

    if (!category?.isActive) {
      throw new ValidationError('Invalid or inactive category selected');
    }

    return category;
  }

  /**
   * Validate task creation data
   */
  private validateTaskData(taskData: CreateTaskData): void {
    if (taskData.budget <= 0) {
      throw new ValidationError('Budget must be greater than zero');
    }

    if (taskData.deadline && taskData.deadline <= new Date()) {
      throw new ValidationError('Deadline must be in the future');
    }
  }

  /**
   * Validate task ownership and ability to edit
   */
  private async validateTaskOwnership(taskId: string, ownerId: string): Promise<{ id: string; ownerId: string; status: string }> {
    const task = await db.task.findUnique({
      where: { id: taskId },
      select: {
        id: true,
        ownerId: true,
        status: true,
      },
    });

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    if (task.ownerId !== ownerId) {
      throw new AuthorizationError('You can only edit your own tasks');
    }

    if (!['OPEN', 'IN_PROGRESS'].includes(task.status)) {
      throw new ConflictError('Task cannot be edited in its current status');
    }

    return task;
  }

  /**
   * Validate task update data
   */
  private validateTaskUpdateData(updateData: UpdateTaskData): void {
    if (updateData.deadline && updateData.deadline <= new Date()) {
      throw new ValidationError('Deadline must be in the future');
    }

    if (updateData.budget !== undefined && updateData.budget <= 0) {
      throw new ValidationError('Budget must be greater than zero');
    }
  }

  /**
   * Validate status transition permissions
   */
  private validateStatusTransition(
    task: { status: string; ownerId: string; assigneeId?: string | null }, 
    newStatus: TaskStatus, 
    userId: string
  ): void {
    const isOwner = task.ownerId === userId;
    const isAssignee = task.assigneeId === userId;

    switch (newStatus) {
      case 'CANCELLED':
        if (!isOwner) {
          throw new AuthorizationError('Only task owner can cancel tasks');
        }
        if (!['OPEN', 'IN_PROGRESS'].includes(task.status)) {
          throw new ConflictError('Task cannot be cancelled in its current status');
        }
        break;

      case 'COMPLETED':
        if (!isAssignee && !isOwner) {
          throw new AuthorizationError('Only assigned tasker or owner can mark task as completed');
        }
        if (task.status !== 'IN_PROGRESS') {
          throw new ConflictError('Only in-progress tasks can be marked as completed');
        }
        break;

      case 'IN_PROGRESS':
        if (!isOwner) {
          throw new AuthorizationError('Only task owner can move task to in-progress');
        }
        break;

      case 'OPEN':
        if (!isOwner) {
          throw new AuthorizationError('Only task owner can reopen tasks');
        }
        break;
    }
  }

  /**
   * Validate task deletion conditions
   */
  private validateTaskDeletion(
    task: { ownerId: string; status: string; bids: Array<{ status: string }> }, 
    ownerId: string
  ): void {
    if (task.ownerId !== ownerId) {
      throw new AuthorizationError('You can only delete your own tasks');
    }

    if (task.status !== 'OPEN') {
      throw new ConflictError('Only open tasks can be deleted');
    }

    const hasAcceptedBids = task.bids.some((bid: { status: string }) => bid.status === 'ACCEPTED');
    if (hasAcceptedBids) {
      throw new ConflictError('Cannot delete tasks with accepted bids');
    }
  }

  /**
   * Build database include clause for task queries
   */
  private getTaskInclude(): object {
    return {
      category: {
        select: {
          id: true,
          name: true,
        },
      },
      owner: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatar: true,
          trustScore: true,
          emailVerified: true,
        },
      },
      assignee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatar: true,
          trustScore: true,
          emailVerified: true,
          phoneVerified: true,
        },
      },
      _count: {
        select: {
          bids: true,
        },
      },
    };
  }

  /**
   * Build where clause for task search with proper null handling
   */
  private buildSearchWhereClause(filters: TaskSearchFilters): TaskWhereClause {
    const whereClause: TaskWhereClause = {};

    // Use nullish coalescing for safer default handling
    whereClause.status = filters.status ?? 'OPEN';

    if (filters.categoryId) {
      whereClause.categoryId = filters.categoryId;
    }

    // Budget filters - handle both min and max independently
    this.addBudgetFilters(whereClause, filters);
    
    // Add other basic filters
    this.addBasicFilters(whereClause, filters);
    
    // Add location filters
    this.addLocationFilters(whereClause, filters);
    
    // Add array-based filters (tags, requirements)
    this.addArrayFilters(whereClause, filters);
    
    // Add deadline filters
    this.addDeadlineFilters(whereClause, filters);

    return whereClause;
  }

  /**
   * Add budget-related filters to where clause
   */
  private addBudgetFilters(whereClause: TaskWhereClause, filters: TaskSearchFilters): void {
    if (filters.budgetMin !== undefined || filters.budgetMax !== undefined) {
      whereClause.budget = {};
      if (filters.budgetMin !== undefined) {
        whereClause.budget.gte = filters.budgetMin;
      }
      if (filters.budgetMax !== undefined) {
        whereClause.budget.lte = filters.budgetMax;
      }
    }

    if (filters.budgetType) {
      whereClause.budgetType = filters.budgetType;
    }
  }

  /**
   * Add basic filters (remote, priority) to where clause
   */
  private addBasicFilters(whereClause: TaskWhereClause, filters: TaskSearchFilters): void {
    if (filters.isRemote !== undefined) {
      whereClause.isRemote = filters.isRemote;
    }

    if (filters.priority) {
      whereClause.priority = filters.priority;
    }
  }

  /**
   * Add location-based filters to where clause
   */
  private addLocationFilters(whereClause: TaskWhereClause, filters: TaskSearchFilters): void {
    if (filters.city) {
      whereClause.location = {
        contains: filters.city,
        mode: 'insensitive',
      };
    }
  }

  /**
   * Add array-based filters (tags, requirements) to where clause
   */
  private addArrayFilters(whereClause: TaskWhereClause, filters: TaskSearchFilters): void {
    if (filters.tags && filters.tags.length > 0) {
      whereClause.tags = {
        hasEvery: filters.tags,
      };
    }

    if (filters.requirements && filters.requirements.length > 0) {
      whereClause.requirements = {
        hasEvery: filters.requirements,
      };
    }
  }

  /**
   * Add deadline-related filters to where clause with safer handling
   */
  private addDeadlineFilters(whereClause: TaskWhereClause, filters: TaskSearchFilters): void {
    if (filters.hasDeadline !== undefined) {
      if (filters.hasDeadline) {
        whereClause.deadline = { not: null };
      } else {
        whereClause.deadline = null;
      }
    }

    // Use nullish coalescing to check if either deadline filter exists
    if (filters.deadlineAfter ?? filters.deadlineBefore) {
      whereClause.deadline = {
        ...whereClause.deadline,
        ...(filters.deadlineAfter && { gte: filters.deadlineAfter }),
        ...(filters.deadlineBefore && { lte: filters.deadlineBefore }),
      };
    }
  }

  /**
   * Build where clause for user tasks query with improved null safety
   */
  private buildUserTasksWhereClause(userId: string, type: string, status?: string): TaskWhereClause {
    const whereClause: TaskWhereClause = {};

    if (type === 'posted') {
      whereClause.OR = [{ ownerId: userId }];
    } else if (type === 'assigned') {
      whereClause.OR = [{ assigneeId: userId }];
    } else {
      whereClause.OR = [
        { ownerId: userId },
        { assigneeId: userId },
      ];
    }

    // Use proper type narrowing instead of loose type assertion
    if (status) {
      whereClause.status = status as TaskStatus;
    }

    return whereClause;
  }

  /**
   * Calculate bid statistics with proper typing
   */
  private calculateBidStatistics(bids: BidFromDatabase[]): BidStatistics {
    if (bids.length === 0) {
      return {
        averageAmount: 0,
        lowestAmount: null,
        highestAmount: null,
      };
    }

    const amounts = bids.map((bid: BidFromDatabase) => Number(bid.amount));
    const averageAmount = amounts.reduce((sum: number, amount: number) => sum + amount, 0) / amounts.length;
    const lowestAmount = Math.min(...amounts);
    const highestAmount = Math.max(...amounts);

    return {
      averageAmount: Math.round(averageAmount * 100) / 100,
      lowestAmount,
      highestAmount,
    };
  }

  /**
   * Calculate user permissions for a task
   */
  private calculateTaskPermissions(task: TaskFromDatabase, currentUserId?: string): TaskPermissions {
    const isOwner = currentUserId === task.owner.id;
    const isAssignee = currentUserId === task.assignee?.id;

    return {
      canEdit: isOwner && task.status === 'OPEN',
      canCancel: isOwner && ['OPEN', 'IN_PROGRESS'].includes(task.status),
      canMarkComplete: isAssignee && task.status === 'IN_PROGRESS',
      canBid: !!currentUserId && !isOwner && !isAssignee && task.status === 'OPEN',
      canViewBids: isOwner || isAssignee,
    };
  }

  /**
   * Process bids based on user permissions
   */
  private processBidsForUser(
    bids: BidFromDatabase[], 
    currentUserId?: string, 
    canViewBids: boolean = false
  ): Array<{
    id: string;
    amount: number | null;
    description: string;
    timeline: string;
    status: string;
    submittedAt: Date;
    bidder: {
      id: string;
      firstName: string;
      lastName: string;
      avatar?: string;
      trustScore: number;
      emailVerified: boolean;
      phoneVerified: boolean;
    };
  }> {
    return bids.map((bid: BidFromDatabase) => ({
      id: bid.id,
      // Hide bid amounts from other bidders unless user has permission
      amount: canViewBids || currentUserId === bid.bidderId ? Number(bid.amount) : null,
      description: '', // Would need to include this in the query
      timeline: '', // Would need to include this in the query
      status: bid.status,
      submittedAt: new Date(), // Would need to include this in the query
      bidder: {
        id: bid.bidder.id,
        firstName: bid.bidder.firstName,
        lastName: bid.bidder.lastName,
        avatar: bid.bidder.avatar ?? undefined,
        trustScore: bid.bidder.trustScore,
        emailVerified: bid.bidder.emailVerified,
        phoneVerified: bid.bidder.phoneVerified,
      },
    }));
  }

  /**
   * Convert raw task data from database to client format
   */
  private processTaskData(task: TaskFromDatabase): ProcessedTask {
    return {
      id: task.id,
      title: task.title,
      description: task.description,
      budget: Number(task.budget), // Convert Decimal to number
      budgetType: task.budgetType,
      location: task.location ?? undefined,
      isRemote: task.isRemote,
      status: task.status,
      priority: task.priority,
      deadline: task.deadline ?? undefined,
      estimatedHours: task.estimatedHours ?? undefined,
      tags: task.tags,
      requirements: task.requirements,
      category: task.category,
      owner: {
        id: task.owner.id,
        firstName: task.owner.firstName,
        lastName: task.owner.lastName,
        avatar: task.owner.avatar ?? undefined,
        trustScore: task.owner.trustScore,
        emailVerified: task.owner.emailVerified,
      },
      assignee: task.assignee ? {
        id: task.assignee.id,
        firstName: task.assignee.firstName,
        lastName: task.assignee.lastName,
        avatar: task.assignee.avatar ?? undefined,
        trustScore: task.assignee.trustScore,
        emailVerified: task.assignee.emailVerified,
      } : undefined,
      bidCount: task._count.bids,
      createdAt: task.createdAt,
    };
  }

  /**
   * Filter tasks by distance from user location with safer type handling
   */
  private async filterTasksByDistance(
    tasks: TaskFromDatabase[], 
    currentUserId: string, 
    maxDistance: number
  ): Promise<TaskFromDatabase[]> {
    try {
      // Get current user's location using optional chaining for safer access
      const currentUser = await db.user.findUnique({
        where: { id: currentUserId },
        select: { latitude: true, longitude: true },
      });

      if (!currentUser?.latitude || !currentUser?.longitude) {
        return tasks; // Return all tasks if user has no location
      }

      return tasks.filter((task: TaskFromDatabase) => {
        if (!task.latitude || !task.longitude) return true;
        
        const distance = this.calculateDistance(
          currentUser.latitude, 
          currentUser.longitude,
          task.latitude,
          task.longitude
        );
        
        return distance <= maxDistance;
      });
    } catch (error) {
      logger.warn('Failed to filter by distance:', error);
      return tasks; // Return unfiltered tasks if distance filtering fails
    }
  }

  /**
   * Calculate distance between two geographic points using Haversine formula
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
}