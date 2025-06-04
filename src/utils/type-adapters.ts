/**
 * Type Adapters and Type Guards
 * 
 * A consolidated module for all type-related utilities, including:
 * - Type guards for runtime type checking
 * - Type adapters for converting between different type representations
 * - Type validation helpers
 */

import { logger } from '../services/logging';
import {
    BidStatus, BudgetType,
    Task as RegularTask,
    TaskPriority, TaskStatus, UserRole
} from '../types';
import {
    AcceptedTask,
    CancelledTask,
    CompletedTask,
    Task as DiscriminatedTask,
    DisputedTask,
    InProgressTask,
    OpenTask,
    TaskBase
} from '../types/task-types';

/**
 * ======================
 * TASK TYPE GUARDS
 * ======================
 */

/**
 * Type guard to check if a task is open
 * 
 * @param task - Task to check
 * @returns Type predicate for OpenTask
 */
export function isOpenTask(task: DiscriminatedTask): task is OpenTask {
  return task.status === TaskStatus.OPEN;
}

/**
 * Type guard to check if a task is accepted but work not started
 * 
 * @param task - Task to check
 * @returns Type predicate for AcceptedTask
 */
export function isAcceptedTask(task: DiscriminatedTask): task is AcceptedTask {
  return task.status === TaskStatus.ACCEPTED;
}

/**
 * Type guard to check if a task is in active progress
 * 
 * @param task - Task to check
 * @returns Type predicate for InProgressTask
 */
export function isInProgressTask(task: DiscriminatedTask): task is InProgressTask {
  return task.status === TaskStatus.IN_PROGRESS;
}

/**
 * Type guard to check if a task is completed
 * 
 * @param task - Task to check
 * @returns Type predicate for CompletedTask
 */
export function isCompletedTask(task: DiscriminatedTask): task is CompletedTask {
  return task.status === TaskStatus.COMPLETED;
}

/**
 * Type guard to check if a task is cancelled
 * 
 * @param task - Task to check
 * @returns Type predicate for CancelledTask
 */
export function isCancelledTask(task: DiscriminatedTask): task is CancelledTask {
  return task.status === TaskStatus.CANCELLED;
}

/**
 * Type guard to check if a task is in dispute
 * 
 * @param task - Task to check
 * @returns Type predicate for DisputedTask
 */
export function isDisputedTask(task: DiscriminatedTask): task is DisputedTask {
  return task.status === TaskStatus.DISPUTED;
}

/**
 * Type guard to check if a task can be assigned
 * (Open tasks can be assigned)
 * 
 * @param task - Task to check
 * @returns Boolean indicating if task can be assigned
 */
export function canAssignTask(task: DiscriminatedTask): boolean {
  return isOpenTask(task);
}

/**
 * Type guard to check if a task can be started
 * (Accepted tasks can be started)
 * 
 * @param task - Task to check
 * @returns Boolean indicating if task can be started
 */
export function canStartTask(task: DiscriminatedTask): boolean {
  return isAcceptedTask(task);
}

/**
 * Type guard to check if a task can be completed
 * (In-progress tasks can be completed)
 * 
 * @param task - Task to check
 * @returns Boolean indicating if task can be completed
 */
export function canCompleteTask(task: DiscriminatedTask): boolean {
  return isInProgressTask(task);
}

/**
 * Type guard to check if a task can be cancelled
 * (Open, accepted, and in-progress tasks can be cancelled)
 * 
 * @param task - Task to check
 * @returns Boolean indicating if task can be cancelled
 */
export function canCancelTask(task: DiscriminatedTask): boolean {
  return isOpenTask(task) || isAcceptedTask(task) || isInProgressTask(task);
}

/**
 * Type guard to check if a task can be disputed
 * (Completed tasks can be disputed)
 * 
 * @param task - Task to check
 * @returns Boolean indicating if task can be disputed
 */
export function canDisputeTask(task: DiscriminatedTask): boolean {
  return isCompletedTask(task);
}

/**
 * Type guard to check if a value is a valid UserRole enum value
 * 
 * @param role - Value to check
 * @returns Type predicate for UserRole
 */
export function isUserRole(role: any): role is UserRole {
  return Object.values(UserRole).includes(role);
}

/**
 * Type guard to check if a bid status is valid
 * 
 * @param status - Value to check
 * @returns Type predicate for BidStatus
 */
export function isBidStatus(status: any): status is BidStatus {
  return Object.values(BidStatus).includes(status);
}

