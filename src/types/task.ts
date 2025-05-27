import { TaskStatus, TaskPriority, BudgetType } from './enums';
import { User } from './index';
import { Category } from './category';

/**
 * Task attachment interface for images and files
 */
export interface TaskAttachment {
  id: string;
  url: string;
  filename: string;
  fileType: string;
  thumbnailUrl?: string;
  size: number;
  uploadedAt: Date;
}

/**
 * Task location information
 */
export interface TaskLocation {
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  isRemote: boolean;
}

/**
 * Task budget information
 */
export interface TaskBudget {
  amount: number;
  type: BudgetType;
  currency: string;
  negotiable: boolean;
}

/**
 * Summary of bids on a task
 */
export interface BidSummary {
  count: number;
  lowestBid?: number;
  highestBid?: number;
  averageBid?: number;
}

/**
 * Base task interface with common properties
 */
export interface TaskBase {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  creator: User;
  category: Category;
  budget: TaskBudget;
  location: TaskLocation;
  attachments: TaskAttachment[];
  tags: string[];
  requirements: string[];
  bidSummary?: BidSummary;
  deadline?: Date;
  startDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Open task - Available for bidding
 */
export interface OpenTask extends TaskBase {
  status: TaskStatus.OPEN;
  assignee?: undefined;
  completedAt?: undefined;
  cancelledAt?: undefined;
}

/**
 * Task that's been accepted but work not yet started
 * (Using IN_PROGRESS status with a flag to indicate pre-work state)
 */
export interface AcceptedTask extends TaskBase {
  status: TaskStatus.IN_PROGRESS;
  assignee: User;
  workStarted: false;
  completedAt?: undefined;
  cancelledAt?: undefined;
}

/**
 * In-progress task - Work actively being performed
 */
export interface InProgressTask extends TaskBase {
  status: TaskStatus.IN_PROGRESS;
  assignee: User;
  workStarted: true;
  completedAt?: undefined;
  cancelledAt?: undefined;
}

/**
 * Completed task - Work finished
 */
export interface CompletedTask extends TaskBase {
  status: TaskStatus.COMPLETED;
  assignee: User;
  completedAt: Date;
  cancelledAt?: undefined;
}

/**
 * Cancelled task - Terminated before completion
 */
export interface CancelledTask extends TaskBase {
  status: TaskStatus.CANCELLED;
  assignee?: User;
  completedAt?: undefined;
  cancelledAt: Date;
  cancellationReason?: string;
}

/**
 * Disputed task - Issues reported, needs resolution
 */
export interface DisputedTask extends TaskBase {
  status: TaskStatus.DISPUTED;
  assignee: User;
  completedAt?: undefined;
  cancelledAt?: undefined;
  disputeReason?: string;
}

/**
 * Union type of all task states
 * Using discriminated union pattern for better type safety
 */
export type Task =
  | OpenTask
  | AcceptedTask
  | InProgressTask
  | CompletedTask
  | CancelledTask
  | DisputedTask;

/**
 * Type guard to check if a task is open
 */
export function isOpenTask(task: Task): task is OpenTask {
  return task.status === TaskStatus.OPEN;
}

/**
 * Type guard to check if a task is accepted but not started
 */
export function isAcceptedTask(task: Task): task is AcceptedTask {
  return task.status === TaskStatus.IN_PROGRESS && task.workStarted === false;
}

/**
 * Type guard to check if a task is in active progress
 */
export function isInProgressTask(task: Task): task is InProgressTask {
  return task.status === TaskStatus.IN_PROGRESS && task.workStarted === true;
}

/**
 * Type guard to check if a task is completed
 */
export function isCompletedTask(task: Task): task is CompletedTask {
  return task.status === TaskStatus.COMPLETED;
}

/**
 * Type guard to check if a task is cancelled
 */
export function isCancelledTask(task: Task): task is CancelledTask {
  return task.status === TaskStatus.CANCELLED;
}

/**
 * Type guard to check if a task is disputed
 */
export function isDisputedTask(task: Task): task is DisputedTask {
  return task.status === TaskStatus.DISPUTED;
}

/**
 * Task filter parameters for search and filtering
 */
export interface TaskFilterParams {
  status?: TaskStatus | TaskStatus[];
  priority?: TaskPriority;
  categoryId?: string;
  search?: string;
  location?: string;
  minBudget?: number;
  maxBudget?: number;
  budgetType?: BudgetType;
  startDate?: Date;
  endDate?: Date;
  userId?: string; // Tasks created by a specific user
  assignedTo?: string; // Tasks assigned to a specific user
  sortBy?: 'createdAt' | 'deadline' | 'budget' | 'priority';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

/**
 * Enhanced task data with all related information
 * Kept for backward compatibility
 */
export interface EnhancedTaskData extends TaskBase {
  status: TaskStatus;
  assignee?: User;
  completedAt?: Date;
  cancelledAt?: Date;
}
