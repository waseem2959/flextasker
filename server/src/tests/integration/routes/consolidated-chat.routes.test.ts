/**
 * Consolidated Chat Routes Integration Tests
 * 
 * Tests the consolidated chat API endpoints to ensure they behave as expected
 * when integrated with the rest of the application.
 */

import { api } from '../setup';
import { mockUsers, mockMessages } from '../../mocks/mock-data';
import { UserRole } from '../../../../shared/types/enums';
import { prisma } from '../../../utils/database-utils';

// Mock chat service
jest.mock('../../../services/consolidated-chat.service', () => {
  const originalModule = jest.requireActual('../../../services/consolidated-chat.service');
  return {
    ...originalModule,
    consolidatedChatService: {
      getConversationsList: jest.fn(),
      getConversation: jest.fn(),
      sendMessage: jest.fn(),
      markMessagesAsRead: jest.fn(),
      getUnreadCount: jest.fn(),
      getMessageById: jest.fn(),
      deleteMessage: jest.fn(),
      searchMessages: jest.fn()
    }
  };
});

// Import the mocked service
import { consolidatedChatService } from '../../../services/consolidated-chat.service';

// Test auth token helper
const getAuthToken = (role: UserRole = UserRole.USER, userId: string = mockUsers[0].id) => {
  // In a real app, you would create a real JWT token
  // For integration tests, we mock the auth middleware to accept this token
  return `mock-jwt-token-${userId}-${role}`;
};

