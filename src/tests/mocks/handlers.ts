/**
 * API Mock Handlers
 * 
 * This file defines mock handlers for API endpoints used in tests.
 * It uses MSW (Mock Service Worker) to intercept requests and return
 * predefined responses, enabling reliable and consistent testing.
 */

import { rest } from 'msw';
import { 
  TaskStatus,
  BidStatus,
  TaskPriority,
  BudgetType,
  UserRole
} from '@/types/enums';
import { mockTasks, mockUsers, mockBids, mockReviews, mockNotifications } from './mock-data';

// API base URL from environment
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export const handlers = [
  // ===== Authentication Endpoints =====
  
  // Login endpoint
  rest.post(`${API_URL}/auth/login`, (req, res, ctx) => {
    const { email, password } = req.body as { email: string; password: string };
    
    // Check credentials (in a real app, we'd verify against stored credentials)
    if (email === 'test@example.com' && password === 'password') {
      return res(
        ctx.status(200),
        ctx.json({
          success: true,
          message: 'Login successful',
          data: {
            accessToken: 'mock-access-token',
            refreshToken: 'mock-refresh-token',
            user: mockUsers[0]
          },
          timestamp: new Date().toISOString()
        })
      );
    }
    
    // Invalid credentials
    return res(
      ctx.status(401),
      ctx.json({
        success: false,
        message: 'Invalid email or password',
        timestamp: new Date().toISOString()
      })
    );
  }),
  
  // Register endpoint
  rest.post(`${API_URL}/auth/register`, (req, res, ctx) => {
    const { email } = req.body as { email: string };
    
    // Check if email already exists
    if (email === 'test@example.com') {
      return res(
        ctx.status(400),
        ctx.json({
          success: false,
          message: 'Email already in use',
          timestamp: new Date().toISOString()
        })
      );
    }
    
    // Create new user
    return res(
      ctx.status(201),
      ctx.json({
        success: true,
        message: 'Registration successful',
        data: {
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
          user: {
            id: 'new-user-id',
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email,
            role: req.body.role,
            trustScore: 0,
            emailVerified: false,
            phoneVerified: false,
            createdAt: new Date(),
            averageRating: 0,
            totalReviews: 0,
            completedTasks: 0
          }
        },
        timestamp: new Date().toISOString()
      })
    );
  }),
  
  // Refresh token endpoint
  rest.post(`${API_URL}/auth/refresh-token`, (req, res, ctx) => {
    const { refreshToken } = req.body as { refreshToken: string };
    
    if (refreshToken === 'mock-refresh-token') {
      return res(
        ctx.status(200),
        ctx.json({
          success: true,
          message: 'Token refreshed successfully',
          data: {
            accessToken: 'new-mock-access-token',
            refreshToken: 'new-mock-refresh-token'
          },
          timestamp: new Date().toISOString()
        })
      );
    }
    
    // Invalid refresh token
    return res(
      ctx.status(401),
      ctx.json({
        success: false,
        message: 'Invalid refresh token',
        timestamp: new Date().toISOString()
      })
    );
  }),
  
  // Logout endpoint
  rest.post(`${API_URL}/auth/logout`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        message: 'Logout successful',
        timestamp: new Date().toISOString()
      })
    );
  }),
  
  // ===== User Endpoints =====
  
  // Current user profile
  rest.get(`${API_URL}/users/me`, (req, res, ctx) => {
    // Check for auth header
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res(
        ctx.status(401),
        ctx.json({
          success: false,
          message: 'Unauthorized',
          timestamp: new Date().toISOString()
        })
      );
    }
    
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        message: 'User profile retrieved successfully',
        data: mockUsers[0],
        timestamp: new Date().toISOString()
      })
    );
  }),
  
  // Get user by ID
  rest.get(`${API_URL}/users/:userId`, (req, res, ctx) => {
    const { userId } = req.params;
    
    const user = mockUsers.find(u => u.id === userId);
    
    if (!user) {
      return res(
        ctx.status(404),
        ctx.json({
          success: false,
          message: 'User not found',
          timestamp: new Date().toISOString()
        })
      );
    }
    
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        message: 'User profile retrieved successfully',
        data: user,
        timestamp: new Date().toISOString()
      })
    );
  }),
  
  // Update user profile
  rest.put(`${API_URL}/users/profile`, (req, res, ctx) => {
    // Check for auth header
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res(
        ctx.status(401),
        ctx.json({
          success: false,
          message: 'Unauthorized',
          timestamp: new Date().toISOString()
        })
      );
    }
    
    // Return updated profile (merge request body with current user)
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          ...mockUsers[0],
          ...req.body
        },
        timestamp: new Date().toISOString()
      })
    );
  }),
  
  // ===== Task Endpoints =====
  
  // Get all tasks
  rest.get(`${API_URL}/tasks`, (req, res, ctx) => {
    // Support pagination
    const page = Number(req.url.searchParams.get('page')) || 1;
    const limit = Number(req.url.searchParams.get('limit')) || 10;
    
    // Support filtering
    const status = req.url.searchParams.get('status');
    const filteredTasks = status 
      ? mockTasks.filter(task => task.status.toString() === status)
      : mockTasks;
    
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedTasks = filteredTasks.slice(start, end);
    
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        message: 'Tasks retrieved successfully',
        data: paginatedTasks,
        pagination: {
          page,
          limit,
          total: filteredTasks.length,
          totalPages: Math.ceil(filteredTasks.length / limit),
          hasNext: end < filteredTasks.length,
          hasPrev: page > 1
        },
        timestamp: new Date().toISOString()
      })
    );
  }),
  
  // Get task by ID
  rest.get(`${API_URL}/tasks/:taskId`, (req, res, ctx) => {
    const { taskId } = req.params;
    
    const task = mockTasks.find(t => t.id === taskId);
    
    if (!task) {
      return res(
        ctx.status(404),
        ctx.json({
          success: false,
          message: 'Task not found',
          timestamp: new Date().toISOString()
        })
      );
    }
    
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        message: 'Task retrieved successfully',
        data: task,
        timestamp: new Date().toISOString()
      })
    );
  }),
  
  // Create a task
  rest.post(`${API_URL}/tasks`, (req, res, ctx) => {
    // Check for auth header
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res(
        ctx.status(401),
        ctx.json({
          success: false,
          message: 'Unauthorized',
          timestamp: new Date().toISOString()
        })
      );
    }
    
    // Create a new task
    const newTask = {
      id: `task-${Date.now()}`,
      ...req.body,
      status: TaskStatus.OPEN,
      createdAt: new Date(),
      owner: mockUsers[0],
      bidCount: 0
    };
    
    return res(
      ctx.status(201),
      ctx.json({
        success: true,
        message: 'Task created successfully',
        data: newTask,
        timestamp: new Date().toISOString()
      })
    );
  }),
  
  // ===== Bid Endpoints =====
  
  // Get bids for a task
  rest.get(`${API_URL}/bids/task/:taskId`, (req, res, ctx) => {
    const { taskId } = req.params;
    
    const taskBids = mockBids.filter(bid => bid.taskId === taskId);
    
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        message: 'Bids retrieved successfully',
        data: taskBids,
        timestamp: new Date().toISOString()
      })
    );
  }),
  
  // Create a bid
  rest.post(`${API_URL}/bids`, (req, res, ctx) => {
    // Check for auth header
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res(
        ctx.status(401),
        ctx.json({
          success: false,
          message: 'Unauthorized',
          timestamp: new Date().toISOString()
        })
      );
    }
    
    const { taskId, amount, description, timeline } = req.body;
    
    // Check if task exists
    const task = mockTasks.find(t => t.id === taskId);
    
    if (!task) {
      return res(
        ctx.status(404),
        ctx.json({
          success: false,
          message: 'Task not found',
          timestamp: new Date().toISOString()
        })
      );
    }
    
    // Create a new bid
    const newBid = {
      id: `bid-${Date.now()}`,
      taskId,
      bidderId: mockUsers[0].id,
      amount,
      description,
      timeline,
      status: BidStatus.PENDING,
      submittedAt: new Date(),
      bidder: mockUsers[0]
    };
    
    return res(
      ctx.status(201),
      ctx.json({
        success: true,
        message: 'Bid submitted successfully',
        data: newBid,
        timestamp: new Date().toISOString()
      })
    );
  }),
  
  // ===== Review Endpoints =====
  
  // Get reviews for a task
  rest.get(`${API_URL}/reviews/task/:taskId`, (req, res, ctx) => {
    const { taskId } = req.params;
    
    const taskReviews = mockReviews.filter(review => review.taskId === taskId);
    
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        message: 'Reviews retrieved successfully',
        data: taskReviews,
        timestamp: new Date().toISOString()
      })
    );
  }),
  
  // Create a review
  rest.post(`${API_URL}/reviews`, (req, res, ctx) => {
    // Check for auth header
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res(
        ctx.status(401),
        ctx.json({
          success: false,
          message: 'Unauthorized',
          timestamp: new Date().toISOString()
        })
      );
    }
    
    const { taskId, rating, title, comment, subjectId } = req.body;
    
    // Create a new review
    const newReview = {
      id: `review-${Date.now()}`,
      taskId,
      authorId: mockUsers[0].id,
      subjectId,
      rating,
      title,
      comment,
      isPublic: true,
      createdAt: new Date(),
      author: mockUsers[0]
    };
    
    return res(
      ctx.status(201),
      ctx.json({
        success: true,
        message: 'Review submitted successfully',
        data: newReview,
        timestamp: new Date().toISOString()
      })
    );
  }),
  
  // ===== Notification Endpoints =====
  
  // Get user notifications
  rest.get(`${API_URL}/notifications`, (req, res, ctx) => {
    // Check for auth header
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res(
        ctx.status(401),
        ctx.json({
          success: false,
          message: 'Unauthorized',
          timestamp: new Date().toISOString()
        })
      );
    }
    
    // Support pagination
    const limit = Number(req.url.searchParams.get('limit')) || 10;
    const paginatedNotifications = mockNotifications.slice(0, limit);
    
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        message: 'Notifications retrieved successfully',
        data: paginatedNotifications,
        timestamp: new Date().toISOString()
      })
    );
  }),
  
  // Get unread notification count
  rest.get(`${API_URL}/notifications/unread-count`, (req, res, ctx) => {
    // Check for auth header
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res(
        ctx.status(401),
        ctx.json({
          success: false,
          message: 'Unauthorized',
          timestamp: new Date().toISOString()
        })
      );
    }
    
    const unreadCount = mockNotifications.filter(n => !n.isRead).length;
    
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        message: 'Unread count retrieved successfully',
        data: { count: unreadCount },
        timestamp: new Date().toISOString()
      })
    );
  }),
];
