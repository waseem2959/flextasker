/**
 * Core Data Models with TypeScript Improvements
 *
 * This file serves as the central definition point for all core domain models
 * with improved TypeScript typing for better type safety.
 *
 * All models are defined here to ensure consistency and prevent duplication.
 */

import { BidStatus, BudgetType, TaskPriority, TaskStatus, UserRole } from './index';
// Import shared user types as the canonical source
import { BaseUser } from '../../shared/types/common/user-types';

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
 * User interface - extends shared BaseUser with frontend-specific computed properties
 * This ensures consistency with backend while adding frontend conveniences
 * Enhanced with role-switching functionality
 */
export interface User extends Omit<BaseUser, 'createdAt' | 'updatedAt'> {
  // Computed property for full name
  name?: string;

  // Frontend-specific optional fields
  avatar?: string | null;
  phone?: string | null;
  bio?: string | null;
  trustScore?: number;
  emailVerified?: boolean;
  phoneVerified?: boolean;

  // Convert string dates to Date objects for frontend use
  createdAt: Date;
  updatedAt: Date;
  lastActive?: Date | null;

  // Optional location fields (flattened from shared structure)
  city?: string | null;
  state?: string | null;
  country?: string | null;

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
  // Required BaseUser fields
  id!: string;
  email!: string;
  username!: string;
  firstName!: string;
  lastName!: string;
  role!: UserRole;
  // Role-switching support
  availableRoles!: UserRole[];
  activeRole!: UserRole;
  rolePreferences?: {
    [key in UserRole]?: {
      isEnabled: boolean;
      profileCompleted: boolean;
      lastUsed?: string;
    };
  };
  createdAt!: Date;
  updatedAt!: Date;
  isActive!: boolean;
  isSuspended!: boolean;

  // Optional BaseUser fields
  profilePictureUrl?: string;

  // Frontend-specific fields
  name?: string;
  avatar?: string | null;
  trustScore?: number;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  lastActive?: Date | null;
  bio?: string | null;
  phone?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  averageRating?: number;
  totalReviews?: number;
  completedTasks?: number;

  constructor(userData: Partial<User>) {
    // Object.assign copies all enumerable properties from userData to this instance
    Object.assign(this, userData);

    // Set computed name property
    this.name = this.getFullName();
  }

  // Computed property that combines firstName and lastName
  getFullName(): string {
    return `${this.firstName} ${this.lastName}`.trim();
  }

  // Static factory method to create User instances from API responses
  static fromApiResponse(apiUser: ApiUserResponse): User {
    const role = (apiUser as any).role ?? UserRole.USER;
    return new UserImpl({
      ...apiUser,
      // Convert string dates to Date objects
      createdAt: apiUser.createdAt ? new Date(apiUser.createdAt) : new Date(),
      updatedAt: apiUser.updatedAt ? new Date(apiUser.updatedAt) : new Date(),
      lastActive: apiUser.lastActive ? new Date(apiUser.lastActive) : null,
      // Ensure role is a valid UserRole enum value
      role,
      // Set default values for role-switching
      availableRoles: (apiUser as any).availableRoles ?? [role],
      activeRole: (apiUser as any).activeRole ?? role,
      rolePreferences: (apiUser as any).rolePreferences ?? {},
      // Set default values for required BaseUser fields
      username: apiUser.username ?? apiUser.email.split('@')[0],
      isActive: apiUser.isActive ?? true,
      isSuspended: apiUser.isSuspended ?? false
    });
  }
}

/**
 * Interface for API user response data
 * This represents the raw data structure received from the backend API
 */
export interface ApiUserResponse {
  // Required BaseUser fields (as strings from API)
  id: string;
  email: string;
  username?: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
  isActive?: boolean;
  isSuspended?: boolean;
  profilePictureUrl?: string;

  // Frontend-specific optional fields
  trustScore?: number;
  emailVerified?: boolean;
  phoneVerified?: boolean;
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
  isUrgent?: boolean;
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
 * Enhanced with role-switching functionality
 */
export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  role: UserRole | null;
  activeRole: UserRole | null;
  availableRoles: UserRole[];
  loading: boolean;
  setUser: (user: User | null) => void;
  setIsLoading: (loading: boolean) => void;
  setTokens: (accessToken: string, refreshToken?: string) => void;
  clearAuth: () => void;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  switchRole: (targetRole: UserRole) => Promise<boolean>;
  checkRoleAvailability: (role: UserRole) => Promise<boolean>;
  token: string | null;
  refreshToken: string | null;
  getToken: () => string | null;
  getRefreshToken: () => string | null;
}