/**
 * ======================
 * TYPE ADAPTERS
 * ======================
 */

/**
 * Converts a regular Task to a discriminated union Task
 * 
 * This adapter enables us to use the new discriminated union pattern
 * with existing code that still uses the regular Task interface.
 * 
 * @param task - Regular task from types/index.ts
 * @returns Task with discriminated union pattern from types/task.ts
 */
export function toDiscriminatedTask(task: RegularTask): DiscriminatedTask {
  // Define the base task properties shared by all subtypes
  const baseTask: TaskBase = {
    id: task.id,
    title: task.title,
    description: task.description,
    category: task.category,
    budget: task.budget,
    location: task.location,
    clientId: task.owner.id,
    clientName: `${task.owner.firstName} ${task.owner.lastName}`,
    clientAvatar: task.owner.avatar,
    createdAt: task.createdAt,
    updatedAt: task.createdAt, // Using createdAt as updatedAt since Task doesn't have updatedAt
    tags: task.tags ?? []
  };
  
  // Create defaults for fields that might not exist on the original task
  const taskerDetails = task.assignee ? {
    taskerId: task.assignee.id,
    taskerName: `${task.assignee.firstName} ${task.assignee.lastName}`,
    taskerAvatar: task.assignee.avatar
  } : {
    taskerId: '',
    taskerName: '',
    taskerAvatar: null
  };

  // Return different subtypes based on task status
  switch(task.status) {
    case TaskStatus.OPEN: {
      return {
        ...baseTask,
        status: TaskStatus.OPEN,
        dueDate: task.deadline,
        bids: [] // Default empty array since bids might not exist
      };
    }
      
    case TaskStatus.ACCEPTED:
      return {
        ...baseTask,
        ...taskerDetails,
        status: TaskStatus.ACCEPTED,
        acceptedBidId: '', // Using default values
        acceptedAt: new Date(),
        startByDate: task.startDate,
        dueDate: task.deadline
      };
      
    case TaskStatus.IN_PROGRESS:
      return {
        ...baseTask,
        ...taskerDetails,
        status: TaskStatus.IN_PROGRESS,
        acceptedBidId: '',
        acceptedAt: new Date(),
        startedAt: task.startDate ?? new Date(),
        estimatedCompletionDate: task.deadline,
        progress: 0,
        dueDate: task.deadline
      };
      
    case TaskStatus.COMPLETED:
      return {
        ...baseTask,
        ...taskerDetails,
        status: TaskStatus.COMPLETED,
        acceptedBidId: '',
        acceptedAt: new Date(),
        startedAt: task.startDate ?? new Date(),
        completedAt: task.completedAt ?? new Date(),
        rating: 0,
        review: ''
      };
      
    case TaskStatus.CANCELLED:
      return {
        ...baseTask,
        status: TaskStatus.CANCELLED,
        cancelledAt: new Date(),
        cancelledBy: task.owner.id,
        cancellationReason: ''
      };
      
    case TaskStatus.DISPUTED:
      return {
        ...baseTask,
        ...taskerDetails,
        status: TaskStatus.DISPUTED,
        acceptedBidId: '',
        acceptedAt: new Date(),
        startedAt: task.startDate ?? new Date(),
        completedAt: task.completedAt,
        disputedAt: new Date(),
        disputeReason: 'Dispute reason not provided',
        disputeResolution: null
      };
        default: {
      // Fallback to open task if status is unknown
      logger.warn(`Unknown task status: ${task.status}. Defaulting to OPEN.`);
      return {
        ...baseTask,
        status: TaskStatus.OPEN,
        dueDate: task.deadline,
        bids: []
      };
    }
  }
}

/**
 * Converts a discriminated union Task to a regular Task
 * 
 * This adapter enables us to use the regular Task interface with
 * code that now uses the discriminated union pattern.
 * 
 * @param task - Task with discriminated union pattern from types/task.ts
 * @returns Regular task from types/index.ts
 */
