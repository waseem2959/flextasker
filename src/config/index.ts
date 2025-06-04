/**
 * Application Configuration
 * 
 * Central configuration for the Flextasker application.
 * This file provides environment-specific settings and configuration values.
 */

import designSystem from './design-system';

/**
 * Environment configuration interface
 */
export interface EnvironmentConfig {
  apiUrl: string;
  socketUrl: string;
  uploadUrl: string;
  authEndpoint: string;
  isDevelopment: boolean;
  isProduction: boolean;
  isTest: boolean;
  version: string;
  buildTime: string;
  features: {
    analytics: boolean;
    offline: boolean;
    notifications: boolean;
    pwa: boolean;
  };
}

/**
 * Feature flags configuration
 */
export interface FeatureFlags {
  enableRealTimeChat: boolean;
  enableOfflineMode: boolean;
  enablePushNotifications: boolean;
  enableAnalytics: boolean;
  enableRateLimiting: boolean;
  enablePerformanceMonitoring: boolean;
  showExperimentalFeatures: boolean;
}

/**
 * Combined application configuration
 */
export interface AppConfig extends EnvironmentConfig {
  featureFlags: FeatureFlags;
}

/**
 * Environment-specific configuration
 */
export const environmentConfig: EnvironmentConfig = {
  apiUrl: import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1',
  socketUrl: import.meta.env.VITE_SOCKET_URL ?? 'http://localhost:3000',
  uploadUrl: import.meta.env.VITE_UPLOAD_URL ?? 'http://localhost:3000/uploads',
  authEndpoint: import.meta.env.VITE_AUTH_ENDPOINT ?? '/api/v1/auth',
  isDevelopment: import.meta.env.DEV === true,
  isProduction: import.meta.env.PROD === true,
  isTest: import.meta.env.MODE === 'test',
  version: import.meta.env.VITE_APP_VERSION ?? '1.0.0',
  buildTime: import.meta.env.VITE_BUILD_TIME ?? new Date().toISOString(),
  features: {
    analytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
    offline: import.meta.env.VITE_ENABLE_OFFLINE === 'true' || true,
    notifications: import.meta.env.VITE_ENABLE_NOTIFICATIONS === 'true' || true,
    pwa: import.meta.env.VITE_ENABLE_PWA === 'true' || true,
  }
};

/**
 * Feature flags configuration
 * These can be toggled at runtime for feature testing
 */
export const featureFlags: FeatureFlags = {
  enableRealTimeChat: true,
  enableOfflineMode: true,
  enablePushNotifications: environmentConfig.isProduction,
  enableAnalytics: environmentConfig.isProduction,
  enableRateLimiting: environmentConfig.isProduction,
  enablePerformanceMonitoring: true,
  showExperimentalFeatures: environmentConfig.isDevelopment,
};

/**
 * Complete application configuration
 */
export const config: AppConfig = {
  ...environmentConfig,
  featureFlags,
};

// Validate configuration at startup
if (!config.apiUrl || !config.socketUrl) {
  throw new Error('Missing required environment variables');
}

// Export design system
export { designSystem };

// Default export
export default config;
