/**
 * Cache Constants
 * 
 * This module defines constants for cache keys and other cache-related values.
 */

/**
 * Cache key prefixes to ensure unique keys across the application
 */
export enum CachePrefix {
  USER = 'user:',
  TASK = 'task:',
  BID = 'bid:',
  CATEGORY = 'category:',
  REVIEW = 'review:',
  NOTIFICATION = 'notification:',
  STATISTICS = 'stats:',
  
  // Collection prefixes
  USER_TASKS = 'user:tasks:',
  USER_BIDS = 'user:bids:',
  USER_REVIEWS = 'user:reviews:',
  USER_NOTIFICATIONS = 'user:notifications:',
  
  TASK_BIDS = 'task:bids:',
  TASK_REVIEWS = 'task:reviews:',
  TASK_ATTACHMENTS = 'task:attachments:',
  
  CATEGORY_TASKS = 'category:tasks:',
  
  // Search prefixes
  SEARCH_TASKS = 'search:tasks:',
  SEARCH_USERS = 'search:users:',
  
  // Feature flag cache
  FEATURE_FLAG = 'feature-flag:',
  
  // API response cache
  API_RESPONSE = 'api:',
  
  // Health check cache
  HEALTH_CHECK = 'health:'
}

/**
 * Default TTL values (in seconds) for different cache types
 */
export const DEFAULT_CACHE_TTL = {
  SHORT: 60,             // 1 minute
  MEDIUM: 60 * 5,        // 5 minutes
  LONG: 60 * 30,         // 30 minutes
  VERY_LONG: 60 * 60 * 2 // 2 hours
};

/**
 * Max items to store in a cache list
 */
export const MAX_CACHE_LIST_SIZE = 100;

/**
 * Default cache options
 */
export const DEFAULT_CACHE_OPTIONS = {
  ttl: DEFAULT_CACHE_TTL.MEDIUM,
  refreshOnAccess: false,
  refreshTtlOnAccess: false
};

export default {
  CachePrefix,
  DEFAULT_CACHE_TTL,
  MAX_CACHE_LIST_SIZE,
  DEFAULT_CACHE_OPTIONS
};
