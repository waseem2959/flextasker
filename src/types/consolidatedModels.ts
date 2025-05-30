/**
 * Consolidated Core Data Models with TypeScript Improvements
 * 
 * This file serves as the central definition point for all core domain models
 * with improved TypeScript typing for better type safety.
 * 
 * All models are defined here to ensure consistency and prevent duplication.
 */

import { UserRole, TaskStatus, TaskPriority, BudgetType, BidStatus } from '../../shared/types/enums';

/**
 * Category definition
 */
export interface Category {
  id: string;
  name: string;
  icon: string;
  subcategories: string[];
}

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
}

/**
 * User implementation with computed properties
 * This class provides the actual implementation for computed properties
 */
export class UserImpl implements User {
  id!: string;
  firstName!: string;
  lastName!: string;
  email!: string;
  role!: UserRole;
  trustScore!: number;
  emailVerified!: boolean;
  phoneVerified!: boolean;
  createdAt!: Date;
  avatar?: string | null;
  bio?: string | null;
  phone?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  lastActive?: Date | null;
  averageRating?: number;
  totalReviews?: number;
  completedTasks?: number;

  constructor(userData: Partial<User>) {
    // Object.assign copies all enumerable properties from userData to this instance
    Object.assign(this, userData);
  }

  // Computed property that combines firstName and lastName
  get name(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  // Static factory method to create User instances from API responses
  static fromApiResponse(apiUser: ApiUserResponse): User {
    return new UserImpl({
      ...apiUser,
      createdAt: apiUser.createdAt ? new Date(apiUser.createdAt) : new Date(),
      lastActive: apiUser.lastActive ? new Date(apiUser.lastActive) : null
    });
  }
}

/**
 * Interface for API user response data
 */
export interface ApiUserResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  trustScore: number;
  emailVerified: boolean;
  phoneVerified: boolean;
  createdAt: string;
  lastActive?: string | null;
  avatar?: string | null;
  bio?: string | null;
  phone?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  averageRating?: number;
  totalReviews?: number;
  completedTasks?: number;
}

/**
 * Task interface - core task model
 */
export interface Task {
  id: string;
  title: string;
  description: string;
  category: Category;
  status: TaskStatus;
  priority: TaskPriority;
  budget: number;
  budgetType: BudgetType;
  isRemote: boolean;
  location?: string;
  tags: string[];
  requirements: string[];
  createdAt: Date;
  deadline?: Date;
  startDate?: Date;
  completedAt?: Date;
  owner: User;
  assignee?: User | null;
  bidCount?: number;
}

/**
 * Bid interface - core bid model
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
  task?: Task;
  bidder?: User;
}

/**
 * Review interface - core review model
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
  task?: Task;
  author?: User;
  subject?: User;
}

/**
 * Authentication related types
 */

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
}

/**
 * Context types for state management
 */
export interface AuthContextType {
  // State
  user: User | null;
  isAuthenticated: boolean;
  role: UserRole | null;
  loading: boolean;
  
  // State management methods
  setUser: (user: User | null) => void;
  setIsLoading: (loading: boolean) => void;
  setTokens: (accessToken: string, refreshToken?: string) => void;
  clearAuth: () => void;
  
  // Authentication methods
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  
  // Token management
  token: string | null;
  refreshToken: string | null;
  getToken: () => string | null;
  getRefreshToken: () => string | null;
}
