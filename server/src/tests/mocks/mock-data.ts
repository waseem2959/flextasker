/**
 * Mock Data for Testing
 * 
 * This file provides consistent mock data for backend tests, mirroring
 * the structure used in frontend tests to ensure compatibility.
 */

import { 
  UserRole, 
  TaskStatus, 
  BidStatus, 
  TaskPriority, 
  BudgetType, 
  NotificationType 
} from '../../../../shared/types/enums';

// Mock Users
export const mockUsers = [
  {
    id: 'user-1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    password: '$2a$10$xDQkykD0lBVZu2CjmkJ5B.TRL7Bx5T4vY19d8K0TFwH1CvKmWh2uW', // hashed 'password123'
    role: UserRole.USER,
    averageRating: 4.5,
    trustScore: 85,
    phoneVerified: true,
    emailVerified: true,
    city: 'New York',
    state: 'NY',
    country: 'USA',
    bio: 'Experienced professional',
    avatar: 'https://example.com/avatars/john.jpg',
    createdAt: new Date('2024-01-01T00:00:00Z')
  },
  {
    id: 'user-2',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@example.com',
    password: '$2a$10$xDQkykD0lBVZu2CjmkJ5B.TRL7Bx5T4vY19d8K0TFwH1CvKmWh2uW', // hashed 'password123'
    role: UserRole.TASKER,
    averageRating: 4.8,
    trustScore: 92,
    phoneVerified: true,
    emailVerified: true,
    city: 'San Francisco',
    state: 'CA',
    country: 'USA',
    bio: 'Skilled tasker with 5+ years experience',
    avatar: 'https://example.com/avatars/jane.jpg',
    createdAt: new Date('2024-01-15T00:00:00Z')
  },
  {
    id: 'user-3',
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@example.com',
    password: '$2a$10$xDQkykD0lBVZu2CjmkJ5B.TRL7Bx5T4vY19d8K0TFwH1CvKmWh2uW', // hashed 'password123'
    role: UserRole.ADMIN,
    averageRating: null,
    trustScore: 100,
    phoneVerified: true,
    emailVerified: true,
    city: 'Chicago',
    state: 'IL',
    country: 'USA',
    bio: 'System administrator',
    avatar: 'https://example.com/avatars/admin.jpg',
    createdAt: new Date('2023-12-01T00:00:00Z')
  }
];

// Mock Categories
export const mockCategories = [
  {
    id: 'category-1',
    name: 'Home Improvement',
    isActive: true
  },
  {
    id: 'category-2',
    name: 'IT & Technology',
    isActive: true
  },
  {
    id: 'category-3',
    name: 'Delivery & Logistics',
    isActive: true
  }
];

// Mock Tasks
export const mockTasks = [
  {
    id: 'task-1',
    title: 'Fix kitchen sink',
    description: 'The kitchen sink is leaking and needs to be repaired',
    categoryId: 'category-1',
    ownerId: 'user-1',
    assigneeId: 'user-2',
    status: TaskStatus.IN_PROGRESS,
    priority: TaskPriority.MEDIUM,
    budget: 100,
    budgetType: BudgetType.FIXED,
    isRemote: false,
    location: 'New York, NY',
    latitude: 40.7128,
    longitude: -74.0060,
    deadline: new Date('2025-06-30T00:00:00Z'),
    tags: ['plumbing', 'repair', 'kitchen'],
    requirements: ['Tools required', 'Experience with plumbing'],
    createdAt: new Date('2025-05-15T00:00:00Z')
  },
  {
    id: 'task-2',
    title: 'Website development',
    description: 'Create a responsive website for a small business',
    categoryId: 'category-2',
    ownerId: 'user-1',
    assigneeId: null,
    status: TaskStatus.OPEN,
    priority: TaskPriority.HIGH,
    budget: 500,
    budgetType: BudgetType.FIXED,
    isRemote: true,
    location: null,
    latitude: null,
    longitude: null,
    deadline: new Date('2025-07-15T00:00:00Z'),
    tags: ['web', 'development', 'react'],
    requirements: ['React experience', 'Responsive design'],
    createdAt: new Date('2025-05-20T00:00:00Z')
  },
  {
    id: 'task-3',
    title: 'Package delivery',
    description: 'Deliver a package from downtown to uptown',
    categoryId: 'category-3',
    ownerId: 'user-2',
    assigneeId: null,
    status: TaskStatus.OPEN,
    priority: TaskPriority.URGENT,
    budget: 25,
    budgetType: BudgetType.FIXED,
    isRemote: false,
    location: 'San Francisco, CA',
    latitude: 37.7749,
    longitude: -122.4194,
    deadline: new Date('2025-05-28T00:00:00Z'),
    tags: ['delivery', 'urgent', 'package'],
    requirements: ['Vehicle required', 'Same-day delivery'],
    createdAt: new Date('2025-05-26T00:00:00Z')
  }
];

// Mock Bids
export const mockBids = [
  {
    id: 'bid-1',
    taskId: 'task-1',
    bidderId: 'user-2',
    amount: 120,
    description: 'I can fix your sink with high-quality parts',
    timeline: '2 days',
    status: BidStatus.ACCEPTED,
    submittedAt: new Date('2025-05-16T00:00:00Z')
  },
  {
    id: 'bid-2',
    taskId: 'task-2',
    bidderId: 'user-2',
    amount: 450,
    description: 'I can build this website using modern technologies',
    timeline: '1 week',
    status: BidStatus.PENDING,
    submittedAt: new Date('2025-05-21T00:00:00Z')
  }
];

// Mock Reviews
export const mockReviews = [
  {
    id: 'review-1',
    taskId: 'task-1',
    reviewerId: 'user-1',
    revieweeId: 'user-2',
    rating: 5,
    title: 'Excellent work',
    comment: 'Fixed the sink quickly and professionally',
    createdAt: new Date('2025-05-18T00:00:00Z')
  }
];

// Mock Notifications
export const mockNotifications = [
  {
    id: 'notification-1',
    userId: 'user-1',
    type: NotificationType.BID_RECEIVED,
    message: 'You received a new bid on your task',
    relatedId: 'bid-2',
    isRead: false,
    createdAt: new Date('2025-05-21T00:00:00Z')
  },
  {
    id: 'notification-2',
    userId: 'user-2',
    type: NotificationType.TASK_COMPLETED,
    message: 'Task has been marked as completed',
    relatedId: 'task-1',
    isRead: true,
    createdAt: new Date('2025-05-18T00:00:00Z')
  }
];

// Mock API Responses - these match the frontend expected formats
export const mockApiResponses = {
  loginSuccess: {
    success: true,
    message: 'Login successful',
    data: {
      accessToken: 'mock-jwt-token',
      refreshToken: 'mock-refresh-token',
      user: {
        id: 'user-1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        role: UserRole.USER
      }
    },
    timestamp: new Date().toISOString()
  },
  
  validationError: {
    success: false,
    message: 'Validation failed',
    errors: [
      {
        field: 'email',
        message: 'Must be a valid email address',
        code: 'INVALID_EMAIL'
      }
    ],
    timestamp: new Date().toISOString()
  }
};
