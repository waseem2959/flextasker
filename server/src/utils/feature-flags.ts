/**
 * Feature Flags System
 * 
 * This module provides a mechanism for feature toggling, allowing for
 * controlled rollouts, A/B testing, and environment-specific feature activation.
 */

import { Request } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from './logger';
import { cacheService } from './cache/cache-service';
import { config } from './config';

// Initialize Prisma client
const prisma = new PrismaClient();

// Cache TTL for feature flags
const FEATURE_FLAGS_CACHE_TTL = 5 * 60; // 5 minutes

// Feature flag cache key
const FEATURE_FLAGS_CACHE_KEY = 'system:feature_flags';

/**
 * Initialize feature flags system
 */
export async function initializeFeatureFlags(): Promise<void> {
  logger.info('Initializing feature flags system');
  
  try {
    // Load all feature flags into cache
    const flags = await getAllFeatureFlags();
    logger.info(`Loaded ${flags.length} feature flags`);
    
    // Set up default flags if none exist
    if (flags.length === 0) {
      logger.info('No feature flags found, creating defaults');
      
      const defaultFlags = [
        {
          name: 'extended-user-profiles',
          description: 'Enable extended user profile information',
          type: FeatureFlagType.ENVIRONMENT,
          enabled: true,
          rules: {
            environments: ['development', 'staging']
          }
        },
        {
          name: 'require-email-verification',
          description: 'Require email verification for new user accounts',
          type: FeatureFlagType.ENVIRONMENT,
          enabled: config.NODE_ENV === 'production',
          rules: {
            environments: ['production']
          }
        },
        {
          name: 'bid-auto-approval',
          description: 'Auto-approve bids for trusted users',
          type: FeatureFlagType.PERCENTAGE,
          enabled: true,
          value: 25, // Enable for 25% of users
          rules: {}
        },
        {
          name: 'service-discovery',
          description: 'Enable service discovery and registry',
          type: FeatureFlagType.BOOLEAN,
          enabled: true,
          rules: {}
        }
      ];
      
      // Create default flags
      for (const flag of defaultFlags) {
        await setFeatureFlag(flag);
      }
      
      logger.info(`Created ${defaultFlags.length} default feature flags`);
    }
    
    return;
  } catch (error) {
    logger.error('Failed to initialize feature flags', { error });
    throw error;
  }
}

// Define feature flag types
export enum FeatureFlagType {
  BOOLEAN = 'BOOLEAN',    // Simple on/off toggle
  PERCENTAGE = 'PERCENTAGE', // Percentage-based rollout
  USER_LIST = 'USER_LIST',   // Specific users only
  ROLE_BASED = 'ROLE_BASED', // Based on user roles
  DATED = 'DATED',        // Active during a date range
  ENVIRONMENT = 'ENVIRONMENT' // Based on environment
}

// Feature flag interface
export interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  type: FeatureFlagType;
  enabled: boolean;
  value?: any;
  rules?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Get all feature flags from database or cache
 */
export async function getAllFeatureFlags(): Promise<FeatureFlag[]> {
  try {
    // Try to get flags from cache first
    const cachedFlags = await cacheService.get<FeatureFlag[]>(FEATURE_FLAGS_CACHE_KEY);
    
    if (cachedFlags) {
      return cachedFlags;
    }
    
    // If not in cache, get from database
    const flags = await prisma.featureFlag.findMany();
    
    // Cache the flags
    await cacheService.set(
      FEATURE_FLAGS_CACHE_KEY,
      flags,
      FEATURE_FLAGS_CACHE_TTL
    );
    
    return flags;
  } catch (error) {
    logger.error('Failed to get feature flags', { error });
    return [];
  }
}

/**
 * Check if a feature is enabled globally
 * 
 * @param featureName The name of the feature to check
 * @returns boolean indicating if the feature is enabled
 */
export async function isFeatureEnabled(featureName: string): Promise<boolean> {
  try {
    const flags = await getAllFeatureFlags();
    const feature = flags.find(f => f.name === featureName);
    
    if (!feature) {
      logger.warn(`Feature flag not found: ${featureName}`);
      return false;
    }
    
    // For simple boolean flags, just return enabled status
    if (feature.type === FeatureFlagType.BOOLEAN) {
      return feature.enabled;
    }
    
    // For environment-based flags
    if (feature.type === FeatureFlagType.ENVIRONMENT && feature.rules?.environments) {
      const environments = feature.rules.environments as string[];
      return feature.enabled && environments.includes(config.NODE_ENV);
    }
    
    // For dated flags, check if current date is within range
    if (feature.type === FeatureFlagType.DATED && feature.rules?.startDate && feature.rules?.endDate) {
      const now = new Date();
      const startDate = new Date(feature.rules.startDate);
      const endDate = new Date(feature.rules.endDate);
      
      return feature.enabled && now >= startDate && now <= endDate;
    }
    
    // Default to the enabled status for other types when used without context
    return feature.enabled;
  } catch (error) {
    logger.error('Error checking feature flag', { featureName, error });
    return false;
  }
}

