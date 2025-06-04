/**
 * Date Service
 * 
 * This service provides standardized date and time utilities for the application.
 * It centralizes all date-related operations to ensure consistent formatting and manipulation.
 */

import {
    daysBetween,
    formatDate,
    isFutureDate,
    isPastDate,
    relativeTime,
    timeAgo
} from '@/lib/date-utils';

// Re-export all date utility functions
export {
    daysBetween, formatDate, isFutureDate, isPastDate, relativeTime, timeAgo
};

/**
 * Format a date as a short relative time (e.g., "2m ago" or "3d ago")
 * 
 * @param date - Date to format
 * @returns Short relative time string
 */
export function formatShortRelativeTime(date: Date | string): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  
  const diffMs = now.getTime() - dateObj.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  
  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
  
  return dateObj.toLocaleDateString();
}

/**
 * Format a date for display in a calendar or date picker
 * 
 * @param date - Date to format
 * @returns Formatted date string (YYYY-MM-DD)
 */
export function formatCalendarDate(date: Date | string): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Format a time for display
 * 
 * @param date - Date to extract time from
 * @param use24Hour - Whether to use 24-hour format
 * @returns Formatted time string
 */
export function formatTime(date: Date | string, use24Hour: boolean = false): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const options: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    hour12: !use24Hour
  };
  
  return new Intl.DateTimeFormat('en-US', options).format(dateObj);
}

/**
 * Format a date as a header (Today, Yesterday, or formatted date)
 * 
 * @param date - Date to format
 * @returns Formatted date header string
 */
export function formatDateHeader(date: Date | string): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (dateObj.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (dateObj.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  } else {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(dateObj);
  }
}

// Default export for convenience
export default {
  formatDate,
  timeAgo,
  isPastDate,
  isFutureDate,
  relativeTime,
  daysBetween,
  formatShortRelativeTime,
  formatCalendarDate,
  formatTime,
  formatDateHeader
};