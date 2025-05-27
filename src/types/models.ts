/**
 * Core Data Models with TypeScript Improvements
 * 
 * This file defines the core domain models for the application with
 * improved TypeScript typing for better type safety.
 */

import { UserRole, TaskPriority, BudgetType, BidStatus } from './enums';
import { Category } from './category';

/**
 * Enhanced User interface with improved type safety
 */
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  avatar?: string | null;
  trustScore: number;
  emailVerified: boolean;
  phoneVerified: boolean;
  createdAt: Date;
  
  // Optional fields that might not always be present
  bio?: string | null;
  phone?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  lastActive?: Date | null;
  
  // Computed fields for UI
  averageRating?: number;
  totalReviews?: number;
  completedTasks?: number;
  
  // Computed property for name
  name: string;
}

/**
 * Basic task information shared across all task states
 */
export interface BasicTaskInfo {
  id: string;
  title: string;
  description: string;
  creatorId: string;
  categoryId: string;
  priority: TaskPriority;
  budget: {
    amount: number;
    type: BudgetType;
    currency: string;
    negotiable: boolean;
  };
  location: {
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
    isRemote: boolean;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  attachments: Array<{
    id: string;
    url: string;
    filename: string;
    fileType: string;
    thumbnailUrl?: string;
    size: number;
    uploadedAt: Date;
  }>;
  tags: string[];
  requirements: string[];
  deadline?: Date;
  startDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Relationship fields
  creator: User;
  category: Category;
}

/**
 * Core Bid interface
 */
export interface Bid {
  id: string;
  taskId: string;
  bidderId: string;
  amount: number;
  description: string;
  timeline: string;
  status: BidStatus;
  submittedAt: Date;
  
  // Relationship fields
  task?: any; // Using 'any' temporarily to avoid circular reference issues
  bidder?: User;
}

/**
 * Core Review interface
 */
export interface Review {
  id: string;
  taskId: string;
  authorId: string;
  subjectId: string;
  rating: number;
  title: string;
  comment: string;
  communicationRating?: number;
  qualityRating?: number;
  timelinessRating?: number;
  isPublic: boolean;
  createdAt: Date;
  
  // Relationship fields
  task?: any; // Using 'any' temporarily to avoid circular reference issues
  author?: User;
  subject?: User;
}

/**
 * Authentication credentials for login
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Registration data for new users
 */
export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
}

/**
 * Authentication tokens structure
 */
export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
}

/**
 * Authentication context type for React context
 */
export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  role: UserRole | null;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => void;
  register: (data: RegisterData) => Promise<boolean>;
  loading: boolean;
}

// Re-export Task interface from task.ts to maintain the discriminated union pattern
export type { Task } from './task';
