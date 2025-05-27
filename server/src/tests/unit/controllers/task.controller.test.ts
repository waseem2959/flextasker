/**
 * Task Controller Unit Tests
 * 
 * Tests the task controller methods and error handling
 */

import { Request, Response } from 'express';
import { TaskController } from '@/controllers/task.controller';
import { createMockRequest } from '@/tests/mocks/mock-request';
import { createMockResponse } from '@/tests/mocks/mock-response';
import { mockTasks } from '@/tests/mocks/mock-data';
import { UserRole, TaskStatus } from '../../../../shared/types/enums';
import { NotFoundError } from '@/utils/enhanced-errors';
import { prismaMock } from '@/tests/setup';

// Mock the task service
jest.mock('@/services/task', () => {
  return {
    TaskService: jest.fn().mockImplementation(() => ({
      getAllTasks: jest.fn().mockResolvedValue(mockTasks),
      getTaskById: jest.fn().mockImplementation((id: string) => {
        const task = mockTasks.find(t => t.id === id);
        if (!task) {
          throw new NotFoundError(`Task with ID ${id} not found`);
        }
        return Promise.resolve(task);
      }),
      createTask: jest.fn().mockResolvedValue(mockTasks[0]),
      updateTask: jest.fn().mockResolvedValue(mockTasks[0]),
      deleteTask: jest.fn().mockResolvedValue({ id: 'task-1' }),
      searchTasks: jest.fn().mockResolvedValue(mockTasks)
    }))
  };
});

describe('TaskController', () => {
  let controller: TaskController;
  let req: Request;
  let res: Response;
  let next: jest.Mock;

  beforeEach(() => {
    controller = new TaskController();
    req = createMockRequest();
    res = createMockResponse();
    next = jest.fn();
    
    // Setup authenticated user
    req.user = {
      id: 'user-1',
      role: UserRole.USER
    };
  });

  describe('getAllTasks', () => {
    it('should return all tasks', async () => {
      // Act
      await controller.getAllTasks(req, res, next);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.any(Array)
      }));
      
      const responseData = (res.json as jest.Mock).mock.calls[0][0];
      expect(responseData.data.length).toBe(mockTasks.length);
    });

    it('should handle errors and pass them to next', async () => {
      // Arrange
      const error = new Error('Test error');
      jest.spyOn(controller['taskService'], 'getAllTasks').mockRejectedValueOnce(error);
      
      // Act
      await controller.getAllTasks(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getTaskById', () => {
    it('should return the task if it exists', async () => {
      // Arrange
      req.params.id = 'task-1';
      
      // Act
      await controller.getTaskById(req, res, next);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          id: 'task-1'
        })
      }));
    });

    it('should pass NotFoundError to next if task does not exist', async () => {
      // Arrange
      req.params.id = 'non-existent-task';
      
      // Act
      await controller.getTaskById(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
    });
  });

  describe('createTask', () => {
    it('should create a new task and return it', async () => {
      // Arrange
      req.body = {
        title: 'Test Task',
        description: 'Test Description',
        categoryId: 'category-1',
        priority: 'MEDIUM',
        budget: 100,
        budgetType: 'FIXED',
        isRemote: false,
        location: 'Test Location',
        deadline: new Date().toISOString()
      };
      
      // Act
      await controller.createTask(req, res, next);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: expect.stringContaining('created'),
        data: expect.objectContaining({
          id: expect.any(String)
        })
      }));
    });

    it('should handle validation errors', async () => {
      // Arrange
      req.body = {
        // Missing required fields
      };
      const validationError = new Error('Validation failed');
      jest.spyOn(controller['taskService'], 'createTask').mockRejectedValueOnce(validationError);
      
      // Act
      await controller.createTask(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(validationError);
    });
  });

  describe('updateTask', () => {
    beforeEach(() => {
      req.params.id = 'task-1';
      req.body = {
        status: TaskStatus.COMPLETED
      };
    });

    it('should update the task and return it', async () => {
      // Act
      await controller.updateTask(req, res, next);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: expect.stringContaining('updated'),
        data: expect.objectContaining({
          id: 'task-1'
        })
      }));
    });

    it('should handle not found errors', async () => {
      // Arrange
      req.params.id = 'non-existent-task';
      const notFoundError = new NotFoundError('Task not found');
      jest.spyOn(controller['taskService'], 'updateTask').mockRejectedValueOnce(notFoundError);
      
      // Act
      await controller.updateTask(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(notFoundError);
    });
  });

  describe('deleteTask', () => {
    it('should delete the task and return success', async () => {
      // Arrange
      req.params.id = 'task-1';
      
      // Act
      await controller.deleteTask(req, res, next);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: expect.stringContaining('deleted')
      }));
    });

    it('should handle not found errors', async () => {
      // Arrange
      req.params.id = 'non-existent-task';
      const notFoundError = new NotFoundError('Task not found');
      jest.spyOn(controller['taskService'], 'deleteTask').mockRejectedValueOnce(notFoundError);
      
      // Act
      await controller.deleteTask(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalledWith(notFoundError);
    });
  });

  describe('searchTasks', () => {
    it('should return tasks matching the search criteria', async () => {
      // Arrange
      req.query = {
        status: TaskStatus.OPEN,
        category: 'category-1',
        location: 'New York'
      };
      
      // Act
      await controller.searchTasks(req, res, next);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.any(Array)
      }));
    });
  });
});
