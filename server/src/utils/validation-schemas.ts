/**
 * Validation Schemas
 * 
 * This module provides Zod schemas for validating data across the application.
 * It centralizes all validation logic to ensure consistency.
 */

import { z } from 'zod';
import { BidStatus, TaskStatus, TaskPriority, BudgetType } from '../../../shared/types/enums';

/**
 * User validation schemas
 */
export const UserSchemas = {
  create: z.object({
    email: z.string().email(),
    password: z.string().min(8),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    role: z.string()
  }),
  
  update: z.object({
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    bio: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    avatar: z.string().optional()
  }),
  
  login: z.object({
    email: z.string().email(),
    password: z.string().min(1)
  }),
  
  changePassword: z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8)
  })
};

/**
 * Task validation schemas
 */
export const TaskSchemas = {
  create: z.object({
    title: z.string().min(5).max(100),
    description: z.string().min(20),
    categoryId: z.string().uuid(),
    budget: z.number().positive(),
    budgetType: z.nativeEnum(BudgetType),
    priority: z.nativeEnum(TaskPriority),
    isRemote: z.boolean().optional().default(false),
    location: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    deadline: z.string().optional().transform(val => val ? new Date(val) : undefined),
    tags: z.array(z.string()).optional().default([]),
    requirements: z.array(z.string()).optional().default([])
  }),
  
  update: z.object({
    title: z.string().min(5).max(100).optional(),
    description: z.string().min(20).optional(),
    categoryId: z.string().uuid().optional(),
    budget: z.number().positive().optional(),
    budgetType: z.nativeEnum(BudgetType).optional(),
    priority: z.nativeEnum(TaskPriority).optional(),
    isRemote: z.boolean().optional(),
    location: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    deadline: z.string().optional().transform(val => val ? new Date(val) : undefined),
    tags: z.array(z.string()).optional(),
    requirements: z.array(z.string()).optional(),
    status: z.nativeEnum(TaskStatus).optional()
  }),
  
  search: z.object({
    query: z.string().optional(),
    categoryId: z.string().uuid().optional(),
    minBudget: z.number().optional(),
    maxBudget: z.number().optional(),
    budgetType: z.nativeEnum(BudgetType).optional(),
    priority: z.nativeEnum(TaskPriority).optional(),
    isRemote: z.boolean().optional(),
    location: z.string().optional(),
    radius: z.number().optional(),
    tags: z.array(z.string()).optional(),
    statuses: z.array(z.nativeEnum(TaskStatus)).optional(),
    page: z.number().int().positive().optional().default(1),
    limit: z.number().int().positive().max(100).optional().default(20),
    sortBy: z.string().optional().default('createdAt'),
    sortDir: z.enum(['asc', 'desc']).optional().default('desc')
  })
};

/**
 * Bid validation schemas
 */
export const BidSchemas = {
  create: z.object({
    taskId: z.string().uuid(),
    amount: z.number().positive(),
    message: z.string().min(10),
    deliveryTime: z.string().min(1)
  }),
  
  update: z.object({
    amount: z.number().positive().optional(),
    message: z.string().min(10).optional(),
    deliveryTime: z.string().min(1).optional()
  }),
  
  updateStatus: z.object({
    status: z.nativeEnum(BidStatus)
  })
};

/**
 * Review validation schemas
 */
export const ReviewSchemas = {
  create: z.object({
    taskId: z.string().uuid(),
    revieweeId: z.string().uuid(),
    rating: z.number().min(1).max(5),
    comment: z.string().min(10)
  })
};

/**
 * Message validation schemas
 */
export const MessageSchemas = {
  create: z.object({
    recipientId: z.string().uuid(),
    content: z.string().min(1)
  })
};

/**
 * Notification validation schemas
 */
export const NotificationSchemas = {
  markAsRead: z.object({
    notificationIds: z.array(z.string().uuid())
  })
};

/**
 * Category validation schemas
 */
export const CategorySchemas = {
  create: z.object({
    name: z.string().min(2).max(50),
    description: z.string().optional(),
    icon: z.string().optional(),
    isActive: z.boolean().optional().default(true)
  }),
  
  update: z.object({
    name: z.string().min(2).max(50).optional(),
    description: z.string().optional(),
    icon: z.string().optional(),
    isActive: z.boolean().optional()
  })
};

/**
 * Attachment validation schemas
 */
export const AttachmentSchemas = {
  create: z.object({
    taskId: z.string().uuid(),
    fileName: z.string().min(1),
    fileSize: z.number().positive(),
    fileType: z.string().min(1),
    url: z.string().url()
  })
};

/**
 * Health check validation schemas
 */
export const HealthCheckSchemas = {
  component: z.object({
    name: z.string().min(1),
    status: z.enum(['healthy', 'degraded', 'unhealthy']),
    message: z.string().optional(),
    details: z.record(z.any()).optional()
  })
};

/**
 * Export all schemas
 */
export const ValidationSchemas = {
  User: UserSchemas,
  Task: TaskSchemas,
  Bid: BidSchemas,
  Review: ReviewSchemas,
  Message: MessageSchemas,
  Notification: NotificationSchemas,
  Category: CategorySchemas,
  Attachment: AttachmentSchemas,
  HealthCheck: HealthCheckSchemas
};

export default ValidationSchemas;
