/**
 * Task Configuration
 * Centralized configuration for all task-related settings
 */

import { BudgetType, TaskPriority, TaskStatus } from '../types/common/enums';

/**
 * Task validation configuration
 */
export const TASK_VALIDATION = {
  TITLE: {
    MIN_LENGTH: 5,
    MAX_LENGTH: 100,
    PATTERN: /^[a-zA-Z0-9\s\-.,!?()]+$/,
    REQUIRED: true,
  },
  
  DESCRIPTION: {
    MIN_LENGTH: 20,
    MAX_LENGTH: 2000,
    REQUIRED: true,
  },
  
  BUDGET: {
    MIN_AMOUNT: 5,
    MAX_AMOUNT: 10000,
    DEFAULT_CURRENCY: 'USD',
    SUPPORTED_CURRENCIES: ['USD', 'EUR', 'GBP', 'AUD', 'CAD'],
    DECIMAL_PLACES: 2,
  },
  
  LOCATION: {
    ADDRESS_MAX_LENGTH: 200,
    CITY_MAX_LENGTH: 100,
    STATE_MAX_LENGTH: 100,
    COUNTRY_MAX_LENGTH: 100,
    POSTAL_CODE_PATTERN: /^[A-Z0-9\s-]{3,10}$/i,
  },
  
  TAGS: {
    MIN_PER_TASK: 0,
    MAX_PER_TASK: 10,
    MIN_LENGTH: 2,
    MAX_LENGTH: 50,
    PATTERN: /^[a-zA-Z0-9-]+$/,
  },
  
  SKILLS: {
    MIN_PER_TASK: 0,
    MAX_PER_TASK: 20,
    MIN_LENGTH: 1,
    MAX_LENGTH: 50,
  },
  
  ATTACHMENTS: {
    MAX_COUNT: 10,
    MAX_SIZE_BYTES: 10 * 1024 * 1024, // 10MB
    ALLOWED_TYPES: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
    ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.doc', '.docx'],
  },
  
  TIMING: {
    MIN_DURATION_DAYS: 1,
    MAX_DURATION_DAYS: 365,
    MIN_ADVANCE_DAYS: 0,
    MAX_ADVANCE_DAYS: 180,
  },
  
  REQUIREMENTS: {
    MAX_LENGTH: 1000,
    MAX_ITEMS: 20,
    ITEM_MAX_LENGTH: 100,
  },
} as const;

/**
 * Task default values
 */
export const TASK_DEFAULTS = {
  STATUS: TaskStatus.DRAFT,
  PRIORITY: TaskPriority.MEDIUM,
  BUDGET_TYPE: BudgetType.FIXED,
  CURRENCY: 'USD',
  IS_REMOTE: false,
  IS_URGENT: false,
  IS_FEATURED: false,
  NEGOTIABLE: false,
  VIEW_COUNT: 0,
  APPLICANT_COUNT: 0,
  TAGS: [] as string[],
  SKILLS: [] as string[],
  REQUIREMENTS: [] as string[],
  ATTACHMENTS: [],
} as const;

/**
 * Task status transitions
 * Defines valid status transitions for task lifecycle
 */
export const TASK_STATUS_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  [TaskStatus.DRAFT]: [TaskStatus.OPEN, TaskStatus.CANCELLED],
  [TaskStatus.OPEN]: [TaskStatus.ASSIGNED, TaskStatus.CANCELLED],
  [TaskStatus.ASSIGNED]: [TaskStatus.ACCEPTED, TaskStatus.OPEN, TaskStatus.CANCELLED],
  [TaskStatus.ACCEPTED]: [TaskStatus.IN_PROGRESS, TaskStatus.CANCELLED, TaskStatus.DISPUTED],
  [TaskStatus.IN_PROGRESS]: [TaskStatus.COMPLETED, TaskStatus.CANCELLED, TaskStatus.DISPUTED],
  [TaskStatus.COMPLETED]: [TaskStatus.REVIEWED, TaskStatus.DISPUTED],
  [TaskStatus.CANCELLED]: [],
  [TaskStatus.DISPUTED]: [TaskStatus.IN_PROGRESS, TaskStatus.COMPLETED, TaskStatus.CANCELLED],
  [TaskStatus.REVIEWED]: [TaskStatus.DISPUTED],
} as const;

