/**
 * Task Controller Tests
 * 
 * Tests for task controller including CRUD operations and task management.
 */

import { Request, Response } from 'express';
import { taskController } from '../../controllers/task-controller';
import { taskService } from '../../services/task-service';
import { TaskStatus, TaskPriority, BudgetType, UserRole } from '../../../../shared/types/enums';

// Mock the task service
jest.mock('../../services/task-service');
const mockTaskService = taskService as jest.Mocked<typeof taskService>;

// Mock response object
const mockResponse = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

// Mock request object
const mockRequest = (body: any = {}, params: any = {}, query: any = {}, user: any = null) => {
  return {
    body,
    params,
    query,
    user,
    ip: '127.0.0.1',
    headers: { 'user-agent': 'test-agent' },
  } as Request;
};

// Mock task data
const mockTask = {
  id: 'task-1',
  title: 'Test Task',
  description: 'This is a test task',
  budget: 100,
  budgetType: BudgetType.FIXED,
  status: TaskStatus.OPEN,
  priority: TaskPriority.MEDIUM,
  ownerId: 'user-1',
  categoryId: 'category-1',
  location: 'Test City',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  role: UserRole.USER,
};

describe('Task Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createTask', () => {
    it('should create task successfully', async () => {
      const taskData = {
        title: 'New Task',
        description: 'Task description',
        budget: 200,
        budgetType: BudgetType.FIXED,
        categoryId: 'category-1',
        location: 'San Francisco',
      };

      const createdTask = { ...mockTask, ...taskData };
      mockTaskService.createTask.mockResolvedValue(createdTask);

      const req = mockRequest(taskData, {}, {}, mockUser);
      const res = mockResponse();

      await taskController.createTask(req, res);

      expect(mockTaskService.createTask).toHaveBeenCalledWith({
        ...taskData,
        ownerId: mockUser.id,
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Task created successfully',
        data: createdTask,
      });
    });

    it('should handle validation errors', async () => {
      const invalidTaskData = {
        title: '', // Invalid: empty title
        description: 'Task description',
        budget: -100, // Invalid: negative budget
      };

      mockTaskService.createTask.mockRejectedValue(
        new Error('Validation failed: Title is required')
      );

      const req = mockRequest(invalidTaskData, {}, {}, mockUser);
      const res = mockResponse();

      await taskController.createTask(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Validation failed: Title is required',
          code: 'VALIDATION_ERROR',
        },
      });
    });

    it('should handle unauthorized access', async () => {
      const taskData = {
        title: 'New Task',
        description: 'Task description',
        budget: 200,
      };

      const req = mockRequest(taskData); // No user
      const res = mockResponse();

      await taskController.createTask(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Authentication required',
          code: 'AUTHENTICATION_REQUIRED',
        },
      });
    });
  });

  describe('getTasks', () => {
    it('should get tasks successfully', async () => {
      const mockTasks = [mockTask];
      const mockResult = {
        tasks: mockTasks,
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      };

      mockTaskService.getTasks.mockResolvedValue(mockResult);

      const req = mockRequest({}, {}, { page: '1', limit: '20' });
      const res = mockResponse();

      await taskController.getTasks(req, res);

      expect(mockTaskService.getTasks).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult,
      });
    });

    it('should handle filters', async () => {
      const filters = {
        category: 'Technology',
        status: TaskStatus.OPEN,
        minBudget: '100',
        maxBudget: '500',
        location: 'New York',
      };

      mockTaskService.getTasks.mockResolvedValue({
        tasks: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      });

      const req = mockRequest({}, {}, filters);
      const res = mockResponse();

      await taskController.getTasks(req, res);

      expect(mockTaskService.getTasks).toHaveBeenCalledWith({
        category: 'Technology',
        status: TaskStatus.OPEN,
        minBudget: 100,
        maxBudget: 500,
        location: 'New York',
        page: 1,
        limit: 20,
      });
    });
  });

  describe('getTaskById', () => {
    it('should get task by ID successfully', async () => {
      mockTaskService.getTaskById.mockResolvedValue(mockTask);

      const req = mockRequest({}, { id: 'task-1' });
      const res = mockResponse();

      await taskController.getTaskById(req, res);

      expect(mockTaskService.getTaskById).toHaveBeenCalledWith('task-1');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockTask,
      });
    });

    it('should handle task not found', async () => {
      mockTaskService.getTaskById.mockRejectedValue(
        new Error('Task not found')
      );

      const req = mockRequest({}, { id: 'invalid-id' });
      const res = mockResponse();

      await taskController.getTaskById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Task not found',
          code: 'NOT_FOUND',
        },
      });
    });
  });

  describe('updateTask', () => {
    it('should update task successfully', async () => {
      const updateData = {
        title: 'Updated Task',
        budget: 300,
      };

      const updatedTask = { ...mockTask, ...updateData };
      mockTaskService.updateTask.mockResolvedValue(updatedTask);

      const req = mockRequest(updateData, { id: 'task-1' }, {}, mockUser);
      const res = mockResponse();

      await taskController.updateTask(req, res);

      expect(mockTaskService.updateTask).toHaveBeenCalledWith('task-1', updateData, mockUser.id);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Task updated successfully',
        data: updatedTask,
      });
    });

    it('should handle unauthorized update', async () => {
      const updateData = { title: 'Updated Task' };

      mockTaskService.updateTask.mockRejectedValue(
        new Error('You can only update your own tasks')
      );

      const req = mockRequest(updateData, { id: 'task-1' }, {}, { id: 'user-2' });
      const res = mockResponse();

      await taskController.updateTask(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'You can only update your own tasks',
          code: 'FORBIDDEN',
        },
      });
    });
  });

  describe('deleteTask', () => {
    it('should delete task successfully', async () => {
      mockTaskService.deleteTask.mockResolvedValue(undefined);

      const req = mockRequest({}, { id: 'task-1' }, {}, mockUser);
      const res = mockResponse();

      await taskController.deleteTask(req, res);

      expect(mockTaskService.deleteTask).toHaveBeenCalledWith('task-1', mockUser.id);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Task deleted successfully',
      });
    });

    it('should handle task not found on delete', async () => {
      mockTaskService.deleteTask.mockRejectedValue(
        new Error('Task not found')
      );

      const req = mockRequest({}, { id: 'invalid-id' }, {}, mockUser);
      const res = mockResponse();

      await taskController.deleteTask(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Task not found',
          code: 'NOT_FOUND',
        },
      });
    });
  });

  describe('searchTasks', () => {
    it('should search tasks successfully', async () => {
      const searchResults = {
        tasks: [mockTask],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      };

      mockTaskService.searchTasks.mockResolvedValue(searchResults);

      const req = mockRequest({}, {}, { q: 'web development', page: '1', limit: '20' });
      const res = mockResponse();

      await taskController.searchTasks(req, res);

      expect(mockTaskService.searchTasks).toHaveBeenCalledWith('web development', {
        page: 1,
        limit: 20,
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: searchResults,
      });
    });

    it('should handle empty search query', async () => {
      const req = mockRequest({}, {}, { q: '', page: '1', limit: '20' });
      const res = mockResponse();

      await taskController.searchTasks(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Search query is required',
          code: 'VALIDATION_ERROR',
        },
      });
    });
  });

  describe('assignTask', () => {
    it('should assign task successfully', async () => {
      const assignData = { assigneeId: 'user-2' };
      const assignedTask = { ...mockTask, assigneeId: 'user-2', status: TaskStatus.IN_PROGRESS };

      mockTaskService.assignTask.mockResolvedValue(assignedTask);

      const req = mockRequest(assignData, { id: 'task-1' }, {}, mockUser);
      const res = mockResponse();

      await taskController.assignTask(req, res);

      expect(mockTaskService.assignTask).toHaveBeenCalledWith('task-1', 'user-2', mockUser.id);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Task assigned successfully',
        data: assignedTask,
      });
    });
  });

  describe('completeTask', () => {
    it('should complete task successfully', async () => {
      const completedTask = { ...mockTask, status: TaskStatus.COMPLETED, completedAt: new Date() };

      mockTaskService.completeTask.mockResolvedValue(completedTask);

      const req = mockRequest({}, { id: 'task-1' }, {}, mockUser);
      const res = mockResponse();

      await taskController.completeTask(req, res);

      expect(mockTaskService.completeTask).toHaveBeenCalledWith('task-1', mockUser.id);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Task completed successfully',
        data: completedTask,
      });
    });
  });
});
