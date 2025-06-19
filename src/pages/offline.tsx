/**
 * Offline Page
 * 
 * Displayed when the user is offline and tries to access a page that's not cached.
 * Provides helpful information and cached content access.
 */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { usePWA } from '../services/pwa/pwa-manager';

interface CachedContent {
  id: string;
  title: string;
  type: 'task' | 'page' | 'data';
  url: string;
  lastUpdated: string;
}

const OfflinePage: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [cachedContent, setCachedContent] = useState<CachedContent[]>([]);
  const [offlineTasksCount, setOfflineTasksCount] = useState(0);
  const pwa = usePWA();

  useEffect(() => {
    // Listen for online status changes
    const handleOnlineChange = () => {
      setIsOnline(navigator.onLine);
    };

    const handlePWAConnectionChange = (event: CustomEvent) => {
      setIsOnline(event.detail.isOnline);
    };

    window.addEventListener('online', handleOnlineChange);
    window.addEventListener('offline', handleOnlineChange);
    window.addEventListener('pwa:connection-change', handlePWAConnectionChange as EventListener);

    // Load cached content information
    loadCachedContent();
    
    // Get offline tasks count
    setOfflineTasksCount(pwa.getOfflineTasksCount());

    return () => {
      window.removeEventListener('online', handleOnlineChange);
      window.removeEventListener('offline', handleOnlineChange);
      window.removeEventListener('pwa:connection-change', handlePWAConnectionChange as EventListener);
    };
  }, []);

  const loadCachedContent = () => {
    // This would typically load from a cache manifest or service worker
    const mockCachedContent: CachedContent[] = [
      {
        id: '1',
        title: 'Dashboard',
        type: 'page',
        url: '/dashboard',
        lastUpdated: '2 hours ago'
      },
      {
        id: '2',
        title: 'My Tasks',
        type: 'page',
        url: '/tasks',
        lastUpdated: '1 hour ago'
      },
      {
        id: '3',
        title: 'Profile Settings',
        type: 'page',
        url: '/profile',
        lastUpdated: '3 hours ago'
      }
    ];

    setCachedContent(mockCachedContent);
  };

  const handleRetry = () => {
    if (navigator.onLine) {
      window.location.reload();
    } else {
      // Try to go to the home page
      window.location.href = '/';
    }
  };

  const clearOfflineTasks = () => {
    pwa.clearOfflineTasks();
    setOfflineTasksCount(0);
  };

  if (isOnline) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">🌐</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            You're Back Online!
          </h1>
          <p className="text-gray-600 mb-6">
            Your internet connection has been restored. You can now access all features.
          </p>
          <button
            onClick={handleRetry}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">📱</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            You're Offline
          </h1>
          <p className="text-gray-600 text-lg">
            No internet connection detected, but you can still access cached content.
          </p>
        </div>

        {/* Status Cards */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="text-2xl mr-3">📊</div>
              <div>
                <h3 className="font-semibold text-orange-800">Connection Status</h3>
                <p className="text-orange-600 text-sm">Offline Mode Active</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="text-2xl mr-3">📝</div>
              <div>
                <h3 className="font-semibold text-blue-800">Pending Tasks</h3>
                <p className="text-blue-600 text-sm">
                  {offlineTasksCount} {offlineTasksCount === 1 ? 'task' : 'tasks'} queued
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Cached Content */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Available Cached Content
          </h2>
          <div className="space-y-3">
            {cachedContent.map((content) => (
              <Link
                key={content.id}
                to={content.url}
                className="block bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg p-4 transition-colors duration-200"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="text-xl mr-3">
                      {content.type === 'task' ? '📋' : 
                       content.type === 'page' ? '📄' : '💾'}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{content.title}</h3>
                      <p className="text-sm text-gray-500">
                        Last updated: {content.lastUpdated}
                      </p>
                    </div>
                  </div>
                  <div className="text-gray-400">
                    →
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Offline Features */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            What You Can Do Offline
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-start">
              <div className="text-green-500 text-xl mr-3 mt-1">✓</div>
              <div>
                <h3 className="font-medium text-gray-900">Browse Cached Pages</h3>
                <p className="text-sm text-gray-600">
                  View previously loaded content and data
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="text-green-500 text-xl mr-3 mt-1">✓</div>
              <div>
                <h3 className="font-medium text-gray-900">Create Offline Tasks</h3>
                <p className="text-sm text-gray-600">
                  Actions will sync when you're back online
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="text-green-500 text-xl mr-3 mt-1">✓</div>
              <div>
                <h3 className="font-medium text-gray-900">Read Messages</h3>
                <p className="text-sm text-gray-600">
                  Access your cached conversations
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="text-green-500 text-xl mr-3 mt-1">✓</div>
              <div>
                <h3 className="font-medium text-gray-900">View Profile</h3>
                <p className="text-sm text-gray-600">
                  Check your cached profile information
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleRetry}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
          >
            Try Again
          </button>
          <Link
            to="/"
            className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors duration-200 font-medium text-center"
          >
            Go to Home
          </Link>
          {offlineTasksCount > 0 && (
            <button
              onClick={clearOfflineTasks}
              className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors duration-200 font-medium"
            >
              Clear Pending Tasks
            </button>
          )}
        </div>

        {/* Tips */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-800 mb-2">💡 Offline Tips</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Your actions will be saved and synced when you reconnect</li>
            <li>• Cached content may not reflect the latest changes</li>
            <li>• Check your network connection and try again</li>
            <li>• You can still use many features while offline</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default OfflinePage;