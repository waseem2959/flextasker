/**
 * Reset Metrics Utility
 * 
 * This module provides functionality to reset all metrics
 * for both HTTP requests, WebSocket events, and errors.
 */

import { logger } from '../logger';
import { getPrometheusRegistry } from './prometheus-config';
import { inMemoryMetrics } from './metrics-service';

/**
 * Reset all metrics counters
 * This will clear all in-memory metrics and reset Prometheus counters if available
 */
export const resetAllMetrics = async (): Promise<boolean> => {
  try {
    // Reset in-memory metrics
    Object.keys(inMemoryMetrics.httpRequests).forEach(key => {
      const metric = inMemoryMetrics.httpRequests[key];
      metric.count = 0;
      metric.sum = 0;
      metric.min = 0;
      metric.max = 0;
      metric.lastUpdated = 0;
    });
    
    // Reset WebSocket events
    Object.keys(inMemoryMetrics.wsEvents).forEach(key => {
      const metric = inMemoryMetrics.wsEvents[key];
      metric.count = 0;
      metric.lastUpdated = 0;
    });
    
    // Reset errors
    Object.keys(inMemoryMetrics.errors).forEach(key => {
      inMemoryMetrics.errors[key] = { count: 0 };
    });
    
    // Reset Prometheus metrics if available
    try {
      const registry = getPrometheusRegistry();
      if (registry && typeof registry.resetMetrics === 'function') {
        // Call resetMetrics and ignore the return value
        registry.resetMetrics();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.warn('Failed to reset Prometheus metrics', { error: errorMessage });
      return false;
    }
    
    logger.info('All metrics have been reset');
    return true;
  } catch (error) {
    logger.error('Failed to reset metrics', { error });
    return false;
  }
};

/**
 * Reset metrics for a specific service
 * @param serviceName The name of the service to reset metrics for
 */
export const resetServiceMetrics = async (serviceName: string): Promise<boolean> => {
  try {
    // Reset in-memory metrics for the specified service
    Object.keys(inMemoryMetrics.httpRequests).forEach(key => {
      if (key.includes(serviceName)) {
        const metric = inMemoryMetrics.httpRequests[key];
        metric.count = 0;
        metric.sum = 0;
        metric.min = 0;
        metric.max = 0;
        metric.lastUpdated = 0;
      }
    });
    
    // Reset WebSocket events for the specified service
    Object.keys(inMemoryMetrics.wsEvents).forEach(key => {
      if (key.includes(serviceName)) {
        const metric = inMemoryMetrics.wsEvents[key];
        metric.count = 0;
        metric.lastUpdated = 0;
      }
    });
    
    // Reset errors for the specified service
    Object.keys(inMemoryMetrics.errors).forEach(key => {
      if (key.startsWith(serviceName)) {
        inMemoryMetrics.errors[key] = { count: 0 };
      }
    });
    
    // For Prometheus, we can't easily reset specific metrics
    // We would need to implement a more complex solution if needed
    
    logger.info(`Metrics for service "${serviceName}" have been reset`);
    return true;
  } catch (error) {
    logger.error(`Failed to reset metrics for service "${serviceName}"`, { error });
    return false;
  }
};
