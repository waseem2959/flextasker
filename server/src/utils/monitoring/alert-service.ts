/**
 * Alert Service
 * 
 * This service monitors metrics and generates alerts based on configured thresholds.
 * It provides real-time monitoring of the migration process and notifies administrators
 * of potential issues.
 */

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';

// Local in-memory metrics store
const inMemoryMetrics = {
  httpRequests: {} as Record<string, {
    count: number;
    sum: number;
    min: number;
    max: number;
    lastUpdated: number;
    statusCodes?: Record<string, number>;
  }>,
  wsEvents: {} as Record<string, {
    count: number;
    sum: number;
    min: number;
    max: number;
    lastUpdated: number;
  }>,
  errors: {} as Record<string, {
    count: number;
    sum: number;
    min: number;
    max: number;
    lastUpdated: number;
  }>
};

// Import alert thresholds with a default empty object if not found
let alertThresholds: any = {};
try {
  // Try to import the project's alert thresholds
  alertThresholds = require('../../config/alert-thresholds')?.default ?? {};
  if (Object.keys(alertThresholds).length === 0) {
    throw new Error('Alert thresholds file is empty');
  }
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  console.warn(`Alert thresholds not loaded (${errorMessage}), using default values`);
  // Set default thresholds if loading fails
  alertThresholds = {
    errorRates: { error: 0.1, warning: 0.05, info: 0.01 },
    responseTimes: { error: 1000, warning: 500, info: 200 },
    adoptionRates: { error: 10, warning: 25, info: 50 }
  };
}

// Import logger or create a basic logger if not available
interface Logger {
  info: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  error: (...args: any[]) => void;
  debug: (...args: any[]) => void;
}

let logger: Logger;
try {
  // Try to import the project's logger
  const loggerModule = require('../logger');
  if (!loggerModule) {
    throw new Error('Logger module not found');
  }
  logger = loggerModule.default ?? loggerModule;
  
  // Test if the logger is working
  logger.debug('Logger initialized successfully');
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  console.warn(`Failed to initialize logger (${errorMessage}), falling back to console`);
  // Fallback to console logging if logger module is not available
  logger = {
    info: (...args: any[]) => console.info('[INFO]', ...args),
    warn: (...args: any[]) => console.warn('[WARN]', ...args),
    error: (...args: any[]) => console.error('[ERROR]', ...args),
    debug: (...args: any[]) => console.debug('[DEBUG]', ...args)
  };
  
  // Log the fallback
  logger.warn('Using console as fallback logger');
}

// Alert data structure
export interface Alert {
  id: string;
  service: string;
  type: 'error' | 'warning' | 'info';
  message: string;
  timestamp: number;
  dismissed: boolean;
  details?: {
    count?: number;
    errorRate?: number;
    serviceAffected?: string;
    url?: string;
    responseTime?: number;
    adoptionRate?: number;
  };
}

// Event emitter for alert notifications
export const alertEvents = new EventEmitter();

// In-memory storage of active alerts
const activeAlerts: Alert[] = [];

/**
 * Generate a new alert
 * @param service Service that triggered the alert
 * @param type Alert severity level
 * @param message Alert message
 * @param details Additional alert details
 * @returns The generated alert
 */
export const generateAlert = (
  service: string,
  type: 'error' | 'warning' | 'info',
  message: string,
  details?: Alert['details']
): Alert => {
  const alert: Alert = {
    id: uuidv4(),
    service,
    type,
    message,
    timestamp: Date.now(),
    dismissed: false,
    details
  };

  // Add to active alerts
  activeAlerts.push(alert);
  
  // Emit alert event
  alertEvents.emit('new-alert', alert);
  
  // Log alert
  logger.warn(`Migration alert: ${message}`, { 
    alertId: alert.id, 
    service,
    alertType: type,
    details
  });

  return alert;
};

/**
 * Dismiss an alert by ID
 * @param alertId ID of the alert to dismiss
 * @returns Boolean indicating success
 */
export const dismissAlert = (alertId: string): boolean => {
  const alertIndex = activeAlerts.findIndex(alert => alert.id === alertId);
  
  if (alertIndex === -1) {
    return false;
  }
  
  activeAlerts[alertIndex].dismissed = true;
  return true;
};

/**
 * Get all active alerts
 * @param includeDismissed Whether to include dismissed alerts
 * @returns Array of alerts
 */
export const getAlerts = (includeDismissed = false): Alert[] => {
  if (includeDismissed) {
    return [...activeAlerts];
  }
  
  return activeAlerts.filter(alert => !alert.dismissed);
};

/**
 * Check error rates for a specific service and generate alerts if thresholds are exceeded
 * @param serviceName Service to check
 */
export const checkErrorRates = (serviceName: string): void => {
  // Get all HTTP metrics keys for this service
  const httpKeys = Object.keys(inMemoryMetrics.httpRequests)
    .filter(key => key.includes(serviceName));
    
  // Calculate total requests and errors
  let totalRequests = 0;
  let errorRequests = 0;
  
  httpKeys.forEach(key => {
    const metrics = inMemoryMetrics.httpRequests[key];
    totalRequests += metrics.count;
    
    // Check if this is an error key (status >= 400)
    if (key.includes(':4') || key.includes(':5')) {
      errorRequests += metrics.count;
    }
  });
  
  if (totalRequests === 0) {
    return; // No requests, no alerts
  }
  
  // Calculate error rate
  const errorRate = totalRequests > 0 ? errorRequests / totalRequests : 0;
  
  // Generate alerts based on thresholds
  if (errorRate >= (alertThresholds.errorRates.critical / 100)) {
    generateAlert(
      serviceName,
      'error',
      `Critical error rate detected in ${serviceName} service: ${(errorRate * 100).toFixed(2)}%`,
      { errorRate, serviceAffected: serviceName, count: errorRequests }
    );
  } else if (errorRate >= (alertThresholds.errorRates.warning / 100)) {
    generateAlert(
      serviceName,
      'warning',
      `High error rate detected in ${serviceName} service: ${(errorRate * 100).toFixed(2)}%`,
      { errorRate, serviceAffected: serviceName, count: errorRequests }
    );
  } else if (errorRate >= (alertThresholds.errorRates.info / 100)) {
    generateAlert(
      serviceName,
      'info',
      `Elevated error rate detected in ${serviceName} service: ${(errorRate * 100).toFixed(2)}%`,
      { errorRate, serviceAffected: serviceName, count: errorRequests }
    );
  }
};

