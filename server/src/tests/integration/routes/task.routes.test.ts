/**
 * Task Routes Integration Tests
 * 
 * Tests the task API endpoints to ensure they behave as expected
 * when integrated with the rest of the application.
 */

import { api } from '../setup';
import { mockTasks } from '../../mocks/mock-data';
import { TaskStatus, UserRole } from '../../../../shared/types/enums';

// Test auth token helper
const getAuthToken = (role: UserRole = UserRole.USER) => {
  // In a real app, you would create a real JWT token
  // For integration tests, we mock the auth middleware to accept this token
  return 'mock-jwt-token';
};

describe('Task API Routes', () => {
  describe('GET /api/v1/tasks', () => {
    it('should return all tasks', async () => {
      // Arrange
      const token = getAuthToken();
      
      // Act
      const response = await api
        .get('/api/v1/tasks')
        .set('Authorization', `Bearer ${token}`);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(mockTasks.length);
    });
    
    it('should filter tasks by status', async () => {
      // Arrange
      const token = getAuthToken();
      const status = TaskStatus.OPEN;
      
      // Act
      const response = await api
        .get(`/api/v1/tasks?status=${status}`)
        .set('Authorization', `Bearer ${token}`);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      
      // Check that all returned tasks have the specified status
      response.body.data.forEach((task: any) => {
        expect(task.status).toBe(status);
      });
    });
    
    it('should return 401 if user is not authenticated', async () => {
      // Act
      const response = await api.get('/api/v1/tasks');
      
      // Assert
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
  
  describe('GET /api/v1/tasks/:id', () => {
    it('should return a specific task by id', async () => {
      // Arrange
      const token = getAuthToken();
      const taskId = mockTasks[0].id;
      
      // Act
      const response = await api
        .get(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${token}`);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(taskId);
    });
    
    it('should return 404 if task is not found', async () => {
      // Arrange
      const token = getAuthToken();
      const nonExistentTaskId = 'non-existent-task';
      
      // Act
      const response = await api
        .get(`/api/v1/tasks/${nonExistentTaskId}`)
        .set('Authorization', `Bearer ${token}`);
      
      // Assert
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });
  
  describe('POST /api/v1/tasks', () => {
    it('should create a new task', async () => {
      // Arrange
      const token = getAuthToken();
      const newTask = {
        title: 'Test Task',
        description: 'Test Description',
        categoryId: 'category-1',
        priority: TaskStatus.MEDIUM,
        budget: 100,
        budgetType: 'FIXED',
        isRemote: false,
        location: 'Test Location',
        deadline: new Date().toISOString()
      };
      
      // Act
      const response = await api
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send(newTask);
      
      // Assert
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(newTask.title);
      expect(response.body.data.description).toBe(newTask.description);
      expect(response.body.data.id).toBeDefined();
    });
    
    it('should return 400 for invalid task data', async () => {
      // Arrange
      const token = getAuthToken();
      const invalidTask = {
        // Missing required fields
        description: 'Test Description'
      };
      
      // Act
      const response = await api
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send(invalidTask);
      
      // Assert
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });
  
  describe('PUT /api/v1/tasks/:id', () => {
    it('should update an existing task', async () => {
      // Arrange
      const token = getAuthToken();
      const taskId = mockTasks[0].id;
      const updateData = {
        title: 'Updated Task Title',
        status: TaskStatus.IN_PROGRESS
      };
      
      // Act
      const response = await api
        .put(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(updateData.title);
      expect(response.body.data.status).toBe(updateData.status);
      expect(response.body.data.id).toBe(taskId);
    });
    
    it('should return 404 if task to update is not found', async () => {
      // Arrange
      const token = getAuthToken();
      const nonExistentTaskId = 'non-existent-task';
      const updateData = {
        title: 'Updated Task Title'
      };
      
      // Act
      const response = await api
        .put(`/api/v1/tasks/${nonExistentTaskId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);
      
      // Assert
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
    
    it('should return 403 if user is not the task owner or admin', async () => {
      // Arrange
      const token = getAuthToken(UserRole.TASKER); // Not the owner or admin
      const taskId = mockTasks[0].id;
      const updateData = {
        title: 'Updated Task Title'
      };
      
      // Act
      const response = await api
        .put(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);
      
      // Assert
      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });
  
  describe('DELETE /api/v1/tasks/:id', () => {
    it('should delete an existing task', async () => {
      // Arrange
      const token = getAuthToken();
      const taskId = mockTasks[0].id;
      
      // Act
      const response = await api
        .delete(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${token}`);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted');
    });
    
    it('should return 404 if task to delete is not found', async () => {
      // Arrange
      const token = getAuthToken();
      const nonExistentTaskId = 'non-existent-task';
      
      // Act
      const response = await api
        .delete(`/api/v1/tasks/${nonExistentTaskId}`)
        .set('Authorization', `Bearer ${token}`);
      
      // Assert
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });
  
  describe('GET /api/v1/tasks/search', () => {
    it('should search tasks based on query parameters', async () => {
      // Arrange
      const token = getAuthToken();
      const query = 'kitchen';
      
      // Act
      const response = await api
        .get(`/api/v1/tasks/search?query=${query}`)
        .set('Authorization', `Bearer ${token}`);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
    
    it('should filter search results by criteria', async () => {
      // Arrange
      const token = getAuthToken();
      const status = TaskStatus.OPEN;
      const minBudget = 100;
      
      // Act
      const response = await api
        .get(`/api/v1/tasks/search?status=${status}&minBudget=${minBudget}`)
        .set('Authorization', `Bearer ${token}`);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      
      // Check that all returned tasks match the criteria
      response.body.data.forEach((task: any) => {
        expect(task.status).toBe(status);
        expect(task.budget).toBeGreaterThanOrEqual(minBudget);
      });
    });
  });
});
