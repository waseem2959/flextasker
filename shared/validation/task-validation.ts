/**
 * Centralized Task Validation Schema
 * Single source of truth for task validation rules used by both client and server
 */

import { z } from 'zod';
import { BudgetType, TaskPriority, TaskStatus } from '../types/common/enums';
import { TASK_CONFIG } from '../config/task-config';

/**
 * Base validation schemas
 */
const titleSchema = z.string()
  .min(TASK_CONFIG.VALIDATION.TITLE.MIN_LENGTH, `Title must be at least ${TASK_CONFIG.VALIDATION.TITLE.MIN_LENGTH} characters`)
  .max(TASK_CONFIG.VALIDATION.TITLE.MAX_LENGTH, `Title cannot exceed ${TASK_CONFIG.VALIDATION.TITLE.MAX_LENGTH} characters`)
  .regex(TASK_CONFIG.VALIDATION.TITLE.PATTERN, 'Title contains invalid characters')
  .trim();

const descriptionSchema = z.string()
  .min(TASK_CONFIG.VALIDATION.DESCRIPTION.MIN_LENGTH, `Description must be at least ${TASK_CONFIG.VALIDATION.DESCRIPTION.MIN_LENGTH} characters`)
  .max(TASK_CONFIG.VALIDATION.DESCRIPTION.MAX_LENGTH, `Description cannot exceed ${TASK_CONFIG.VALIDATION.DESCRIPTION.MAX_LENGTH} characters`)
  .trim();

const budgetAmountSchema = z.number()
  .min(TASK_CONFIG.VALIDATION.BUDGET.MIN_AMOUNT, `Budget must be at least $${TASK_CONFIG.VALIDATION.BUDGET.MIN_AMOUNT}`)
  .max(TASK_CONFIG.VALIDATION.BUDGET.MAX_AMOUNT, `Budget cannot exceed $${TASK_CONFIG.VALIDATION.BUDGET.MAX_AMOUNT}`)
  .multipleOf(0.01, 'Budget must be a valid currency amount');

const currencySchema = z.enum(['USD', 'EUR', 'GBP', 'AUD', 'CAD']);

const tagSchema = z.string()
  .min(TASK_CONFIG.VALIDATION.TAGS.MIN_LENGTH, `Tag must be at least ${TASK_CONFIG.VALIDATION.TAGS.MIN_LENGTH} characters`)
  .max(TASK_CONFIG.VALIDATION.TAGS.MAX_LENGTH, `Tag cannot exceed ${TASK_CONFIG.VALIDATION.TAGS.MAX_LENGTH} characters`)
  .regex(TASK_CONFIG.VALIDATION.TAGS.PATTERN, 'Tag can only contain letters, numbers, and hyphens')
  .trim();

const skillSchema = z.string()
  .min(TASK_CONFIG.VALIDATION.SKILLS.MIN_LENGTH, `Skill must be at least ${TASK_CONFIG.VALIDATION.SKILLS.MIN_LENGTH} characters`)
  .max(TASK_CONFIG.VALIDATION.SKILLS.MAX_LENGTH, `Skill cannot exceed ${TASK_CONFIG.VALIDATION.SKILLS.MAX_LENGTH} characters`)
  .trim();

/**
 * Budget validation schema
 */
export const budgetSchema = z.object({
  amount: budgetAmountSchema,
  type: z.nativeEnum(BudgetType, { required_error: 'Budget type is required' }),
  currency: currencySchema.default(TASK_CONFIG.VALIDATION.BUDGET.DEFAULT_CURRENCY),
  negotiable: z.boolean().default(false),
  estimatedHours: z.number().min(0.5).max(1000).optional(),
  maxAmount: z.number().min(0).optional(),
}).refine((data) => {
  if (data.type === BudgetType.HOURLY && !data.estimatedHours) {
    return false;
  }
  return true;
}, {
  message: 'Estimated hours are required for hourly budget type',
  path: ['estimatedHours']
}).refine((data) => {
  if (data.maxAmount && data.maxAmount < data.amount) {
    return false;
  }
  return true;
}, {
  message: 'Maximum amount cannot be less than the base amount',
  path: ['maxAmount']
});

/**
 * Location validation schema
 */
export const locationSchema = z.object({
  isRemote: z.boolean(),
  address: z.string().max(TASK_CONFIG.VALIDATION.LOCATION.ADDRESS_MAX_LENGTH).optional(),
  city: z.string().max(TASK_CONFIG.VALIDATION.LOCATION.CITY_MAX_LENGTH).optional(),
  state: z.string().max(TASK_CONFIG.VALIDATION.LOCATION.STATE_MAX_LENGTH).optional(),
  country: z.string().max(TASK_CONFIG.VALIDATION.LOCATION.COUNTRY_MAX_LENGTH).optional(),
  postalCode: z.string().regex(TASK_CONFIG.VALIDATION.LOCATION.POSTAL_CODE_PATTERN).optional(),
  coordinates: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }).optional(),
}).refine((data) => {
  if (!data.isRemote && (!data.address || !data.city)) {
    return false;
  }
  return true;
}, {
  message: 'Address and city are required for non-remote tasks',
  path: ['address']
});

