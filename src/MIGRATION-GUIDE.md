# Flextasker Architecture Migration Guide

This guide provides instructions for migrating components from the old patterns to the new enhanced implementation, covering both frontend TypeScript improvements and backend architectural enhancements.

## Core Improvements

### Frontend Enhancements

1. **Enhanced Type Safety**: Discriminated unions for task states, proper error types, and consistent enum usage
2. **Consolidated API Services**: Improved error handling and type inference
3. **Enhanced React Query Integration**: Better performance and developer experience

### Backend Architectural Enhancements

1. **Standardized Error Handling**: Consolidated error types across frontend and backend
2. **Controller Layer**: Improved separation of concerns with base controller pattern
3. **Modular Middleware**: Better organized, reusable middleware components
4. **OpenAPI Documentation**: Comprehensive API documentation with Swagger
5. **Testing Infrastructure**: Consistent testing approach for both unit and integration tests

## Frontend Migration Steps

### 1. Update Imports

Replace imports from individual files with our new consolidated exports:

```tsx
// BEFORE
import { useTask } from '@/hooks/use-tasks';
import { taskService } from '@/services/api/tasks.service';

// AFTER
import { useEnhancedTask } from '@/hooks';
// or import the entire hooks namespace
import * as hooks from '@/hooks';
```

### 2. Use Enhanced Hooks

Replace old hook usage with enhanced versions:

```tsx
// BEFORE
const { data: taskData, isLoading } = useTask(taskId);

// AFTER
const { data: taskResponse, isLoading } = useEnhancedTask(taskId);
const task = taskResponse?.data;
```

### 3. Leverage Type Guards

Use the type guards for better type safety:

```tsx
// BEFORE
if (task && task.status === 'COMPLETED') {
  // No type safety here
  console.log(task.completedAt);
}

// AFTER
import { isCompletedTask } from '@/utils/type-guards';

if (task && isCompletedTask(task)) {
  // TypeScript knows this is a CompletedTask
  console.log(task.completionDate);
}
```

### 4. Use Enhanced Auth Context

Replace the old auth context with the enhanced version:

```tsx
// BEFORE
import { AuthProvider } from '@/contexts/auth-context';

// AFTER
import { EnhancedAuthProvider } from '@/contexts';
```

### 5. Use Enhanced API Client

For direct API calls, use the enhanced API client:

```tsx
// BEFORE
import apiClient from '@/services/api/api-client';

// AFTER
import { enhancedApiClient } from '@/services/api';
```

## File Mappings

| Old File | New File |
|----------|----------|
| `auth-context.tsx` | `enhanced-auth-context.tsx` |
| `tasks.service.ts` | `enhanced-tasks.service.ts` |
**Note: As of the latest update, all services and utilities have been reorganized into a more modular structure. The following table shows the new organization:**

| Old Filename | New Organization |
|-------------------|-------------------------------------------|
| `api-client.ts`   | Now `base-client.ts` in services/api folder |
| `enhanced-api-client.ts` | Now `enhanced-client.ts` in services/api folder |
| `offline-queue.ts` | Modularized into utils/offline-queue folder with `core.ts`, `manager.ts`, `types.ts`, and `index.ts` |
| `offline-queue-manager.ts` | Now part of utils/offline-queue/manager.ts |
| `use-api.ts` | Updated to use the new client implementations |
| `use-tasks.ts` | Updated to use the new client implementations |
| `use-bids.ts` | Updated to use the new client implementations |
| `use-users.ts` | Updated to use the new client implementations |

## Advanced Type Safety with Discriminated Unions

Our new implementation uses discriminated unions for task states, which provides better type safety:

```tsx
// Example of using discriminated unions
import { useEnhancedTask } from '@/hooks';
import { isOpenTask, isCompletedTask } from '@/utils/type-guards';

function TaskDetails({ taskId }) {
  const { data: response } = useEnhancedTask(taskId);
  const task = response?.data;
  
  if (!task) return <div>Loading...</div>;
  
  if (isOpenTask(task)) {
    // TypeScript knows this is an OpenTask
    return (
      <div>
        <h2>{task.title}</h2>
        <p>Accepting bids until: {task.bidEndDate.toLocaleString()}</p>
      </div>
    );
  }
  
  if (isCompletedTask(task)) {
    // TypeScript knows this is a CompletedTask
    return (
      <div>
        <h2>{task.title}</h2>
        <p>Completed on: {task.completionDate.toLocaleString()}</p>
        <p>Rating: {task.rating}/5</p>
      </div>
    );
  }
  
  // Handle other task states...
}
```

