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
 * Safe environment variable access for both Vite and Jest environments
 */
const getEnvVar = (key: string, defaultValue?: string) => {
  // Check for Vite environment variables
  if (typeof import.meta !== 'undefined' && import.meta.env?.[key]) {
    return import.meta.env[key] ?? defaultValue;
  }
  // Fallback to process.env for Jest/Node environments
  return process.env[key] ?? defaultValue;
};

/**
 * Environment-specific configuration
 */
export const environmentConfig: EnvironmentConfig = {
  apiUrl: getEnvVar('VITE_API_URL', 'http://localhost:3000/api/v1'),
  socketUrl: getEnvVar('VITE_SOCKET_URL', 'http://localhost:3000'),
  uploadUrl: getEnvVar('VITE_UPLOAD_URL', 'http://localhost:3000/uploads'),
  authEndpoint: getEnvVar('VITE_AUTH_ENDPOINT', '/api/v1/auth'),
  isDevelopment: getEnvVar('DEV') === 'true' || process.env.NODE_ENV === 'development',
  isProduction: getEnvVar('PROD') === 'true' || process.env.NODE_ENV === 'production',
  isTest: getEnvVar('MODE') === 'test' || process.env.NODE_ENV === 'test',
  version: getEnvVar('VITE_APP_VERSION', '1.0.0'),
  buildTime: getEnvVar('VITE_BUILD_TIME', new Date().toISOString()),
  features: {
    analytics: getEnvVar('VITE_ENABLE_ANALYTICS') === 'true',
    offline: getEnvVar('VITE_ENABLE_OFFLINE') === 'true' || true,
    notifications: getEnvVar('VITE_ENABLE_NOTIFICATIONS') === 'true' || true,
    pwa: getEnvVar('VITE_ENABLE_PWA') === 'true' || true,
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
