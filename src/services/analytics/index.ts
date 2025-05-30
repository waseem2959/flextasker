/**
 * Analytics Services Index
 * 
 * This file exports all analytics-related services in a structured way.
 * It provides a centralized entry point for accessing analytics functionality.
 */

// Export the performance monitoring service
export { 
  performanceMonitor,
  usePerformanceMonitoring
} from './performanceMonitor';

// Export types for convenience
export type { 
  RequestMetric,
  EndpointStats,
  PerformanceThresholds
} from './performanceMonitor';

// Default export for convenience
export default { performanceMonitor };
