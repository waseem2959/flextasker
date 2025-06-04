/**
 * Shared Task Type Definitions
 * 
 * This file defines the task-related types that are shared between
 * the frontend and backend to ensure consistency across the codebase.
 */

import {
  BudgetType,
  TaskCategory,
  TaskPriority,
  TaskStatus
} from './enums';

/**
 * Task location interface
 */
export interface TaskLocation {
  address?: string;
  city?: string;
  state?: string;
  country: string;
  postalCode?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  isRemote: boolean;
}

/**
 * Task attachment interface
 */
export interface TaskAttachment {
  id: string;
  filename: string;
  filesize: number;
  contentType: string;
  url: string;
  thumbnailUrl?: string;
  uploadedAt: string;
  uploadedBy: string;
}

/**
 * Task budget interface
 */
export interface TaskBudget {
  type: BudgetType;
  amount?: number;
  maxAmount?: number;
  currency: string;
  estimatedHours?: number;
  negotiable: boolean;
}

/**
 * Task timing interface
 */
export interface TaskTiming {
  startDate?: string;
  dueDate?: string;
  estimatedDuration?: number; // in days
  isFlexible: boolean;
}

/**
 * Task requirements interface
 */
export interface TaskRequirements {
  skills?: string[];
  experience?: string;
  certifications?: string[];
  equipmentNeeded?: string[];
  otherRequirements?: string;
}

/**
 * Base Task interface - common properties for all tasks
 */
export interface BaseTask {
  id: string;
  title: string;
  description: string;
  category: TaskCategory;
  location: TaskLocation;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  priority: TaskPriority;
  status: TaskStatus;
  tags?: string[];
  attachments?: TaskAttachment[];
}

/**
 * Complete Task interface with all properties
 */
export interface Task extends BaseTask {
  budget: TaskBudget;
  timing: TaskTiming;
  requirements?: TaskRequirements;
  viewCount: number;
  applicantCount: number;
  isFeatured: boolean;
  isUrgent: boolean;
}

/**
 * Task creation request interface
 */
export interface CreateTaskRequest {
  title: string;
  description: string;
  category: TaskCategory;
  budget: TaskBudget;
  location: TaskLocation;
  timing: TaskTiming;
  requirements?: TaskRequirements;
  tags?: string[];
  priority: TaskPriority;
  attachmentIds?: string[]; // IDs of previously uploaded attachments
}

/**
 * Task update request interface
 */
export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  category?: TaskCategory;
  budget?: Partial<TaskBudget>;
  location?: Partial<TaskLocation>;
  timing?: Partial<TaskTiming>;
  requirements?: Partial<TaskRequirements>;
  tags?: string[];
  priority?: TaskPriority;
  status?: TaskStatus;
  attachmentsToAdd?: string[];
  attachmentsToRemove?: string[];
}

/**
 * Task search parameters interface
 */
export interface TaskSearchParams {
  query?: string;
  category?: TaskCategory | TaskCategory[];
  status?: TaskStatus | TaskStatus[];
  priority?: TaskPriority | TaskPriority[];
  location?: string;
  remoteOnly?: boolean;
  minBudget?: number;
  maxBudget?: number;
  budgetType?: BudgetType;
  createdAfter?: string;
  createdBefore?: string;
  dueAfter?: string;
  dueBefore?: string;
  tags?: string[];
  skills?: string[];
  sortBy?: 'createdAt' | 'dueDate' | 'budget' | 'priority';
  sortDirection?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

/**
 * Task response interface with pagination
 */
export interface TasksResponse {
  tasks: Task[];
  pagination: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

/**
 * Task with discriminated union based on status
 */
export type TaskWithStatus = 
  | DraftTask
  | OpenTask
  | AssignedTask
  | AcceptedTask
  | InProgressTask
  | CompletedTask
  | CancelledTask
  | DisputedTask
  | ReviewedTask;

/**
 * Draft Task interface
 */
export interface DraftTask extends Task {
  status: TaskStatus.DRAFT;
  // Draft-specific properties
  isDraft: true;
  draftExpiresAt?: string;
}

/**
 * Open Task interface
 */
export interface OpenTask extends Task {
  status: TaskStatus.OPEN;
  // Open-specific properties
  openedAt: string;
  viewCount: number;
  applicantCount: number;
}

/**
 * Assigned Task interface
 */
export interface AssignedTask extends Task {
  status: TaskStatus.ASSIGNED;
  // Assigned-specific properties
  assignedTo: string;
  assignedAt: string;
  assignmentMessage?: string;
}

/**
 * Accepted Task interface
 */
export interface AcceptedTask extends Task {
  status: TaskStatus.ACCEPTED;
  // Accepted-specific properties
  assignedTo: string;
  acceptedAt: string;
  acceptanceMessage?: string;
}

/**
 * In Progress Task interface
 */
export interface InProgressTask extends Task {
  status: TaskStatus.IN_PROGRESS;
  // In-progress-specific properties
  assignedTo: string;
  startedAt: string;
  progressUpdates?: {
    id: string;
    message: string;
    timestamp: string;
    attachments?: TaskAttachment[];
  }[];
  progressPercentage?: number;
}

/**
 * Completed Task interface
 */
export interface CompletedTask extends Task {
  status: TaskStatus.COMPLETED;
  // Completed-specific properties
  assignedTo: string;
  completedAt: string;
  completionMessage?: string;
  completionAttachments?: TaskAttachment[];
  awaitingReview: boolean;
}

/**
 * Cancelled Task interface
 */
export interface CancelledTask extends Task {
  status: TaskStatus.CANCELLED;
  // Cancelled-specific properties
  cancelledAt: string;
  cancelledBy: string;
  cancellationReason?: string;
  refundStatus?: 'none' | 'partial' | 'full';
}

/**
 * Disputed Task interface
 */
export interface DisputedTask extends Task {
  status: TaskStatus.DISPUTED;
  // Disputed-specific properties
  disputeOpenedAt: string;
  disputeOpenedBy: string;
  disputeReason: string;
  disputeAttachments?: TaskAttachment[];
  disputeStatus: 'open' | 'under_review' | 'resolved';
}

/**
 * Reviewed Task interface
 */
export interface ReviewedTask extends Task {
  status: TaskStatus.REVIEWED;
  // Reviewed-specific properties
  assignedTo: string;
  completedAt: string;
  reviewedAt: string;
  reviewId: string;
  rating: number;
}
