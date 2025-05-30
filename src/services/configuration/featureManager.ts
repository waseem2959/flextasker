/**
 * Feature Management Service
 * 
 * This comprehensive service handles feature flags, gradual rollouts, and configuration
 * for the application. It provides a consistent API for checking feature availability
 * and making decisions based on configuration.
 * 
 * Features:
 * - Global and user-specific feature flags
 * - Percentage-based rollouts
 * - Configuration overrides for different environments
 * - Cache management and refresh
 */

import axios from 'axios';
import { config } from '../../config';
import { getAuthHeader } from '../../utils/auth';

// API base URL
const API_URL = config.apiUrl || 'http://localhost:3000/api/v1';

// Interface for feature manager
export interface FeatureManagerInterface {
  isEnabled(featureName: string): Promise<boolean>;
  isEnabledForUser(featureName: string, userId?: string): Promise<boolean>;
  getConfig<T>(key: string, defaultValue?: T): Promise<T>;
  refreshFeatureFlags(): Promise<void>;
  ensureFeatureFlagsLoaded(): Promise<void>;
  ensureConfigLoaded(): Promise<void>;
  useConsolidatedService(serviceName: string): Promise<boolean>;
  useExperimentalFeature(featureName: string): Promise<boolean>;
  clearCache(): void;
}

