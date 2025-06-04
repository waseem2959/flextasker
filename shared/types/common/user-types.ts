/**
 * Shared User Type Definitions
 * 
 * This file defines the user-related types that are shared between
 * the frontend and backend to ensure consistency across the codebase.
 */

import { UserRole, VerificationStatus } from './enums';

/**
 * Base User interface - common properties for all users
 */
export interface BaseUser {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  isSuspended: boolean;
  profilePictureUrl?: string;
}

/**
 * User profile interface - extended user information
 */
export interface UserProfile extends BaseUser {
  phone?: string;
  bio?: string;
  location?: {
    city?: string;
    state?: string;
    country?: string;
  };
  website?: string;
  skills?: string[];
  languages?: string[];
  hourlyRate?: number;
  availability?: string;
  tasksCompleted?: number;
  tasksCreated?: number;
  averageRating?: number;
  totalReviews?: number;
  verificationStatus: VerificationStatus;
  joinedAt: string;
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    github?: string;
    facebook?: string;
    instagram?: string;
  };
  preferences?: {
    notifications?: {
      email?: boolean;
      push?: boolean;
      sms?: boolean;
    };
    privacy?: {
      showEmail?: boolean;
      showPhone?: boolean;
      showLocation?: boolean;
    };
    theme?: 'light' | 'dark' | 'system';
    language?: string;
  };
}

/**
 * Client user interface
 */
export interface ClientUser extends UserProfile {
  role: UserRole.CLIENT | UserRole.USER;
  // Client-specific properties
  totalTasksPosted: number;
  activeTasks: number;
  completedTasks: number;
  cancelledTasks: number;
  paymentMethods?: {
    id: string;
    type: string;
    lastFour?: string;
    isDefault: boolean;
  }[];
}

/**
 * Tasker user interface
 */
export interface TaskerUser extends UserProfile {
  role: UserRole.TASKER;
  // Tasker-specific properties
  skills: string[];
  certifications?: {
    name: string;
    issuer: string;
    dateIssued: string;
    expiryDate?: string;
    verified: boolean;
  }[];
  portfolioItems?: {
    id: string;
    title: string;
    description?: string;
    imageUrl?: string;
    link?: string;
  }[];
  totalEarnings?: number;
  completionRate?: number;
  responseRate?: number;
  responseTime?: number; // in minutes
  availability: 'available' | 'limited' | 'unavailable';
  successRate?: number;
}

/**
 * Admin user interface
 */
export interface AdminUser extends UserProfile {
  role: UserRole.ADMIN | UserRole.MODERATOR;
  // Admin-specific properties
  permissions: string[];
  lastLoginAt?: string;
  adminSince: string;
  managedCategories?: string[];
  activityLog?: {
    action: string;
    timestamp: string;
    details?: string;
  }[];
}

/**
 * User with discriminated union based on role
 */
export type UserWithRole = ClientUser | TaskerUser | AdminUser;

/**
 * User registration request interface
 */
export interface UserRegistrationRequest {
  email: string;
  password: string;
  username: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phone?: string;
  acceptedTerms: boolean;
  recaptchaToken?: string;
}

/**
 * User update request interface
 */
export interface UserUpdateRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  bio?: string;
  location?: {
    city?: string;
    state?: string;
    country?: string;
  };
  website?: string;
  skills?: string[];
  languages?: string[];
  hourlyRate?: number;
  availability?: string;
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    github?: string;
    facebook?: string;
    instagram?: string;
  };
  preferences?: {
    notifications?: {
      email?: boolean;
      push?: boolean;
      sms?: boolean;
    };
    privacy?: {
      showEmail?: boolean;
      showPhone?: boolean;
      showLocation?: boolean;
    };
    theme?: 'light' | 'dark' | 'system';
    language?: string;
  };
}

/**
 * Password change request interface
 */
export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

/**
 * User search parameters interface - consolidated version
 * 
 * This is the single source of truth for UserSearchParams used throughout the application.
 */
export interface UserSearchParams {
  // Search and filtering
  query?: string;
  search?: string; // General search term
  name?: string;
  email?: string;
  
  // Role filtering
  role?: UserRole | UserRole[] | string;
  
  // Location filtering
  location?: string;
  city?: string;
  state?: string;
  country?: string;
  
  // Skills and verification
  skills?: string[];
  verified?: boolean;
  
  // Trust and status
  minTrustScore?: number;
  maxTrustScore?: number;
  minRating?: number;
  status?: string;
  availabilityStatus?: 'available' | 'limited' | 'unavailable';
  
  // Sorting
  sortBy?: string | 'rating' | 'completionRate' | 'responseRate' | 'joinedAt';
  sortDirection?: 'asc' | 'desc';
  sortOrder?: 'asc' | 'desc'; // Alternative name for sortDirection
  
  // Pagination
  page?: number;
  pageSize?: number;
  limit?: number; // Alternative name for pageSize
}

/**
 * User response interface with pagination
 */
export interface UsersResponse {
  users: UserProfile[];
  pagination: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}
