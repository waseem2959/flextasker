/**
 * Alert Thresholds Configuration
 * 
 * This file defines the thresholds for triggering alerts in the migration monitoring system.
 * Adjust these values based on your production traffic patterns and requirements.
 */

export const alertThresholds = {
  // Error rate thresholds (percentage of total requests)
  errorRates: {
    critical: 5, // 5% or more errors triggers a critical alert
    warning: 2,  // 2% or more errors triggers a warning alert
    info: 0.5    // 0.5% or more errors triggers an info alert
  },
  
  // Response time thresholds (in milliseconds)
  responseTimes: {
    critical: 2000, // 2 seconds or more triggers a critical alert
    warning: 1000,  // 1 second or more triggers a warning alert
    info: 500       // 500ms or more triggers an info alert
  },
  
  // Adoption rate thresholds (percentage of requests using consolidated services)
  adoptionRates: {
    critical: 20,  // Below 20% adoption triggers a critical alert
    warning: 40,   // Below 40% adoption triggers a warning alert
    info: 60       // Below 60% adoption triggers an info alert
  },
  
  // Threshold for number of consecutive errors before triggering an alert
  consecutiveErrors: {
    critical: 5,  // 5 consecutive errors triggers a critical alert
    warning: 3,   // 3 consecutive errors triggers a warning alert
  },
  
  // Time window for calculating rates (in milliseconds)
  timeWindows: {
    short: 5 * 60 * 1000,    // 5 minutes
    medium: 30 * 60 * 1000,  // 30 minutes
    long: 24 * 60 * 60 * 1000 // 24 hours
  }
};

// Alert types and their respective priorities
export enum AlertType {
  CRITICAL = 'critical',
  WARNING = 'warning',
  INFO = 'info'
}

// Export default config
export default alertThresholds;
