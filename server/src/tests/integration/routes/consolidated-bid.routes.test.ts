/**
 * Consolidated Bid Routes Integration Tests
 * 
 * Tests the consolidated bid API endpoints to ensure they behave as expected
 * when integrated with the rest of the application.
 */

import { api } from '../setup';
import { mockUsers, mockTasks, mockBids } from '../../mocks/mock-data';
import { UserRole, BidStatus, TaskStatus } from '../../../../shared/types/enums';

// Mock bid service
jest.mock('../../../services/consolidated-bid.service', () => {
  const originalModule = jest.requireActual('../../../services/consolidated-bid.service');
  return {
    ...originalModule,
    consolidatedBidService: {
      createBid: jest.fn(),
      updateBid: jest.fn(),
      deleteBid: jest.fn(),
      getBidById: jest.fn(),
      getBidsByTask: jest.fn(),
      getBidsByUser: jest.fn(),
      getReceivedBids: jest.fn(),
      acceptBid: jest.fn(),
      rejectBid: jest.fn(),
      withdrawBid: jest.fn(),
      getUserBidStats: jest.fn()
    }
  };
});

// Import the mocked service
import { consolidatedBidService } from '../../../services/consolidated-bid.service';

// Test auth token helper
const getAuthToken = (role: UserRole = UserRole.USER, userId: string = mockUsers[0].id) => {
  // In a real app, you would create a real JWT token
  // For integration tests, we mock the auth middleware to accept this token
  return `mock-jwt-token-${userId}-${role}`;
};