/**
 * Timing validation schema
 */
export const timingSchema = z.object({
  startDate: z.string().datetime().optional(),
  dueDate: z.string().datetime().optional(),
  deadline: z.string().datetime().optional(),
  estimatedDuration: z.number()
    .min(TASK_CONFIG.VALIDATION.TIMING.MIN_DURATION_DAYS)
    .max(TASK_CONFIG.VALIDATION.TIMING.MAX_DURATION_DAYS)
    .optional(),
  isFlexible: z.boolean().default(false),
}).refine((data) => {
  if (data.startDate && data.dueDate) {
    const start = new Date(data.startDate);
    const due = new Date(data.dueDate);
    if (start >= due) {
      return false;
    }
  }
  return true;
}, {
  message: 'Due date must be after start date',
  path: ['dueDate']
}).refine((data) => {
  if (data.dueDate || data.deadline) {
    const dueDate = new Date(data.dueDate || data.deadline!);
    const now = new Date();
    const minAdvanceMs = TASK_CONFIG.VALIDATION.TIMING.MIN_ADVANCE_DAYS * 24 * 60 * 60 * 1000;
    if (dueDate.getTime() < now.getTime() + minAdvanceMs) {
      return false;
    }
  }
  return true;
}, {
  message: `Due date must be at least ${TASK_CONFIG.VALIDATION.TIMING.MIN_ADVANCE_DAYS} days from now`,
  path: ['dueDate']
});

/**
 * Requirements validation schema
 */
export const requirementsSchema = z.object({
  skills: z.array(skillSchema)
    .min(TASK_CONFIG.VALIDATION.SKILLS.MIN_PER_TASK)
    .max(TASK_CONFIG.VALIDATION.SKILLS.MAX_PER_TASK)
    .optional(),
  experience: z.string().max(TASK_CONFIG.VALIDATION.REQUIREMENTS.MAX_LENGTH).optional(),
  certifications: z.array(z.string().max(100)).max(10).optional(),
  equipmentNeeded: z.array(z.string().max(100)).max(20).optional(),
  otherRequirements: z.string().max(TASK_CONFIG.VALIDATION.REQUIREMENTS.MAX_LENGTH).optional(),
}).optional();

/**
 * Task creation validation schema
 */
export const taskCreateSchema = z.object({
  title: titleSchema,
  description: descriptionSchema,
  category: z.string().uuid('Category ID must be a valid UUID'),
  priority: z.nativeEnum(TaskPriority).default(TASK_CONFIG.DEFAULTS.PRIORITY),
  budget: budgetSchema,
  location: locationSchema,
  timing: timingSchema.optional(),
  requirements: requirementsSchema,
  tags: z.array(tagSchema)
    .min(TASK_CONFIG.VALIDATION.TAGS.MIN_PER_TASK)
    .max(TASK_CONFIG.VALIDATION.TAGS.MAX_PER_TASK)
    .default([]),
  attachmentIds: z.array(z.string().uuid()).max(TASK_CONFIG.VALIDATION.ATTACHMENTS.MAX_COUNT).optional(),
});

/**
 * Task update validation schema
 */
export const taskUpdateSchema = taskCreateSchema.partial().extend({
  status: z.nativeEnum(TaskStatus).optional(),
});

/**
 * Task search validation schema
 */
export const taskSearchSchema = z.object({
  query: z.string().min(TASK_CONFIG.SEARCH.MIN_SEARCH_LENGTH).optional(),
  category: z.union([z.string().uuid(), z.array(z.string().uuid())]).optional(),
  status: z.union([z.nativeEnum(TaskStatus), z.array(z.nativeEnum(TaskStatus))]).optional(),
  priority: z.union([z.nativeEnum(TaskPriority), z.array(z.nativeEnum(TaskPriority))]).optional(),
  location: z.string().optional(),
  remoteOnly: z.boolean().optional(),
  minBudget: z.number().min(0).optional(),
  maxBudget: z.number().min(0).optional(),
  budgetType: z.nativeEnum(BudgetType).optional(),
  createdAfter: z.string().datetime().optional(),
  createdBefore: z.string().datetime().optional(),
  dueAfter: z.string().datetime().optional(),
  dueBefore: z.string().datetime().optional(),
  tags: z.array(z.string()).optional(),
  skills: z.array(z.string()).optional(),
  sortBy: z.enum(['createdAt', 'dueDate', 'budget', 'priority']).default('createdAt'),
  sortDirection: z.enum(['asc', 'desc']).default('desc'),
  page: z.number().int().min(1).default(TASK_CONFIG.SEARCH.DEFAULT_PAGE),
  limit: z.number().int().min(1).max(TASK_CONFIG.SEARCH.MAX_LIMIT).default(TASK_CONFIG.SEARCH.DEFAULT_LIMIT),
}).refine((data) => {
  if (data.minBudget && data.maxBudget && data.minBudget > data.maxBudget) {
    return false;
  }
  return true;
}, {
  message: 'Maximum budget must be greater than minimum budget',
  path: ['maxBudget']
});