## Error Handling

The new implementation provides better error handling with specialized error types:

```tsx
import { useEnhancedCreateTask } from '@/hooks';
import { ValidationError, AuthorizationError } from '@/types/errors';

function CreateTaskForm() {
  const createTask = useEnhancedCreateTask();
  
  const handleSubmit = async (data) => {
    try {
      await createTask.mutateAsync(data);
      // Success handling
    } catch (error) {
      if (error instanceof ValidationError) {
        // Handle validation errors
        console.log(error.details);
      } else if (error instanceof AuthorizationError) {
        // Handle authorization errors
        console.log('You do not have permission to create tasks');
      } else {
        // Handle other errors
        console.error('An unexpected error occurred', error);
      }
    }
  };
  
  // Form JSX...
}
```

## Backend Migration Guide

### 1. Error Handling

Migrate from custom error handling to the new standardized error system:

```typescript
// BEFORE
import { AppError } from '@/utils/errors';

// Creating errors with custom status codes
throw new AppError('Resource not found', 404);

// AFTER
import { NotFoundError } from '@/utils/enhanced-errors';
// Or if importing from shared types:
import { NotFoundError } from '../../shared/types/errors';

// Using specific error classes for better type safety
throw new NotFoundError('Resource not found');
```

### 2. Controller Pattern

Migrate route handlers to the new controller pattern:

```typescript
// BEFORE - in routes/tasks.ts
router.get('/', async (req, res, next) => {
  try {
    const tasks = await taskService.getAllTasks();
    res.json({ success: true, data: tasks });
  } catch (error) {
    next(error);
  }
});

// AFTER - in controllers/task.controller.ts
import { BaseController } from './base.controller';
import { TaskService } from '@/services/task';

export class TaskController extends BaseController {
  private taskService = new TaskService();
  
  getAllTasks = this.asyncHandler(async (req, res) => {
    const tasks = await this.taskService.getAllTasks();
    this.sendSuccess(res, tasks);
  });
}

// Then in routes/tasks.ts
import { TaskController } from '@/controllers/task.controller';
const taskController = new TaskController();
router.get('/', taskController.getAllTasks);
```

### 3. Modular Middleware

Migrate to the new modular middleware structure:

```typescript
// BEFORE - importing middleware directly
import { authenticateUser } from '@/middleware/auth';
import { validateTaskInput } from '@/middleware/validation';

// AFTER - using the new modular structure
import { auth, validation } from '@/middleware';

// Usage in routes
router.post('/tasks', 
  auth.authenticateToken,
  validation.validate(taskValidationSchema),
  taskController.createTask
);
```

### 4. Testing

Update test files to use the new testing infrastructure:

```typescript
// BEFORE - custom test setup
import request from 'supertest';
import { app } from '@/app';

// AFTER - using the standardized test utilities
import { api } from '@/tests/integration/setup';
import { createMockRequest, createMockResponse } from '@/tests/mocks/mock-request';
import { mockTasks } from '@/tests/mocks/mock-data';

// Unit testing a controller
describe('TaskController', () => {
  let req, res, next;
  
  beforeEach(() => {
    req = createMockRequest();
    res = createMockResponse();
    next = jest.fn();
  });
  
  it('should return all tasks', async () => {
    await taskController.getAllTasks(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

// Integration testing an API endpoint
describe('GET /api/v1/tasks', () => {
  it('should return all tasks', async () => {
    const response = await api
      .get('/api/v1/tasks')
      .set('Authorization', 'Bearer token');
      
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
```

### 5. OpenAPI Documentation

Add OpenAPI/Swagger documentation to your routes:

```typescript
/**
 * @swagger
 * /tasks:
 *   get:
 *     summary: Get all tasks
 *     tags: [Tasks]
 *     responses:
 *       200:
 *         description: A list of tasks
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TaskList'
 */
router.get('/', taskController.getAllTasks);
```

## Shared Type System

Use the shared type system for consistent types between frontend and backend:

```typescript
// Import shared enums in both frontend and backend
import { UserRole, TaskStatus } from '../shared/types/enums';

// Import shared API interfaces
import { 
  TaskCreateRequest, 
  TaskResponse 
} from '../shared/types/api';

// Import shared error types
import { 
  ValidationError, 
  NotFoundError 
} from '../shared/types/errors';
```

## Gradual Migration

You can gradually migrate your components to the new patterns. The old APIs will continue to work alongside the new ones until you're ready to fully transition.
