/**
 * Scheduled Checks for Migration Monitoring
 * 
 * This module sets up scheduled jobs to periodically run alert checks
 * and monitor the health of the migration process.
 */

import alertService from './alert-service';

// Track the interval ID to allow cleanup
let checkIntervalId: NodeJS.Timeout | null = null;

// Default check interval in milliseconds (5 minutes)
const DEFAULT_CHECK_INTERVAL = 5 * 60 * 1000;

/**
 * Start the scheduled alert checks
 * @param interval Check interval in milliseconds
 */
export const startScheduledChecks = (interval = DEFAULT_CHECK_INTERVAL): void => {
  // Clear any existing interval
  if (checkIntervalId) {
    clearInterval(checkIntervalId);
  }
  
  // Log that checks are starting
  console.info(`Starting scheduled migration alert checks (interval: ${interval}ms)`);
  
  // Run an initial check immediately
  alertService.runAllChecks();
  
  // Set up the scheduled interval
  checkIntervalId = setInterval(() => {
    try {
      alertService.runAllChecks();
    } catch (error) {
      console.error('Error running scheduled alert checks:', error);
    }
  }, interval);
};

/**
 * Stop the scheduled alert checks
 */
export const stopScheduledChecks = (): void => {
  if (checkIntervalId) {
    clearInterval(checkIntervalId);
    checkIntervalId = null;
    console.info('Stopped scheduled migration alert checks');
  }
};

/**
 * Check if scheduled checks are running
 */
export const isCheckScheduleActive = (): boolean => {
  return checkIntervalId !== null;
};

// Export default functions
export default {
  startScheduledChecks,
  stopScheduledChecks,
  isCheckScheduleActive
};
