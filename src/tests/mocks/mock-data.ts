/**
 * Mock Data for Testing
 * 
 * This file provides consistent mock data for tests, ensuring
 * that all tests have access to the same baseline data.
 */

import { 
  TaskStatus, 
  BidStatus, 
  TaskPriority, 
  BudgetType, 
  UserRole 
} from '@/types/enums';

// Define the NotificationType enum directly since the referenced hook is gone
enum NotificationType {
  TASK_CREATED = 'TASK_CREATED',
  TASK_UPDATED = 'TASK_UPDATED',
  TASK_COMPLETED = 'TASK_COMPLETED',
  BID_RECEIVED = 'BID_RECEIVED',
  BID_ACCEPTED = 'BID_ACCEPTED',
  BID_REJECTED = 'BID_REJECTED',
  REVIEW_RECEIVED = 'REVIEW_RECEIVED',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED'
}

// Mock Users
export const mockUsers = [
  {
    id: 'user-1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'test@example.com',
    role: UserRole.USER,
    avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
    trustScore: 4.7,
    emailVerified: true,
    phoneVerified: true,
    createdAt: new Date('2023-01-01'),
    bio: 'Experienced project manager looking for help with various tasks.',
    phone: '123-456-7890',
    city: 'San Francisco',
    state: 'CA',
    country: 'USA',
    lastActive: new Date('2023-06-15'),
    averageRating: 4.5,
    totalReviews: 15,
    completedTasks: 12
  },
  {
    id: 'user-2',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane@example.com',
    role: UserRole.TASKER,
    avatar: 'https://randomuser.me/api/portraits/women/1.jpg',
    trustScore: 4.9,
    emailVerified: true,
    phoneVerified: true,
    createdAt: new Date('2023-01-15'),
    bio: 'Professional designer with 5+ years of experience.',
    phone: '234-567-8901',
    city: 'New York',
    state: 'NY',
    country: 'USA',
    lastActive: new Date('2023-06-14'),
    averageRating: 4.8,
    totalReviews: 32,
    completedTasks: 28
  },
  {
    id: 'user-3',
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@example.com',
    role: UserRole.ADMIN,
    avatar: 'https://randomuser.me/api/portraits/men/2.jpg',
    trustScore: 5.0,
    emailVerified: true,
    phoneVerified: true,
    createdAt: new Date('2022-12-01'),
    bio: 'Platform administrator.',
    phone: '345-678-9012',
    city: 'Chicago',
    state: 'IL',
    country: 'USA',
    lastActive: new Date('2023-06-16'),
    averageRating: 5.0,
    totalReviews: 5,
    completedTasks: 0
  }
];

// Mock Tasks
export const mockTasks = [
  {
    id: 'task-1',
    title: 'Website Redesign',
    description: 'Need a complete redesign of my company website.',
    category: {
      id: 'category-1',
      name: 'Web Development'
    },
    status: TaskStatus.OPEN,
    priority: TaskPriority.HIGH,
    budget: 1500,
    budgetType: BudgetType.FIXED,
    isRemote: true,
    location: '',
    tags: ['website', 'design', 'responsive'],
    requirements: ['Experience with React', 'Portfolio of previous work', 'Available for meetings'],
    createdAt: new Date('2023-05-15'),
    deadline: new Date('2023-07-15'),
    startDate: new Date('2023-06-01'),
    owner: mockUsers[0],
    bidCount: 5
  },
  {
    id: 'task-2',
    title: 'Logo Design',
    description: 'Need a professional logo for my new startup.',
    category: {
      id: 'category-2',
      name: 'Design'
    },
    status: TaskStatus.IN_PROGRESS,
    priority: TaskPriority.MEDIUM,
    budget: 300,
    budgetType: BudgetType.FIXED,
    isRemote: true,
    location: '',
    tags: ['logo', 'branding', 'startup'],
    requirements: ['Previous logo design experience', 'Quick turnaround'],
    createdAt: new Date('2023-05-20'),
    deadline: new Date('2023-06-20'),
    startDate: new Date('2023-06-01'),
    owner: mockUsers[0],
    assignee: mockUsers[1],
    bidCount: 8
  },
  {
    id: 'task-3',
    title: 'Content Writing for Blog',
    description: 'Need 10 blog posts about technology trends.',
    category: {
      id: 'category-3',
      name: 'Writing'
    },
    status: TaskStatus.COMPLETED,
    priority: TaskPriority.LOW,
    budget: 50,
    budgetType: BudgetType.FIXED,
    isRemote: true,
    location: '',
    tags: ['content', 'blog', 'technology'],
    requirements: ['Native English speaker', 'Knowledge of tech industry'],
    createdAt: new Date('2023-04-10'),
    deadline: new Date('2023-05-10'),
    startDate: new Date('2023-04-15'),
    completedAt: new Date('2023-05-08'),
    owner: mockUsers[0],
    assignee: mockUsers[1],
    bidCount: 12
  }
];

