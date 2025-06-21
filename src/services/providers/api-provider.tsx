/**
 * API Provider
 * 
 * A provider component that integrates API features:
 * - Real-time synchronization via WebSockets
 * - Performance monitoring and analytics
 * - Rate limiting protection
 * - Offline request queueing
 * 
 * This component should be placed near the root of your application,
 * typically inside the QueryClientProvider.
 */

import { FloatingConnectionStatus } from '@/components/status/connection-status';
import { toast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { ReactNode, useEffect, useState } from 'react';
import { logger } from '../logging';
import { socketService } from '../realtime/socket-service';

// Import from new standardized locations
import { offlineQueueManager } from '@/services/offline';
import { rateLimiter } from '../api/rate-limiter-service';

interface ApiProviderProps {
  readonly children: ReactNode;
  readonly enableRealTimeSync?: boolean;
  readonly enableRateLimiting?: boolean;
  readonly enableOfflineSupport?: boolean;
  readonly enableDevTools?: boolean;
  readonly enableConnectionStatus?: boolean;
}

/**
 * API Provider component
 * 
 * Adds API features like real-time synchronization, performance monitoring,
 * rate limiting, and offline support to the application.
 */
function ApiProvider({
  children,
  enableRealTimeSync = true,
  enableRateLimiting = true,
  enableOfflineSupport = true,
  enableDevTools = (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development'),
  enableConnectionStatus = true
}: ApiProviderProps) {
  const queryClient = useQueryClient();
  const [isDevPanelOpen, setIsDevPanelOpen] = useState(false);

  // Toggle development panel
  const toggleDevPanel = () => {
    setIsDevPanelOpen(prev => !prev);
  };

  // Set up realtime synchronization
  useEffect(() => {
    if (!enableRealTimeSync) return;

    // Setup WebSocket connection and event handlers
    socketService.connect();

    // Event handlers will be implemented when socket service is fully integrated
    // TODO: Add WebSocket event handlers for real-time data synchronization

    // Register event handlers for different WebSocket events
    // Note: Event handling will be implemented when socket service is fully integrated
    
    // Cleanup on unmount
    return () => {
      socketService.disconnect();
    };
  }, [enableRealTimeSync, queryClient]);

  // Set up rate limiting
  useEffect(() => {
    if (!enableRateLimiting) return;

    // Setup and configure rate limiter
    rateLimiter.initialize({
      maxRequestsPerMinute: 60,
      maxRequestsPerHour: 1000,
      enableQueueing: true,
      queueTimeout: 30000,
    });

    return () => {
      rateLimiter.reset();
    };
  }, [enableRateLimiting]);

  // Set up offline support
  useEffect(() => {
    if (!enableOfflineSupport) return;

    // Process offline queue when we come back online
    const handleOnlineStatus = async () => {
      if (navigator.onLine) {
        // Wait a moment for stable connection
        setTimeout(async () => {
          try {
            await offlineQueueManager.processQueue();
          } catch (error) {
            logger.error('Failed to process offline queue', { error });
          }
        }, 1000);
      }
    };

    // Listen for online/offline events
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', () => {
      toast({
        title: 'You are offline',
        description: 'Your changes will be saved and synchronized when you reconnect',
        variant: 'warning',
      } as any);
    });

    // Initial check and queue processing
    if (navigator.onLine) {
      offlineQueueManager.processQueue().catch(error => {
        logger.error('Failed to process initial offline queue', { error });
      });
    }

    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', () => {});
    };
  }, [enableOfflineSupport]);

  // Set up keyboard shortcuts for dev tools
  useEffect(() => {
    if (!enableDevTools) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt+D to toggle dev panel
      if (e.altKey && e.key === 'd') {
        toggleDevPanel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enableDevTools]);

  return (
    <>
      {/* Main content */}
      {children}
      
      {/* Connection status indicator */}
      {enableConnectionStatus && <FloatingConnectionStatus />}
      
      {/* Development performance panel */}
      {enableDevTools && isDevPanelOpen && (
        <div className="fixed top-4 right-4 z-50 bg-white p-4 border rounded shadow">
          <button onClick={toggleDevPanel} className="mb-2 text-sm">Close</button>
          <div>API Performance Panel (Dev Mode)</div>
        </div>
      )}
    </>
  );
}

export default ApiProvider;
