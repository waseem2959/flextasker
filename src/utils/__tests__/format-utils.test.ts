/**
 * Format Utilities Tests
 * 
 * Tests for various formatting utility functions imported from the main utils library
 */

import { formatCurrency, formatFileSize, truncate } from '../../lib/utils';

// Additional test-only utility for percentage formatting
export const formatPercent = (value: number, decimals: number = 1): string => {
  return `${(value * 100).toFixed(decimals)}%`;
};

describe('Format Utilities', () => {
  describe('formatCurrency', () => {
    it('should format USD currency correctly', () => {
      expect(formatCurrency(1234.56)).toBe('$1,234.56');
      expect(formatCurrency(0)).toBe('$0.00');
      expect(formatCurrency(1000000)).toBe('$1,000,000.00');
    });

    it('should handle different currencies', () => {
      expect(formatCurrency(1234.56, 'EUR')).toContain('1,234.56');
      expect(formatCurrency(1234.56, 'GBP')).toContain('1,234.56');
    });

    it('should handle negative amounts', () => {
      expect(formatCurrency(-100)).toBe('-$100.00');
    });

    it('should handle decimal amounts', () => {
      expect(formatCurrency(99.99)).toBe('$99.99');
      expect(formatCurrency(0.01)).toBe('$0.01');
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
      expect(formatFileSize(512)).toBe('512 Bytes');
      expect(formatFileSize(1023)).toBe('1023 Bytes');
    });

    it('should format KB correctly', () => {
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1536)).toBe('1.5 KB');
      expect(formatFileSize(1048575)).toBe('1024 KB');
    });

    it('should format MB correctly', () => {
      expect(formatFileSize(1048576)).toBe('1 MB');
      expect(formatFileSize(1572864)).toBe('1.5 MB');
      expect(formatFileSize(1073741823)).toBe('1024 MB');
    });

    it('should format GB correctly', () => {
      expect(formatFileSize(1073741824)).toBe('1 GB');
      expect(formatFileSize(2147483648)).toBe('2 GB');
    });

    it('should format TB correctly', () => {
      expect(formatFileSize(1099511627776)).toBe('1 TB');
    });
  });

  describe('formatPercent', () => {
    it('should format percentages with default decimals', () => {
      expect(formatPercent(0.5)).toBe('50.0%');
      expect(formatPercent(0.255)).toBe('25.5%');
      expect(formatPercent(1)).toBe('100.0%');
    });

    it('should format percentages with custom decimals', () => {
      expect(formatPercent(0.12345, 0)).toBe('12%');
      expect(formatPercent(0.12345, 2)).toBe('12.35%');
      expect(formatPercent(0.12345, 3)).toBe('12.345%');
    });

    it('should handle edge cases', () => {
      expect(formatPercent(0)).toBe('0.0%');
      expect(formatPercent(2.5)).toBe('250.0%');
      expect(formatPercent(-0.1)).toBe('-10.0%');
    });
  });

  describe('truncate', () => {
    it('should truncate long text', () => {
      const longText = 'This is a very long text that should be truncated';
      expect(truncate(longText, 20)).toBe('This is a very lo...');
    });

    it('should not truncate short text', () => {
      const shortText = 'Short text';
      expect(truncate(shortText, 20)).toBe('Short text');
    });

    it('should handle text equal to max length', () => {
      const text = 'Exactly twenty chars';
      expect(truncate(text, 20)).toBe('Exactly twenty chars');
    });

    it('should handle empty text', () => {
      expect(truncate('', 10)).toBe('');
    });

    it('should handle zero max length', () => {
      expect(truncate('Some text', 0)).toBe('...');
    });

    it('should handle custom ending', () => {
      const text = 'This has trailing spaces   ';
      expect(truncate(text, 10, '---')).toBe('This ha---');
    });
  });
});