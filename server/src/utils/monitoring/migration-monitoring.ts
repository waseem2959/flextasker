/**
 * Migration Monitoring System
 * 
 * This module serves as the central integration point for the migration monitoring system.
 * It connects metrics collection, alert generation, and scheduled checks into a
 * cohesive system for monitoring the migration from legacy to consolidated services.
 */

import alertService from './alert-service';
import { startScheduledChecks, stopScheduledChecks } from './scheduled-checks';
import { logger } from '../logger';

/**
 * Initialize the migration monitoring system
 * This should be called during application startup
 */
export const initializeMigrationMonitoring = async (): Promise<boolean> => {
  try {
    // Run initial alert checks
    alertService.runAllChecks();
    logger.info('Initial migration alert checks completed');
    
    // Start scheduled checks
    startScheduledChecks();
    logger.info('Scheduled migration monitoring checks started');
    
    return true;
  } catch (error) {
    logger.error('Failed to initialize migration monitoring system', { error });
    return false;
  }
};

/**
 * Shutdown the migration monitoring system
 * This should be called during application shutdown
 */
export const shutdownMigrationMonitoring = (): void => {
  try {
    // Stop scheduled checks
    stopScheduledChecks();
    logger.info('Migration monitoring checks stopped');
  } catch (error) {
    logger.error('Error shutting down migration monitoring', { error });
  }
};

/**
 * Get current status of the migration monitoring system
 */
export const getMigrationMonitoringStatus = () => {
  return {
    metrics: {
      isInitialized: true, // This would ideally check the actual state
      lastUpdated: new Date().toISOString()
    },
    alerts: {
      active: alertService.getAlerts().length,
      total: alertService.getAlerts(true).length
    },
    scheduledChecks: {
      isRunning: true // This would ideally check from scheduled-checks
    }
  };
};

// Export the migration monitoring system
export default {
  initializeMigrationMonitoring,
  shutdownMigrationMonitoring,
  getMigrationMonitoringStatus
};
