/**
 * Date and Time Utilities
 * 
 * A collection of helper functions for common date and time operations
 * throughout the application. These utilities help ensure consistent
 * date formatting and manipulation.
 */

/**
 * Format a date in a consistent way for display
 * 
 * @param date - Date to format
 * @param includeTime - Whether to include time in the output
 * @returns Formatted date string
 */
export function formatDate(date: Date | string, includeTime: boolean = false): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Options for date formatting
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };
  
  // Add time options if requested
  if (includeTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
  }
  
  return dateObj.toLocaleDateString('en-US', options);
}

/**
 * Calculate the time difference between now and a given date
 * 
 * @param date - Date to calculate difference from
 * @returns Human-readable time difference string
 */
export function timeAgo(date: Date | string): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  
  const diffMs = now.getTime() - dateObj.getTime();
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHr = Math.round(diffMin / 60);
  const diffDays = Math.round(diffHr / 24);
  const diffWeeks = Math.round(diffDays / 7);
  const diffMonths = Math.round(diffDays / 30);
  
  if (diffSec < 60) {
    return 'just now';
  } else if (diffMin < 60) {
    return `${diffMin} minute${diffMin === 1 ? '' : 's'} ago`;
  } else if (diffHr < 24) {
    return `${diffHr} hour${diffHr === 1 ? '' : 's'} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  } else if (diffWeeks < 4) {
    return `${diffWeeks} week${diffWeeks === 1 ? '' : 's'} ago`;
  } else {
    return `${diffMonths} month${diffMonths === 1 ? '' : 's'} ago`;
  }
}

/**
 * Check if a date is in the past
 * 
 * @param date - Date to check
 * @returns True if the date is in the past
 */
export function isPastDate(date: Date | string): boolean {
  if (!date) return false;
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  
  return dateObj.getTime() < now.getTime();
}

/**
 * Check if a date is in the future
 * 
 * @param date - Date to check
 * @returns True if the date is in the future
 */
export function isFutureDate(date: Date | string): boolean {
  if (!date) return false;
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  
  return dateObj.getTime() > now.getTime();
}

/**
 * Format a date as a relative time (e.g., "in 2 days" or "2 days ago")
 * 
 * @param date - Date to format
 * @returns Relative time string
 */
export function relativeTime(date: Date | string): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  
  if (isPastDate(dateObj)) {
    return timeAgo(dateObj);
  }
  
  const diffMs = dateObj.getTime() - now.getTime();
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHr = Math.round(diffMin / 60);
  const diffDays = Math.round(diffHr / 24);
  const diffWeeks = Math.round(diffDays / 7);
  const diffMonths = Math.round(diffDays / 30);
  
  if (diffSec < 60) {
    return 'in a few seconds';
  } else if (diffMin < 60) {
    return `in ${diffMin} minute${diffMin === 1 ? '' : 's'}`;
  } else if (diffHr < 24) {
    return `in ${diffHr} hour${diffHr === 1 ? '' : 's'}`;
  } else if (diffDays < 7) {
    return `in ${diffDays} day${diffDays === 1 ? '' : 's'}`;
  } else if (diffWeeks < 4) {
    return `in ${diffWeeks} week${diffWeeks === 1 ? '' : 's'}`;
  } else {
    return `in ${diffMonths} month${diffMonths === 1 ? '' : 's'}`;
  }
}

/**
 * Calculate the duration between two dates in days
 * 
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Number of days between the dates
 */
export function daysBetween(startDate: Date | string, endDate: Date | string): number {
  if (!startDate || !endDate) return 0;
  
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
  
  // Set to midnight to ignore time of day
  const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  
  // Calculate difference in days
  const millisPerDay = 1000 * 60 * 60 * 24;
  const diffMs = endDay.getTime() - startDay.getTime();
  
  return Math.round(diffMs / millisPerDay);
}
