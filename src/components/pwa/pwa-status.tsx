/**
 * PWA Status Component
 * 
 * Displays the current PWA status including online/offline state,
 * installation status, and available updates.
 */

import React, { useEffect, useState } from 'react';
import { 
  Wifi, 
  WifiOff, 
  Download, 
  RefreshCw, 
  Check, 
  AlertCircle,
  Smartphone,
  Cloud,
  CloudOff
} from 'lucide-react';
import { usePWA } from '../../services/pwa/pwa-manager';
import type { PWAStatus } from '../../services/pwa/pwa-manager';

interface PWAStatusProps {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  variant?: 'compact' | 'detailed' | 'minimal';
  showWhenOnline?: boolean;
}

const PWAStatusComponent: React.FC<PWAStatusProps> = ({
  position = 'bottom-right',
  variant = 'compact',
  showWhenOnline = false
}) => {
  const [status, setStatus] = useState<PWAStatus>({
    isInstallable: false,
    isInstalled: false,
    isOnline: navigator.onLine,
    serviceWorkerReady: false,
    hasUpdate: false,
    installPromptAvailable: false
  });
  const [offlineTasksCount, setOfflineTasksCount] = useState(0);
  const [isUpdating, setIsUpdating] = useState(false);
  const pwa = usePWA();

  useEffect(() => {
    // Update status
    const updateStatus = () => {
      setStatus(pwa.getStatus());
      setOfflineTasksCount(pwa.getOfflineTasksCount());
    };

    // Event listeners
    const handleConnectionChange = (event: CustomEvent) => {
      setStatus(prev => ({ ...prev, isOnline: event.detail.isOnline }));
    };

    const handleInstallAvailable = () => {
      setStatus(prev => ({ ...prev, installPromptAvailable: true, isInstallable: true }));
    };

    const handleInstalled = () => {
      setStatus(prev => ({ ...prev, isInstalled: true, installPromptAvailable: false }));
    };

    const handleUpdateAvailable = () => {
      setStatus(prev => ({ ...prev, hasUpdate: true }));
    };

    window.addEventListener('pwa:connection-change', handleConnectionChange as EventListener);
    window.addEventListener('pwa:install-available', handleInstallAvailable);
    window.addEventListener('pwa:installed', handleInstalled);
    window.addEventListener('pwa:update-available', handleUpdateAvailable);

    // Initial status
    updateStatus();

    // Update status periodically
    const interval = setInterval(updateStatus, 5000);

    return () => {
      window.removeEventListener('pwa:connection-change', handleConnectionChange as EventListener);
      window.removeEventListener('pwa:install-available', handleInstallAvailable);
      window.removeEventListener('pwa:installed', handleInstalled);
      window.removeEventListener('pwa:update-available', handleUpdateAvailable);
      clearInterval(interval);
    };
  }, []);

  const handleInstall = async () => {
    try {
      await pwa.install();
    } catch (error) {
      console.error('Installation failed:', error);
    }
  };

  const handleUpdate = async () => {
    try {
      setIsUpdating(true);
      await pwa.applyUpdate();
    } catch (error) {
      console.error('Update failed:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Don't show if online and showWhenOnline is false
  if (status.isOnline && !showWhenOnline && !status.hasUpdate && !status.installPromptAvailable) {
    return null;
  }

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4'
  };

  // Minimal variant - just an indicator dot
  if (variant === 'minimal') {
    return (
      <div className={`fixed ${positionClasses[position]} z-40`}>
        <div className="flex items-center space-x-1">
          {!status.isOnline && (
            <div className="bg-red-500 w-3 h-3 rounded-full animate-pulse" />
          )}
          {status.hasUpdate && (
            <div className="bg-blue-500 w-3 h-3 rounded-full animate-pulse" />
          )}
          {status.installPromptAvailable && (
            <div className="bg-green-500 w-3 h-3 rounded-full animate-pulse" />
          )}
        </div>
      </div>
    );
  }

  // Compact variant
  if (variant === 'compact') {
    return (
      <div className={`fixed ${positionClasses[position]} z-40`}>
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 max-w-xs">
          <div className="flex items-center space-x-3">
            {/* Connection Status */}
            <div className="flex items-center">
              {status.isOnline ? (
                <Wifi className="w-4 h-4 text-green-500" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-500" />
              )}
            </div>

            {/* Status Info */}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900">
                {!status.isOnline ? 'Offline' : 
                 status.hasUpdate ? 'Update Available' :
                 status.installPromptAvailable ? 'Install Available' : 'Online'}
              </div>
              {offlineTasksCount > 0 && (
                <div className="text-xs text-gray-500">
                  {offlineTasksCount} pending {offlineTasksCount === 1 ? 'task' : 'tasks'}
                </div>
              )}
            </div>

            {/* Action Button */}
            {status.hasUpdate && (
              <button
                onClick={handleUpdate}
                disabled={isUpdating}
                className="text-blue-600 hover:text-blue-700 p-1"
                title="Update available"
              >
                <RefreshCw className={`w-4 h-4 ${isUpdating ? 'animate-spin' : ''}`} />
              </button>
            )}
            
            {status.installPromptAvailable && (
              <button
                onClick={handleInstall}
                className="text-green-600 hover:text-green-700 p-1"
                title="Install app"
              >
                <Download className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Detailed variant
  return (
    <div className={`fixed ${positionClasses[position]} z-40`}>
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">App Status</h3>
          <div className="flex items-center space-x-1">
            {status.isOnline ? (
              <Cloud className="w-4 h-4 text-green-500" />
            ) : (
              <CloudOff className="w-4 h-4 text-red-500" />
            )}
          </div>
        </div>

        {/* Status Items */}
        <div className="space-y-2">
          {/* Connection */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {status.isOnline ? (
                <Wifi className="w-4 h-4 text-green-500 mr-2" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-500 mr-2" />
              )}
              <span className="text-sm text-gray-700">Connection</span>
            </div>
            <span className={`text-xs px-2 py-1 rounded-full ${
              status.isOnline 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {status.isOnline ? 'Online' : 'Offline'}
            </span>
          </div>

          {/* Installation */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Smartphone className="w-4 h-4 text-blue-500 mr-2" />
              <span className="text-sm text-gray-700">Installation</span>
            </div>
            <div className="flex items-center">
              {status.isInstalled ? (
                <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">
                  Installed
                </span>
              ) : status.installPromptAvailable ? (
                <button
                  onClick={handleInstall}
                  className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800 hover:bg-blue-200"
                >
                  Install
                </button>
              ) : (
                <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                  Browser
                </span>
              )}
            </div>
          </div>

          {/* Service Worker */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className={`w-4 h-4 mr-2 ${
                status.serviceWorkerReady ? 'text-green-500' : 'text-gray-400'
              }`}>
                {status.serviceWorkerReady ? <Check /> : <AlertCircle />}
              </div>
              <span className="text-sm text-gray-700">Service Worker</span>
            </div>
            <span className={`text-xs px-2 py-1 rounded-full ${
              status.serviceWorkerReady 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-600'
            }`}>
              {status.serviceWorkerReady ? 'Ready' : 'Loading'}
            </span>
          </div>

          {/* Updates */}
          {status.hasUpdate && (
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <RefreshCw className="w-4 h-4 text-blue-500 mr-2" />
                <span className="text-sm text-gray-700">Update</span>
              </div>
              <button
                onClick={handleUpdate}
                disabled={isUpdating}
                className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800 hover:bg-blue-200 disabled:opacity-50"
              >
                {isUpdating ? 'Updating...' : 'Apply'}
              </button>
            </div>
          )}

          {/* Offline Tasks */}
          {offlineTasksCount > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <AlertCircle className="w-4 h-4 text-orange-500 mr-2" />
                <span className="text-sm text-gray-700">Pending Tasks</span>
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-800">
                {offlineTasksCount}
              </span>
            </div>
          )}
        </div>

        {/* Tips */}
        {!status.isOnline && (
          <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
            <strong>Tip:</strong> Your actions will sync when you're back online.
          </div>
        )}
      </div>
    </div>
  );
};

export default PWAStatusComponent;