/**
 * Task status update validation schema
 */
export const taskStatusUpdateSchema = z.object({
  status: z.nativeEnum(TaskStatus, { required_error: 'Status is required' }),
  notes: z.string().max(500).optional(),
  reason: z.string().max(500).optional(),
}).refine((data) => {
  if (data.status === TaskStatus.CANCELLED && !data.reason) {
    return false;
  }
  return true;
}, {
  message: 'Cancellation reason is required when cancelling a task',
  path: ['reason']
});

/**
 * Attachment validation schema
 */
export const attachmentSchema = z.object({
  filename: z.string().min(1).max(255),
  filesize: z.number().min(1).max(TASK_CONFIG.VALIDATION.ATTACHMENTS.MAX_SIZE_BYTES),
  contentType: z.enum([
    'image/jpeg',
    'image/png', 
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]),
  url: z.string().url(),
  thumbnailUrl: z.string().url().optional(),
});

/**
 * Export validation functions for different environments
 */
export const validateTaskCreate = (data: unknown) => taskCreateSchema.parse(data);
export const validateTaskUpdate = (data: unknown) => taskUpdateSchema.parse(data);
export const validateTaskSearch = (data: unknown) => taskSearchSchema.parse(data);
export const validateTaskStatusUpdate = (data: unknown) => taskStatusUpdateSchema.parse(data);
export const validateAttachment = (data: unknown) => attachmentSchema.parse(data);

/**
 * Safe validation functions that return results instead of throwing
 */
export const safeValidateTaskCreate = (data: unknown) => taskCreateSchema.safeParse(data);
export const safeValidateTaskUpdate = (data: unknown) => taskUpdateSchema.safeParse(data);
export const safeValidateTaskSearch = (data: unknown) => taskSearchSchema.safeParse(data);
export const safeValidateTaskStatusUpdate = (data: unknown) => taskStatusUpdateSchema.safeParse(data);
export const safeValidateAttachment = (data: unknown) => attachmentSchema.safeParse(data);

/**
 * Express-validator equivalent rules for backward compatibility
 */
export const getExpressValidationRules = () => ({
  title: {
    isString: true,
    trim: true,
    isLength: { 
      options: { 
        min: TASK_CONFIG.VALIDATION.TITLE.MIN_LENGTH, 
        max: TASK_CONFIG.VALIDATION.TITLE.MAX_LENGTH 
      } 
    },
    matches: { options: [TASK_CONFIG.VALIDATION.TITLE.PATTERN] }
  },
  description: {
    isString: true,
    trim: true,
    isLength: { 
      options: { 
        min: TASK_CONFIG.VALIDATION.DESCRIPTION.MIN_LENGTH, 
        max: TASK_CONFIG.VALIDATION.DESCRIPTION.MAX_LENGTH 
      } 
    }
  },
  category: {
    isUUID: true
  },
  'budget.amount': {
    isFloat: { 
      options: { 
        min: TASK_CONFIG.VALIDATION.BUDGET.MIN_AMOUNT, 
        max: TASK_CONFIG.VALIDATION.BUDGET.MAX_AMOUNT 
      } 
    }
  },
  'budget.type': {
    isIn: { options: [Object.values(BudgetType)] }
  },
  priority: {
    optional: true,
    isIn: { options: [Object.values(TaskPriority)] }
  },
  'location.address': {
    optional: true,
    isString: true,
    isLength: { options: { max: TASK_CONFIG.VALIDATION.LOCATION.ADDRESS_MAX_LENGTH } }
  },
  tags: {
    optional: true,
    isArray: true,
    custom: {
      options: (value: string[]) => {
        if (value.length > TASK_CONFIG.VALIDATION.TAGS.MAX_PER_TASK) {
          throw new Error(`Too many tags (max ${TASK_CONFIG.VALIDATION.TAGS.MAX_PER_TASK})`);
        }
        return true;
      }
    }
  }
});

/**
 * Type exports for TypeScript inference
 */
export type TaskCreateData = z.infer<typeof taskCreateSchema>;
export type TaskUpdateData = z.infer<typeof taskUpdateSchema>;
export type TaskSearchData = z.infer<typeof taskSearchSchema>;
export type TaskStatusUpdateData = z.infer<typeof taskStatusUpdateSchema>;
export type AttachmentData = z.infer<typeof attachmentSchema>;