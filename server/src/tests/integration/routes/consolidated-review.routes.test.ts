/**
 * Consolidated Review Routes Integration Tests
 * 
 * Tests the consolidated review API endpoints to ensure they behave as expected
 * when integrated with the rest of the application.
 */

import { api } from '../setup';
import { mockUsers, mockTasks, mockReviews } from '../../mocks/mock-data';
import { UserRole, TaskStatus } from '../../../../shared/types/enums';

// Mock review service
jest.mock('../../../services/consolidated-review.service', () => {
  const originalModule = jest.requireActual('../../../services/consolidated-review.service');
  return {
    ...originalModule,
    consolidatedReviewService: {
      createReview: jest.fn(),
      updateReview: jest.fn(),
      deleteReview: jest.fn(),
      getReviewById: jest.fn(),
      getReviewsByTask: jest.fn(),
      getReviewsByUser: jest.fn(),
      getReviewsForUser: jest.fn(),
      getUserRatingSummary: jest.fn()
    }
  };
});

// Import the mocked service
import { consolidatedReviewService } from '../../../services/consolidated-review.service';

// Test auth token helper
const getAuthToken = (role: UserRole = UserRole.USER, userId: string = mockUsers[0].id) => {
  // In a real app, you would create a real JWT token
  // For integration tests, we mock the auth middleware to accept this token
  return `mock-jwt-token-${userId}-${role}`;
};

