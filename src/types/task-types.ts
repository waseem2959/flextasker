/**
 * Task Type Definitions with Discriminated Unions
 * 
 * This file defines task-related types using a discriminated union pattern,
 * allowing for more precise type checking based on task status.
 */

import { TaskStatus } from './index';
import { Category } from './models-types';

/**
 * Base Task interface with properties common to all task types
 */
export interface TaskBase {
  id: string;
  title: string;
  description: string;
  category: Category;
  budget: number;
  location?: string;
  clientId: string;
  clientName: string;
  clientAvatar?: string | null;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
}

/**
 * Open Task - A task that is accepting bids
 */
export interface OpenTask extends TaskBase {
  status: TaskStatus.OPEN;
  dueDate?: Date;
  bids: Array<any>; // Using any for simplicity, could be a Bid type
}

/**
 * Accepted Task - A task where a bid has been accepted but work hasn't started
 */
export interface AcceptedTask extends TaskBase {
  status: TaskStatus.ACCEPTED;
  acceptedBidId: string;
  acceptedAt: Date;
  taskerId: string;
  taskerName: string;
  taskerAvatar?: string | null;
  startByDate?: Date;
  dueDate?: Date;
}

/**
 * In Progress Task - A task that is currently being worked on
 */
export interface InProgressTask extends TaskBase {
  status: TaskStatus.IN_PROGRESS;
  acceptedBidId: string;
  acceptedAt: Date;
  taskerId: string;
  taskerName: string;
  taskerAvatar?: string | null;
  startedAt: Date;
  estimatedCompletionDate?: Date;
  progress: number;
  dueDate?: Date;
}

/**
 * Completed Task - A task that has been finished
 */
export interface CompletedTask extends TaskBase {
  status: TaskStatus.COMPLETED;
  acceptedBidId: string;
  acceptedAt: Date;
  taskerId: string;
  taskerName: string;
  taskerAvatar?: string | null;
  startedAt: Date;
  completedAt: Date;
  rating?: number;
  review?: string;
}

/**
 * Cancelled Task - A task that was cancelled
 */
export interface CancelledTask extends TaskBase {
  status: TaskStatus.CANCELLED;
  cancelledAt: Date;
  cancelledBy: string;
  cancellationReason?: string;
}

/**
 * Disputed Task - A task with a dispute
 */
export interface DisputedTask extends TaskBase {
  status: TaskStatus.DISPUTED;
  acceptedBidId: string;
  acceptedAt: Date;
  taskerId: string;
  taskerName: string;
  taskerAvatar?: string | null;
  startedAt: Date;
  completedAt?: Date;
  disputedAt: Date;
  disputeReason: string;
  disputeResolution?: string | null;
}

/**
 * Task - Discriminated union of all task types
 */
export type Task = 
  | OpenTask 
  | AcceptedTask 
  | InProgressTask 
  | CompletedTask 
  | CancelledTask 
  | DisputedTask;
