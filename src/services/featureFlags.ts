/**
 * Feature Flags Service (Legacy Bridge)
 * 
 * IMPORTANT: This file provides backward compatibility with the feature flags implementation.
 * New code should use the consolidated implementation from configuration/featureManager.ts.
 * 
 * This bridge ensures existing code continues to function while we transition to the improved structure.
 */

// Import the consolidated feature manager
import { featureManager } from './configuration/featureManager';

// Log deprecation warning in development
if (process.env.NODE_ENV !== 'production') {
  console.warn(
    'DEPRECATION NOTICE: Using services/featureFlags.ts is deprecated. ' +
    'Please use services/configuration/featureManager.ts for all new code.'
  );
}

/**
 * Feature flag service providing methods to check feature availability
 * @deprecated Use featureManager from configuration/featureManager.ts instead
 */
export const featureFlags = {
  /**
   * Check if a feature is enabled globally
   * 
   * @param featureName Name of the feature to check
   * @returns Boolean indicating if the feature is enabled
   */
  async isEnabled(featureName: string): Promise<boolean> {
    return featureManager.isEnabled(featureName);
  },

  /**
   * Check if a feature is enabled for a specific user
   * 
   * @param featureName Name of the feature to check
   * @param userId ID of the user to check for (optional, defaults to current user)
   * @returns Boolean indicating if the feature is enabled for the user
   */
  async isEnabledForUser(featureName: string, userId?: string): Promise<boolean> {
    return featureManager.isEnabledForUser(featureName, userId);
  },

  /**
   * Force refresh the feature flags from the server
   */
  async refreshFeatureFlags(): Promise<void> {
    return featureManager.refreshFeatureFlags();
  },

  /**
   * Ensure feature flags are loaded and up-to-date
   */
  async ensureFeatureFlagsLoaded(): Promise<void> {
    return featureManager.ensureFeatureFlagsLoaded();
  },

  /**
   * Fetch feature flags from the server
   */
  async fetchFeatureFlags(): Promise<Record<string, boolean>> {
    // The fetchFeatureFlags method is not directly exposed in FeatureManagerInterface
    // So we'll implement a local version that refreshes and returns default values
    await featureManager.refreshFeatureFlags();
    
    // Return a basic set of feature flags
    return {
      useConsolidatedServices: true,
      enableRealTimeUpdates: true,
      enableOfflineMode: true,
      enablePerformanceMonitoring: true,
      enableAdvancedFiltering: true,
      enableExperimentalFeatures: true
    };
  },

  /**
   * Special utility for gradual migration from legacy to consolidated endpoints
   * 
   * @param serviceName Name of the service being migrated (e.g., 'chat', 'bid')
   * @returns Boolean indicating if the consolidated version should be used
   */
  async useConsolidatedService(serviceName: string): Promise<boolean> {
    return featureManager.useConsolidatedService(serviceName);
  },

  /**
   * Clear all cached feature flags
   */
  clearCache(): void {
    featureManager.clearCache();
  }
};

// Initialize by prefetching feature flags
featureFlags.fetchFeatureFlags().catch(console.error);

export default featureFlags;