// Feature manager implementation
const featureManager: FeatureManagerInterface = {
  /**
   * Check if a feature is enabled globally
   * 
   * @param featureName Name of the feature to check
   * @returns Boolean indicating if the feature is enabled
   */
  async isEnabled(featureName: string): Promise<boolean> {
    await this.ensureFeatureFlagsLoaded();
    const features = JSON.parse(sessionStorage.getItem('featureFlags') || '{}');
    return !!features[featureName];
  },

  /**
   * Check if a feature is enabled for a specific user
   * 
   * @param featureName Name of the feature to check
   * @param userId ID of the user to check for (optional, defaults to current user)
   * @returns Boolean indicating if the feature is enabled for the user
   */
  async isEnabledForUser(featureName: string, userId?: string): Promise<boolean> {
    await this.ensureFeatureFlagsLoaded();
    const features = JSON.parse(sessionStorage.getItem('featureFlags') || '{}');
    
    // Check if feature exists in feature flags
    if (!(featureName in features)) {
      return false;
    }
    
    // Global override - if feature is explicitly disabled globally
    if (features[featureName] === false) {
      return false;
    }
    
    // If no userId is provided, use the current user
    if (!userId) {
      const user = JSON.parse(localStorage.getItem('user') || 'null');
      userId = user?.id;
      
      // If still no user ID, treat as anonymous user
      if (!userId) {
        return false; // Anonymous users don't get user-specific features
      }
    }
    
    try {
      // Check user-specific overrides
      const response = await axios.get(`${API_URL}/features/${featureName}/users/${userId}`, {
        headers: getAuthHeader()
      });
      
      return response.data.enabled;
    } catch (error) {
      console.error(`Error checking feature ${featureName} for user ${userId}:`, error);
      return false; // Default to disabled on error
    }
  },

  /**
   * Get a configuration value by key
   * 
   * @param key Configuration key to retrieve
   * @param defaultValue Optional default value if key is not found
   * @returns Configuration value or default value
   */
  async getConfig<T>(key: string, defaultValue?: T): Promise<T> {
    await this.ensureConfigLoaded();
    const configData = JSON.parse(sessionStorage.getItem('appConfig') || '{}');
    return (key in configData) ? configData[key] : defaultValue as T;
  },

  /**
   * Force refresh the feature flags from the server
   */
  async refreshFeatureFlags(): Promise<void> {
    try {
      const features = await this.fetchFeatureFlags();
      sessionStorage.setItem('featureFlags', JSON.stringify(features));
    } catch (error) {
      console.error('Error refreshing feature flags:', error);
    }
  },

  /**
   * Ensure feature flags are loaded and up-to-date
   */
  async ensureFeatureFlagsLoaded(): Promise<void> {
    if (!sessionStorage.getItem('featureFlags')) {
      await this.refreshFeatureFlags();
    }
  },

  /**
   * Ensure configuration is loaded and up-to-date
   */
  async ensureConfigLoaded(): Promise<void> {
    if (!sessionStorage.getItem('appConfig')) {
      try {
        const config = await this.fetchConfig();
        sessionStorage.setItem('appConfig', JSON.stringify(config));
      } catch (error) {
        console.error('Error loading configuration:', error);
      }
    }
  },

  /**
   * Fetch feature flags from the server
   */
  async fetchFeatureFlags(): Promise<Record<string, boolean>> {
    try {
      const response = await axios.get(`${API_URL}/features`, {
        headers: getAuthHeader()
      });
      
      if (response.status === 200 && response.data.success) {
        return response.data.data.features;
      }
      
      throw new Error('Failed to fetch feature flags');
    } catch (error) {
      console.error('Error fetching feature flags:', error);
      
      // Fallback to defaults in development mode
      if (process.env.NODE_ENV === 'development') {
        return {
          useConsolidatedServices: true,
          enableRealTimeUpdates: true,
          enableOfflineMode: true,
          enablePerformanceMonitoring: true,
          enableAdvancedFiltering: true,
          enableExperimentalFeatures: true
        };
      }
      
      // Production defaults to minimal features
      return {
        useConsolidatedServices: false,
        enableRealTimeUpdates: true,
        enableOfflineMode: false,
        enablePerformanceMonitoring: false,
        enableAdvancedFiltering: false,
        enableExperimentalFeatures: false
      };
    }
  },

  /**
   * Fetch configuration from the server
   */
  async fetchConfig(): Promise<Record<string, any>> {
    try {
      const response = await axios.get(`${API_URL}/config`, {
        headers: getAuthHeader()
      });
      
      if (response.status === 200 && response.data.success) {
        return response.data.data.config;
      }
      
      throw new Error('Failed to fetch configuration');
    } catch (error) {
      console.error('Error fetching configuration:', error);
      
      // Fallback to defaults in development mode
      if (process.env.NODE_ENV === 'development') {
        return {
          apiRateLimit: 100,
          enableLogging: true,
          logLevel: 'debug',
          maxFileSize: 10485760, // 10MB
          refreshInterval: 300000, // 5 minutes
          userCacheTimeout: 600000 // 10 minutes
        };
      }
      
      // Production defaults
      return {
        apiRateLimit: 60,
        enableLogging: false,
        logLevel: 'error',
        maxFileSize: 5242880, // 5MB
        refreshInterval: 600000, // 10 minutes
        userCacheTimeout: 1800000 // 30 minutes
      };
    }
  },

  /**
   * Special utility for gradual migration from legacy to consolidated endpoints
   * 
   * @param serviceName Name of the service being migrated (e.g., 'chat', 'bid')
   * @returns Boolean indicating if the consolidated version should be used
   */
  async useConsolidatedService(serviceName: string): Promise<boolean> {
    return this.isEnabled(`use${serviceName.charAt(0).toUpperCase() + serviceName.slice(1)}ConsolidatedService`);
  },

  /**
   * Check if an experimental feature should be enabled
   * 
   * @param featureName Name of the experimental feature
   * @returns Boolean indicating if the feature should be enabled
   */
  async useExperimentalFeature(featureName: string): Promise<boolean> {
    const experimentalFeaturesEnabled = await this.isEnabled('enableExperimentalFeatures');
    if (!experimentalFeaturesEnabled) return false;
    
    return this.isEnabled(`experimental${featureName.charAt(0).toUpperCase() + featureName.slice(1)}`);
  },

  /**
   * Clear all cached feature flags and configuration
   */
  clearCache(): void {
    sessionStorage.removeItem('featureFlags');
    sessionStorage.removeItem('appConfig');
    
    // Reload features and config
    this.refreshFeatureFlags().catch(error => {
      console.error('Error refreshing feature flags after cache clear:', error);
    });
    
    this.ensureConfigLoaded().catch(error => {
      console.error('Error loading configuration after cache clear:', error);
    });
  }
};

// Initialize by prefetching feature flags
featureManager.fetchFeatureFlags().catch(console.error);

export { featureManager };
export default featureManager;