/**
 * Task search and filtering configuration
 */
export const TASK_SEARCH_CONFIG = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  MIN_SEARCH_LENGTH: 2,
  SEARCH_DEBOUNCE_MS: 300,
  
  SORT_OPTIONS: {
    NEWEST: { field: 'createdAt', direction: 'desc' },
    OLDEST: { field: 'createdAt', direction: 'asc' },
    BUDGET_HIGH: { field: 'budget', direction: 'desc' },
    BUDGET_LOW: { field: 'budget', direction: 'asc' },
    DUE_SOON: { field: 'dueDate', direction: 'asc' },
    PRIORITY_HIGH: { field: 'priority', direction: 'desc' },
  },
  
  FILTER_PRESETS: {
    URGENT: { priority: TaskPriority.URGENT, status: TaskStatus.OPEN },
    REMOTE: { isRemote: true, status: TaskStatus.OPEN },
    LOCAL: { isRemote: false, status: TaskStatus.OPEN },
    FEATURED: { isFeatured: true, status: TaskStatus.OPEN },
  },
} as const;

/**
 * Task notification configuration
 */
export const TASK_NOTIFICATIONS = {
  TYPES: {
    TASK_CREATED: 'task.created',
    TASK_UPDATED: 'task.updated',
    TASK_ASSIGNED: 'task.assigned',
    TASK_ACCEPTED: 'task.accepted',
    TASK_STARTED: 'task.started',
    TASK_COMPLETED: 'task.completed',
    TASK_CANCELLED: 'task.cancelled',
    TASK_DISPUTED: 'task.disputed',
    TASK_REVIEWED: 'task.reviewed',
    BID_RECEIVED: 'task.bid_received',
    BID_ACCEPTED: 'task.bid_accepted',
    BID_REJECTED: 'task.bid_rejected',
  },
  
  EMAIL_TEMPLATES: {
    TASK_CREATED: 'task-created',
    TASK_ASSIGNED: 'task-assigned',
    TASK_COMPLETED: 'task-completed',
    BID_RECEIVED: 'bid-received',
  },
} as const;

/**
 * Task business rules
 */
export const TASK_BUSINESS_RULES = {
  // Bid acceptance rules
  BID_ACCEPTANCE: {
    MIN_BIDS_BEFORE_ACCEPT: 1,
    MIN_WAIT_TIME_HOURS: 0,
    AUTO_CLOSE_AFTER_ACCEPT: true,
  },
  
  // Completion rules
  COMPLETION: {
    REQUIRES_ASSIGNEE_CONFIRMATION: true,
    REQUIRES_OWNER_CONFIRMATION: true,
    AUTO_COMPLETE_AFTER_DAYS: 7,
    ALLOW_PARTIAL_COMPLETION: false,
  },
  
  // Cancellation rules
  CANCELLATION: {
    ALLOW_OWNER_CANCEL: true,
    ALLOW_ASSIGNEE_CANCEL: true,
    REFUND_ON_CANCEL: true,
    CANCELLATION_FEE_PERCENTAGE: 10,
    GRACE_PERIOD_HOURS: 24,
  },
  
  // Review rules
  REVIEW: {
    ALLOW_AFTER_COMPLETION: true,
    REVIEW_WINDOW_DAYS: 30,
    MIN_RATING: 1,
    MAX_RATING: 5,
    REQUIRE_COMMENT: false,
    MIN_COMMENT_LENGTH: 10,
  },
  
  // Fee structure
  FEES: {
    PLATFORM_FEE_PERCENTAGE: 15,
    PAYMENT_PROCESSING_PERCENTAGE: 2.9,
    PAYMENT_PROCESSING_FIXED: 0.30,
    MINIMUM_FEE: 1.00,
  },
} as const;

/**
 * Task form configuration
 */
