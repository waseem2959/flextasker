/**
 * Utils Test Suite
 * 
 * Comprehensive tests for utility functions to ensure reliability and correctness.
 */

import {
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
  getInitials,
} from '../utils';

describe('Utils', () => {
  // === CLASS NAME UTILITIES ===
  describe('cn (className utility)', () => {
    it('should combine class names correctly', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2');
    });

    it('should handle conditional classes', () => {
      expect(cn('base', { 'conditional': true, 'hidden': false })).toBe('base conditional');
    });

    it('should merge Tailwind classes correctly', () => {
      expect(cn('p-4', 'p-2')).toBe('p-2');
    });
  });

  // === DATE FORMATTING ===
  describe('formatDate', () => {
    const testDate = new Date('2023-12-25T10:30:00Z');

    it('should format date with default format', () => {
      const result = formatDate(testDate);
      expect(result).toMatch(/Dec 25, 2023/);
    });

    it('should format date with custom format', () => {
      const result = formatDate(testDate, 'yyyy-MM-dd');
      expect(result).toBe('2023-12-25');
    });

    it('should handle invalid dates', () => {
      expect(formatDate(new Date('invalid'))).toBe('Invalid Date');
    });

    it('should handle null/undefined', () => {
      expect(formatDate(null)).toBe('');
      expect(formatDate(undefined)).toBe('');
    });
  });

  // === CURRENCY FORMATTING ===
  describe('formatCurrency', () => {
    it('should format currency with default settings', () => {
      expect(formatCurrency(1234.56)).toBe('$1,234.56');
    });

    it('should format currency with custom currency', () => {
      expect(formatCurrency(1234.56, 'EUR')).toBe('€1,234.56');
    });

    it('should handle zero', () => {
      expect(formatCurrency(0)).toBe('$0.00');
    });

    it('should handle negative numbers', () => {
      expect(formatCurrency(-100)).toBe('-$100.00');
    });
  });

  // === NUMBER FORMATTING ===
  describe('formatNumber', () => {
    it('should format large numbers', () => {
      expect(formatNumber(1234567)).toBe('1,234,567');
    });

    it('should handle decimals', () => {
      expect(formatNumber(1234.56)).toBe('1,234.56');
    });
  });

  // === ID GENERATION ===
  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe('string');
      expect(id1.length).toBeGreaterThan(0);
    });

    it('should generate IDs with custom prefix', () => {
      const id = generateId('test');
      expect(id).toMatch(/^test-/);
    });
  });

  // === STRING UTILITIES ===
  describe('truncate', () => {
    it('should truncate long strings', () => {
      const longString = 'This is a very long string that should be truncated';
      expect(truncate(longString, 20)).toBe('This is a very long...');
    });

    it('should not truncate short strings', () => {
      const shortString = 'Short';
      expect(truncate(shortString, 20)).toBe('Short');
    });

    it('should handle custom suffix', () => {
      expect(truncate('Long string', 5, '---')).toBe('Long ---');
    });
  });

  describe('getInitials', () => {
    it('should get initials from full name', () => {
      expect(getInitials('John Doe')).toBe('JD');
    });

    it('should handle single name', () => {
      expect(getInitials('John')).toBe('J');
    });

    it('should handle empty string', () => {
      expect(getInitials('')).toBe('');
    });

    it('should handle multiple names', () => {
      expect(getInitials('John Michael Doe')).toBe('JD');
    });
  });

  // === OBJECT UTILITIES ===
  describe('deepClone', () => {
    it('should deep clone objects', () => {
      const original = { a: 1, b: { c: 2 } };
      const cloned = deepClone(original);
      
      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned.b).not.toBe(original.b);
    });

    it('should handle arrays', () => {
      const original = [1, [2, 3]];
      const cloned = deepClone(original);
      
      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
    });
  });

  describe('isEmpty', () => {
    it('should detect empty values', () => {
      expect(isEmpty(null)).toBe(true);
      expect(isEmpty(undefined)).toBe(true);
      expect(isEmpty('')).toBe(true);
      expect(isEmpty([])).toBe(true);
      expect(isEmpty({})).toBe(true);
    });

    it('should detect non-empty values', () => {
      expect(isEmpty('text')).toBe(false);
      expect(isEmpty([1])).toBe(false);
      expect(isEmpty({ a: 1 })).toBe(false);
      expect(isEmpty(0)).toBe(false);
    });
  });

  // === PERFORMANCE UTILITIES ===
  describe('debounce', () => {
    jest.useFakeTimers();

    it('should debounce function calls', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn();
      debouncedFn();
      debouncedFn();

      expect(mockFn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(100);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    afterEach(() => {
      jest.clearAllTimers();
    });
  });

  // === FILE UTILITIES ===
  describe('formatFileSize', () => {
    it('should format file sizes correctly', () => {
      expect(formatFileSize(1024)).toBe('1.0 KB');
      expect(formatFileSize(1048576)).toBe('1.0 MB');
      expect(formatFileSize(1073741824)).toBe('1.0 GB');
    });

    it('should handle bytes', () => {
      expect(formatFileSize(500)).toBe('500 B');
    });
  });

  describe('getFileExtension', () => {
    it('should extract file extensions', () => {
      expect(getFileExtension('document.pdf')).toBe('pdf');
      expect(getFileExtension('image.jpg')).toBe('jpg');
      expect(getFileExtension('file')).toBe('');
    });
  });

  // === ASYNC UTILITIES ===
  describe('sleep', () => {
    it('should delay execution', async () => {
      const start = Date.now();
      await sleep(100);
      const end = Date.now();
      expect(end - start).toBeGreaterThanOrEqual(90);
    });
  });

  // === STRING CASE CONVERSION ===
  describe('camelToKebab', () => {
    it('should convert camelCase to kebab-case', () => {
      expect(camelToKebab('camelCase')).toBe('camel-case');
      expect(camelToKebab('someVariableName')).toBe('some-variable-name');
    });
  });

  describe('kebabToCamel', () => {
    it('should convert kebab-case to camelCase', () => {
      expect(kebabToCamel('kebab-case')).toBe('kebabCase');
      expect(kebabToCamel('some-variable-name')).toBe('someVariableName');
    });
  });

  // === URL UTILITIES ===
  describe('toQueryString', () => {
    it('should convert object to query string', () => {
      const params = { name: 'John', age: '30', active: 'true' };
      expect(toQueryString(params)).toBe('name=John&age=30&active=true');
    });

    it('should handle empty object', () => {
      expect(toQueryString({})).toBe('');
    });
  });

  describe('parseQueryString', () => {
    it('should parse query string to object', () => {
      const result = parseQueryString('name=John&age=30&active=true');
      expect(result).toEqual({ name: 'John', age: '30', active: 'true' });
    });

    it('should handle empty string', () => {
      expect(parseQueryString('')).toEqual({});
    });
  });
});
