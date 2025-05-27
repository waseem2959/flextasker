/**
 * Shared Enum Definitions
 * 
 * This file contains enums that are used by both frontend and backend.
 * Sharing these definitions ensures consistency across the application
 * and prevents errors due to mismatched enum values.
 */

/**
 * User role enumeration - defines what type of user someone is
 */
export enum UserRole {
  USER = 'USER',      // Can post tasks and receive services
  TASKER = 'TASKER',  // Can complete tasks for others
  ADMIN = 'ADMIN'     // Can manage the platform
}

/**
 * Task status workflow - tracks the lifecycle of each task
 */
export enum TaskStatus {
  OPEN = 'OPEN',              // Task is posted and accepting bids
  IN_PROGRESS = 'IN_PROGRESS', // Task has been accepted and is being worked on
  COMPLETED = 'COMPLETED',    // Task is finished and awaiting final approval
  CANCELLED = 'CANCELLED',    // Task was cancelled by either party
  DISPUTED = 'DISPUTED'       // Task has issues that need admin resolution
}

/**
 * Bid status tracking - shows the current state of each bid
 */
export enum BidStatus {
  PENDING = 'PENDING',     // Bid submitted, awaiting response
  ACCEPTED = 'ACCEPTED',   // Bid was accepted by task owner
  REJECTED = 'REJECTED',   // Bid was declined
  WITHDRAWN = 'WITHDRAWN'  // Tasker withdrew their bid
}

/**
 * Task priority levels - indicates the urgency of a task
 */
export enum TaskPriority {
  LOW = 'LOW',         // Not urgent, flexible timeline
  MEDIUM = 'MEDIUM',   // Standard priority
  HIGH = 'HIGH',       // Needs attention soon
  URGENT = 'URGENT'    // Requires immediate attention
}

/**
 * Budget type options - defines how payment for a task is structured
 */
export enum BudgetType {
  FIXED = 'FIXED',         // One-time payment for completion
  HOURLY = 'HOURLY',       // Payment based on hours worked
  NEGOTIABLE = 'NEGOTIABLE' // Payment terms to be discussed
}

/**
 * Notification types - categorizes different notification events
 */
export enum NotificationType {
  TASK_CREATED = 'TASK_CREATED',       // When a new task is created
  TASK_UPDATED = 'TASK_UPDATED',       // When a task is modified
  TASK_COMPLETED = 'TASK_COMPLETED',   // When a task is marked complete
  BID_RECEIVED = 'BID_RECEIVED',       // When a new bid is placed
  BID_ACCEPTED = 'BID_ACCEPTED',       // When a bid is accepted
  BID_REJECTED = 'BID_REJECTED',       // When a bid is rejected
  REVIEW_RECEIVED = 'REVIEW_RECEIVED', // When a review is submitted
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED' // When payment is processed
}
