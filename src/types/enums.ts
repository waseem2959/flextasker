/**
 * Centralized enum types for the Flextasker application.
 * 
 * This file defines all the enum types used throughout the application to ensure
 * consistency and type safety. By importing these enums instead of redefining
 * string literals in each file, we prevent inconsistencies and make it easier
 * to refactor in the future.
 */

/**
 * User role enumeration - defines what type of user someone is
 * Must match the backend UserRole enum
 */
export enum UserRole {
  USER = 'USER',      // Can post tasks and receive services
  TASKER = 'TASKER',  // Can complete tasks for others
  ADMIN = 'ADMIN'     // Can manage the platform
}

/**
 * Task status workflow - tracks the lifecycle of each task
 * Must match the backend TaskStatus enum
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
 * Must match the backend BidStatus enum
 */
export enum BidStatus {
  PENDING = 'PENDING',     // Bid submitted, awaiting response
  ACCEPTED = 'ACCEPTED',   // Bid was accepted by task owner
  REJECTED = 'REJECTED',   // Bid was declined
  WITHDRAWN = 'WITHDRAWN'  // Tasker withdrew their bid
}

/**
 * Task priority levels - indicates the urgency of a task
 * Must match the backend TaskPriority enum
 */
export enum TaskPriority {
  LOW = 'LOW',         // Not urgent, flexible timeline
  MEDIUM = 'MEDIUM',   // Standard priority
  HIGH = 'HIGH',       // Needs attention soon
  URGENT = 'URGENT'    // Requires immediate attention
}

/**
 * Budget type options - defines how the budget for a task is structured
 * Must match the backend BudgetType enum
 */
export enum BudgetType {
  FIXED = 'FIXED',           // Fixed price for the entire task
  HOURLY = 'HOURLY',         // Rate paid per hour of work
  DAILY = 'DAILY',           // Rate paid per day of work
  NEGOTIABLE = 'NEGOTIABLE'  // Budget to be determined through bidding
}
