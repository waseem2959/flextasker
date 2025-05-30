/**
 * Consolidated Notification Routes Integration Tests
 * 
 * Tests the consolidated notification API endpoints to ensure they behave as expected
 * when integrated with the rest of the application.
 */

import { api } from '../setup';
import { mockUsers, mockNotifications } from '../../mocks/mock-data';
import { UserRole, NotificationType } from '../../../../shared/types/enums';

// Mock notification service
jest.mock('../../../services/consolidated-notification.service', () => {
  const originalModule = jest.requireActual('../../../services/consolidated-notification.service');
  return {
    ...originalModule,
    consolidatedNotificationService: {
      getUserNotifications: jest.fn(),
      getUnreadCount: jest.fn(),
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
      sendNotification: jest.fn(),
      deleteNotification: jest.fn(),
      getUserNotificationPreferences: jest.fn(),
      updateUserNotificationPreferences: jest.fn()
    }
  };
});

// Import the mocked service
import { consolidatedNotificationService } from '../../../services/consolidated-notification.service';

// Test auth token helper
const getAuthToken = (role: UserRole = UserRole.USER, userId: string = mockUsers[0].id) => {
  // In a real app, you would create a real JWT token
  // For integration tests, we mock the auth middleware to accept this token
  return `mock-jwt-token-${userId}-${role}`;
};

