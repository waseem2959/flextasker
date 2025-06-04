/**
 * General Utility Functions
 * 
 * This file contains commonly used utility functions that can be reused
 * throughout the application.
 */

import { cva, type VariantProps } from "class-variance-authority";
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combine multiple class names with tailwind merge support
 * This allows for conditional classes and proper handling of tailwind classes
 * 
 * @example
 * cn('text-red-500', { 'bg-blue-500': isActive }, 'p-4')
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Badge variant styling with class-variance-authority
 */
export const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        success:
          "border-transparent bg-success text-success-foreground hover:bg-success/80",
        warning:
          "border-transparent bg-warning text-warning-foreground hover:bg-warning/80",
        accent:
          "border-transparent bg-accent text-accent-foreground hover:bg-accent/80",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

/**
 * Navigation menu trigger styling with class-variance-authority
 */
export const navigationMenuTriggerStyle = cva(
  "group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50",
);

/**
 * CONSOLIDATED DATE FORMATTING FUNCTION
 * This replaces multiple date formatting implementations across the codebase
 *
 * @example
 * formatDate(new Date(), 'MMM dd, yyyy') // => 'Jan 01, 2023'
 * formatDate(new Date(), 'relative') // => '2 hours ago'
 * formatDate(new Date(), 'header') // => 'Today'
 */
export function formatDate(
  date: Date | string,
  format: string = 'MMM dd, yyyy',
  includeTime: boolean = false
): string {
  if (!date) return '';

  const d = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(d.getTime())) {
    return 'Invalid date';
  }

  // Handle special format types
  if (format === 'relative') {
    return formatRelativeTime(d);
  }

  if (format === 'header') {
    return formatDateHeader(d);
  }

  if (format === 'time') {
    return formatTime(d);
  }

  if (format === 'simple') {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };

    if (includeTime) {
      options.hour = '2-digit';
      options.minute = '2-digit';
    }

    return d.toLocaleDateString('en-US', options);
  }

  // Custom format patterns
  const formats: Record<string, (d: Date) => string> = {
    'yyyy': (d) => d.getFullYear().toString(),
    'yy': (d) => d.getFullYear().toString().slice(2),
    'MMMM': (d) => d.toLocaleString('default', { month: 'long' }),
    'MMM': (d) => d.toLocaleString('default', { month: 'short' }),
    'MM': (d) => (d.getMonth() + 1).toString().padStart(2, '0'),
    'M': (d) => (d.getMonth() + 1).toString(),
    'dd': (d) => d.getDate().toString().padStart(2, '0'),
    'd': (d) => d.getDate().toString(),
    'EEEE': (d) => d.toLocaleString('default', { weekday: 'long' }),
    'EEE': (d) => d.toLocaleString('default', { weekday: 'short' }),
    'HH': (d) => d.getHours().toString().padStart(2, '0'),
    'H': (d) => d.getHours().toString(),
    'hh': (d) => (d.getHours() % 12 || 12).toString().padStart(2, '0'),
    'h': (d) => (d.getHours() % 12 || 12).toString(),
    'mm': (d) => d.getMinutes().toString().padStart(2, '0'),
    'm': (d) => d.getMinutes().toString(),
    'ss': (d) => d.getSeconds().toString().padStart(2, '0'),
    's': (d) => d.getSeconds().toString(),
    'a': (d) => d.getHours() < 12 ? 'am' : 'pm',
    'aa': (d) => d.getHours() < 12 ? 'AM' : 'PM',
  };

  let result = format;

  // Replace tokens with formatted values
  Object.entries(formats).forEach(([token, formatter]) => {
    result = result.replace(token, formatter(d));
  });

  return result;
}

