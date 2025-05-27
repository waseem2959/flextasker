# Enhanced API Features Documentation

This document provides a comprehensive guide to using the enhanced API features in the Flextasker application.

## Table of Contents

1. [Overview](#overview)
2. [Enhanced API Client](#enhanced-api-client)
3. [Real-Time Synchronization](#real-time-synchronization)
4. [Performance Monitoring](#performance-monitoring)
5. [Offline Support](#offline-support)
6. [Rate Limiting](#rate-limiting)
7. [Integration Guide](#integration-guide)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)

## Overview

The enhanced API layer provides several advanced features to improve the user experience and application reliability:

- **Real-Time Synchronization**: Instant updates via WebSockets
- **Performance Monitoring**: Track and analyze API performance
- **Offline Support**: Queue requests when offline for later processing
- **Rate Limiting**: Prevent API throttling with intelligent request management
- **Auto-Retry**: Automatically retry failed requests with exponential backoff

## Enhanced API Client

The enhanced API client extends the base API client with additional functionality while maintaining the same interface.

### Basic Usage

```typescript
import enhancedApiClient from '@/services/api/enhanced-api-client';

// Making GET requests
const tasksResponse = await enhancedApiClient.get('/tasks');
if (tasksResponse.success) {
  const tasks = tasksResponse.data;
  // Process tasks...
}

// Making POST requests
const newTask = {
  title: 'New Task',
  description: 'Task description',
  categoryId: '1',
  priority: TaskPriority.MEDIUM,
  budget: 100,
  budgetType: BudgetType.FIXED
};

const createResponse = await enhancedApiClient.post('/tasks', newTask);
if (createResponse.success) {
  const createdTask = createResponse.data;
  // Handle created task...
}

// Making PUT requests
const updatedTask = { ...task, status: TaskStatus.COMPLETED };
const updateResponse = await enhancedApiClient.put(`/tasks/${task.id}`, updatedTask);

// Making DELETE requests
const deleteResponse = await enhancedApiClient.delete(`/tasks/${task.id}`);
```

### Error Handling

The enhanced client provides consistent error handling across all requests:

```typescript
try {
  const response = await enhancedApiClient.get('/tasks');
  
  if (!response.success) {
    // Handle API error
    console.error(`API Error: ${response.message}`);
    console.error('Details:', response.errors);
    
    // Show user-friendly message
    toast({
      title: 'Error fetching tasks',
      description: response.message,
      variant: 'destructive'
    });
    
    return;
  }
  
  // Process successful response
  const tasks = response.data;
  
} catch (error) {
  // Handle unexpected errors (network issues, etc.)
  console.error('Unexpected error:', error);
  
  toast({
    title: 'Error',
    description: 'An unexpected error occurred. Please try again.',
    variant: 'destructive'
  });
}
```

## Real-Time Synchronization

The real-time synchronization system uses WebSockets to provide instant updates for tasks, bids, messages, and notifications.

### Using the Socket Service

```typescript
import { useSocket, SocketEventType } from '@/services/socket/socket-service';

function TaskComponent({ taskId }) {
  const [task, setTask] = useState(null);
  const { isConnected, connectionState } = useSocket();
  
  useEffect(() => {
    // Subscribe to task updates
    const unsubscribe = useSocket().on(SocketEventType.TASK_UPDATED, (data) => {
      if (data.taskId === taskId) {
        setTask(data.task);
      }
    });
    
    // Cleanup on unmount
    return unsubscribe;
  }, [taskId]);
  
  return (
    <div>
      {isConnected ? (
        <span className="text-green-500">Connected</span>
      ) : (
        <span className="text-red-500">Disconnected ({connectionState})</span>
      )}
      
      {task && (
        <div>
          <h3>{task.title}</h3>
          <p>Status: {task.status}</p>
        </div>
      )}
    </div>
  );
}
```

### Available Event Types

The `SocketEventType` enum provides all the available event types:

- `TASK_CREATED`: Fired when a new task is created
- `TASK_UPDATED`: Fired when a task is updated
- `TASK_DELETED`: Fired when a task is deleted
- `BID_RECEIVED`: Fired when a new bid is received
- `BID_UPDATED`: Fired when a bid is updated
- `MESSAGE_RECEIVED`: Fired when a new message is received
- `NOTIFICATION_RECEIVED`: Fired when a new notification is received

### Sending Events

You can also send events to the server using the enhanced API client:

```typescript
enhancedApiClient.sendSocketEvent(SocketEventType.TASK_UPDATED, {
  taskId: '123',
  task: updatedTask
});
```

## Performance Monitoring

The performance monitoring system tracks metrics for all API calls, including response times, success rates, and payload sizes.

### Using the Performance Monitor

```typescript
import { usePerformanceMonitoring } from '@/services/analytics/performance-monitor';

function PerformanceMetricsComponent() {
  const { getPerformanceScore, getSlowestEndpoints } = usePerformanceMonitoring();
  const [score, setScore] = useState(100);
  const [slowEndpoints, setSlowEndpoints] = useState([]);
  
  useEffect(() => {
    const updateMetrics = () => {
      setScore(getPerformanceScore());
      setSlowEndpoints(getSlowestEndpoints(3));
    };
    
    updateMetrics();
    const interval = setInterval(updateMetrics, 5000);
    
    return () => clearInterval(interval);
  }, [getPerformanceScore, getSlowestEndpoints]);
  
  return (
    <div>
      <h3>API Performance</h3>
      <div>Score: {score}/100</div>
      
      <h4>Slowest Endpoints</h4>
      <ul>
        {slowEndpoints.map((endpoint, index) => (
          <li key={index}>
            {endpoint.method} {endpoint.endpoint}: {endpoint.averageDuration.toFixed(1)}ms
            (Success Rate: {(endpoint.successRate * 100).toFixed(0)}%)
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### Manual Timing

You can also manually time operations:

```typescript
import { usePerformanceMonitoring } from '@/services/analytics/performance-monitor';

function CustomOperation() {
  const { monitor } = usePerformanceMonitoring();
  
  const performSlowOperation = async () => {
    const startTime = monitor.startTiming('custom-operation', 'CUSTOM');
    
    // Perform your operation
    await someSlowOperation();
    
    // Record the result
    monitor.recordRequest(
      'custom-operation',
      'CUSTOM',
      startTime,
      200, // status code
      true, // success
      false, // fromCache
      0, // responseSize
      0 // retryCount
    );
  };
  
  return (
    <button onClick={performSlowOperation}>
      Perform Slow Operation
    </button>
  );
}
```

## Offline Support

The offline support system automatically queues requests when the application is offline and processes them when the connection is restored.

### Using the Offline Queue Manager

```typescript
import { offlineQueueManager, RequestStatus } from '@/utils/offline-queue-manager';

// Check the queue length
const queueLength = await offlineQueueManager.getQueueLength();

// Manually enqueue a request
const requestId = await offlineQueueManager.enqueue({
  url: '/tasks',
  method: 'POST',
  data: {
    title: 'Offline Task',
    description: 'Created while offline'
  },
  priority: 2, // Higher priorities are processed first
  entityType: 'task'
});

// Manually process the queue
await offlineQueueManager.processQueue();

// Get pending requests
const pendingRequests = await offlineQueueManager.getPendingRequests();

// Clear completed requests
const clearedCount = await offlineQueueManager.clearCompletedRequests();
```

### Using the useOfflineQueue Hook

```typescript
import { useOfflineQueue } from '@/utils/offline-queue-manager';

function OfflineStatusComponent() {
  const { queueLength, enqueue, processQueue, clearCompleted, isProcessing } = useOfflineQueue();
  
  return (
    <div>
      <div>Pending requests: {queueLength}</div>
      
      <button 
        onClick={() => processQueue()} 
        disabled={queueLength === 0 || isProcessing}
      >
        Process Queue
      </button>
      
      <button 
        onClick={() => clearCompleted()} 
        disabled={isProcessing}
      >
        Clear Completed
      </button>
    </div>
  );
}
```

## Rate Limiting

The rate limiting system prevents API throttling by intelligently managing request frequency.

### Configuration

Rate limiting is automatically configured based on endpoint patterns:

```typescript
const rateLimits = {
  // Default limit for all endpoints
  default: { maxRequests: 20, windowMs: 10000 },
  
  // Specific limits for certain endpoint patterns
  '/tasks': { maxRequests: 10, windowMs: 5000 },
  '/users': { maxRequests: 5, windowMs: 10000 }
};
```

### Manual Rate Limiting

You can also use the rate limiter directly:

```typescript
import { rateLimiter } from '@/services/api/rate-limiter';

// Check if a request would be rate limited
const wouldBeRateLimited = rateLimiter.wouldBeRateLimited('/tasks', 'GET');

// Manually rate limit a request
await rateLimiter.limitRequest('/tasks', 'GET', 1);
```

## Integration Guide

To integrate all enhanced API features in your application, use the `EnhancedApiProvider` at your app's entry point:

```typescript
import { EnhancedApiProvider } from '@/providers/enhanced-api-provider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <EnhancedApiProvider
        enableRealTimeSync={true}
        enableRateLimiting={true}
        enableOfflineSupport={true}
        enableDevTools={import.meta.env.DEV}
      >
        <YourAppComponents />
      </EnhancedApiProvider>
    </QueryClientProvider>
  );
}
```

### Configuration Options

The `EnhancedApiProvider` accepts several configuration options:

- `enableRealTimeSync`: Enable WebSocket-based real-time updates
- `enableRateLimiting`: Enable intelligent request rate limiting
- `enableOfflineSupport`: Enable offline request queueing
- `enablePerformanceMonitoring`: Enable API performance tracking
- `enableDevTools`: Show developer tools for monitoring and debugging
- `socketUrl`: URL for the WebSocket connection
- `tokenRefreshUrl`: URL for refreshing authentication tokens
- `offlinePollingInterval`: How often to check and process the offline queue

## Best Practices

### Using Enhanced Hooks

For the best developer experience, use the enhanced hooks that leverage the enhanced API client:

```typescript
import { useTasksEnhanced } from '@/hooks/use-tasks-enhanced';

function TaskList() {
  const { 
    tasks, 
    isLoading, 
    error, 
    createTask, 
    updateTask, 
    deleteTask,
    isOffline
  } = useTasksEnhanced();
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <div>
      {isOffline && (
        <div className="bg-yellow-100 p-2 rounded mb-4">
          You are offline. Changes will be synced when you reconnect.
        </div>
      )}
      
      <button onClick={() => createTask({ title: 'New Task' })}>
        Create Task
      </button>
      
      <ul>
        {tasks.map(task => (
          <li key={task.id}>
            {task.title}
            <button onClick={() => updateTask(task.id, { status: TaskStatus.COMPLETED })}>
              Complete
            </button>
            <button onClick={() => deleteTask(task.id)}>
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### Optimistic Updates

Use optimistic updates for a better user experience:

```typescript
const updateTaskWithOptimisticUpdate = async (taskId, updates) => {
  // Get the current query cache
  const queryCache = queryClient.getQueryCache();
  const queryCacheKey = ['tasks', 'detail', taskId];
  
  // Get the current task data
  const currentData = queryClient.getQueryData(queryCacheKey);
  
  if (currentData) {
    // Apply optimistic update
    queryClient.setQueryData(queryCacheKey, {
      ...currentData,
      data: {
        ...currentData.data,
        ...updates
      }
    });
  }
  
  try {
    // Make the actual API request
    const response = await enhancedApiClient.put(`/tasks/${taskId}`, updates);
    
    if (!response.success) {
      // Revert optimistic update on error
      queryClient.setQueryData(queryCacheKey, currentData);
      throw new Error(response.message);
    }
    
    return response;
  } catch (error) {
    // Revert optimistic update on error
    queryClient.setQueryData(queryCacheKey, currentData);
    throw error;
  }
};
```

## Troubleshooting

### WebSocket Connection Issues

If you're experiencing WebSocket connection issues:

1. Check the server status and WebSocket endpoint
2. Verify your authentication token is valid
3. Check for network issues or firewalls blocking WebSocket connections
4. Use the ConnectionStatusIndicator to monitor the connection state

```typescript
import { ConnectionStatusIndicator } from '@/components/status/connection-status';

function Header() {
  return (
    <header>
      <h1>Flextasker</h1>
      <ConnectionStatusIndicator />
    </header>
  );
}
```

### Offline Queue Not Processing

If the offline queue is not processing correctly:

1. Verify your network connection is active
2. Check the browser console for errors
3. Manually trigger queue processing
4. Clear any stuck requests

```typescript
// Manually process the queue
await offlineQueueManager.processQueue();

// Clear completed requests to remove any that might be stuck
await offlineQueueManager.clearCompletedRequests();
```

### Performance Issues

If you're experiencing API performance issues:

1. Use the ApiPerformancePanel to identify slow endpoints
2. Consider implementing caching for frequently accessed data
3. Reduce the payload size by requesting only needed fields
4. Implement pagination for large data sets

```typescript
import { ApiPerformancePanel } from '@/components/dev-tools/api-performance-panel';

function DevTools() {
  return (
    <div className="fixed bottom-0 right-0 z-50">
      <ApiPerformancePanel />
    </div>
  );
}
```
