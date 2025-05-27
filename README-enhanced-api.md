# Flextasker Enhanced API Client

## Overview

The Enhanced API Client extends Flextasker's basic API capabilities with advanced features including:

- 🔄 **Real-time Synchronization** - WebSocket-based instant updates
- 📊 **Performance Monitoring** - Track API call metrics and identify bottlenecks
- 🔌 **Offline Support** - Queue requests when offline for later processing
- 🚦 **Rate Limiting** - Prevent API throttling with intelligent request management
- 🔁 **Auto-Retry** - Automatically retry failed requests with exponential backoff

## Quick Start

### 1. Setup the Enhanced API Provider

Add the Enhanced API Provider to your application's entry point:

```tsx
// In your App.tsx
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

### 2. Use the Enhanced API Client

Make API calls with the enhanced client:

```tsx
import { useEffect, useState } from 'react';
import enhancedApiClient from '@/services/api/enhanced-api-client';
import { Task } from '@/types';
import { TaskStatus, TaskPriority } from '@/types/enums';

function TaskComponent() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function fetchTasks() {
      const response = await enhancedApiClient.get('/tasks');
      if (response.success) {
        setTasks(response.data);
      }
      setLoading(false);
    }
    
    fetchTasks();
  }, []);
  
  const createTask = async () => {
    const newTask = {
      title: 'New Task',
      description: 'Created with enhanced API client',
      priority: TaskPriority.MEDIUM,
      status: TaskStatus.PENDING
    };
    
    const response = await enhancedApiClient.post('/tasks', newTask);
    if (response.success) {
      setTasks([...tasks, response.data]);
    }
  };
  
  return (
    <div>
      <button onClick={createTask}>Create Task</button>
      
      {loading ? (
        <p>Loading...</p>
      ) : (
        <ul>
          {tasks.map(task => (
            <li key={task.id}>{task.title} - {task.status}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

### 3. Use Enhanced Hooks

For the best developer experience, use the enhanced hooks:

```tsx
import { useTasksEnhanced } from '@/hooks/use-tasks-enhanced';
import { TaskStatus } from '@/types/enums';

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

## Feature Details

### Real-Time Synchronization

The WebSocket service provides real-time updates for tasks, bids, and notifications:

```tsx
import { useSocket, SocketEventType } from '@/services/socket/socket-service';

function TaskNotifications() {
  const [notifications, setNotifications] = useState([]);
  const { isConnected } = useSocket();
  
  useEffect(() => {
    // Subscribe to task updates
    const unsubscribe = useSocket().on(SocketEventType.TASK_UPDATED, (data) => {
      setNotifications(prev => [
        `Task "${data.task.title}" was updated to ${data.task.status}`,
        ...prev.slice(0, 9)
      ]);
    });
    
    return unsubscribe;
  }, []);
  
  return (
    <div>
      <div>Connection Status: {isConnected ? 'Connected' : 'Disconnected'}</div>
      <h3>Recent Updates:</h3>
      <ul>
        {notifications.map((notification, index) => (
          <li key={index}>{notification}</li>
        ))}
      </ul>
    </div>
  );
}
```

### Offline Support

The offline queue manager automatically queues requests when offline:

```tsx
import { useOfflineQueue } from '@/utils/offline-queue-manager';

function OfflineIndicator() {
  const { queueLength, processQueue } = useOfflineQueue();
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  return (
    <div className={isOffline ? 'bg-red-100' : 'bg-green-100'} style={{ padding: '8px' }}>
      <div>Status: {isOffline ? 'Offline' : 'Online'}</div>
      {queueLength > 0 && (
        <div>
          {queueLength} request(s) waiting to be processed
          <button onClick={() => processQueue()}>Sync Now</button>
        </div>
      )}
    </div>
  );
}
```

### Performance Monitoring

Monitor API performance with the performance monitoring tools:

```tsx
import { ApiPerformancePanel } from '@/components/dev-tools/api-performance-panel';

function DevTools() {
  return (
    <div className="fixed bottom-0 right-0 z-50">
      <ApiPerformancePanel />
    </div>
  );
}
```

## Testing

Run the tests to ensure that everything is working correctly:

```bash
npm run test
```

## Documentation

For more detailed documentation, see:

- [Enhanced API Features Documentation](./docs/enhanced-api-features.md)
- [Example Usage](./src/examples/api-enhancements-usage.tsx)
- [Test Suite](./src/tests/enhanced-api-client.test.ts)

## TypeScript Support

All components and utilities are fully typed with TypeScript:

- Use centralized enums for type safety (e.g., `TaskStatus`, `UserRole`, `TaskPriority`)
- Consistent interfaces for API responses
- Type-safe hooks and components

## Next Steps

- Add more specialized hooks for different entity types
- Implement caching strategies for frequently accessed data
- Add offline conflict resolution for complex scenarios
- Create more visualization tools for API performance monitoring
