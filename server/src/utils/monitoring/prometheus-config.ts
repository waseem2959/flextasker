/**
 * Prometheus Configuration
 * 
 * This module provides a shared Prometheus registry for metrics
 * and utility functions for working with Prometheus.
 */

import * as promClient from 'prom-client';
import { logger } from '../logger';

// Create a registry to store metrics
let registry: promClient.Registry | null = null;

/**
 * Initialize Prometheus registry
 */
export const initPrometheusRegistry = (): promClient.Registry => {
  try {
    // Create a new registry
    registry = new promClient.Registry();
    
    // Add default metrics (CPU, memory, etc.)
    promClient.collectDefaultMetrics({
      register: registry,
      prefix: 'flextasker_'
    });
    
    logger.info('Prometheus registry initialized');
    return registry;
  } catch (error) {
    logger.error('Failed to initialize Prometheus registry', { error });
    throw error;
  }
};

/**
 * Get the Prometheus registry
 * @returns The Prometheus registry, or null if not initialized
 */
export const getPrometheusRegistry = (): promClient.Registry | null => {
  return registry;
};

/**
 * Create and register a new counter
 * @param name Counter name
 * @param help Counter description
 * @param labelNames Label names for the counter
 * @returns The created counter
 */
export const createCounter = (
  name: string,
  help: string,
  labelNames: string[]
): promClient.Counter<string> => {
  if (!registry) {
    throw new Error('Prometheus registry not initialized');
  }
  
  const counter = new promClient.Counter({
    name,
    help,
    labelNames
  });
  
  registry.registerMetric(counter);
  return counter;
};

/**
 * Create and register a new histogram
 * @param name Histogram name
 * @param help Histogram description
 * @param labelNames Label names for the histogram
 * @param buckets Histogram buckets
 * @returns The created histogram
 */
export const createHistogram = (
  name: string,
  help: string,
  labelNames: string[],
  buckets: number[] = promClient.linearBuckets(0.1, 0.1, 10)
): promClient.Histogram<string> => {
  if (!registry) {
    throw new Error('Prometheus registry not initialized');
  }
  
  const histogram = new promClient.Histogram({
    name,
    help,
    labelNames,
    buckets
  });
  
  registry.registerMetric(histogram);
  return histogram;
};

/**
 * Create and register a new gauge
 * @param name Gauge name
 * @param help Gauge description
 * @param labelNames Label names for the gauge
 * @returns The created gauge
 */
export const createGauge = (
  name: string,
  help: string,
  labelNames: string[]
): promClient.Gauge<string> => {
  if (!registry) {
    throw new Error('Prometheus registry not initialized');
  }
  
  const gauge = new promClient.Gauge({
    name,
    help,
    labelNames
  });
  
  registry.registerMetric(gauge);
  return gauge;
};
