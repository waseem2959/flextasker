// types/index.ts
// This file defines the core types for your FlexTasker frontend application
// These types are designed to match your backend API structure

// User role enum - matches your backend enum values
export type UserRole = 'USER' | 'TASKER' | 'ADMIN';

// Task status enum - matches your backend
export type TaskStatus = 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

// Task priority enum - matches your backend  
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

// Budget type enum - matches your backend
export type BudgetType = 'FIXED' | 'HOURLY' | 'NEGOTIABLE';

// Core User interface - matches your backend User model
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
  
  // For backward compatibility with existing UI components
  // This computed property combines firstName and lastName
  get name(): string;
}

// Task interface - matches your backend Task model
export interface Task {
  id: string;
  title: string;
  description: string;
  budget: number;
  budgetType: BudgetType;
  status: TaskStatus;
  priority: TaskPriority;
  isRemote: boolean;
  location?: string;
  deadline?: Date;
  estimatedHours?: number;
  tags: string[];
  requirements: string[];
  createdAt: Date;
  
  // Related entities
  category: {
    id: string;
    name: string;
  };
  owner: User;
  assignee?: User;
  bidCount: number;
}

// Bid interface - matches your backend Bid model
export interface Bid {
  id: string;
  taskId: string;
  bidderId: string;
  amount: number;
  description: string;
  timeline: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';
  submittedAt: Date;
  
  // Related entities
  task: Task;
  bidder: User;
}

// Review interface - matches your backend Review model
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
  
  // Related entities
  task: Task;
  author: User;
  subject: User;
}

// API Response types for consistent data handling
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
  pagination?: PaginationInfo;
  timestamp: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Authentication related types
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

// Context types for state management
export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  role: UserRole | null;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => void;
  register: (data: RegisterData) => Promise<boolean>;
  loading: boolean;
}

// Utility type for creating User objects with computed properties
export class UserImpl implements User {
  // Required properties - these must always have values
  // Using definite assignment assertions (!) tells TypeScript that we guarantee
  // these properties will be initialized, even though it can't see how
  id!: string;
  firstName!: string;
  lastName!: string;
  email!: string;
  role!: UserRole;
  trustScore!: number;
  emailVerified!: boolean;
  phoneVerified!: boolean;
  createdAt!: Date;
  
  // Optional properties - these are already properly typed as optional
  // TypeScript allows optional properties to be uninitialized
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

  /**
   * Constructor that properly initializes all required properties
   * 
   * The Object.assign approach is elegant but TypeScript's strict mode
   * requires us to be explicit about property initialization. By using
   * definite assignment assertions (!), we're telling TypeScript:
   * "Trust us, these properties will be properly initialized."
   */
  constructor(userData: Omit<User, 'name'>) {
    // Object.assign copies all enumerable properties from userData to this instance
    // This is a clean way to initialize multiple properties at once
    Object.assign(this, userData);
  }

  // Computed property that combines firstName and lastName
  // This provides backward compatibility with existing UI components
  get name(): string {
    return `${this.firstName} ${this.lastName}`.trim();
  }

  /**
   * Static factory method to create User instances from API responses
   * 
   * This method handles the common task of converting API response data
   * (which often has dates as strings) into properly typed User objects
   * (which expect Date instances).
   * 
   * We use a proper interface instead of 'any' for better type safety.
   */
  static fromApiResponse(apiUser: ApiUserResponse): User {
    return new UserImpl({
      ...apiUser,
      // Convert string dates to Date objects for proper typing
      createdAt: new Date(apiUser.createdAt),
      lastActive: apiUser.lastActive ? new Date(apiUser.lastActive) : null,
    });
  }
}

/**
 * Interface for API user response data
 * 
 * This replaces the 'any' type with a specific interface that describes
 * what we expect from the API. This approach provides several benefits:
 * 1. Type safety - we catch mismatches at compile time
 * 2. Documentation - other developers can see what the API returns
 * 3. IntelliSense - IDEs can provide better autocomplete and error checking
 */
interface ApiUserResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  trustScore: number;
  emailVerified: boolean;
  phoneVerified: boolean;
  // API returns dates as ISO string, we'll convert to Date objects
  createdAt: string;
  lastActive?: string | null;
  
  // Optional properties that might come from the API
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