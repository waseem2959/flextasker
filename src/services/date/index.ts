/**
 * Date Service Exports
 *
 * This file provides centralized exports for all date-related services.
 * Now consolidated into the main utils.ts file.
 */

// Re-export the consolidated date formatting function from utils
export { formatDate } from '@/lib/utils';

// For backward compatibility, provide the same interface
export const dateService = {
  formatDate: (date: Date | string, format?: string, includeTime?: boolean) => {
    const { formatDate } = require('@/lib/utils');
    return formatDate(date, format, includeTime);
  },
  timeAgo: (date: Date | string) => {
    const { formatDate } = require('@/lib/utils');
    return formatDate(date, 'relative');
  },
  formatDateHeader: (date: Date | string) => {
    const { formatDate } = require('@/lib/utils');
    return formatDate(date, 'header');
  },
  formatTime: (date: Date | string) => {
    const { formatDate } = require('@/lib/utils');
    return formatDate(date, 'time');
  }
};

export default dateService;
