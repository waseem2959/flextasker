/**
 * Type Guards for Task Types
 * 
 * These utility functions allow for runtime type checking of our
 * discriminated union types, providing better type safety throughout the app.
 */

import { 
  Task, 
  OpenTask, 
  AcceptedTask, 
  InProgressTask, 
  CompletedTask, 
  CancelledTask,
  DisputedTask
} from '@/types/task';
import type { User } from '@/types/models';
import { TaskStatus, UserRole, BidStatus } from '@/types/enums';

/**
 * Type guard to check if a task is open for bidding
 * 
 * @param task - Task to check
 * @returns Type predicate for OpenTask
 */
export function isOpenTask(task: Task): task is OpenTask {
  return task.status === TaskStatus.OPEN;
}

/**
 * Type guard to check if a task is accepted but work not started
 * 
 * @param task - Task to check
 * @returns Type predicate for AcceptedTask
 */
export function isAcceptedTask(task: Task): task is AcceptedTask {
  return task.status === TaskStatus.IN_PROGRESS && 
         task.assignee !== undefined && 
         !task.workStarted;
}

/**
 * Type guard to check if a task is in active progress
 * 
 * @param task - Task to check
 * @returns Type predicate for InProgressTask
 */
export function isInProgressTask(task: Task): task is InProgressTask {
  return task.status === TaskStatus.IN_PROGRESS && 
         task.assignee !== undefined && 
         task.workStarted === true;
}

/**
 * Type guard to check if a task is completed
 * 
 * @param task - Task to check
 * @returns Type predicate for CompletedTask
 */
export function isCompletedTask(task: Task): task is CompletedTask {
  return task.status === TaskStatus.COMPLETED;
}

/**
 * Type guard to check if a task is cancelled
 * 
 * @param task - Task to check
 * @returns Type predicate for CancelledTask
 */
export function isCancelledTask(task: Task): task is CancelledTask {
  return task.status === TaskStatus.CANCELLED;
}

/**
 * Type guard to check if a task is in dispute
 * 
 * @param task - Task to check
 * @returns Type predicate for DisputedTask
 */
export function isDisputedTask(task: Task): task is DisputedTask {
  return task.status === TaskStatus.DISPUTED;
}

/**
 * Type guard to check if a task can be assigned
 * (Open tasks can be assigned)
 * 
 * @param task - Task to check
 * @returns Boolean indicating if task can be assigned
 */
export function canAssignTask(task: Task): boolean {
  return isOpenTask(task);
}

/**
 * Type guard to check if a task can be started
 * (Accepted tasks can be started)
 * 
 * @param task - Task to check
 * @returns Boolean indicating if task can be started
 */
export function canStartTask(task: Task): boolean {
  return isAcceptedTask(task);
}

/**
 * Type guard to check if a task can be completed
 * (In-progress tasks can be completed)
 * 
 * @param task - Task to check
 * @returns Boolean indicating if task can be completed
 */
export function canCompleteTask(task: Task): boolean {
  return isInProgressTask(task);
}

/**
 * Type guard to check if a task can be cancelled
 * (Open, accepted, and in-progress tasks can be cancelled)
 * 
 * @param task - Task to check
 * @returns Boolean indicating if task can be cancelled
 */
export function canCancelTask(task: Task): boolean {
  return isOpenTask(task) || isAcceptedTask(task) || isInProgressTask(task);
}

/**
 * Type guard to check if a task can be disputed
 * (Completed tasks can be disputed)
 * 
 * @param task - Task to check
 * @returns Boolean indicating if task can be disputed
 */
export function canDisputeTask(task: Task): boolean {
  return isCompletedTask(task);
}

/**
 * Type guard to check if a value is a valid UserRole enum value
 * 
 * @param role - Value to check
 * @returns Type predicate for UserRole
 */
export function isUserRole(role: any): role is UserRole {
  return Object.values(UserRole).includes(role as UserRole);
}

/**
 * Type guard to check if a user is an admin
 * 
 * @param user - User to check
 * @returns Boolean indicating if user is an admin
 */
export function isAdmin(user: User | null): boolean {
  return !!user && user.role === UserRole.ADMIN;
}

/**
 * Type guard to check if a user is a tasker
 * 
 * @param user - User to check
 * @returns Boolean indicating if user is a tasker
 */
export function isTasker(user: User | null): boolean {
  return !!user && user.role === UserRole.TASKER;
}

/**
 * Type guard to check if a user is a regular user
 * 
 * @param user - User to check
 * @returns Boolean indicating if user is a regular user
 */
export function isRegularUser(user: User | null): boolean {
  return !!user && user.role === UserRole.USER;
}

/**
 * Type guard to check if a bid status is valid
 * 
 * @param status - Value to check
 * @returns Type predicate for BidStatus
 */
export function isBidStatus(status: any): status is BidStatus {
  return Object.values(BidStatus).includes(status as BidStatus);
}
