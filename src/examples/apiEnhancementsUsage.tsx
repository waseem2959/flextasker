/**
 * Enhanced API Features Usage Examples
 * 
 * This file demonstrates how to use the enhanced API features we've implemented:
 * - Real-time synchronization
 * - Performance monitoring
 * - Rate limiting
 * - Offline support
 * - Auto-retry
 * 
 * These examples are meant to be educational and show proper usage patterns.
 */

import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';

// Import our enhanced API features from consolidated implementation
import { consolidatedApiClient as enhancedApiClient } from '@/services/api/consolidated-client';
import { ConnectionStatusIndicator } from '@/components/status/connectionStatus';
import { useRealtimeService } from '@/services/realtime/hooks';
import { SocketEventType } from '@/services/realtime/types';
import { usePerformanceMonitoring } from '@/services/analytics/performanceMonitor';
// Import removed: rateLimiter (unused)
import { offlineQueueManager } from '@/utils/offline-queue';

// Import types from our centralized type definitions
import { TaskStatus, TaskPriority, BudgetType } from '../../shared/types/enums';

/**
 * Example showing how to use the enhanced API client directly
 */
function EnhancedApiClientExample() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Function to make an API request using the enhanced client
  const fetchTasks = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Use the enhanced client to fetch tasks
      const response = await enhancedApiClient.get('/tasks');
      
      if (response.success) {
        setResult(response.data);
        toast({
          title: 'Tasks fetched successfully',
          description: `Loaded ${response.data.length} tasks`,
          variant: 'default'
        });
      } else {
        setError(response.message);
        toast({
          title: 'Failed to fetch tasks',
          description: response.message,
          variant: 'destructive'
        });
      }
    } catch (err: any) {
      setError(err.message);
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Function to create a task with offline support
  const createTask = async () => {
    setLoading(true);
    setError(null);
    
    const newTask = {
      title: `Task created at ${new Date().toLocaleTimeString()}`,
      description: 'This is a test task created via the enhanced API client',
      categoryId: '1',
      priority: TaskPriority.MEDIUM,
      budget: 100,
      budgetType: BudgetType.FIXED,
      isRemote: true
    };
    
    try {
      // Create a task with the enhanced client
      const response = await enhancedApiClient.post('/tasks', newTask);
      
      if (response.success) {
        setResult(response.data);
        toast({
          title: 'Task created successfully',
          description: `Created task: ${response.data.title}`,
          variant: 'default'
        });
      } else {
        setError(response.message);
        toast({
          title: 'Failed to create task',
          description: response.message,
          variant: 'destructive'
        });
      }
    } catch (err: any) {
      setError(err.message);
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Enhanced API Client Example</CardTitle>
        <CardDescription>
          Demonstrates direct usage of the enhanced API client with
          offline support, rate limiting, and automatic retries
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex space-x-2">
          <Button onClick={fetchTasks} disabled={loading}>
            {loading ? 'Loading...' : 'Fetch Tasks'}
          </Button>
          
          <Button onClick={createTask} disabled={loading} variant="outline">
            {loading ? 'Creating...' : 'Create Task'}
          </Button>
        </div>
        
        {error && (
          <div className="bg-destructive/10 p-3 rounded-md text-destructive text-sm">
            {error}
          </div>
        )}
        
        {result && (
          <div className="bg-muted p-3 rounded-md overflow-auto max-h-[200px]">
            <pre className="text-xs">{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Example showing how to use real-time synchronization
 */
function RealTimeSyncExample() {
  const realtimeService = useRealtimeService();
  const { isConnected, connectionState, service } = realtimeService;
  const [events, setEvents] = useState<Array<{ type: string; data: Record<string, unknown>; time: string }>>([]);
  const queryClient = useQueryClient();
  
  // Subscribe to real-time events
  useEffect(() => {
    // Listen for task updates
    const taskUpdatedUnsubscribe = service.on(SocketEventType.TASK_UPDATED, (data: Record<string, unknown>) => {
      // Add to our events log
      setEvents(prev => [
        { type: 'TASK_UPDATED', data, time: new Date().toLocaleTimeString() },
        ...prev.slice(0, 9) // Keep only the 10 most recent events
      ]);
      
      // This would typically be handled by our EnhancedApiProvider
      // but we show it here for demonstration
      const typedData = data as { taskId: string; task: Record<string, unknown> };
      queryClient.setQueryData(['tasks', 'detail', typedData.taskId], {
        success: true,
        message: 'Task updated via socket',
        data: typedData.task,
        timestamp: new Date().toISOString()
      });
    });
    
    // Listen for new bids
    const bidReceivedUnsubscribe = service.on(SocketEventType.BID_RECEIVED, (data: Record<string, unknown>) => {
      setEvents(prev => [
        { type: 'BID_RECEIVED', data, time: new Date().toLocaleTimeString() },
        ...prev.slice(0, 9)
      ]);
    });
    
    // Listen for notifications
    const notificationReceivedUnsubscribe = service.on(SocketEventType.NOTIFICATION_RECEIVED, (data: Record<string, unknown>) => {
      setEvents(prev => [
        { type: 'NOTIFICATION', data, time: new Date().toLocaleTimeString() },
        ...prev.slice(0, 9)
      ]);
    });
    
    // Cleanup on unmount
    return () => {
      taskUpdatedUnsubscribe();
      bidReceivedUnsubscribe();
      notificationReceivedUnsubscribe();
    };
  }, [queryClient]);
  
  // Function to simulate sending a real-time event
  const sendTestEvent = () => {
    // Create a mock task update
    const mockTaskUpdate = {
      taskId: `task-${Math.floor(Math.random() * 1000)}`,
      task: {
        id: `task-${Math.floor(Math.random() * 1000)}`,
        title: `Updated Task ${Math.floor(Math.random() * 100)}`,
        status: TaskStatus.IN_PROGRESS,
        updatedAt: new Date().toISOString()
      }
    };
    
    // Send it via the WebSocket
    enhancedApiClient.sendSocketEvent(SocketEventType.TASK_UPDATED, mockTaskUpdate);
    
    toast({
      title: 'Test Event Sent',
      description: 'A test task update event was sent via WebSocket',
      variant: 'default'
    });
  };
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>Real-Time Synchronization</CardTitle>
          <CardDescription>
            Shows real-time updates via WebSockets
          </CardDescription>
        </div>
        <ConnectionStatusIndicator />
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <Button onClick={sendTestEvent} disabled={!isConnected}>
            Send Test Event
          </Button>
          
          <Badge variant={isConnected ? 'default' : 'destructive'}>
            {connectionState}
          </Badge>
        </div>
        
        <div className="border rounded-md overflow-hidden">
          <div className="bg-muted p-2 text-sm font-medium">Recent Events</div>
          <div className="p-0 max-h-[200px] overflow-auto">
            {events.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                No events received yet
              </div>
            ) : (
              <ul className="divide-y">
                {events.map((event) => (
                  <li key={`${event.type}-${event.time}`} className="p-2 text-xs">
                    <div className="flex justify-between">
                      <Badge variant="outline" className="mb-1">
                        {event.type}
                      </Badge>
                      <span className="text-muted-foreground">{event.time}</span>
                    </div>
                    <div className="text-xs font-mono mt-1 break-all">
                      {JSON.stringify(event.data).substring(0, 100)}
                      {JSON.stringify(event.data).length > 100 ? '...' : ''}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Example showing how to monitor API performance
 */
function PerformanceMonitoringExample() {
  const { monitor, getPerformanceScore, getSlowestEndpoints } = usePerformanceMonitoring();
  const [performanceScore, setPerformanceScore] = useState(100);
  const [slowEndpoints, setSlowEndpoints] = useState<any[]>([]);
  
  // Update the performance metrics periodically
  useEffect(() => {
    const updateMetrics = () => {
      setPerformanceScore(getPerformanceScore());
      setSlowEndpoints(getSlowestEndpoints(3));
    };
    
    // Initial update
    updateMetrics();
    
    // Set up interval
    const interval = setInterval(updateMetrics, 5000);
    
    return () => clearInterval(interval);
  }, [getPerformanceScore, getSlowestEndpoints]);
  
  // Function to make test API calls to measure performance
  const makeTestApiCalls = async () => {
    toast({
      title: 'Running Performance Test',
      description: 'Making multiple API calls to measure performance',
      variant: 'default'
    });
    
    // Make multiple API calls in sequence to collect metrics
    for (let i = 0; i < 5; i++) {
      try {
        await enhancedApiClient.get('/tasks');
        await new Promise(r => setTimeout(r, 300)); // Small delay between calls
      } catch (error) {
        console.error('Error in test API call:', error);
      }
    }
    
    toast({
      title: 'Performance Test Complete',
      description: 'Check the metrics to see the results',
      variant: 'default'
    });
  };
  
  // Function to simulate a slow API call
  const simulateSlowCall = async () => {
    toast({
      title: 'Simulating Slow API Call',
      description: 'This will take 3 seconds to complete',
      variant: 'default'
    });
    
    const startTime = monitor.startTiming('/slow-endpoint', 'GET');
    
    // Simulate a 3-second API call
    await new Promise(r => setTimeout(r, 3000));
    
    // Record the slow performance
    monitor.recordRequest(
      '/slow-endpoint',
      'GET',
      startTime,
      200,
      true,
      false,
      1024,
      0
    );
    
    toast({
      title: 'Slow Call Complete',
      description: 'A 3-second API call was recorded',
      variant: 'default'
    });
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Monitoring</CardTitle>
        <CardDescription>
          Demonstrates tracking and analyzing API performance
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-2xl font-bold">{performanceScore}</div>
            <div className="text-sm text-muted-foreground">API Performance Score</div>
          </div>
          
          <div className="space-x-2">
            <Button onClick={makeTestApiCalls} variant="outline" size="sm">
              Run Test Calls
            </Button>
            <Button onClick={simulateSlowCall} variant="outline" size="sm">
              Simulate Slow Call
            </Button>
          </div>
        </div>
        
        <div>
          <Progress value={performanceScore} className="h-2" />
        </div>
        
        <div className="border rounded-md overflow-hidden mt-4">
          <div className="bg-muted p-2 text-sm font-medium">Slowest Endpoints</div>
          {slowEndpoints.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              No performance data yet
            </div>
          ) : (
            <ul className="divide-y">
              {slowEndpoints.map((endpoint) => (
                <li key={`${endpoint.method}-${endpoint.endpoint}`} className="p-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-mono text-xs">{endpoint.method} {endpoint.endpoint}</span>
                    <Badge variant="outline">
                      {endpoint.averageDuration.toFixed(1)}ms
                    </Badge>
                  </div>
                  <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                    <span>Success Rate: {(endpoint.successRate * 100).toFixed(0)}%</span>
                    <span>Calls: {endpoint.callCount}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Example showing offline queue functionality
 */
function OfflineQueueExample() {
  const [queueLength, setQueueLength] = useState(0);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  
  // Monitor queue length and online status
  useEffect(() => {
    const checkQueueLength = async () => {
      const length = await offlineQueueManager.getQueueLength();
      setQueueLength(length);
    };
    
    // Initial check
    checkQueueLength();
    
    // Set up interval to check queue length
    const interval = setInterval(checkQueueLength, 2000);
    
    // Listen for online/offline events
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Set up queue change listener
    const unsubscribe = offlineQueueManager.onQueueChange(length => {
      setQueueLength(length);
    });
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribe();
    };
  }, []);
  
  // Function to simulate going offline
  const simulateOffline = () => {
    // We can't actually go offline programmatically, but we can pretend
    setIsOffline(true);
    
    toast({
      title: 'Simulating Offline Mode',
      description: 'Requests will be queued for later processing',
      variant: 'default'
    });
  };
  
  // Function to enqueue a test request
  const enqueueTestRequest = async () => {
    try {
      // Create a test request
      const id = await offlineQueueManager.enqueue({
        url: '/tasks',
        method: 'POST',
        data: {
          title: `Offline task created at ${new Date().toLocaleTimeString()}`,
          description: 'This task was created while offline',
          categoryId: '1',
          priority: TaskPriority.MEDIUM,
          budget: 100,
          budgetType: BudgetType.FIXED,
          isRemote: true
        },
        priority: 2,
        entityType: 'task'
      });
      
      toast({
        title: 'Request Queued',
        description: `Request added to offline queue with ID: ${id.substring(0, 8)}...`,
        variant: 'default'
      });
    } catch (error) {
      console.error('Error queuing request:', error);
      toast({
        title: 'Error',
        description: 'Failed to queue request',
        variant: 'destructive'
      });
    }
  };
  
  // Function to process the offline queue
  const processQueue = async () => {
    try {
      // Process all queued requests
      await offlineQueueManager.processQueue();
      
      toast({
        title: 'Queue Processing Started',
        description: 'Processing all queued requests...',
        variant: 'default'
      });
    } catch (error) {
      console.error('Error processing queue:', error);
      toast({
        title: 'Error',
        description: 'Failed to process queue',
        variant: 'destructive'
      });
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Offline Queue</CardTitle>
        <CardDescription>
          Demonstrates queueing requests when offline
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <Badge variant={isOffline ? 'destructive' : 'default'}>
            {isOffline ? 'Offline' : 'Online'}
          </Badge>
          
          <div className="text-right">
            <div className="text-2xl font-bold">{queueLength}</div>
            <div className="text-sm text-muted-foreground">Queued Requests</div>
          </div>
        </div>
        
        <div className="flex space-x-2 justify-end">
          <Button onClick={simulateOffline} variant="outline" size="sm" disabled={isOffline}>
            Simulate Offline
          </Button>
          
          <Button onClick={enqueueTestRequest} size="sm">
            Add Test Request
          </Button>
          
          <Button onClick={processQueue} size="sm" variant="default" disabled={queueLength === 0}>
            Process Queue
          </Button>
        </div>
        
        {isOffline && (
          <div className="bg-amber-50 dark:bg-amber-950/20 p-3 rounded-md text-sm">
            <p className="font-medium text-amber-800 dark:text-amber-300">You are offline</p>
            <p className="text-amber-700 dark:text-amber-400 text-xs mt-1">
              Your requests will be queued and processed when you reconnect.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Main API Enhancements Usage Example Component
 */
export default function ApiEnhancementsUsageExample() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Enhanced API Features Usage Examples</h1>
        <p className="text-muted-foreground">
          These examples demonstrate how to use the advanced API features implemented in Flextasker.
        </p>
      </div>
      
      <Tabs defaultValue="api-client">
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="api-client">Enhanced API Client</TabsTrigger>
          <TabsTrigger value="realtime">Real-Time Sync</TabsTrigger>
          <TabsTrigger value="performance">Performance Monitoring</TabsTrigger>
          <TabsTrigger value="offline">Offline Support</TabsTrigger>
        </TabsList>
        
        <TabsContent value="api-client">
          <EnhancedApiClientExample />
        </TabsContent>
        
        <TabsContent value="realtime">
          <RealTimeSyncExample />
        </TabsContent>
        
        <TabsContent value="performance">
          <PerformanceMonitoringExample />
        </TabsContent>
        
        <TabsContent value="offline">
          <OfflineQueueExample />
        </TabsContent>
      </Tabs>
      
      <Separator className="my-6" />
      
      <div className="prose prose-sm max-w-none">
        <h2>Integration in Your Application</h2>
        <p>
          To use these enhanced API features in your application, add the EnhancedApiProvider
          to your app's entry point:
        </p>
        
        <pre className="bg-muted p-4 rounded-md overflow-auto">
{`// In your App.tsx or main component:
import { EnhancedApiProvider } from '@/providers/enhancedApiProvider';
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
}`}
        </pre>
        
        <h2>Using the Enhanced API Client</h2>
        <p>
          You can use the enhanced API client directly in your components or create enhanced hooks:
        </p>
        
        <pre className="bg-muted p-4 rounded-md overflow-auto">
{`// Direct usage:
import { consolidatedApiClient } from '@/services/api/consolidated-client';

async function fetchData() {
  const response = await consolidatedApiClient.get('/tasks');
  if (response.success) {
    return response.data;
  }
  throw new Error(response.message);
}

// In enhanced hooks:
function useTasksEnhanced() {
  return useQuery(['tasks'], async () => {
    const response = await enhancedApiClient.get('/tasks');
    if (!response.success) {
      throw new Error(response.message);
    }
    return response.data;
  });
}`}
        </pre>
      </div>
    </div>
  );
}

