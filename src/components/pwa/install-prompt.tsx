/**
 * PWA Install Prompt Component
 * 
 * Shows an installation prompt when the app is installable.
 * Provides information about PWA benefits and installation options.
 */

import React, { useEffect, useState } from 'react';
import { X, Download, Smartphone, Wifi, Bell } from 'lucide-react';
import { usePWA } from '../../services/pwa/pwa-manager';

interface InstallPromptProps {
  onDismiss?: () => void;
  showBenefits?: boolean;
  position?: 'bottom' | 'center' | 'top';
  variant?: 'compact' | 'detailed';
}

const InstallPrompt: React.FC<InstallPromptProps> = ({
  onDismiss,
  showBenefits = true,
  position = 'bottom',
  variant = 'detailed'
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [installResult, setInstallResult] = useState<'success' | 'dismissed' | null>(null);
  const pwa = usePWA();

  useEffect(() => {
    // Listen for install availability
    const handleInstallAvailable = () => {
      const status = pwa.getStatus();
      if (status.installPromptAvailable && !status.isInstalled) {
        setIsVisible(true);
      }
    };

    // Listen for successful installation
    const handleInstalled = () => {
      setInstallResult('success');
      setTimeout(() => {
        setIsVisible(false);
      }, 3000);
    };

    window.addEventListener('pwa:install-available', handleInstallAvailable);
    window.addEventListener('pwa:installed', handleInstalled);

    // Check initial state
    handleInstallAvailable();

    return () => {
      window.removeEventListener('pwa:install-available', handleInstallAvailable);
      window.removeEventListener('pwa:installed', handleInstalled);
    };
  }, []);

  const handleInstall = async () => {
    try {
      setIsInstalling(true);
      const success = await pwa.install();
      
      if (success) {
        setInstallResult('success');
      } else {
        setInstallResult('dismissed');
        setTimeout(() => {
          setIsVisible(false);
          onDismiss?.();
        }, 2000);
      }
    } catch (error) {
      console.error('Installation failed:', error);
      setInstallResult('dismissed');
    } finally {
      setIsInstalling(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  if (!isVisible) return null;

  // Success state
  if (installResult === 'success') {
    return (
      <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4`}>
        <div className="bg-white rounded-lg p-6 max-w-md w-full text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Installation Successful!
          </h3>
          <p className="text-gray-600 mb-4">
            Flextasker has been installed on your device. You can now access it from your home screen.
          </p>
          <button
            onClick={() => setIsVisible(false)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Great!
          </button>
        </div>
      </div>
    );
  }

  // Compact variant
  if (variant === 'compact') {
    return (
      <div className={`fixed ${position === 'top' ? 'top-4' : 'bottom-4'} left-4 right-4 z-50`}>
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 flex items-center justify-between">
          <div className="flex items-center">
            <Smartphone className="w-6 h-6 text-blue-600 mr-3" />
            <div>
              <p className="font-medium text-gray-900">Install Flextasker</p>
              <p className="text-sm text-gray-600">Get the app experience</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleInstall}
              disabled={isInstalling}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm"
            >
              {isInstalling ? 'Installing...' : 'Install'}
            </button>
            <button
              onClick={handleDismiss}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Detailed variant
  const positionClasses = {
    bottom: 'bottom-4 left-4 right-4',
    center: 'inset-0 flex items-center justify-center',
    top: 'top-4 left-4 right-4'
  };

  return (
    <div className={`fixed ${positionClasses[position]} z-50 p-4`}>
      {position === 'center' && (
        <div className="absolute inset-0 bg-black bg-opacity-50" onClick={handleDismiss} />
      )}
      
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 max-w-md mx-auto relative">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-blue-100 p-2 rounded-lg mr-3">
                <Smartphone className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Install Flextasker
                </h3>
                <p className="text-sm text-gray-600">
                  Get the full app experience
                </p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Benefits */}
        {showBenefits && (
          <div className="p-6 border-b border-gray-200">
            <h4 className="font-medium text-gray-900 mb-3">Why install the app?</h4>
            <div className="space-y-3">
              <div className="flex items-start">
                <Wifi className="w-5 h-5 text-green-500 mr-3 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900 text-sm">Works Offline</p>
                  <p className="text-xs text-gray-600">
                    Access your tasks and data even without internet
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <Bell className="w-5 h-5 text-blue-500 mr-3 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900 text-sm">Push Notifications</p>
                  <p className="text-xs text-gray-600">
                    Get notified about new tasks and messages
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <Download className="w-5 h-5 text-purple-500 mr-3 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900 text-sm">Home Screen Access</p>
                  <p className="text-xs text-gray-600">
                    Launch directly from your device's home screen
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <Smartphone className="w-5 h-5 text-orange-500 mr-3 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900 text-sm">Native App Feel</p>
                  <p className="text-xs text-gray-600">
                    Faster loading and better performance
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="p-6">
          <div className="flex space-x-3">
            <button
              onClick={handleInstall}
              disabled={isInstalling}
              className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium"
            >
              {isInstalling ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  Installing...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <Download className="w-4 h-4 mr-2" />
                  Install App
                </span>
              )}
            </button>
            
            <button
              onClick={handleDismiss}
              className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Maybe Later
            </button>
          </div>
          
          <p className="text-xs text-gray-500 text-center mt-3">
            The app will be installed on your device and won't take up much space.
          </p>
        </div>
      </div>
    </div>
  );
};

export default InstallPrompt;