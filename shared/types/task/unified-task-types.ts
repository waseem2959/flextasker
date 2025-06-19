/**
 * Unified Task Type Definitions
 * 
 * This file provides a unified type system that works across both client and server,
 * with proper transformations and adapters for different contexts.
 */

import { BudgetType, TaskPriority, TaskStatus } from '../common/enums';
import { BaseUser } from '../common/user-types';
import { Category } from '../common/category-types';

/**
 * Core task fields that are always present
 */
export interface TaskCore {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  createdAt: string;
  updatedAt: string;
  tags: string[];
}

/**
 * Budget information with proper structure
 */
export interface TaskBudget {
  amount: number;
  type: BudgetType;
  currency: string;
  negotiable: boolean;
  estimatedHours?: number;
  maxAmount?: number;
}

/**
 * Location information with optional fields
 */
export interface TaskLocation {
  isRemote: boolean;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

/**
 * Timing information
 */
export interface TaskTiming {
  startDate?: string;
  dueDate?: string;
  deadline?: string;
  estimatedDuration?: number;
  isFlexible: boolean;
}

/**
 * Task requirements
 */
export interface TaskRequirements {
  skills?: string[];
  experience?: string;
  certifications?: string[];
  equipmentNeeded?: string[];
  otherRequirements?: string;
}

/**
 * Task relationships
 */
export interface TaskRelationships {
  owner: BaseUser | { id: string; name: string; avatar?: string };
  category: Category | { id: string; name: string };
  assignee?: BaseUser | { id: string; name: string; avatar?: string };
  completedBy?: BaseUser | { id: string; name: string; avatar?: string };
}

/**
 * Task metrics
 */
export interface TaskMetrics {
  viewCount: number;
  applicantCount: number;
  bidCount?: number;
  isFeatured: boolean;
  isUrgent: boolean;
}

/**
 * Complete Task interface for database/API
 */
export interface Task extends TaskCore {
  budget: TaskBudget;
  location: TaskLocation;
  timing: TaskTiming;
  requirements?: TaskRequirements;
  relationships: TaskRelationships;
  metrics: TaskMetrics;
  attachments?: TaskAttachment[];
  paymentStatus?: string;
  cancellationReason?: string;
  disputeReason?: string;
}

/**
 * Task attachment
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
 * Simplified task for client-side usage
 */
export interface TaskSimplified extends TaskCore {
  budget: number;
  budgetType: BudgetType;
  location?: string;
  isRemote: boolean;
  category: { id: string; name: string };
  owner: { id: string; name: string; avatar?: string };
  assignee?: { id: string; name: string; avatar?: string };
  dueDate?: string;
  viewCount: number;
  bidCount: number;
  isFeatured: boolean;
  isUrgent: boolean;
}

/**
 * Task form data structure
 */
export interface TaskFormData {
  title: string;
  description: string;
  category: string;
  priority?: TaskPriority;
  budget: {
    amount: number;
    type: BudgetType;
    negotiable?: boolean;
    currency?: string;
  };
  location: {
    isRemote: boolean;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
  timing?: {
    startDate?: string;
    dueDate?: string;
    isFlexible?: boolean;
  };
  requirements?: {
    skills?: string[];
    experience?: string;
  };
  tags?: string[];
  attachmentIds?: string[];
}

/**
 * Task creation request
 */
export interface TaskCreateRequest extends Omit<TaskFormData, 'attachmentIds'> {
  attachmentIds?: string[];
}

/**
 * Task update request
 */
export interface TaskUpdateRequest extends Partial<TaskCreateRequest> {
  status?: TaskStatus;
}

/**
 * Task search parameters
 */
export interface TaskSearchParams {
  query?: string;
  category?: string | string[];
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
 * Task list response
 */
export interface TaskListResponse {
  tasks: TaskSimplified[];
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
 * Type guards
 */
export const isTask = (obj: any): obj is Task => {
  return obj && typeof obj.id === 'string' && 'budget' in obj && typeof obj.budget === 'object';
};

export const isTaskSimplified = (obj: any): obj is TaskSimplified => {
  return obj && typeof obj.id === 'string' && typeof obj.budget === 'number';
};

/**
 * Transformation utilities
 */
export const transformTaskToSimplified = (task: Task): TaskSimplified => {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    tags: task.tags,
    budget: task.budget.amount,
    budgetType: task.budget.type,
    location: task.location.isRemote ? undefined : 
      [task.location.address, task.location.city, task.location.state, task.location.country]
        .filter(Boolean).join(', ') || undefined,
    isRemote: task.location.isRemote,
    category: {
      id: typeof task.relationships.category === 'object' ? task.relationships.category.id : '',
      name: typeof task.relationships.category === 'object' ? task.relationships.category.name : ''
    },
    owner: {
      id: typeof task.relationships.owner === 'object' ? task.relationships.owner.id : '',
      name: typeof task.relationships.owner === 'object' ? 
        ('firstName' in task.relationships.owner && 'lastName' in task.relationships.owner ? 
          `${task.relationships.owner.firstName} ${task.relationships.owner.lastName}` : task.relationships.owner.name) : '',
      avatar: typeof task.relationships.owner === 'object' ? 
        ('profilePhoto' in task.relationships.owner ? 
          (typeof task.relationships.owner.profilePhoto === 'string' ? task.relationships.owner.profilePhoto : undefined) : 
          (typeof task.relationships.owner.avatar === 'string' ? task.relationships.owner.avatar : undefined)) : undefined
    },
    assignee: task.relationships.assignee ? {
      id: typeof task.relationships.assignee === 'object' ? task.relationships.assignee.id : '',
      name: typeof task.relationships.assignee === 'object' ? 
        ('firstName' in task.relationships.assignee && 'lastName' in task.relationships.assignee ? 
          `${task.relationships.assignee.firstName} ${task.relationships.assignee.lastName}` : task.relationships.assignee.name) : '',
      avatar: typeof task.relationships.assignee === 'object' ? 
        ('profilePhoto' in task.relationships.assignee ? 
          (typeof task.relationships.assignee.profilePhoto === 'string' ? task.relationships.assignee.profilePhoto : undefined) : 
          (typeof task.relationships.assignee.avatar === 'string' ? task.relationships.assignee.avatar : undefined)) : undefined
    } : undefined,
    dueDate: task.timing.dueDate || task.timing.deadline,
    viewCount: task.metrics.viewCount,
    bidCount: task.metrics.bidCount || task.metrics.applicantCount,
    isFeatured: task.metrics.isFeatured,
    isUrgent: task.metrics.isUrgent,
  };
};

/**
 * Database to API transformation
 */
export const transformDatabaseTaskToAPI = (dbTask: any): Task => {
  return {
    id: dbTask.id,
    title: dbTask.title,
    description: dbTask.description,
    status: dbTask.status as TaskStatus,
    priority: dbTask.priority as TaskPriority,
    createdAt: dbTask.createdAt.toISOString(),
    updatedAt: dbTask.updatedAt.toISOString(),
    tags: dbTask.tags || [],
    budget: {
      amount: dbTask.budget,
      type: dbTask.budgetType as BudgetType,
      currency: 'USD', // Default, should come from config
      negotiable: false, // Default, should be in DB
    },
    location: {
      isRemote: dbTask.isRemote,
      address: dbTask.location,
      city: dbTask.city,
      state: dbTask.state,
      country: dbTask.country || 'USA', // Default
      coordinates: dbTask.latitude && dbTask.longitude ? {
        latitude: dbTask.latitude,
        longitude: dbTask.longitude,
      } : undefined,
    },
    timing: {
      startDate: dbTask.startDate?.toISOString(),
      dueDate: dbTask.deadline?.toISOString(),
      deadline: dbTask.deadline?.toISOString(),
      isFlexible: false, // Default, should be in DB
    },
    requirements: dbTask.requirements ? {
      skills: dbTask.requirements,
    } : undefined,
    relationships: {
      owner: dbTask.owner,
      category: dbTask.category,
      assignee: dbTask.assignee,
      completedBy: dbTask.completedBy,
    },
    metrics: {
      viewCount: dbTask.viewCount || 0,
      applicantCount: dbTask.applicantCount || 0,
      bidCount: dbTask.bids?.length || 0,
      isFeatured: dbTask.isFeatured || false,
      isUrgent: dbTask.priority === TaskPriority.URGENT,
    },
    attachments: dbTask.attachments,
    paymentStatus: dbTask.paymentStatus,
    cancellationReason: dbTask.cancellationReason,
    disputeReason: dbTask.disputeReason,
  };
};

/**
 * API to database transformation
 */
export const transformAPITaskToDatabase = (apiTask: TaskCreateRequest) => {
  return {
    title: apiTask.title,
    description: apiTask.description,
    categoryId: apiTask.category,
    priority: apiTask.priority || TaskPriority.MEDIUM,
    budget: apiTask.budget.amount,
    budgetType: apiTask.budget.type,
    isRemote: apiTask.location.isRemote,
    location: apiTask.location.address,
    city: apiTask.location.city,
    state: apiTask.location.state,
    country: apiTask.location.country,
    postalCode: apiTask.location.postalCode,
    deadline: apiTask.timing?.dueDate ? new Date(apiTask.timing.dueDate) : undefined,
    startDate: apiTask.timing?.startDate ? new Date(apiTask.timing.startDate) : undefined,
    tags: apiTask.tags || [],
    requirements: apiTask.requirements?.skills || [],
    status: TaskStatus.DRAFT,
  };
};