/**
 * Enhanced API Provider
 * 
 * A simplified provider component that integrates basic API features:
 * - Offline request queueing
 * - Basic connectivity handling
 * 
 * This component should be placed near the root of your application,
 * typically inside the QueryClientProvider.
 */

import { toast } from '@/hooks/use-toast';
import { offlineQueueManager } from '@/services/offline';
import { ReactNode, useEffect, useState } from 'react';
import { logger } from '../logging';

interface EnhancedApiProviderProps {
  readonly children: ReactNode;
  readonly enableOfflineSupport?: boolean;
  readonly enableDevTools?: boolean;
}

/**
 * Enhanced API Provider component
 * 
 * Adds API features like offline support to the application.
 * This is a simplified version of the full ApiProvider with fewer features
 * for applications that don't need the full suite of API capabilities.
 */
function EnhancedApiProvider({
  children,
  enableOfflineSupport = true,
  enableDevTools = import.meta.env.DEV
}: EnhancedApiProviderProps) {

  const [isDevPanelOpen, setIsDevPanelOpen] = useState(false);

  // Toggle development panel
  const toggleDevPanel = () => {
    setIsDevPanelOpen(prev => !prev);
  };

  // Set up offline support
  useEffect(() => {
    if (!enableOfflineSupport) return;

    // Process offline queue when we come back online
    const handleOnlineStatus = async () => {
      if (navigator.onLine) {        // Wait a moment for stable connection
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
      } as any);    });

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
      
      {/* Development panel */}
      {enableDevTools && isDevPanelOpen && (
        <div className="fixed top-4 right-4 z-50 bg-white p-4 border rounded shadow">
          <button onClick={toggleDevPanel} className="mb-2 text-sm">Close</button>
          <div>Enhanced API Provider (Dev Mode)</div>
          <div className="text-xs text-gray-600">
            - Offline Support: {enableOfflineSupport ? 'Enabled' : 'Disabled'}
          </div>
        </div>
      )}
    </>
  );
}

export default EnhancedApiProvider;
