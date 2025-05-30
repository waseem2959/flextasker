/**
 * Type Utilities
 * 
 * A consolidated module for all type-related utilities, including:
 * - Type guards for runtime type checking
 * - Type adapters for converting between different type representations
 * - Type validation helpers
 */

import { 
  Task as RegularTask
} from '../types';
import { 
  Task as DiscriminatedTask,
  OpenTask,
  AcceptedTask,
  InProgressTask,
  CompletedTask,
  CancelledTask,
  DisputedTask,
  TaskBase
} from '../types/task';
import { TaskStatus, UserRole, BidStatus } from '../types/enums';

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
    clientId: task.clientId,
    clientName: task.clientName,
    clientAvatar: task.clientAvatar,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    tags: task.tags || []
  };
  
  // Return different subtypes based on task status
  switch(task.status) {
    case TaskStatus.OPEN:
      return {
        ...baseTask,
        status: TaskStatus.OPEN,
        dueDate: task.dueDate,
        bids: task.bids || []
      };
      
    case TaskStatus.ACCEPTED:
      return {
        ...baseTask,
        status: TaskStatus.ACCEPTED,
        acceptedBidId: task.acceptedBidId!,
        acceptedAt: task.acceptedAt!,
        taskerId: task.taskerId!,
        taskerName: task.taskerName!,
        taskerAvatar: task.taskerAvatar,
        startByDate: task.startByDate,
        dueDate: task.dueDate
      };
      
    case TaskStatus.IN_PROGRESS:
      return {
        ...baseTask,
        status: TaskStatus.IN_PROGRESS,
        acceptedBidId: task.acceptedBidId!,
        acceptedAt: task.acceptedAt!,
        taskerId: task.taskerId!,
        taskerName: task.taskerName!,
        taskerAvatar: task.taskerAvatar,
        startedAt: task.startedAt!,
        estimatedCompletionDate: task.estimatedCompletionDate,
        progress: task.progress || 0,
        dueDate: task.dueDate
      };
      
    case TaskStatus.COMPLETED:
      return {
        ...baseTask,
        status: TaskStatus.COMPLETED,
        acceptedBidId: task.acceptedBidId!,
        acceptedAt: task.acceptedAt!,
        taskerId: task.taskerId!,
        taskerName: task.taskerName!,
        taskerAvatar: task.taskerAvatar,
        startedAt: task.startedAt!,
        completedAt: task.completedAt!,
        rating: task.rating,
        review: task.review
      };
      
    case TaskStatus.CANCELLED:
      return {
        ...baseTask,
        status: TaskStatus.CANCELLED,
        cancelledAt: task.cancelledAt!,
        cancelledBy: task.cancelledBy!,
        cancellationReason: task.cancellationReason
      };
      
    case TaskStatus.DISPUTED:
      return {
        ...baseTask,
        status: TaskStatus.DISPUTED,
        acceptedBidId: task.acceptedBidId!,
        acceptedAt: task.acceptedAt!,
        taskerId: task.taskerId!,
        taskerName: task.taskerName!,
        taskerAvatar: task.taskerAvatar,
        startedAt: task.startedAt!,
        completedAt: task.completedAt,
        disputedAt: task.disputedAt!,
        disputeReason: task.disputeReason!,
        disputeResolution: task.disputeResolution
      };
      
    default:
      // Fallback to open task if status is unknown
      return {
        ...baseTask,
        status: TaskStatus.OPEN,
        dueDate: task.dueDate,
        bids: task.bids || []
      };
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
  const baseTask: RegularTask = {
    id: task.id,
    title: task.title,
    description: task.description,
    category: task.category,
    budget: task.budget,
    location: task.location,
    clientId: task.clientId,
    clientName: task.clientName,
    clientAvatar: task.clientAvatar,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    status: task.status,
    tags: task.tags
  };
  
  // Add specific properties based on task type
  if (isOpenTask(task)) {
    baseTask.dueDate = task.dueDate;
    baseTask.bids = task.bids;
  } else if (isAcceptedTask(task)) {
    baseTask.acceptedBidId = task.acceptedBidId;
    baseTask.acceptedAt = task.acceptedAt;
    baseTask.taskerId = task.taskerId;
    baseTask.taskerName = task.taskerName;
    baseTask.taskerAvatar = task.taskerAvatar;
    baseTask.startByDate = task.startByDate;
    baseTask.dueDate = task.dueDate;
  } else if (isInProgressTask(task)) {
    baseTask.acceptedBidId = task.acceptedBidId;
    baseTask.acceptedAt = task.acceptedAt;
    baseTask.taskerId = task.taskerId;
    baseTask.taskerName = task.taskerName;
    baseTask.taskerAvatar = task.taskerAvatar;
    baseTask.startedAt = task.startedAt;
    baseTask.estimatedCompletionDate = task.estimatedCompletionDate;
    baseTask.progress = task.progress;
    baseTask.dueDate = task.dueDate;
  } else if (isCompletedTask(task)) {
    baseTask.acceptedBidId = task.acceptedBidId;
    baseTask.acceptedAt = task.acceptedAt;
    baseTask.taskerId = task.taskerId;
    baseTask.taskerName = task.taskerName;
    baseTask.taskerAvatar = task.taskerAvatar;
    baseTask.startedAt = task.startedAt;
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
    baseTask.startedAt = task.startedAt;
    baseTask.completedAt = task.completedAt;
    baseTask.disputedAt = task.disputedAt;
    baseTask.disputeReason = task.disputeReason;
    baseTask.disputeResolution = task.disputeResolution;
  }
  
  return baseTask;
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