describe('Consolidated Review API Routes', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  describe('POST /api/reviews/consolidated', () => {
    it('should create a new review', async () => {
      // Arrange
      const reviewerId = mockUsers[0].id;
      const revieweeId = mockUsers[1].id;
      const taskId = mockTasks[0].id;
      const token = getAuthToken(UserRole.USER, reviewerId);
      const reviewData = {
        revieweeId,
        taskId,
        rating: 4,
        comment: 'Great work on this task!'
      };
      const mockResponse = {
        id: 'new-review-id',
        reviewerId,
        ...reviewData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Mock the service response
      (consolidatedReviewService.createReview as jest.Mock).mockResolvedValue(mockResponse);
      
      // Act
      const response = await api
        .post('/api/reviews/consolidated')
        .set('Authorization', `Bearer ${token}`)
        .send(reviewData);
      
      // Assert
      expect(response.status).toBe(201);
      expect(response.body.data).toEqual(mockResponse);
      expect(consolidatedReviewService.createReview).toHaveBeenCalledWith(
        reviewerId,
        expect.objectContaining(reviewData)
      );
    });

    it('should return 400 if review data is invalid', async () => {
      // Arrange
      const userId = mockUsers[0].id;
      const token = getAuthToken(UserRole.USER, userId);
      const invalidReviewData = {
        // Missing revieweeId
        taskId: mockTasks[0].id,
        rating: 6, // Invalid rating (above 5)
        comment: 'Great work on this task!'
      };
      
      // Act
      const response = await api
        .post('/api/reviews/consolidated')
        .set('Authorization', `Bearer ${token}`)
        .send(invalidReviewData);
      
      // Assert
      expect(response.status).toBe(400);
      expect(consolidatedReviewService.createReview).not.toHaveBeenCalled();
    });

    it('should return 401 if user is not authenticated', async () => {
      // Arrange
      const reviewData = {
        revieweeId: mockUsers[1].id,
        taskId: mockTasks[0].id,
        rating: 4,
        comment: 'Great work on this task!'
      };
      
      // Act
      const response = await api
        .post('/api/reviews/consolidated')
        .send(reviewData);
      
      // Assert
      expect(response.status).toBe(401);
      expect(consolidatedReviewService.createReview).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/reviews/consolidated/:reviewId', () => {
    it('should return a specific review', async () => {
      // Arrange
      const userId = mockUsers[0].id;
      const reviewId = 'review1';
      const token = getAuthToken(UserRole.USER, userId);
      const mockReview = {
        id: reviewId,
        reviewerId: mockUsers[0].id,
        revieweeId: mockUsers[1].id,
        taskId: mockTasks[0].id,
        rating: 4,
        comment: 'Great work on this task!',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        reviewer: {
          id: mockUsers[0].id,
          firstName: mockUsers[0].firstName,
          lastName: mockUsers[0].lastName,
          avatar: mockUsers[0].avatar
        },
        reviewee: {
          id: mockUsers[1].id,
          firstName: mockUsers[1].firstName,
          lastName: mockUsers[1].lastName,
          avatar: mockUsers[1].avatar
        },
        task: {
          id: mockTasks[0].id,
          title: mockTasks[0].title
        }
      };
      
      // Mock the service response
      (consolidatedReviewService.getReviewById as jest.Mock).mockResolvedValue(mockReview);
      
      // Act
      const response = await api
        .get(`/api/reviews/consolidated/${reviewId}`)
        .set('Authorization', `Bearer ${token}`);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(mockReview);
      expect(consolidatedReviewService.getReviewById).toHaveBeenCalledWith(reviewId);
    });

    it('should return 404 if review does not exist', async () => {
      // Arrange
      const userId = mockUsers[0].id;
      const nonExistentReviewId = 'non-existent-review';
      const token = getAuthToken(UserRole.USER, userId);
      
      // Mock the service to throw a NotFoundError
      (consolidatedReviewService.getReviewById as jest.Mock).mockRejectedValue(
        new Error('Review not found')
      );
      
      // Act
      const response = await api
        .get(`/api/reviews/consolidated/${nonExistentReviewId}`)
        .set('Authorization', `Bearer ${token}`);
      
      // Assert
      expect(response.status).toBe(404);
      expect(consolidatedReviewService.getReviewById).toHaveBeenCalledWith(nonExistentReviewId);
    });
  });

  describe('PUT /api/reviews/consolidated/:reviewId', () => {
    it('should update an existing review', async () => {
      // Arrange
      const reviewerId = mockUsers[0].id;
      const reviewId = 'review1';
      const token = getAuthToken(UserRole.USER, reviewerId);
      const updateData = {
        rating: 5,
        comment: 'Updated comment: Excellent work!'
      };
      const mockResponse = {
        id: reviewId,
        reviewerId,
        revieweeId: mockUsers[1].id,
        taskId: mockTasks[0].id,
        ...updateData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Mock the service response
      (consolidatedReviewService.updateReview as jest.Mock).mockResolvedValue(mockResponse);
      
      // Act
      const response = await api
        .put(`/api/reviews/consolidated/${reviewId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(mockResponse);
      expect(consolidatedReviewService.updateReview).toHaveBeenCalledWith(
        reviewId,
        reviewerId,
        updateData
      );
    });

    it('should return 403 if user tries to update someone else\'s review', async () => {
      // Arrange
      const userId = mockUsers[0].id;
      const reviewId = 'review-by-someone-else';
      const token = getAuthToken(UserRole.USER, userId);
      const updateData = {
        rating: 5,
        comment: 'Updated comment'
      };
      
      // Mock the service to throw an AuthorizationError
      (consolidatedReviewService.updateReview as jest.Mock).mockRejectedValue(
        new Error('You are not authorized to update this review')
      );
      
      // Act
      const response = await api
        .put(`/api/reviews/consolidated/${reviewId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);
      
      // Assert
      expect(response.status).toBe(403);
      expect(consolidatedReviewService.updateReview).toHaveBeenCalledWith(
        reviewId,
        userId,
        updateData
      );
    });
  });

  describe('DELETE /api/reviews/consolidated/:reviewId', () => {
    it('should delete a review created by the user', async () => {
      // Arrange
      const reviewerId = mockUsers[0].id;
      const reviewId = 'review1';
      const token = getAuthToken(UserRole.USER, reviewerId);
      
      // Mock the service response
      (consolidatedReviewService.deleteReview as jest.Mock).mockResolvedValue({ success: true });
      
      // Act
      const response = await api
        .delete(`/api/reviews/consolidated/${reviewId}`)
        .set('Authorization', `Bearer ${token}`);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data).toEqual({ success: true });
      expect(consolidatedReviewService.deleteReview).toHaveBeenCalledWith(
        reviewId,
        reviewerId
      );
    });

    it('should return 403 if user tries to delete someone else\'s review', async () => {
      // Arrange
      const userId = mockUsers[0].id;
      const reviewId = 'review-by-someone-else';
      const token = getAuthToken(UserRole.USER, userId);
      
      // Mock the service to throw an AuthorizationError
      (consolidatedReviewService.deleteReview as jest.Mock).mockRejectedValue(
        new Error('You are not authorized to delete this review')
      );
      
      // Act
      const response = await api
        .delete(`/api/reviews/consolidated/${reviewId}`)
        .set('Authorization', `Bearer ${token}`);
      
      // Assert
      expect(response.status).toBe(403);
      expect(consolidatedReviewService.deleteReview).toHaveBeenCalledWith(
        reviewId,
        userId
      );
    });

    it('should allow admins to delete any review', async () => {
      // Arrange
      const adminId = mockUsers[0].id;
      const reviewId = 'review-by-someone-else';
      const token = getAuthToken(UserRole.ADMIN, adminId);
      
      // Mock the service response
      (consolidatedReviewService.deleteReview as jest.Mock).mockResolvedValue({ success: true });
      
      // Act
      const response = await api
        .delete(`/api/reviews/consolidated/${reviewId}`)
        .set('Authorization', `Bearer ${token}`);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data).toEqual({ success: true });
      // Admin ID is passed to the service, which should have special handling for admins
      expect(consolidatedReviewService.deleteReview).toHaveBeenCalledWith(
        reviewId,
        adminId
      );
    });
  });

  describe('GET /api/reviews/consolidated/task/:taskId', () => {
    it('should return reviews for a specific task', async () => {
      // Arrange
      const userId = mockUsers[0].id;
      const taskId = mockTasks[0].id;
      const token = getAuthToken(UserRole.USER, userId);
      const mockResponse = {
        reviews: [
          {
            id: 'review1',
            reviewerId: mockUsers[0].id,
            revieweeId: mockUsers[1].id,
            taskId,
            rating: 4,
            comment: 'Great work!',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            reviewer: {
              id: mockUsers[0].id,
              firstName: mockUsers[0].firstName,
              lastName: mockUsers[0].lastName,
              avatar: mockUsers[0].avatar
            }
          }
        ],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1
      };
      
      // Mock the service response
      (consolidatedReviewService.getReviewsByTask as jest.Mock).mockResolvedValue(mockResponse);
      
      // Act
      const response = await api
        .get(`/api/reviews/consolidated/task/${taskId}`)
        .set('Authorization', `Bearer ${token}`);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(mockResponse);
      expect(consolidatedReviewService.getReviewsByTask).toHaveBeenCalledWith(
        taskId,
        expect.objectContaining({ page: 1, limit: 20 })
      );
    });
  });

  describe('GET /api/reviews/consolidated/user/:userId/given', () => {
    it('should return reviews given by a specific user', async () => {
      // Arrange
      const currentUserId = mockUsers[0].id;
      const targetUserId = mockUsers[1].id;
      const token = getAuthToken(UserRole.USER, currentUserId);
      const mockResponse = {
        reviews: [
          {
            id: 'review1',
            reviewerId: targetUserId,
            revieweeId: mockUsers[2].id,
            taskId: mockTasks[0].id,
            rating: 5,
            comment: 'Excellent work!',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            reviewee: {
              id: mockUsers[2].id,
              firstName: mockUsers[2].firstName,
              lastName: mockUsers[2].lastName,
              avatar: mockUsers[2].avatar
            },
            task: {
              id: mockTasks[0].id,
              title: mockTasks[0].title
            }
          }
        ],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1
      };
      
      // Mock the service response
      (consolidatedReviewService.getReviewsByUser as jest.Mock).mockResolvedValue(mockResponse);
      
      // Act
      const response = await api
        .get(`/api/reviews/consolidated/user/${targetUserId}/given`)
        .set('Authorization', `Bearer ${token}`);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(mockResponse);
      expect(consolidatedReviewService.getReviewsByUser).toHaveBeenCalledWith(
        targetUserId,
        expect.objectContaining({ page: 1, limit: 20 })
      );
    });
  });

  describe('GET /api/reviews/consolidated/user/:userId/received', () => {
    it('should return reviews received by a specific user', async () => {
      // Arrange
      const currentUserId = mockUsers[0].id;
      const targetUserId = mockUsers[1].id;
      const token = getAuthToken(UserRole.USER, currentUserId);
      const mockResponse = {
        reviews: [
          {
            id: 'review1',
            reviewerId: mockUsers[2].id,
            revieweeId: targetUserId,
            taskId: mockTasks[0].id,
            rating: 4,
            comment: 'Great job!',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            reviewer: {
              id: mockUsers[2].id,
              firstName: mockUsers[2].firstName,
              lastName: mockUsers[2].lastName,
              avatar: mockUsers[2].avatar
            },
            task: {
              id: mockTasks[0].id,
              title: mockTasks[0].title
            }
          }
        ],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1
      };
      
      // Mock the service response
      (consolidatedReviewService.getReviewsForUser as jest.Mock).mockResolvedValue(mockResponse);
      
      // Act
      const response = await api
        .get(`/api/reviews/consolidated/user/${targetUserId}/received`)
        .set('Authorization', `Bearer ${token}`);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(mockResponse);
      expect(consolidatedReviewService.getReviewsForUser).toHaveBeenCalledWith(
        targetUserId,
        expect.objectContaining({ page: 1, limit: 20 })
      );
    });
  });

  describe('GET /api/reviews/consolidated/user/:userId/summary', () => {
    it('should return rating summary for a user', async () => {
      // Arrange
      const currentUserId = mockUsers[0].id;
      const targetUserId = mockUsers[1].id;
      const token = getAuthToken(UserRole.USER, currentUserId);
      const mockSummary = {
        userId: targetUserId,
        averageRating: 4.5,
        totalReviews: 10,
        ratingBreakdown: {
          '1': 0,
          '2': 1,
          '3': 0,
          '4': 3,
          '5': 6
        },
        recentReviews: [
          {
            id: 'review1',
            reviewerId: mockUsers[2].id,
            revieweeId: targetUserId,
            rating: 5,
            comment: 'Excellent!',
            createdAt: new Date().toISOString(),
            reviewer: {
              id: mockUsers[2].id,
              firstName: mockUsers[2].firstName,
              lastName: mockUsers[2].lastName,
              avatar: mockUsers[2].avatar
            }
          }
        ]
      };
      
      // Mock the service response
      (consolidatedReviewService.getUserRatingSummary as jest.Mock).mockResolvedValue(mockSummary);
      
      // Act
      const response = await api
        .get(`/api/reviews/consolidated/user/${targetUserId}/summary`)
        .set('Authorization', `Bearer ${token}`);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(mockSummary);
      expect(consolidatedReviewService.getUserRatingSummary).toHaveBeenCalledWith(targetUserId);
    });
  });
});
