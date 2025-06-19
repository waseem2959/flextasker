/**
 * Shared Enumerations
 * 
 * Common enums used by both frontend and backend.
 * This ensures consistency in type definitions across the codebase.
 */

/**
 * User role enumeration - defines what type of user someone is
 * Standardized to exactly three roles for FlexTasker marketplace
 */
export enum UserRole {
  USER = 'user',      // Can post tasks and receive services (task posters)
  TASKER = 'tasker',  // Can complete tasks for others (service providers)
  ADMIN = 'admin'     // Can manage the platform (platform management)
}

/**
 * Task status workflow - tracks the lifecycle of each task
 */
export enum TaskStatus {
  DRAFT = 'draft',            // Task is saved but not published
  OPEN = 'open',              // Task is posted and accepting bids
  ASSIGNED = 'assigned',      // Task has been assigned but not started
  ACCEPTED = 'accepted',      // Task's bid has been accepted but work not started
  IN_PROGRESS = 'in_progress', // Task is being worked on
  COMPLETED = 'completed',    // Task is finished and awaiting final approval
  CANCELLED = 'cancelled',    // Task was cancelled by either party
  DISPUTED = 'disputed',      // Task has issues that need admin resolution
  REVIEWED = 'reviewed'       // Task has been completed and reviewed
}

/**
 * Bid status tracking - shows the current state of each bid
 */
export enum BidStatus {
  PENDING = 'pending',     // Bid submitted, awaiting response
  ACCEPTED = 'accepted',   // Bid was accepted by task owner
  REJECTED = 'rejected',   // Bid was declined
  WITHDRAWN = 'withdrawn', // Tasker withdrew their bid
  EXPIRED = 'expired'      // Bid expired without a response
}

/**
 * Task priority levels - indicates the urgency of a task
 */
export enum TaskPriority {
  LOW = 'low',         // Not urgent, flexible timeline
  NORMAL = 'normal',   // Standard priority
  MEDIUM = 'medium',   // Medium priority (alias for NORMAL)
  HIGH = 'high',       // Needs attention soon
  URGENT = 'urgent'    // Requires immediate attention
}

/**
 * Budget type options - defines how payment for a task is structured
 */
export enum BudgetType {
  FIXED = 'fixed',         // One-time payment for completion
  HOURLY = 'hourly',       // Payment based on hours worked
  NEGOTIABLE = 'negotiable' // Payment terms to be discussed
}

/**
 * Notification types - categorizes different notification events
 */
export enum NotificationType {
  TASK_CREATED = 'task_created',     // When a new task is created
  TASK_UPDATED = 'task_updated',     // When a task is modified
  TASK_COMPLETED = 'task_completed', // When a task is marked complete
  TASK_CANCELLED = 'task_cancelled', // When a task is cancelled
  BID_RECEIVED = 'bid_received',     // When a new bid is placed
  BID_ACCEPTED = 'bid_accepted',     // When a bid is accepted
  BID_REJECTED = 'bid_rejected',     // When a bid is rejected
  MESSAGE_RECEIVED = 'message_received', // When a message is received
  REVIEW_RECEIVED = 'review_received',   // When a review is submitted
  PAYMENT_RECEIVED = 'payment_received', // When payment is processed
  SYSTEM_ALERT = 'system_alert'          // System level notification
}

/**
 * Payment status
 */
export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  DISPUTED = 'disputed'
}

/**
 * Review rating values
 */
export enum ReviewRating {
  ONE = 1,
  TWO = 2,
  THREE = 3,
  FOUR = 4,
  FIVE = 5
}

/**
 * Account verification status
 */
export enum VerificationStatus {
  UNVERIFIED = 'unverified',
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
  EXPIRED = 'expired'
}

/**
 * File types allowed for upload
 */
export enum AllowedFileType {
  IMAGE = 'image',
  DOCUMENT = 'document',
  VIDEO = 'video',
  AUDIO = 'audio'
}

/**
 * Task categories
 */
export enum TaskCategory {
  WEB_DEVELOPMENT = 'web_development',
  MOBILE_DEVELOPMENT = 'mobile_development',
  DESIGN = 'design',
  WRITING = 'writing',
  MARKETING = 'marketing',
  DATA_ENTRY = 'data_entry',
  TRANSLATION = 'translation',
  CONSULTING = 'consulting',
  OTHER = 'other'
}

// Re-export error types for consistency
export { ErrorType, HttpStatusCode } from '../errors';