/**
 * Format relative time (e.g., "2 hours ago", "in 3 days")
 */
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHr = Math.round(diffMin / 60);
  const diffDays = Math.round(diffHr / 24);

  if (Math.abs(diffSec) < 60) return 'just now';
  if (Math.abs(diffMin) < 60) return `${Math.abs(diffMin)} minute${Math.abs(diffMin) !== 1 ? 's' : ''} ${diffMin < 0 ? 'from now' : 'ago'}`;
  if (Math.abs(diffHr) < 24) return `${Math.abs(diffHr)} hour${Math.abs(diffHr) !== 1 ? 's' : ''} ${diffHr < 0 ? 'from now' : 'ago'}`;
  if (Math.abs(diffDays) < 7) return `${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''} ${diffDays < 0 ? 'from now' : 'ago'}`;

  return formatDate(date, 'MMM dd, yyyy');
}

/**
 * Format date header (Today, Yesterday, or formatted date)
 */
function formatDateHeader(date: Date): string {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  } else {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  }
}

/**
 * Format time only (e.g., "2:30 PM")
 */
function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).format(date);
}

/**
 * Format a number as currency
 * 
 * @example
 * formatCurrency(1234.56) // => '$1,234.56'
 */
export function formatCurrency(
  amount: number,
  currency: string = 'USD',
  locale: string = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Format a number with specified options
 * 
 * @example
 * formatNumber(1234.56, { maximumFractionDigits: 0 }) // => '1,235'
 */
export function formatNumber(
  value: number,
  options: Intl.NumberFormatOptions = {},
  locale: string = 'en-US'
): string {
  return new Intl.NumberFormat(locale, options).format(value);
}

/**
 * Generate a unique ID
 * 
 * @example
 * const id = generateId() // => 'id-1234567890'
 */
export function generateId(prefix: string = 'id'): string {
  return `${prefix}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Truncate a string to the specified length
 * 
 * @example
 * truncate('This is a long string', 10) // => 'This is a...'
 */
export function truncate(str: string, length: number, ending: string = '...'): string {
  if (str.length <= length) {
    return str;
  }
  return str.substring(0, length - ending.length) + ending;
}

/**
 * Alias for truncate function with different parameter name for compatibility
 * 
 * @example
 * truncateText('This is a long string', 10) // => 'This is a...'
 */
export function truncateText(text: string, maxLength: number): string {
  return truncate(text, maxLength);
}

/**
 * Deep clone an object
 * 
 * @example
 * const clone = deepClone({ nested: { prop: 1 } })
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  // Handle Date
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as any;
  }

  // Handle Array
  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item)) as any;
  }

  // Handle Object
  if (obj instanceof Object) {
    const copy: any = {};
    for (const attr in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, attr)) {
        copy[attr] = deepClone(obj[attr]);
      }
    }
    return copy;
  }

  throw new Error(`Unable to clone object of type ${typeof obj}`);
}

/**
 * Debounce a function call
 * 
 * @example
 * const debouncedFn = debounce(() => console.log('Debounced'), 300)
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number = 300
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function(...args: Parameters<T>): void {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle a function call
 * 
 * @example
 * const throttledFn = throttle(() => console.log('Throttled'), 300)
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number = 300
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;
  let lastFunc: ReturnType<typeof setTimeout> | null = null;
  let lastRan: number = 0;
  
  return function(...args: Parameters<T>): void {
    if (!inThrottle) {
      func(...args);
      lastRan = Date.now();
      inThrottle = true;
      
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    } else {
      if (lastFunc) clearTimeout(lastFunc);
      
      lastFunc = setTimeout(() => {
        if (Date.now() - lastRan >= limit) {
          func(...args);
          lastRan = Date.now();
        }
      }, limit - (Date.now() - lastRan));
    }
  };
}

/**
 * Create a memoized version of a function
 * 
 * @example
 * const memoizedFn = memoize((a, b) => a + b)
 */
export function memoize<T extends (...args: any[]) => any>(
  func: T,
  resolver?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();
  
  return function(...args: Parameters<T>): ReturnType<T> {
    const key = resolver ? resolver(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    
    const result = func(...args);
    cache.set(key, result);
    
    return result;
  } as T;
}

/**
 * Group an array of objects by a key
 * 
 * @example
 * const grouped = groupBy([{ id: 1, name: 'A' }, { id: 1, name: 'B' }], 'id')
 * // => { '1': [{ id: 1, name: 'A' }, { id: 1, name: 'B' }] }
 */
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce(
    (result, item) => {
      const groupKey = String(item[key]);
      
      if (!result[groupKey]) {
        result[groupKey] = [];
      }
      
      result[groupKey].push(item);
      
      return result;
    },
    {} as Record<string, T[]>
  );
}

/**
 * Check if a value is empty
 * 
 * @example
 * isEmpty('') // => true
 * isEmpty([]) // => true
 * isEmpty({}) // => true
 * isEmpty(null) // => true
 * isEmpty(undefined) // => true
 */
export function isEmpty(value: any): boolean {
  if (value === null || value === undefined) {
    return true;
  }
  
  if (typeof value === 'string' || Array.isArray(value)) {
    return value.length === 0;
  }
  
  if (typeof value === 'object') {
    return Object.keys(value).length === 0;
  }
  
  return false;
}

/**
 * Format a file size in bytes to a human-readable string
 * 
 * @example
 * formatFileSize(1024) // => '1.0 KB'
 */
export function formatFileSize(bytes: number, decimals: number = 1): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Get the extension from a filename
 * 
 * @example
 * getFileExtension('image.jpg') // => 'jpg'
 */
export function getFileExtension(filename: string): string {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
}

/**
 * Sleep for the specified number of milliseconds
 * 
 * @example
 * await sleep(1000) // Sleep for 1 second
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Safely access nested object properties
 * 
 * @example
 * const obj = { a: { b: { c: 1 } } }
 * getNestedValue(obj, 'a.b.c') // => 1
 * getNestedValue(obj, 'a.b.d', 'default') // => 'default'
 */
export function getNestedValue<T = any>(
  obj: any,
  path: string,
  defaultValue?: T
): T | undefined {
  if (!obj || !path) {
    return defaultValue;
  }
  
  return path.split('.')
    .reduce((result, key) => result?.[key], obj) ?? defaultValue;
}

/**
 * Convert camelCase to kebab-case
 * 
 * @example
 * camelToKebab('helloWorld') // => 'hello-world'
 */
export function camelToKebab(str: string): string {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

/**
 * Convert kebab-case to camelCase
 * 
 * @example
 * kebabToCamel('hello-world') // => 'helloWorld'
 */
export function kebabToCamel(str: string): string {
  return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Create a URL query string from an object
 * 
 * @example
 * toQueryString({ page: 1, limit: 10 }) // => 'page=1&limit=10'
 */
export function toQueryString(params: Record<string, any>): string {
  return Object.entries(params)
    .filter(([_, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');
}

/**
 * Parse a URL query string into an object
 * 
 * @example
 * parseQueryString('page=1&limit=10') // => { page: '1', limit: '10' }
 */
export function parseQueryString(queryString: string): Record<string, string> {
  if (!queryString?.includes('=')) {
    return {};
  }
  
  return queryString
    .replace(/^\?/, '')
    .split('&')
    .reduce((result, param) => {
      const [key, value] = param.split('=');
      result[decodeURIComponent(key)] = decodeURIComponent(value || '');
      return result;
    }, {} as Record<string, string>);
}

/**
 * Get initials from a name
 * 
 * @example
 * getInitials('John Doe') // => 'JD'
 * getInitials('John', 'Doe') // => 'JD'
 */
export function getInitials(name: string, lastName?: string): string {
  if (lastName) {
    return `${name.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }
  
  const nameParts = name.split(' ').filter(Boolean);
  if (nameParts.length === 1) {
    return nameParts[0].charAt(0).toUpperCase();
  }
  
  return `${nameParts[0].charAt(0)}${nameParts[nameParts.length - 1].charAt(0)}`.toUpperCase();
}

// Export types for component props
export type { VariantProps };

export default {
  cn,
  formatDate,
  formatCurrency,
  formatNumber,
  generateId,
  truncate,
  deepClone,
  debounce,
  throttle,
  memoize,
  groupBy,
  isEmpty,
  formatFileSize,
  getFileExtension,
  sleep,
  getNestedValue,
  camelToKebab,
  kebabToCamel,
  toQueryString,
  parseQueryString,
  badgeVariants,
  navigationMenuTriggerStyle,
  getInitials,
};