describe('Consolidated Chat API Routes', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  describe('GET /api/chat/consolidated/conversations', () => {
    it('should return a list of conversations', async () => {
      // Arrange
      const userId = mockUsers[0].id;
      const token = getAuthToken(UserRole.USER, userId);
      const mockResponse = {
        conversations: [
          {
            id: mockUsers[1].id,
            firstName: mockUsers[1].firstName,
            lastName: mockUsers[1].lastName,
            avatar: mockUsers[1].avatar,
            unreadCount: 2,
            lastMessage: 'Hello there!',
            lastMessageTime: new Date().toISOString()
          }
        ],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1
      };
      
      // Mock the service response
      (consolidatedChatService.getConversationsList as jest.Mock).mockResolvedValue(mockResponse);
      
      // Act
      const response = await api
        .get('/api/chat/consolidated/conversations')
        .set('Authorization', `Bearer ${token}`);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(mockResponse);
      expect(consolidatedChatService.getConversationsList).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({ page: 1, limit: 20 })
      );
    });

    it('should return 401 if user is not authenticated', async () => {
      // Act
      const response = await api.get('/api/chat/consolidated/conversations');
      
      // Assert
      expect(response.status).toBe(401);
      expect(consolidatedChatService.getConversationsList).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/chat/consolidated/conversations/:userId', () => {
    it('should return a conversation with specific user', async () => {
      // Arrange
      const userId = mockUsers[0].id;
      const otherUserId = mockUsers[1].id;
      const token = getAuthToken(UserRole.USER, userId);
      const mockResponse = {
        messages: [
          {
            id: 'message1',
            senderId: userId,
            receiverId: otherUserId,
            content: 'Hello!',
            isRead: true,
            createdAt: new Date().toISOString(),
            sender: {
              id: userId,
              firstName: mockUsers[0].firstName,
              lastName: mockUsers[0].lastName,
              avatar: mockUsers[0].avatar
            }
          },
          {
            id: 'message2',
            senderId: otherUserId,
            receiverId: userId,
            content: 'Hi there!',
            isRead: false,
            createdAt: new Date().toISOString(),
            sender: {
              id: otherUserId,
              firstName: mockUsers[1].firstName,
              lastName: mockUsers[1].lastName,
              avatar: mockUsers[1].avatar
            }
          }
        ],
        total: 2,
        page: 1,
        limit: 30,
        totalPages: 1,
        otherUser: {
          id: otherUserId,
          firstName: mockUsers[1].firstName,
          lastName: mockUsers[1].lastName,
          avatar: mockUsers[1].avatar,
          averageRating: 4.5
        }
      };
      
      // Mock the service response
      (consolidatedChatService.getConversation as jest.Mock).mockResolvedValue(mockResponse);
      
      // Act
      const response = await api
        .get(`/api/chat/consolidated/conversations/${otherUserId}`)
        .set('Authorization', `Bearer ${token}`);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(mockResponse);
      expect(consolidatedChatService.getConversation).toHaveBeenCalledWith(
        userId,
        otherUserId,
        expect.any(Object)
      );
    });

    it('should return 401 if user is not authenticated', async () => {
      // Act
      const response = await api.get(`/api/chat/consolidated/conversations/${mockUsers[1].id}`);
      
      // Assert
      expect(response.status).toBe(401);
      expect(consolidatedChatService.getConversation).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/chat/consolidated/messages', () => {
    it('should send a message to another user', async () => {
      // Arrange
      const userId = mockUsers[0].id;
      const receiverId = mockUsers[1].id;
      const token = getAuthToken(UserRole.USER, userId);
      const messageData = {
        receiverId,
        content: 'Hello, this is a test message!'
      };
      const mockResponse = {
        id: 'new-message-id',
        senderId: userId,
        receiverId,
        content: messageData.content,
        isRead: false,
        createdAt: new Date().toISOString(),
        sender: {
          id: userId,
          firstName: mockUsers[0].firstName,
          lastName: mockUsers[0].lastName,
          avatar: mockUsers[0].avatar
        }
      };
      
      // Mock the service response
      (consolidatedChatService.sendMessage as jest.Mock).mockResolvedValue(mockResponse);
      
      // Act
      const response = await api
        .post('/api/chat/consolidated/messages')
        .set('Authorization', `Bearer ${token}`)
        .send(messageData);
      
      // Assert
      expect(response.status).toBe(201);
      expect(response.body.data).toEqual(mockResponse);
      expect(consolidatedChatService.sendMessage).toHaveBeenCalledWith(
        userId,
        receiverId,
        messageData.content
      );
    });

    it('should return 400 if message data is invalid', async () => {
      // Arrange
      const userId = mockUsers[0].id;
      const token = getAuthToken(UserRole.USER, userId);
      const invalidMessageData = {
        // Missing receiverId
        content: 'Hello, this is a test message!'
      };
      
      // Act
      const response = await api
        .post('/api/chat/consolidated/messages')
        .set('Authorization', `Bearer ${token}`)
        .send(invalidMessageData);
      
      // Assert
      expect(response.status).toBe(400);
      expect(consolidatedChatService.sendMessage).not.toHaveBeenCalled();
    });

    it('should return 401 if user is not authenticated', async () => {
      // Arrange
      const messageData = {
        receiverId: mockUsers[1].id,
        content: 'Hello, this is a test message!'
      };
      
      // Act
      const response = await api
        .post('/api/chat/consolidated/messages')
        .send(messageData);
      
      // Assert
      expect(response.status).toBe(401);
      expect(consolidatedChatService.sendMessage).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/chat/consolidated/messages/read', () => {
    it('should mark messages from a specific sender as read', async () => {
      // Arrange
      const userId = mockUsers[0].id;
      const senderId = mockUsers[1].id;
      const token = getAuthToken(UserRole.USER, userId);
      const readData = { senderId };
      const mockResponse = { count: 3 }; // 3 messages marked as read
      
      // Mock the service response
      (consolidatedChatService.markMessagesAsRead as jest.Mock).mockResolvedValue(3);
      
      // Act
      const response = await api
        .post('/api/chat/consolidated/messages/read')
        .set('Authorization', `Bearer ${token}`)
        .send(readData);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(mockResponse);
      expect(consolidatedChatService.markMessagesAsRead).toHaveBeenCalledWith(
        userId,
        senderId
      );
    });

    it('should return 400 if sender ID is missing', async () => {
      // Arrange
      const userId = mockUsers[0].id;
      const token = getAuthToken(UserRole.USER, userId);
      
      // Act
      const response = await api
        .post('/api/chat/consolidated/messages/read')
        .set('Authorization', `Bearer ${token}`)
        .send({});
      
      // Assert
      expect(response.status).toBe(400);
      expect(consolidatedChatService.markMessagesAsRead).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/chat/consolidated/messages/unread/count', () => {
    it('should return the number of unread messages', async () => {
      // Arrange
      const userId = mockUsers[0].id;
      const token = getAuthToken(UserRole.USER, userId);
      const mockCount = 5;
      
      // Mock the service response
      (consolidatedChatService.getUnreadCount as jest.Mock).mockResolvedValue(mockCount);
      
      // Act
      const response = await api
        .get('/api/chat/consolidated/messages/unread/count')
        .set('Authorization', `Bearer ${token}`);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data).toEqual({ count: mockCount });
      expect(consolidatedChatService.getUnreadCount).toHaveBeenCalledWith(userId);
    });
  });

  describe('DELETE /api/chat/consolidated/messages/:messageId', () => {
    it('should delete a message sent by the current user', async () => {
      // Arrange
      const userId = mockUsers[0].id;
      const messageId = 'message-to-delete';
      const token = getAuthToken(UserRole.USER, userId);
      
      // Mock the service response
      (consolidatedChatService.deleteMessage as jest.Mock).mockResolvedValue({ success: true });
      
      // Act
      const response = await api
        .delete(`/api/chat/consolidated/messages/${messageId}`)
        .set('Authorization', `Bearer ${token}`);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data).toEqual({ success: true });
      expect(consolidatedChatService.deleteMessage).toHaveBeenCalledWith(
        messageId,
        userId
      );
    });

    it('should return 401 if user is not authenticated', async () => {
      // Act
      const response = await api.delete('/api/chat/consolidated/messages/some-message-id');
      
      // Assert
      expect(response.status).toBe(401);
      expect(consolidatedChatService.deleteMessage).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/chat/consolidated/messages/search', () => {
    it('should search for messages containing a specific query', async () => {
      // Arrange
      const userId = mockUsers[0].id;
      const token = getAuthToken(UserRole.USER, userId);
      const searchQuery = 'hello';
      const mockResponse = {
        messages: [
          {
            id: 'message1',
            senderId: userId,
            receiverId: mockUsers[1].id,
            content: 'Hello, how are you?',
            isRead: true,
            createdAt: new Date().toISOString(),
            sender: {
              id: userId,
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
      (consolidatedChatService.searchMessages as jest.Mock).mockResolvedValue(mockResponse);
      
      // Act
      const response = await api
        .get('/api/chat/consolidated/messages/search')
        .query({ query: searchQuery })
        .set('Authorization', `Bearer ${token}`);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(mockResponse);
      expect(consolidatedChatService.searchMessages).toHaveBeenCalledWith(
        userId,
        searchQuery,
        expect.objectContaining({ page: 1, limit: 20 })
      );
    });

    it('should return 400 if search query is missing', async () => {
      // Arrange
      const userId = mockUsers[0].id;
      const token = getAuthToken(UserRole.USER, userId);
      
      // Act
      const response = await api
        .get('/api/chat/consolidated/messages/search')
        .set('Authorization', `Bearer ${token}`);
      
      // Assert
      expect(response.status).toBe(400);
      expect(consolidatedChatService.searchMessages).not.toHaveBeenCalled();
    });
  });
});