/**
 * Check response times for a specific service and generate alerts if thresholds are exceeded
 * @param serviceName Service to check
 */
export const checkResponseTimes = (serviceName: string): void => {
  // Get all HTTP metrics keys for this service
  const httpKeys = Object.keys(inMemoryMetrics.httpRequests)
    .filter(key => key.includes(serviceName));
    
  // Check each metric
  httpKeys.forEach(key => {
    const metrics = inMemoryMetrics.httpRequests[key];
    
    // Use max response time as an approximation for p95
    const responseTime = metrics.max;
    
    // Check response time against thresholds
    if (responseTime >= alertThresholds.responseTimes.error) {
      generateAlert(
        serviceName,
        'error',
        `Critical response time detected in ${serviceName} service: ${responseTime.toFixed(2)}ms`,
        { responseTime, serviceAffected: serviceName, url: key.split(':')[1] }
      );
    } else if (responseTime >= alertThresholds.responseTimes.warning) {
      generateAlert(
        serviceName,
        'warning',
        `Slow response time detected in ${serviceName} service: ${responseTime.toFixed(2)}ms`,
        { responseTime, serviceAffected: serviceName, url: key.split(':')[1] }
      );
    } else if (responseTime >= alertThresholds.responseTimes.info) {
      generateAlert(
        serviceName,
        'info',
        `Elevated response time detected in ${serviceName} service: ${responseTime.toFixed(2)}ms`,
        { responseTime, serviceAffected: serviceName, url: key.split(':')[1] }
      );
    }
  });
};

/**
 * Check adoption rates for a specific service and generate alerts if below thresholds
 * @param serviceName Service to check
 */
export const checkAdoptionRates = (serviceName: string): void => {
  // Get all HTTP metrics keys for this service
  const legacyKeys = Object.keys(inMemoryMetrics.httpRequests)
    .filter(key => key.includes(serviceName) && key.includes(':legacy'));
    
  const consolidatedKeys = Object.keys(inMemoryMetrics.httpRequests)
    .filter(key => key.includes(serviceName) && key.includes(':consolidated'));
    
  // Calculate total requests for each type
  let legacyRequests = 0;
  let consolidatedRequests = 0;
  
  legacyKeys.forEach(key => {
    legacyRequests += inMemoryMetrics.httpRequests[key].count;
  });
  
  consolidatedKeys.forEach(key => {
    consolidatedRequests += inMemoryMetrics.httpRequests[key].count;
  });
  
  const totalRequests = legacyRequests + consolidatedRequests;
  
  if (totalRequests === 0) {
    return; // No requests, no alerts
  }
  
  // Calculate adoption rate
  const adoptionRate = totalRequests > 0 ? (consolidatedRequests / totalRequests) * 100 : 0;
  
  // Generate alerts based on thresholds
  if (adoptionRate <= alertThresholds.adoptionRates.critical) {
    generateAlert(
      serviceName,
      'error',
      `Critical low adoption rate for ${serviceName} service: ${adoptionRate.toFixed(2)}%`,
      { adoptionRate, serviceAffected: serviceName }
    );
  } else if (adoptionRate <= alertThresholds.adoptionRates.warning) {
    generateAlert(
      serviceName,
      'warning',
      `Low adoption rate for ${serviceName} service: ${adoptionRate.toFixed(2)}%`,
      { adoptionRate, serviceAffected: serviceName }
    );
  } else if (adoptionRate <= alertThresholds.adoptionRates.info) {
    generateAlert(
      serviceName,
      'info',
      `Moderate adoption rate for ${serviceName} service: ${adoptionRate.toFixed(2)}%`,
      { adoptionRate, serviceAffected: serviceName }
    );
  }
};

/**
 * Run all checks for a specific service
 * @param serviceName Service to check
 */
export const runServiceChecks = (serviceName: string): void => {
  checkErrorRates(serviceName);
  checkResponseTimes(serviceName);
  checkAdoptionRates(serviceName);
};

/**
 * Run all checks for all services
 */
export const runAllChecks = (): void => {
  // Get unique service names from metrics
  const serviceNames = new Set<string>();
  
  Object.keys(inMemoryMetrics.httpRequests).forEach(key => {
    const parts = key.split(':');
    if (parts.length >= 3) {
      const serviceName = parts[0];
      serviceNames.add(serviceName);
    }
  });
  
  // Run checks for each service
  serviceNames.forEach(serviceName => {
    runServiceChecks(serviceName);
  });
};

// Export the alert service
const alertService = {
  generateAlert,
  dismissAlert,
  getAlerts,
  checkErrorRates,
  checkResponseTimes,
  checkAdoptionRates,
  runServiceChecks,
  runAllChecks,
  alertEvents
};

export default alertService;