describe('Consolidated Bid API Routes', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  describe('POST /api/bids/consolidated', () => {
    it('should create a new bid', async () => {
      // Arrange
      const bidderId = mockUsers[0].id;
      const taskId = mockTasks[0].id;
      const token = getAuthToken(UserRole.USER, bidderId);
      const bidData = {
        taskId,
        amount: 50,
        message: 'I can complete this task efficiently',
        estimatedCompletionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
      };
      const mockResponse = {
        id: 'new-bid-id',
        bidderId,
        ...bidData,
        status: BidStatus.PENDING,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Mock the service response
      (consolidatedBidService.createBid as jest.Mock).mockResolvedValue(mockResponse);
      
      // Act
      const response = await api
        .post('/api/bids/consolidated')
        .set('Authorization', `Bearer ${token}`)
        .send(bidData);
      
      // Assert
      expect(response.status).toBe(201);
      expect(response.body.data).toEqual(mockResponse);
      expect(consolidatedBidService.createBid).toHaveBeenCalledWith(
        bidderId,
        expect.objectContaining(bidData)
      );
    });

    it('should return 400 if bid data is invalid', async () => {
      // Arrange
      const userId = mockUsers[0].id;
      const token = getAuthToken(UserRole.USER, userId);
      const invalidBidData = {
        // Missing taskId
        amount: -10, // Invalid amount (negative)
        message: 'I can complete this task efficiently'
      };
      
      // Act
      const response = await api
        .post('/api/bids/consolidated')
        .set('Authorization', `Bearer ${token}`)
        .send(invalidBidData);
      
      // Assert
      expect(response.status).toBe(400);
      expect(consolidatedBidService.createBid).not.toHaveBeenCalled();
    });

    it('should return 401 if user is not authenticated', async () => {
      // Arrange
      const bidData = {
        taskId: mockTasks[0].id,
        amount: 50,
        message: 'I can complete this task efficiently'
      };
      
      // Act
      const response = await api
        .post('/api/bids/consolidated')
        .send(bidData);
      
      // Assert
      expect(response.status).toBe(401);
      expect(consolidatedBidService.createBid).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/bids/consolidated/:bidId', () => {
    it('should return a specific bid', async () => {
      // Arrange
      const userId = mockUsers[0].id;
      const bidId = 'bid1';
      const token = getAuthToken(UserRole.USER, userId);
      const mockBid = {
        id: bidId,
        bidderId: mockUsers[1].id,
        taskId: mockTasks[0].id,
        amount: 50,
        message: 'I can complete this task efficiently',
        status: BidStatus.PENDING,
        estimatedCompletionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        bidder: {
          id: mockUsers[1].id,
          firstName: mockUsers[1].firstName,
          lastName: mockUsers[1].lastName,
          avatar: mockUsers[1].avatar,
          averageRating: 4.5
        },
        task: {
          id: mockTasks[0].id,
          title: mockTasks[0].title,
          status: TaskStatus.OPEN
        }
      };
      
      // Mock the service response
      (consolidatedBidService.getBidById as jest.Mock).mockResolvedValue(mockBid);
      
      // Act
      const response = await api
        .get(`/api/bids/consolidated/${bidId}`)
        .set('Authorization', `Bearer ${token}`);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(mockBid);
      expect(consolidatedBidService.getBidById).toHaveBeenCalledWith(bidId, userId);
    });

    it('should return 404 if bid does not exist', async () => {
      // Arrange
      const userId = mockUsers[0].id;
      const nonExistentBidId = 'non-existent-bid';
      const token = getAuthToken(UserRole.USER, userId);
      
      // Mock the service to throw a NotFoundError
      (consolidatedBidService.getBidById as jest.Mock).mockRejectedValue(
        new Error('Bid not found')
      );
      
      // Act
      const response = await api
        .get(`/api/bids/consolidated/${nonExistentBidId}`)
        .set('Authorization', `Bearer ${token}`);
      
      // Assert
      expect(response.status).toBe(404);
      expect(consolidatedBidService.getBidById).toHaveBeenCalledWith(nonExistentBidId, userId);
    });
  });

  describe('PUT /api/bids/consolidated/:bidId', () => {
    it('should update an existing bid', async () => {
      // Arrange
      const bidderId = mockUsers[0].id;
      const bidId = 'bid1';
      const token = getAuthToken(UserRole.USER, bidderId);
      const updateData = {
        amount: 45, // Reduced price
        message: 'Updated: I can complete this task even more efficiently',
        estimatedCompletionDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString() // 5 days from now
      };
      const mockResponse = {
        id: bidId,
        bidderId,
        taskId: mockTasks[0].id,
        ...updateData,
        status: BidStatus.PENDING,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Mock the service response
      (consolidatedBidService.updateBid as jest.Mock).mockResolvedValue(mockResponse);
      
      // Act
      const response = await api
        .put(`/api/bids/consolidated/${bidId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(mockResponse);
      expect(consolidatedBidService.updateBid).toHaveBeenCalledWith(
        bidId,
        bidderId,
        updateData
      );
    });

    it('should return 403 if user tries to update someone else\'s bid', async () => {
      // Arrange
      const userId = mockUsers[0].id;
      const bidId = 'bid-by-someone-else';
      const token = getAuthToken(UserRole.USER, userId);
      const updateData = {
        amount: 45,
        message: 'Updated message'
      };
      
      // Mock the service to throw an AuthorizationError
      (consolidatedBidService.updateBid as jest.Mock).mockRejectedValue(
        new Error('You are not authorized to update this bid')
      );
      
      // Act
      const response = await api
        .put(`/api/bids/consolidated/${bidId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);
      
      // Assert
      expect(response.status).toBe(403);
      expect(consolidatedBidService.updateBid).toHaveBeenCalledWith(
        bidId,
        userId,
        updateData
      );
    });
  });

  describe('DELETE /api/bids/consolidated/:bidId', () => {
    it('should delete a bid created by the user', async () => {
      // Arrange
      const bidderId = mockUsers[0].id;
      const bidId = 'bid1';
      const token = getAuthToken(UserRole.USER, bidderId);
      
      // Mock the service response
      (consolidatedBidService.deleteBid as jest.Mock).mockResolvedValue({ success: true });
      
      // Act
      const response = await api
        .delete(`/api/bids/consolidated/${bidId}`)
        .set('Authorization', `Bearer ${token}`);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data).toEqual({ success: true });
      expect(consolidatedBidService.deleteBid).toHaveBeenCalledWith(
        bidId,
        bidderId
      );
    });

    it('should return 403 if user tries to delete someone else\'s bid', async () => {
      // Arrange
      const userId = mockUsers[0].id;
      const bidId = 'bid-by-someone-else';
      const token = getAuthToken(UserRole.USER, userId);
      
      // Mock the service to throw an AuthorizationError
      (consolidatedBidService.deleteBid as jest.Mock).mockRejectedValue(
        new Error('You are not authorized to delete this bid')
      );
      
      // Act
      const response = await api
        .delete(`/api/bids/consolidated/${bidId}`)
        .set('Authorization', `Bearer ${token}`);
      
      // Assert
      expect(response.status).toBe(403);
      expect(consolidatedBidService.deleteBid).toHaveBeenCalledWith(
        bidId,
        userId
      );
    });

    it('should allow admins to delete any bid', async () => {
      // Arrange
      const adminId = mockUsers[0].id;
      const bidId = 'bid-by-someone-else';
      const token = getAuthToken(UserRole.ADMIN, adminId);
      
      // Mock the service response
      (consolidatedBidService.deleteBid as jest.Mock).mockResolvedValue({ success: true });
      
      // Act
      const response = await api
        .delete(`/api/bids/consolidated/${bidId}`)
        .set('Authorization', `Bearer ${token}`);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data).toEqual({ success: true });
      // Admin ID is passed to the service, which should have special handling for admins
      expect(consolidatedBidService.deleteBid).toHaveBeenCalledWith(
        bidId,
        adminId
      );
    });
  });

  describe('GET /api/bids/consolidated/task/:taskId', () => {
    it('should return bids for a specific task', async () => {
      // Arrange
      const userId = mockUsers[0].id;
      const taskId = mockTasks[0].id;
      const token = getAuthToken(UserRole.USER, userId);
      const mockResponse = {
        bids: [
          {
            id: 'bid1',
            bidderId: mockUsers[1].id,
            taskId,
            amount: 50,
            message: 'I can complete this task efficiently',
            status: BidStatus.PENDING,
            estimatedCompletionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            bidder: {
              id: mockUsers[1].id,
              firstName: mockUsers[1].firstName,
              lastName: mockUsers[1].lastName,
              avatar: mockUsers[1].avatar,
              averageRating: 4.5
            }
          }
        ],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1
      };
      
      // Mock the service response
      (consolidatedBidService.getBidsByTask as jest.Mock).mockResolvedValue(mockResponse);
      
      // Act
      const response = await api
        .get(`/api/bids/consolidated/task/${taskId}`)
        .set('Authorization', `Bearer ${token}`);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(mockResponse);
      expect(consolidatedBidService.getBidsByTask).toHaveBeenCalledWith(
        taskId,
        userId,
        expect.objectContaining({ page: 1, limit: 20 })
      );
    });
  });

  describe('GET /api/bids/consolidated/user/:userId/sent', () => {
    it('should return bids sent by a specific user', async () => {
      // Arrange
      const currentUserId = mockUsers[0].id;
      const targetUserId = mockUsers[1].id;
      const token = getAuthToken(UserRole.USER, currentUserId);
      const mockResponse = {
        bids: [
          {
            id: 'bid1',
            bidderId: targetUserId,
            taskId: mockTasks[0].id,
            amount: 50,
            message: 'I can complete this task efficiently',
            status: BidStatus.PENDING,
            estimatedCompletionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            task: {
              id: mockTasks[0].id,
              title: mockTasks[0].title,
              status: TaskStatus.OPEN
            }
          }
        ],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1
      };
      
      // Mock the service response
      (consolidatedBidService.getBidsByUser as jest.Mock).mockResolvedValue(mockResponse);
      
      // Act
      const response = await api
        .get(`/api/bids/consolidated/user/${targetUserId}/sent`)
        .set('Authorization', `Bearer ${token}`);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(mockResponse);
      expect(consolidatedBidService.getBidsByUser).toHaveBeenCalledWith(
        targetUserId,
        expect.objectContaining({ page: 1, limit: 20 })
      );
    });
  });

  describe('GET /api/bids/consolidated/user/:userId/received', () => {
    it('should return bids received by a specific user', async () => {
      // Arrange
      const currentUserId = mockUsers[0].id;
      const targetUserId = mockUsers[1].id;
      const token = getAuthToken(UserRole.USER, currentUserId);
      const mockResponse = {
        bids: [
          {
            id: 'bid1',
            bidderId: mockUsers[2].id,
            taskId: mockTasks[0].id,
            amount: 45,
            message: 'I can help with this task',
            status: BidStatus.PENDING,
            estimatedCompletionDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            bidder: {
              id: mockUsers[2].id,
              firstName: mockUsers[2].firstName,
              lastName: mockUsers[2].lastName,
              avatar: mockUsers[2].avatar,
              averageRating: 4.2
            },
            task: {
              id: mockTasks[0].id,
              title: mockTasks[0].title,
              status: TaskStatus.OPEN
            }
          }
        ],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1
      };
      
      // Mock the service response
      (consolidatedBidService.getReceivedBids as jest.Mock).mockResolvedValue(mockResponse);
      
      // Act
      const response = await api
        .get(`/api/bids/consolidated/user/${targetUserId}/received`)
        .set('Authorization', `Bearer ${token}`);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(mockResponse);
      expect(consolidatedBidService.getReceivedBids).toHaveBeenCalledWith(
        targetUserId,
        expect.objectContaining({ page: 1, limit: 20 })
      );
    });
  });

  describe('POST /api/bids/consolidated/:bidId/accept', () => {
    it('should accept a bid for a task owned by the user', async () => {
      // Arrange
      const taskOwnerId = mockUsers[0].id;
      const bidId = 'bid1';
      const token = getAuthToken(UserRole.USER, taskOwnerId);
      const mockResponse = {
        id: bidId,
        bidderId: mockUsers[1].id,
        taskId: mockTasks[0].id,
        amount: 50,
        message: 'I can complete this task efficiently',
        status: BidStatus.ACCEPTED,
        estimatedCompletionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Mock the service response
      (consolidatedBidService.acceptBid as jest.Mock).mockResolvedValue(mockResponse);
      
      // Act
      const response = await api
        .post(`/api/bids/consolidated/${bidId}/accept`)
        .set('Authorization', `Bearer ${token}`);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(mockResponse);
      expect(consolidatedBidService.acceptBid).toHaveBeenCalledWith(
        bidId,
        taskOwnerId
      );
    });

    it('should return 403 if user is not the task owner', async () => {
      // Arrange
      const nonOwnerId = mockUsers[2].id;
      const bidId = 'bid1';
      const token = getAuthToken(UserRole.USER, nonOwnerId);
      
      // Mock the service to throw an AuthorizationError
      (consolidatedBidService.acceptBid as jest.Mock).mockRejectedValue(
        new Error('You are not authorized to accept this bid')
      );
      
      // Act
      const response = await api
        .post(`/api/bids/consolidated/${bidId}/accept`)
        .set('Authorization', `Bearer ${token}`);
      
      // Assert
      expect(response.status).toBe(403);
      expect(consolidatedBidService.acceptBid).toHaveBeenCalledWith(
        bidId,
        nonOwnerId
      );
    });
  });

  describe('POST /api/bids/consolidated/:bidId/reject', () => {
    it('should reject a bid for a task owned by the user', async () => {
      // Arrange
      const taskOwnerId = mockUsers[0].id;
      const bidId = 'bid1';
      const token = getAuthToken(UserRole.USER, taskOwnerId);
      const mockResponse = {
        id: bidId,
        bidderId: mockUsers[1].id,
        taskId: mockTasks[0].id,
        amount: 50,
        message: 'I can complete this task efficiently',
        status: BidStatus.REJECTED,
        estimatedCompletionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Mock the service response
      (consolidatedBidService.rejectBid as jest.Mock).mockResolvedValue(mockResponse);
      
      // Act
      const response = await api
        .post(`/api/bids/consolidated/${bidId}/reject`)
        .set('Authorization', `Bearer ${token}`);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(mockResponse);
      expect(consolidatedBidService.rejectBid).toHaveBeenCalledWith(
        bidId,
        taskOwnerId
      );
    });
  });

  describe('POST /api/bids/consolidated/:bidId/withdraw', () => {
    it('should withdraw a bid created by the user', async () => {
      // Arrange
      const bidderId = mockUsers[0].id;
      const bidId = 'bid1';
      const token = getAuthToken(UserRole.USER, bidderId);
      const mockResponse = {
        id: bidId,
        bidderId,
        taskId: mockTasks[0].id,
        amount: 50,
        message: 'I can complete this task efficiently',
        status: BidStatus.WITHDRAWN,
        estimatedCompletionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Mock the service response
      (consolidatedBidService.withdrawBid as jest.Mock).mockResolvedValue(mockResponse);
      
      // Act
      const response = await api
        .post(`/api/bids/consolidated/${bidId}/withdraw`)
        .set('Authorization', `Bearer ${token}`);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(mockResponse);
      expect(consolidatedBidService.withdrawBid).toHaveBeenCalledWith(
        bidId,
        bidderId
      );
    });

    it('should return 403 if user is not the bidder', async () => {
      // Arrange
      const nonBidderId = mockUsers[2].id;
      const bidId = 'bid1';
      const token = getAuthToken(UserRole.USER, nonBidderId);
      
      // Mock the service to throw an AuthorizationError
      (consolidatedBidService.withdrawBid as jest.Mock).mockRejectedValue(
        new Error('You are not authorized to withdraw this bid')
      );
      
      // Act
      const response = await api
        .post(`/api/bids/consolidated/${bidId}/withdraw`)
        .set('Authorization', `Bearer ${token}`);
      
      // Assert
      expect(response.status).toBe(403);
      expect(consolidatedBidService.withdrawBid).toHaveBeenCalledWith(
        bidId,
        nonBidderId
      );
    });
  });

  describe('GET /api/bids/consolidated/user/:userId/stats', () => {
    it('should return bid statistics for a user', async () => {
      // Arrange
      const currentUserId = mockUsers[0].id;
      const targetUserId = mockUsers[1].id;
      const token = getAuthToken(UserRole.USER, currentUserId);
      const mockStats = {
        userId: targetUserId,
        totalBids: 20,
        acceptedBids: 12,
        rejectedBids: 5,
        withdrawnBids: 1,
        pendingBids: 2,
        acceptanceRate: 0.6, // 60%
        averageBidAmount: 45.5,
        highestBidAmount: 100,
        lowestBidAmount: 15,
        recentBids: [
          {
            id: 'bid1',
            taskId: mockTasks[0].id,
            amount: 50,
            status: BidStatus.ACCEPTED,
            createdAt: new Date().toISOString(),
            task: {
              id: mockTasks[0].id,
              title: mockTasks[0].title
            }
          }
        ]
      };
      
      // Mock the service response
      (consolidatedBidService.getUserBidStats as jest.Mock).mockResolvedValue(mockStats);
      
      // Act
      const response = await api
        .get(`/api/bids/consolidated/user/${targetUserId}/stats`)
        .set('Authorization', `Bearer ${token}`);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(mockStats);
      expect(consolidatedBidService.getUserBidStats).toHaveBeenCalledWith(targetUserId);
    });
  });
});
