/**
 * Task Utilities
 * 
 * This file provides helper functions for working with task data,
 * especially handling complex types like location and status.
 * Budget-related functions have been moved to budget-utils.ts
 */

import { TaskStatus } from '../types';

/**
 * Location interface with flexible typing to handle different formats
 */
export interface TaskLocation {
  isRemote: boolean;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

/**
 * Type alias for location parameter that can be string, TaskLocation, undefined or null
 */
export type LocationParam = string | TaskLocation | undefined | null;

/**
 * Type guard to check if a value is a TaskLocation object
 */
export function isTaskLocationObject(location: LocationParam): location is TaskLocation {
  return typeof location === 'object' && location !== null && 'isRemote' in location;
}

/**
 * Get display text for a location regardless of format
 */
export function getLocationDisplayText(location: LocationParam): string {
  if (!location) return 'Location not specified';
  if (typeof location === 'string') return location;
  if (isTaskLocationObject(location)) {
    if (location.isRemote) return 'Remote';
    const addressParts = [
      location.address,
      location.city,
      location.state,
      location.country
    ].filter(Boolean);
    return addressParts.length > 0 ? addressParts.join(', ') : 'On Location';
  }
  return 'Location not specified';
}

// Budget-related functions have been moved to budget-utils.ts
// Re-export for backward compatibility
export { formatTaskBudget as formatBudget } from './budget-utils';

/**
 * Format task status for display
 */
export function formatTaskStatus(status: TaskStatus): string {
  return status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (l: string) => l.toUpperCase());
}

/**
 * Get status color for UI display
 */
export function getStatusColor(status: TaskStatus): string {
  switch (status) {
    case TaskStatus.OPEN:
      return 'blue';
    case TaskStatus.IN_PROGRESS:
      return 'yellow';
    case TaskStatus.COMPLETED:
      return 'green';
    case TaskStatus.CANCELLED:
      return 'red';
    default:
      return 'gray';
  }
}

/**
 * Get status icon for UI display
 */
export function getStatusIcon(status: TaskStatus): string {
  switch (status) {
    case TaskStatus.OPEN:
      return '📋';
    case TaskStatus.IN_PROGRESS:
      return '⏳';
    case TaskStatus.COMPLETED:
      return '✅';
    case TaskStatus.CANCELLED:
      return '❌';
    default:
      return '❓';
  }
}

/**
 * Get task status display text
 */
export function getTaskStatusDisplayText(status: TaskStatus): string {
  return formatTaskStatus(status);
}

/**
 * Check if task is completed
 */
export function isTaskCompleted(status: TaskStatus): boolean {
  return status === TaskStatus.COMPLETED;
}

/**
 * Check if task is in progress
 */
export function isTaskInProgress(status: TaskStatus): boolean {
  return status === TaskStatus.IN_PROGRESS;
}

/**
 * Check if task is open
 */
export function isTaskOpen(status: TaskStatus): boolean {
  return status === TaskStatus.OPEN;
}