/**
 * Check if a feature is enabled for a specific user
 * 
 * @param featureName The name of the feature to check
 * @param userId The ID of the user
 * @param userRole Optional user role
 * @returns boolean indicating if the feature is enabled for the user
 */
export async function isFeatureEnabledForUser(
  featureName: string,
  userId: string,
  userRole?: string
): Promise<boolean> {
  try {
    const flags = await getAllFeatureFlags();
    const feature = flags.find(f => f.name === featureName);
    
    if (!feature || !feature.enabled) {
      return false;
    }
    
    // For simple boolean flags, just return enabled status
    if (feature.type === FeatureFlagType.BOOLEAN) {
      return feature.enabled;
    }
    
    // For percentage-based rollout
    if (feature.type === FeatureFlagType.PERCENTAGE && feature.rules?.percentage) {
      const percentage = feature.rules.percentage as number;
      
      // Generate a deterministic value between 0-100 based on userId and feature name
      const hash = hashString(`${featureName}:${userId}`);
      const userValue = hash % 100;
      
      return userValue < percentage;
    }
    
    // For user list-based flags
    if (feature.type === FeatureFlagType.USER_LIST && feature.rules?.userIds) {
      const userIds = feature.rules.userIds as string[];
      return userIds.includes(userId);
    }
    
    // For role-based flags
    if (feature.type === FeatureFlagType.ROLE_BASED && feature.rules?.roles && userRole) {
      const roles = feature.rules.roles as string[];
      return roles.includes(userRole);
    }
    
    // Default to the enabled status for other types
    return feature.enabled;
  } catch (error) {
    logger.error('Error checking feature flag for user', { featureName, userId, error });
    return false;
  }
}

/**
 * Check if a feature is enabled for a request
 * 
 * @param featureName The name of the feature to check
 * @param req The Express request object
 * @returns boolean indicating if the feature is enabled for the request
 */
export async function isFeatureEnabledForRequest(
  featureName: string,
  req: Request
): Promise<boolean> {
  if (!req.user) {
    // For non-authenticated requests, check global feature flag
    return isFeatureEnabled(featureName);
  }
  
  // For authenticated requests, check user-specific flag
  return isFeatureEnabledForUser(
    featureName,
    req.user.id,
    req.user.role
  );
}

/**
 * Create or update a feature flag
 * 
 * @param flag The feature flag to create or update
 * @returns The created or updated feature flag
 */
export async function setFeatureFlag(flag: Omit<FeatureFlag, 'id' | 'createdAt' | 'updatedAt'>): Promise<FeatureFlag> {
  try {
    // Convert rules to string if it's an object
    const data: any = {
      ...flag,
      rules: flag.rules ? JSON.stringify(flag.rules) : null
    };
    
    // Check if flag exists
    const existingFlag = await prisma.featureFlag.findFirst({
      where: { name: flag.name }
    });
    
    let result;
    
    if (existingFlag) {
      // Update existing flag
      result = await prisma.featureFlag.update({
        where: { id: existingFlag.id },
        data
      });
    } else {
      // Create new flag
      result = await prisma.featureFlag.create({
        data
      });
    }
    
    // Invalidate cache
    await cacheService.delete(FEATURE_FLAGS_CACHE_KEY);
    
    // Convert rules back to object
    return {
      ...result,
      rules: result.rules ? JSON.parse(result.rules as string) : undefined
    };
  } catch (error) {
    logger.error('Failed to set feature flag', { flag, error });
    throw error;
  }
}

/**
 * Delete a feature flag
 * 
 * @param featureName The name of the feature flag to delete
 * @returns boolean indicating if the deletion was successful
 */
export async function deleteFeatureFlag(featureName: string): Promise<boolean> {
  try {
    // Find the flag
    const flag = await prisma.featureFlag.findFirst({
      where: { name: featureName }
    });
    
    if (!flag) {
      return false;
    }
    
    // Delete the flag
    await prisma.featureFlag.delete({
      where: { id: flag.id }
    });
    
    // Invalidate cache
    await cacheService.delete(FEATURE_FLAGS_CACHE_KEY);
    
    return true;
  } catch (error) {
    logger.error('Failed to delete feature flag', { featureName, error });
    return false;
  }
}

/**
 * Helper function to generate a deterministic hash from a string
 */
function hashString(str: string): number {
  let hash = 0;
  
  if (str.length === 0) {
    return hash;
  }
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return Math.abs(hash);
}

export default {
  isFeatureEnabled,
  isFeatureEnabledForUser,
  isFeatureEnabledForRequest,
  setFeatureFlag,
  deleteFeatureFlag,
  getAllFeatureFlags,
  initializeFeatureFlags,
  FeatureFlagType
};
