/**
 * Task Routes Integration Tests
 * 
 * Integration tests for task-related endpoints including CRUD operations and search functionality.
 */

import request from 'supertest';
import { app } from '../../app';
import { setupTestDatabase, cleanupTestDatabase, createTestUser, createTestTask } from '../../utils/test-utils';
import { TaskStatus, TaskPriority, BudgetType, UserRole } from '../../../../shared/types/enums';

describe('Task Routes Integration Tests', () => {
  let authToken: string;
  let testUser: any;
  let testTask: any;

  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  beforeEach(async () => {
    // Clean up and create fresh test data
    await cleanupTestDatabase();
    
    // Create test user and get auth token
    testUser = await createTestUser({
      email: 'taskowner@example.com',
      password: 'Password123!',
      firstName: 'Task',
      lastName: 'Owner',
      role: UserRole.USER,
    });

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'taskowner@example.com',
        password: 'Password123!',
      });

    authToken = loginResponse.body.data.tokens.accessToken;

    // Create a test task
    testTask = await createTestTask({
      title: 'Test Task',
      description: 'This is a test task',
      budget: 100,
      budgetType: BudgetType.FIXED,
      ownerId: testUser.id,
      status: TaskStatus.OPEN,
      priority: TaskPriority.MEDIUM,
    });
  });

  describe('POST /api/tasks', () => {
    it('should create a new task successfully', async () => {
      const taskData = {
        title: 'New Task',
        description: 'A new task description',
        budget: 200,
        budgetType: BudgetType.FIXED,
        category: 'Technology',
        location: 'San Francisco',
        priority: TaskPriority.HIGH,
      };

      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(taskData)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Task created successfully',
        data: {
          title: taskData.title,
          description: taskData.description,
          budget: taskData.budget,
          budgetType: taskData.budgetType,
          ownerId: testUser.id,
          status: TaskStatus.OPEN,
        },
      });
    });

    it('should validate required fields', async () => {
      const invalidTaskData = {
        description: 'Missing title',
        budget: 100,
      };

      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidTaskData)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          message: expect.stringContaining('Validation failed'),
          code: 'VALIDATION_ERROR',
        },
      });
    });

    it('should require authentication', async () => {
      const taskData = {
        title: 'Unauthorized Task',
        description: 'This should fail',
        budget: 100,
      };

      const response = await request(app)
        .post('/api/tasks')
        .send(taskData)
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'AUTHENTICATION_REQUIRED',
        },
      });
    });

    it('should validate budget constraints', async () => {
      const invalidBudgetData = {
        title: 'Invalid Budget Task',
        description: 'Task with invalid budget',
        budget: -100, // Negative budget
        budgetType: BudgetType.FIXED,
      };

      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidBudgetData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/tasks', () => {
    beforeEach(async () => {
      // Create multiple test tasks
      await createTestTask({
        title: 'Task 1',
        description: 'First task',
        budget: 100,
        budgetType: BudgetType.FIXED,
        ownerId: testUser.id,
        status: TaskStatus.OPEN,
      });

      await createTestTask({
        title: 'Task 2',
        description: 'Second task',
        budget: 200,
        budgetType: BudgetType.HOURLY,
        ownerId: testUser.id,
        status: TaskStatus.IN_PROGRESS,
      });
    });

    it('should fetch tasks successfully', async () => {
      const response = await request(app)
        .get('/api/tasks')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          tasks: expect.arrayContaining([
            expect.objectContaining({
              title: expect.any(String),
              description: expect.any(String),
              budget: expect.any(Number),
            }),
          ]),
          total: expect.any(Number),
          page: 1,
          limit: 20,
        },
      });
    });

    it('should handle pagination', async () => {
      const response = await request(app)
        .get('/api/tasks')
        .query({ page: 1, limit: 1 })
        .expect(200);

      expect(response.body.data.tasks).toHaveLength(1);
      expect(response.body.data.page).toBe(1);
      expect(response.body.data.limit).toBe(1);
    });

    it('should filter by status', async () => {
      const response = await request(app)
        .get('/api/tasks')
        .query({ status: TaskStatus.OPEN })
        .expect(200);

      response.body.data.tasks.forEach((task: any) => {
        expect(task.status).toBe(TaskStatus.OPEN);
      });
    });

    it('should filter by budget range', async () => {
      const response = await request(app)
        .get('/api/tasks')
        .query({ minBudget: 150, maxBudget: 250 })
        .expect(200);

      response.body.data.tasks.forEach((task: any) => {
        expect(task.budget).toBeGreaterThanOrEqual(150);
        expect(task.budget).toBeLessThanOrEqual(250);
      });
    });
  });

  describe('GET /api/tasks/:id', () => {
    it('should fetch task by ID successfully', async () => {
      const response = await request(app)
        .get(`/api/tasks/${testTask.id}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          id: testTask.id,
          title: testTask.title,
          description: testTask.description,
          budget: testTask.budget,
        },
      });
    });

    it('should return 404 for non-existent task', async () => {
      const response = await request(app)
        .get('/api/tasks/non-existent-id')
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'NOT_FOUND',
        },
      });
    });

    it('should include related data when requested', async () => {
      const response = await request(app)
        .get(`/api/tasks/${testTask.id}`)
        .query({ include: 'owner,bids,reviews' })
        .expect(200);

      expect(response.body.data).toHaveProperty('owner');
    });
  });

  describe('PUT /api/tasks/:id', () => {
    it('should update task successfully', async () => {
      const updateData = {
        title: 'Updated Task Title',
        budget: 300,
        priority: TaskPriority.HIGH,
      };

      const response = await request(app)
        .put(`/api/tasks/${testTask.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Task updated successfully',
        data: {
          id: testTask.id,
          title: updateData.title,
          budget: updateData.budget,
          priority: updateData.priority,
        },
      });
    });

    it('should prevent unauthorized updates', async () => {
      // Create another user
      const otherUser = await createTestUser({
        email: 'other@example.com',
        password: 'Password123!',
        firstName: 'Other',
        lastName: 'User',
      });

      const otherLoginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'other@example.com',
          password: 'Password123!',
        });

      const otherAuthToken = otherLoginResponse.body.data.tokens.accessToken;

      const response = await request(app)
        .put(`/api/tasks/${testTask.id}`)
        .set('Authorization', `Bearer ${otherAuthToken}`)
        .send({ title: 'Unauthorized Update' })
        .expect(403);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'FORBIDDEN',
        },
      });
    });

    it('should validate update data', async () => {
      const invalidUpdateData = {
        budget: -50, // Invalid negative budget
      };

      const response = await request(app)
        .put(`/api/tasks/${testTask.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidUpdateData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    it('should delete task successfully', async () => {
      const response = await request(app)
        .delete(`/api/tasks/${testTask.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Task deleted successfully',
      });

      // Verify task is deleted
      await request(app)
        .get(`/api/tasks/${testTask.id}`)
        .expect(404);
    });

    it('should prevent unauthorized deletion', async () => {
      // Create another user
      const otherUser = await createTestUser({
        email: 'other2@example.com',
        password: 'Password123!',
        firstName: 'Other',
        lastName: 'User',
      });

      const otherLoginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'other2@example.com',
          password: 'Password123!',
        });

      const otherAuthToken = otherLoginResponse.body.data.tokens.accessToken;

      const response = await request(app)
        .delete(`/api/tasks/${testTask.id}`)
        .set('Authorization', `Bearer ${otherAuthToken}`)
        .expect(403);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'FORBIDDEN',
        },
      });
    });
  });

  describe('GET /api/tasks/search', () => {
    beforeEach(async () => {
      // Create tasks with different content for search testing
      await createTestTask({
        title: 'Web Development Project',
        description: 'Need a React developer for frontend work',
        budget: 500,
        budgetType: BudgetType.FIXED,
        ownerId: testUser.id,
      });

      await createTestTask({
        title: 'Mobile App Design',
        description: 'Looking for UI/UX designer for mobile application',
        budget: 300,
        budgetType: BudgetType.HOURLY,
        ownerId: testUser.id,
      });
    });

    it('should search tasks by title', async () => {
      const response = await request(app)
        .get('/api/tasks/search')
        .query({ q: 'Web Development' })
        .expect(200);

      expect(response.body.data.tasks).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            title: expect.stringContaining('Web Development'),
          }),
        ])
      );
    });

    it('should search tasks by description', async () => {
      const response = await request(app)
        .get('/api/tasks/search')
        .query({ q: 'React developer' })
        .expect(200);

      expect(response.body.data.tasks).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            description: expect.stringContaining('React developer'),
          }),
        ])
      );
    });

    it('should require search query', async () => {
      const response = await request(app)
        .get('/api/tasks/search')
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          message: expect.stringContaining('Search query is required'),
          code: 'VALIDATION_ERROR',
        },
      });
    });

    it('should handle empty search results', async () => {
      const response = await request(app)
        .get('/api/tasks/search')
        .query({ q: 'nonexistentterm12345' })
        .expect(200);

      expect(response.body.data.tasks).toHaveLength(0);
      expect(response.body.data.total).toBe(0);
    });
  });

  describe('POST /api/tasks/:id/assign', () => {
    let taskerUser: any;
    let taskerAuthToken: string;

    beforeEach(async () => {
      // Create a tasker user
      taskerUser = await createTestUser({
        email: 'tasker@example.com',
        password: 'Password123!',
        firstName: 'Task',
        lastName: 'Executor',
        role: UserRole.TASKER,
      });

      const taskerLoginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'tasker@example.com',
          password: 'Password123!',
        });

      taskerAuthToken = taskerLoginResponse.body.data.tokens.accessToken;
    });

    it('should assign task to tasker successfully', async () => {
      const response = await request(app)
        .post(`/api/tasks/${testTask.id}/assign`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ assigneeId: taskerUser.id })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Task assigned successfully',
        data: {
          id: testTask.id,
          assigneeId: taskerUser.id,
          status: TaskStatus.IN_PROGRESS,
        },
      });
    });

    it('should prevent non-owners from assigning tasks', async () => {
      const response = await request(app)
        .post(`/api/tasks/${testTask.id}/assign`)
        .set('Authorization', `Bearer ${taskerAuthToken}`)
        .send({ assigneeId: taskerUser.id })
        .expect(403);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'FORBIDDEN',
        },
      });
    });
  });

  describe('POST /api/tasks/:id/complete', () => {
    beforeEach(async () => {
      // Set task to IN_PROGRESS status
      await request(app)
        .put(`/api/tasks/${testTask.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: TaskStatus.IN_PROGRESS });
    });

    it('should complete task successfully', async () => {
      const response = await request(app)
        .post(`/api/tasks/${testTask.id}/complete`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Task completed successfully',
        data: {
          id: testTask.id,
          status: TaskStatus.COMPLETED,
          completedAt: expect.any(String),
        },
      });
    });

    it('should prevent completing tasks that are not in progress', async () => {
      // Reset task to OPEN status
      await request(app)
        .put(`/api/tasks/${testTask.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: TaskStatus.OPEN });

      const response = await request(app)
        .post(`/api/tasks/${testTask.id}/complete`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});