// Mock Bids
export const mockBids = [
  {
    id: 'bid-1',
    taskId: 'task-1',
    bidderId: 'user-2',
    amount: 1200,
    description: 'I can deliver a modern, responsive website design using React and Tailwind CSS.',
    timeline: '4 weeks',
    status: BidStatus.PENDING,
    submittedAt: new Date('2023-05-16'),
    bidder: mockUsers[1]
  },
  {
    id: 'bid-2',
    taskId: 'task-1',
    bidderId: 'user-3',
    amount: 1800,
    description: 'I offer premium website design with ongoing support and maintenance.',
    timeline: '3 weeks',
    status: BidStatus.PENDING,
    submittedAt: new Date('2023-05-17'),
    bidder: mockUsers[2]
  },
  {
    id: 'bid-3',
    taskId: 'task-2',
    bidderId: 'user-2',
    amount: 250,
    description: 'I can create a unique logo that captures your brand essence.',
    timeline: '1 week',
    status: BidStatus.ACCEPTED,
    submittedAt: new Date('2023-05-21'),
    bidder: mockUsers[1]
  }
];

// Mock Reviews
export const mockReviews = [
  {
    id: 'review-1',
    taskId: 'task-3',
    authorId: 'user-1',
    subjectId: 'user-2',
    rating: 5,
    title: 'Excellent content writing',
    comment: 'Jane delivered high-quality content before the deadline. Highly recommended!',
    communicationRating: 5,
    qualityRating: 5,
    timelinessRating: 5,
    isPublic: true,
    createdAt: new Date('2023-05-09'),
    author: mockUsers[0],
    subject: mockUsers[1]
  },
  {
    id: 'review-2',
    taskId: 'task-3',
    authorId: 'user-2',
    subjectId: 'user-1',
    rating: 4,
    title: 'Great client to work with',
    comment: 'Clear requirements and prompt payment. Would work with again.',
    communicationRating: 5,
    qualityRating: 4,
    timelinessRating: 4,
    isPublic: true,
    createdAt: new Date('2023-05-10'),
    author: mockUsers[1],
    subject: mockUsers[0]
  }
];

// Mock Notifications
export const mockNotifications = [
  {
    id: 'notification-1',
    userId: 'user-1',
    type: NotificationType.BID_RECEIVED,
    title: 'New bid received',
    message: 'You have received a new bid on your "Website Redesign" task.',
    isRead: false,
    relatedEntityId: 'task-1',
    relatedEntityType: 'task',
    createdAt: new Date('2023-05-16')
  },
  {
    id: 'notification-2',
    userId: 'user-1',
    type: NotificationType.TASK_COMPLETED,
    title: 'Task completed',
    message: 'Your "Content Writing for Blog" task has been marked as completed.',
    isRead: true,
    relatedEntityId: 'task-3',
    relatedEntityType: 'task',
    createdAt: new Date('2023-05-08')
  },
  {
    id: 'notification-3',
    userId: 'user-2',
    type: NotificationType.BID_ACCEPTED,
    title: 'Bid accepted',
    message: 'Your bid for "Logo Design" has been accepted.',
    isRead: false,
    relatedEntityId: 'bid-3',
    relatedEntityType: 'bid',
    createdAt: new Date('2023-05-22')
  },
  {
    id: 'notification-4',
    userId: 'user-1',
    type: NotificationType.REVIEW_RECEIVED,
    title: 'New review received',
    message: 'Jane Smith has left a review for you.',
    isRead: false,
    relatedEntityId: 'review-2',
    relatedEntityType: 'review',
    createdAt: new Date('2023-05-10')
  }
];
