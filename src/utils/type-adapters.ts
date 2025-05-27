/**
 * Type Adapters with TypeScript Improvements
 * 
 * This utility provides adapter functions to convert between different
 * type representations within the application, enabling gradual migration
 * to improved TypeScript patterns without breaking existing code.
 */

import { Task as RegularTask, Category } from '@/types';
import { 
  Task as DiscriminatedTask,
  OpenTask,
  InProgressTask,
  CompletedTask,
  CancelledTask,
  DisputedTask,
  TaskBase
} from '@/types/task';
import { TaskStatus } from '@/types/enums';

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
  // Create the base task properties that are common to all task states
  const baseTask: TaskBase = {
    id: task.id,
    title: task.title,
    description: task.description,
    priority: task.priority,
    creator: task.owner, // owner in regular task maps to creator in discriminated task
    category: {
      id: task.category.id,
      name: task.category.name,
      icon: 'folder', // Default icon
      subcategories: [] // Default empty subcategories
    },
    budget: {
      amount: task.budget,
      type: task.budgetType,
      currency: 'USD', // Default currency
      negotiable: true // Default negotiable
    },
    location: {
      isRemote: task.isRemote,
      address: task.location
    },
    attachments: [], // Default empty attachments
    tags: task.tags || [],
    requirements: task.requirements || [],
    createdAt: task.createdAt,
    updatedAt: task.createdAt, // Use createdAt as updatedAt if not provided
    ...(task.deadline && { deadline: task.deadline }),
    ...(task.startDate && { startDate: task.startDate })
  };

  // Convert to the appropriate discriminated union type based on status
  switch (task.status) {
    case TaskStatus.OPEN:
      return {
        ...baseTask,
        status: TaskStatus.OPEN
      } as OpenTask;

    case TaskStatus.IN_PROGRESS:
      // In the regular Task, we don't have a flag for work started,
      // so we'll assume work has started if it's in progress
      return {
        ...baseTask,
        status: TaskStatus.IN_PROGRESS,
        assignee: task.assignee!,
        workStarted: true
      } as InProgressTask;

    case TaskStatus.COMPLETED:
      return {
        ...baseTask,
        status: TaskStatus.COMPLETED,
        assignee: task.assignee!,
        completedAt: task.completedAt || new Date()
      } as CompletedTask;

    case TaskStatus.CANCELLED:
      return {
        ...baseTask,
        status: TaskStatus.CANCELLED,
        assignee: task.assignee,
        cancelledAt: new Date(), // Use current date if not provided
        cancellationReason: "Task cancelled" // Default reason
      } as CancelledTask;

    case TaskStatus.DISPUTED:
      return {
        ...baseTask,
        status: TaskStatus.DISPUTED,
        assignee: task.assignee!,
        disputeReason: "Task disputed" // Default reason
      } as DisputedTask;

    default:
      // Default to open task
      return {
        ...baseTask,
        status: TaskStatus.OPEN
      } as OpenTask;
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
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    category: task.category,
    status: task.status,
    priority: task.priority,
    budget: task.budget.amount,
    budgetType: task.budget.type,
    isRemote: task.location.isRemote,
    location: task.location.address || '',
    tags: task.tags,
    requirements: task.requirements,
    createdAt: task.createdAt,
    deadline: task.deadline,
    startDate: task.startDate,
    completedAt: 'completedAt' in task ? task.completedAt : undefined,
    owner: task.creator,
    assignee: 'assignee' in task ? task.assignee : undefined,
    bidCount: 0 // Default bid count if not provided
  };
}

/**
 * Type guard to check if a task is using the discriminated union pattern
 * 
 * @param task - Task to check
 * @returns Type predicate for discriminated union task
 */
export function isDiscriminatedTask(task: RegularTask | DiscriminatedTask): task is DiscriminatedTask {
  return 'creator' in task && 'budget' in task && typeof task.budget === 'object';
}

/**
 * Type guard to check if a task is using the regular task interface
 * 
 * @param task - Task to check
 * @returns Type predicate for regular task
 */
export function isRegularTask(task: RegularTask | DiscriminatedTask): task is RegularTask {
  return 'owner' in task && 'budget' in task && typeof task.budget === 'number';
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
  }
  return toDiscriminatedTask(task);
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
  }
  return toRegularTask(task);
}