export const TASK_FORM_CONFIG = {
  STEPS: {
    BASIC_INFO: { order: 1, required: true },
    LOCATION: { order: 2, required: true },
    BUDGET: { order: 3, required: true },
    TIMING: { order: 4, required: false },
    REQUIREMENTS: { order: 5, required: false },
    REVIEW: { order: 6, required: true },
  },
  
  WIZARD_CONFIG: {
    ALLOW_SKIP: false,
    SAVE_DRAFT: true,
    VALIDATION_ON_BLUR: true,
    VALIDATION_ON_CHANGE: false,
    SHOW_PROGRESS: true,
    ALLOW_BACK_NAVIGATION: true,
  },
  
  FIELD_HINTS: {
    TITLE: 'Be specific about what you need done',
    DESCRIPTION: 'Include all relevant details, requirements, and expectations',
    BUDGET: 'Set a fair budget based on the task complexity',
    LOCATION: 'Specify where the task needs to be completed',
    DUE_DATE: 'When do you need this completed by?',
    SKILLS: 'What skills are required for this task?',
  },
} as const;

/**
 * Task permission configuration
 */
export const TASK_PERMISSIONS = {
  // Who can create tasks
  CREATE: ['USER', 'TASKER', 'ADMIN'],
  
  // Who can view tasks
  VIEW: {
    DRAFT: ['OWNER', 'ADMIN'],
    OPEN: ['ALL'],
    ASSIGNED: ['OWNER', 'ASSIGNEE', 'ADMIN'],
    IN_PROGRESS: ['OWNER', 'ASSIGNEE', 'ADMIN'],
    COMPLETED: ['ALL'],
    CANCELLED: ['ALL'],
    DISPUTED: ['OWNER', 'ASSIGNEE', 'ADMIN', 'MODERATOR'],
    REVIEWED: ['ALL'],
  },
  
  // Who can edit tasks
  EDIT: {
    DRAFT: ['OWNER', 'ADMIN'],
    OPEN: ['OWNER', 'ADMIN'],
    ASSIGNED: ['ADMIN'],
    IN_PROGRESS: ['ADMIN'],
    COMPLETED: ['ADMIN'],
    CANCELLED: [],
    DISPUTED: ['ADMIN', 'MODERATOR'],
    REVIEWED: [],
  },
  
  // Who can delete tasks
  DELETE: {
    DRAFT: ['OWNER', 'ADMIN'],
    OPEN: ['OWNER', 'ADMIN'],
    ASSIGNED: ['ADMIN'],
    IN_PROGRESS: [],
    COMPLETED: [],
    CANCELLED: ['ADMIN'],
    DISPUTED: [],
    REVIEWED: [],
  },
  
  // Who can change status
  CHANGE_STATUS: {
    TO_OPEN: ['OWNER', 'ADMIN'],
    TO_ASSIGNED: ['OWNER', 'ADMIN'],
    TO_ACCEPTED: ['ASSIGNEE', 'ADMIN'],
    TO_IN_PROGRESS: ['ASSIGNEE', 'ADMIN'],
    TO_COMPLETED: ['ASSIGNEE', 'ADMIN'],
    TO_CANCELLED: ['OWNER', 'ASSIGNEE', 'ADMIN'],
    TO_DISPUTED: ['OWNER', 'ASSIGNEE', 'ADMIN'],
    TO_REVIEWED: ['OWNER', 'ADMIN'],
  },
} as const;

/**
 * Export all task configuration
 */
export const TASK_CONFIG = {
  VALIDATION: TASK_VALIDATION,
  DEFAULTS: TASK_DEFAULTS,
  STATUS_TRANSITIONS: TASK_STATUS_TRANSITIONS,
  SEARCH: TASK_SEARCH_CONFIG,
  NOTIFICATIONS: TASK_NOTIFICATIONS,
  BUSINESS_RULES: TASK_BUSINESS_RULES,
  FORM: TASK_FORM_CONFIG,
  PERMISSIONS: TASK_PERMISSIONS,
} as const;

// Type exports for better type inference
export type TaskValidation = typeof TASK_VALIDATION;
export type TaskDefaults = typeof TASK_DEFAULTS;
export type TaskStatusTransitions = typeof TASK_STATUS_TRANSITIONS;
export type TaskSearchConfig = typeof TASK_SEARCH_CONFIG;
export type TaskNotifications = typeof TASK_NOTIFICATIONS;
export type TaskBusinessRules = typeof TASK_BUSINESS_RULES;
export type TaskFormConfig = typeof TASK_FORM_CONFIG;
export type TaskPermissions = typeof TASK_PERMISSIONS;
export type TaskConfig = typeof TASK_CONFIG;