describe('Consolidated Notification API Routes', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  describe('GET /api/notifications/consolidated', () => {
    it('should return user notifications with pagination', async () => {
      // Arrange
      const userId = mockUsers[0].id;
      const token = getAuthToken(UserRole.USER, userId);
      const mockResponse = {
        notifications: [
          {
            id: 'notification1',
            userId,
            type: NotificationType.NEW_MESSAGE,
            message: 'You received a new message',
            relatedId: 'message1',
            isRead: false,
            createdAt: new Date().toISOString()
          },
          {
            id: 'notification2',
            userId,
            type: NotificationType.TASK_UPDATED,
            message: 'Your task was updated',
            relatedId: 'task1',
            isRead: true,
            createdAt: new Date().toISOString()
          }
        ],
        total: 2,
        page: 1,
        limit: 20,
        totalPages: 1
      };
      
      // Mock the service response
      (consolidatedNotificationService.getUserNotifications as jest.Mock).mockResolvedValue(mockResponse);
      
      // Act
      const response = await api
        .get('/api/notifications/consolidated')
        .set('Authorization', `Bearer ${token}`);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(mockResponse);
      expect(consolidatedNotificationService.getUserNotifications).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({ page: 1, limit: 20 })
      );
    });

    it('should filter notifications by type when query parameter is provided', async () => {
      // Arrange
      const userId = mockUsers[0].id;
      const token = getAuthToken(UserRole.USER, userId);
      const notificationType = NotificationType.NEW_MESSAGE;
      const mockResponse = {
        notifications: [
          {
            id: 'notification1',
            userId,
            type: NotificationType.NEW_MESSAGE,
            message: 'You received a new message',
            relatedId: 'message1',
            isRead: false,
            createdAt: new Date().toISOString()
          }
        ],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1
      };
      
      // Mock the service response
      (consolidatedNotificationService.getUserNotifications as jest.Mock).mockResolvedValue(mockResponse);
      
      // Act
      const response = await api
        .get(`/api/notifications/consolidated?type=${notificationType}`)
        .set('Authorization', `Bearer ${token}`);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(mockResponse);
      expect(consolidatedNotificationService.getUserNotifications).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({ 
          page: 1, 
          limit: 20,
          type: notificationType
        })
      );
    });

    it('should return 401 if user is not authenticated', async () => {
      // Act
      const response = await api.get('/api/notifications/consolidated');
      
      // Assert
      expect(response.status).toBe(401);
      expect(consolidatedNotificationService.getUserNotifications).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/notifications/consolidated/unread/count', () => {
    it('should return the number of unread notifications', async () => {
      // Arrange
      const userId = mockUsers[0].id;
      const token = getAuthToken(UserRole.USER, userId);
      const mockCount = 5;
      
      // Mock the service response
      (consolidatedNotificationService.getUnreadCount as jest.Mock).mockResolvedValue(mockCount);
      
      // Act
      const response = await api
        .get('/api/notifications/consolidated/unread/count')
        .set('Authorization', `Bearer ${token}`);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data).toEqual({ count: mockCount });
      expect(consolidatedNotificationService.getUnreadCount).toHaveBeenCalledWith(userId);
    });

    it('should return 401 if user is not authenticated', async () => {
      // Act
      const response = await api.get('/api/notifications/consolidated/unread/count');
      
      // Assert
      expect(response.status).toBe(401);
      expect(consolidatedNotificationService.getUnreadCount).not.toHaveBeenCalled();
    });
  });

  describe('PUT /api/notifications/consolidated/:notificationId/read', () => {
    it('should mark a specific notification as read', async () => {
      // Arrange
      const userId = mockUsers[0].id;
      const notificationId = 'notification1';
      const token = getAuthToken(UserRole.USER, userId);
      
      // Mock the service response
      (consolidatedNotificationService.markAsRead as jest.Mock).mockResolvedValue({
        id: notificationId,
        isRead: true
      });
      
      // Act
      const response = await api
        .put(`/api/notifications/consolidated/${notificationId}/read`)
        .set('Authorization', `Bearer ${token}`);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data).toEqual({
        id: notificationId,
        isRead: true
      });
      expect(consolidatedNotificationService.markAsRead).toHaveBeenCalledWith(
        notificationId,
        userId
      );
    });

    it('should return 401 if user is not authenticated', async () => {
      // Act
      const response = await api.put('/api/notifications/consolidated/notification1/read');
      
      // Assert
      expect(response.status).toBe(401);
      expect(consolidatedNotificationService.markAsRead).not.toHaveBeenCalled();
    });
  });

  describe('PUT /api/notifications/consolidated/read-all', () => {
    it('should mark all notifications as read', async () => {
      // Arrange
      const userId = mockUsers[0].id;
      const token = getAuthToken(UserRole.USER, userId);
      
      // Mock the service response
      (consolidatedNotificationService.markAllAsRead as jest.Mock).mockResolvedValue({ count: 5 });
      
      // Act
      const response = await api
        .put('/api/notifications/consolidated/read-all')
        .set('Authorization', `Bearer ${token}`);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data).toEqual({ count: 5 });
      expect(consolidatedNotificationService.markAllAsRead).toHaveBeenCalledWith(userId);
    });

    it('should return 401 if user is not authenticated', async () => {
      // Act
      const response = await api.put('/api/notifications/consolidated/read-all');
      
      // Assert
      expect(response.status).toBe(401);
      expect(consolidatedNotificationService.markAllAsRead).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/notifications/consolidated/admin', () => {
    it('should allow admin to send a notification to a user', async () => {
      // Arrange
      const adminId = mockUsers[0].id;
      const token = getAuthToken(UserRole.ADMIN, adminId);
      const notificationData = {
        userId: mockUsers[1].id,
        type: NotificationType.SYSTEM_MESSAGE,
        title: 'System Notification',
        message: 'This is an admin notification',
        relatedId: null
      };
      const mockResponse = {
        id: 'new-notification-id',
        ...notificationData,
        isRead: false,
        createdAt: new Date().toISOString()
      };
      
      // Mock the service response
      (consolidatedNotificationService.sendNotification as jest.Mock).mockResolvedValue(mockResponse);
      
      // Act
      const response = await api
        .post('/api/notifications/consolidated/admin')
        .set('Authorization', `Bearer ${token}`)
        .send(notificationData);
      
      // Assert
      expect(response.status).toBe(201);
      expect(response.body.data).toEqual(mockResponse);
      expect(consolidatedNotificationService.sendNotification).toHaveBeenCalledWith(
        notificationData
      );
    });

    it('should return 403 if non-admin tries to send admin notification', async () => {
      // Arrange
      const userId = mockUsers[0].id;
      const token = getAuthToken(UserRole.USER, userId);
      const notificationData = {
        userId: mockUsers[1].id,
        type: NotificationType.SYSTEM_MESSAGE,
        title: 'System Notification',
        message: 'This is an admin notification',
        relatedId: null
      };
      
      // Act
      const response = await api
        .post('/api/notifications/consolidated/admin')
        .set('Authorization', `Bearer ${token}`)
        .send(notificationData);
      
      // Assert
      expect(response.status).toBe(403);
      expect(consolidatedNotificationService.sendNotification).not.toHaveBeenCalled();
    });

    it('should return 400 if notification data is invalid', async () => {
      // Arrange
      const adminId = mockUsers[0].id;
      const token = getAuthToken(UserRole.ADMIN, adminId);
      const invalidData = {
        // Missing userId
        type: NotificationType.SYSTEM_MESSAGE,
        message: 'This is an admin notification'
      };
      
      // Act
      const response = await api
        .post('/api/notifications/consolidated/admin')
        .set('Authorization', `Bearer ${token}`)
        .send(invalidData);
      
      // Assert
      expect(response.status).toBe(400);
      expect(consolidatedNotificationService.sendNotification).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/notifications/consolidated/preferences', () => {
    it('should return user notification preferences', async () => {
      // Arrange
      const userId = mockUsers[0].id;
      const token = getAuthToken(UserRole.USER, userId);
      const mockPreferences = {
        userId,
        emailNotifications: true,
        pushNotifications: true,
        smsNotifications: false,
        notificationTypes: {
          [NotificationType.NEW_MESSAGE]: true,
          [NotificationType.TASK_UPDATED]: true,
          [NotificationType.NEW_BID]: true,
          [NotificationType.SYSTEM_MESSAGE]: true
        }
      };
      
      // Mock the service response
      (consolidatedNotificationService.getUserNotificationPreferences as jest.Mock).mockResolvedValue(mockPreferences);
      
      // Act
      const response = await api
        .get('/api/notifications/consolidated/preferences')
        .set('Authorization', `Bearer ${token}`);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(mockPreferences);
      expect(consolidatedNotificationService.getUserNotificationPreferences).toHaveBeenCalledWith(userId);
    });
  });

  describe('PUT /api/notifications/consolidated/preferences', () => {
    it('should update user notification preferences', async () => {
      // Arrange
      const userId = mockUsers[0].id;
      const token = getAuthToken(UserRole.USER, userId);
      const preferencesData = {
        emailNotifications: false,
        pushNotifications: true,
        notificationTypes: {
          [NotificationType.NEW_MESSAGE]: true,
          [NotificationType.TASK_UPDATED]: false
        }
      };
      const mockResponse = {
        userId,
        ...preferencesData,
        smsNotifications: false,
        notificationTypes: {
          ...preferencesData.notificationTypes,
          [NotificationType.NEW_BID]: true,
          [NotificationType.SYSTEM_MESSAGE]: true
        }
      };
      
      // Mock the service response
      (consolidatedNotificationService.updateUserNotificationPreferences as jest.Mock).mockResolvedValue(mockResponse);
      
      // Act
      const response = await api
        .put('/api/notifications/consolidated/preferences')
        .set('Authorization', `Bearer ${token}`)
        .send(preferencesData);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(mockResponse);
      expect(consolidatedNotificationService.updateUserNotificationPreferences).toHaveBeenCalledWith(
        userId,
        preferencesData
      );
    });

    it('should return 401 if user is not authenticated', async () => {
      // Arrange
      const preferencesData = {
        emailNotifications: false,
        pushNotifications: true
      };
      
      // Act
      const response = await api
        .put('/api/notifications/consolidated/preferences')
        .send(preferencesData);
      
      // Assert
      expect(response.status).toBe(401);
      expect(consolidatedNotificationService.updateUserNotificationPreferences).not.toHaveBeenCalled();
    });
  });
});