export function toRegularTask(task: DiscriminatedTask): RegularTask {
  // Create a new task object with properties that match the regular Task interface
  const baseTask: any = {
    id: task.id,
    title: task.title,
    description: task.description,
    category: task.category,
    status: task.status,
    budget: task.budget,
    // For simplicity, we're using default values for required fields not in the discriminated task
    priority: TaskPriority.MEDIUM,
    budgetType: BudgetType.FIXED,
    isRemote: false,
    location: task.location,
    tags: task.tags,
    requirements: [],
    createdAt: task.createdAt,
    // Create a minimal User object for the owner from client information
    owner: {
      id: task.clientId,
      firstName: task.clientName.split(' ')[0],
      lastName: task.clientName.split(' ')[1] || '',
      email: '', // Default value
      role: UserRole.USER,
      trustScore: 0,
      emailVerified: true,
      phoneVerified: false,
      createdAt: new Date(),
      avatar: task.clientAvatar
    }
  };
  
  // Add specific properties based on task type
  if (isOpenTask(task)) {
    baseTask.deadline = task.dueDate; // Convert dueDate to deadline
    baseTask.bids = task.bids;
  } else if (isAcceptedTask(task)) {
    baseTask.acceptedBidId = task.acceptedBidId;
    baseTask.acceptedAt = task.acceptedAt;
    baseTask.taskerId = task.taskerId;
    baseTask.taskerName = task.taskerName;
    baseTask.taskerAvatar = task.taskerAvatar;
    baseTask.startDate = task.startByDate; // Convert startByDate to startDate
    baseTask.deadline = task.dueDate; // Convert dueDate to deadline
  } else if (isInProgressTask(task)) {
    baseTask.acceptedBidId = task.acceptedBidId;
    baseTask.acceptedAt = task.acceptedAt;
    baseTask.taskerId = task.taskerId;
    baseTask.taskerName = task.taskerName;
    baseTask.taskerAvatar = task.taskerAvatar;
    baseTask.startDate = task.startedAt; // Use startedAt as startDate
    baseTask.estimatedCompletionDate = task.estimatedCompletionDate;
    baseTask.progress = task.progress;
    baseTask.deadline = task.dueDate; // Convert dueDate to deadline
  } else if (isCompletedTask(task)) {
    baseTask.acceptedBidId = task.acceptedBidId;
    baseTask.acceptedAt = task.acceptedAt;
    baseTask.taskerId = task.taskerId;
    baseTask.taskerName = task.taskerName;
    baseTask.taskerAvatar = task.taskerAvatar;
    baseTask.startDate = task.startedAt; // Use startedAt as startDate
    baseTask.completedAt = task.completedAt;
    baseTask.rating = task.rating;
    baseTask.review = task.review;
  } else if (isCancelledTask(task)) {
    baseTask.cancelledAt = task.cancelledAt;
    baseTask.cancelledBy = task.cancelledBy;
    baseTask.cancellationReason = task.cancellationReason;
  } else if (isDisputedTask(task)) {
    baseTask.acceptedBidId = task.acceptedBidId;
    baseTask.acceptedAt = task.acceptedAt;
    baseTask.taskerId = task.taskerId;
    baseTask.taskerName = task.taskerName;
    baseTask.taskerAvatar = task.taskerAvatar;
    baseTask.startDate = task.startedAt; // Use startedAt as startDate
    baseTask.completedAt = task.completedAt;
    baseTask.disputedAt = task.disputedAt;
    baseTask.disputeReason = task.disputeReason;
    baseTask.disputeResolution = task.disputeResolution;
  }
  
  return baseTask as RegularTask;
}

/**
 * Type guard to check if a task is using the discriminated union pattern
 * 
 * @param task - Task to check
 * @returns Type predicate for discriminated union task
 */
export function isDiscriminatedTask(task: RegularTask | DiscriminatedTask): task is DiscriminatedTask {
  return 'status' in task && Object.prototype.hasOwnProperty.call(task, 'status');
}

/**
 * Type guard to check if a task is using the regular task interface
 * 
 * @param task - Task to check
 * @returns Type predicate for regular task
 */
export function isRegularTask(task: RegularTask | DiscriminatedTask): task is RegularTask {
  return !isDiscriminatedTask(task);
}

/**
 * Ensures a task is in the discriminated union format
 * 
 * @param task - Task that could be either type
 * @returns Task in discriminated union format
 */
export function ensureDiscriminatedTask(task: RegularTask | DiscriminatedTask): DiscriminatedTask {
  if (isDiscriminatedTask(task)) {
    return task;
  } else {
    return toDiscriminatedTask(task);
  }
}

/**
 * Ensures a task is in the regular format
 * 
 * @param task - Task that could be either type
 * @returns Task in regular format
 */
export function ensureRegularTask(task: RegularTask | DiscriminatedTask): RegularTask {
  if (isRegularTask(task)) {
    return task;
  } else {
    return toRegularTask(task);
  }
}
