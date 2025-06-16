/**
 * Utils Relative Time Tests
 * 
 * Tests for the refactored formatRelativeTime function to ensure
 * cognitive complexity reduction didn't break functionality
 */

import { formatDate } from '../utils';

describe('formatDate with relative time', () => {
  beforeEach(() => {
    // Mock Date.now to ensure consistent test results
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2023-01-01T12:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Immediate time', () => {
    it('should return "just now" for times within 60 seconds', () => {
      const now = new Date();
      const thirtySecondsAgo = new Date(now.getTime() - 30 * 1000);
      const thirtySecondsFromNow = new Date(now.getTime() + 30 * 1000);

      expect(formatDate(thirtySecondsAgo, 'relative')).toBe('just now');
      expect(formatDate(thirtySecondsFromNow, 'relative')).toBe('just now');
    });
  });

  describe('Minutes', () => {
    it('should format minutes correctly', () => {
      const now = new Date();
      const oneMinuteAgo = new Date(now.getTime() - 1 * 60 * 1000);
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
      const oneMinuteFromNow = new Date(now.getTime() + 1 * 60 * 1000);
      const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

      expect(formatDate(oneMinuteAgo, 'relative')).toBe('1 minute ago');
      expect(formatDate(fiveMinutesAgo, 'relative')).toBe('5 minutes ago');
      expect(formatDate(oneMinuteFromNow, 'relative')).toBe('1 minute from now');
      expect(formatDate(fiveMinutesFromNow, 'relative')).toBe('5 minutes from now');
    });
  });

  describe('Hours', () => {
    it('should format hours correctly', () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 1 * 60 * 60 * 1000);
      const fiveHoursAgo = new Date(now.getTime() - 5 * 60 * 60 * 1000);
      const oneHourFromNow = new Date(now.getTime() + 1 * 60 * 60 * 1000);
      const fiveHoursFromNow = new Date(now.getTime() + 5 * 60 * 60 * 1000);

      expect(formatDate(oneHourAgo, 'relative')).toBe('1 hour ago');
      expect(formatDate(fiveHoursAgo, 'relative')).toBe('5 hours ago');
      expect(formatDate(oneHourFromNow, 'relative')).toBe('1 hour from now');
      expect(formatDate(fiveHoursFromNow, 'relative')).toBe('5 hours from now');
    });
  });

  describe('Days', () => {
    it('should format days correctly', () => {
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
      const oneDayFromNow = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);
      const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

      expect(formatDate(oneDayAgo, 'relative')).toBe('1 day ago');
      expect(formatDate(threeDaysAgo, 'relative')).toBe('3 days ago');
      expect(formatDate(oneDayFromNow, 'relative')).toBe('1 day from now');
      expect(formatDate(threeDaysFromNow, 'relative')).toBe('3 days from now');
    });
  });

  describe('Long periods', () => {
    it('should fallback to formatted date for periods longer than a week', () => {
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      expect(formatDate(oneWeekAgo, 'relative')).toBe('Dec 25, 2022');
      expect(formatDate(oneMonthAgo, 'relative')).toBe('Dec 02, 2022');
    });
  });

  describe('Edge cases', () => {
    it('should handle exactly 60 seconds', () => {
      const now = new Date();
      const sixtySecondsAgo = new Date(now.getTime() - 60 * 1000);
      
      expect(formatDate(sixtySecondsAgo, 'relative')).toBe('1 minute ago');
    });

    it('should handle exactly 60 minutes', () => {
      const now = new Date();
      const sixtyMinutesAgo = new Date(now.getTime() - 60 * 60 * 1000);
      
      expect(formatDate(sixtyMinutesAgo, 'relative')).toBe('1 hour ago');
    });

    it('should handle exactly 24 hours', () => {
      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      expect(formatDate(twentyFourHoursAgo, 'relative')).toBe('1 day ago');
    });

    it('should handle exactly 7 days', () => {
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      expect(formatDate(sevenDaysAgo, 'relative')).toBe('Dec 25, 2022');
    });
  });

  describe('Pluralization', () => {
    it('should use singular form for 1 unit', () => {
      const now = new Date();
      const oneMinuteAgo = new Date(now.getTime() - 1 * 60 * 1000);
      const oneHourAgo = new Date(now.getTime() - 1 * 60 * 60 * 1000);
      const oneDayAgo = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);

      expect(formatDate(oneMinuteAgo, 'relative')).toBe('1 minute ago');
      expect(formatDate(oneHourAgo, 'relative')).toBe('1 hour ago');
      expect(formatDate(oneDayAgo, 'relative')).toBe('1 day ago');
    });

    it('should use plural form for multiple units', () => {
      const now = new Date();
      const twoMinutesAgo = new Date(now.getTime() - 2 * 60 * 1000);
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
      const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

      expect(formatDate(twoMinutesAgo, 'relative')).toBe('2 minutes ago');
      expect(formatDate(twoHoursAgo, 'relative')).toBe('2 hours ago');
      expect(formatDate(twoDaysAgo, 'relative')).toBe('2 days ago');
    });
  });
});
