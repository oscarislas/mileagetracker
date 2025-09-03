import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  formatTripDate, 
  formatTripDateRelative, 
  getTimeAgo, 
  isValidDateString, 
  getTodayDateString 
} from '../dateUtils';

describe('dateUtils', () => {
  beforeEach(() => {
    // Reset any mocks before each test
    vi.restoreAllMocks();
  });

  describe('formatTripDate', () => {
    it('should format valid date strings correctly', () => {
      expect(formatTripDate('2024-01-15')).toBe('Jan 15, 2024');
      expect(formatTripDate('2024-12-25')).toBe('Dec 25, 2024');
      expect(formatTripDate('2023-06-01')).toBe('Jun 1, 2023');
    });

    it('should handle invalid date strings gracefully', () => {
      expect(formatTripDate('invalid-date')).toBe('Invalid Date');
      expect(formatTripDate('')).toBe('Invalid Date');
      expect(formatTripDate('2024-13-45')).toBe('Invalid Date');
      expect(formatTripDate('24-01-15')).toBe('Invalid Date');
    });

    it('should handle edge cases', () => {
      expect(formatTripDate('2024-02-29')).toBe('Feb 29, 2024'); // Leap year
      expect(formatTripDate('2023-02-29')).toBe('Invalid Date'); // Not a leap year
    });
  });

  describe('formatTripDateRelative', () => {
    it('should return "Today" for today\'s date', () => {
      const today = new Date();
      const todayString = today.toISOString().split('T')[0];
      expect(formatTripDateRelative(todayString)).toBe('Today');
    });

    it('should return "Yesterday" for yesterday\'s date', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayString = yesterday.toISOString().split('T')[0];
      expect(formatTripDateRelative(yesterdayString)).toBe('Yesterday');
    });

    it('should return formatted date for other dates', () => {
      const oldDate = '2024-01-15';
      const result = formatTripDateRelative(oldDate);
      // Should not be Today or Yesterday
      expect(result).not.toBe('Today');
      expect(result).not.toBe('Yesterday');
      expect(result).toMatch(/\w+ \d+/); // Should match "Jan 15" pattern
    });

    it('should handle same year dates without year', () => {
      const currentYear = new Date().getFullYear();
      const sameYearDate = `${currentYear}-06-15`;
      const result = formatTripDateRelative(sameYearDate);
      
      if (result !== 'Today' && result !== 'Yesterday') {
        expect(result).not.toMatch(/\d{4}/); // Should not include year
      }
    });

    it('should include year for different year dates', () => {
      const differentYearDate = '2022-06-15';
      const result = formatTripDateRelative(differentYearDate);
      expect(result).toMatch(/2022/); // Should include year
    });

    it('should handle invalid dates gracefully', () => {
      expect(formatTripDateRelative('invalid')).toBe('Invalid Date');
    });
  });

  describe('getTimeAgo', () => {
    it('should return "today" for today\'s timestamp', () => {
      const today = new Date().toISOString();
      expect(getTimeAgo(today)).toBe('today');
    });

    it('should return "yesterday" for yesterday\'s timestamp', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(getTimeAgo(yesterday.toISOString())).toBe('yesterday');
    });

    it('should return days for recent dates', () => {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      expect(getTimeAgo(threeDaysAgo.toISOString())).toBe('3 days ago');
    });

    it('should return weeks for dates within a month', () => {
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      expect(getTimeAgo(twoWeeksAgo.toISOString())).toBe('2 weeks ago');
    });

    it('should return months for older dates', () => {
      const twoMonthsAgo = new Date();
      twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
      expect(getTimeAgo(twoMonthsAgo.toISOString())).toBe('2 months ago');
    });

    it('should handle invalid timestamps gracefully', () => {
      expect(getTimeAgo('invalid')).toBe('unknown time');
    });
  });

  describe('isValidDateString', () => {
    it('should validate correct YYYY-MM-DD format', () => {
      expect(isValidDateString('2024-01-15')).toBe(true);
      expect(isValidDateString('2024-12-31')).toBe(true);
      expect(isValidDateString('2023-02-28')).toBe(true);
      expect(isValidDateString('2024-02-29')).toBe(true); // Leap year
    });

    it('should reject invalid formats', () => {
      expect(isValidDateString('24-01-15')).toBe(false);
      expect(isValidDateString('2024/01/15')).toBe(false);
      expect(isValidDateString('15-01-2024')).toBe(false);
      expect(isValidDateString('2024-1-15')).toBe(false); // Single digit month
      expect(isValidDateString('2024-01-5')).toBe(false); // Single digit day
    });

    it('should reject invalid dates', () => {
      expect(isValidDateString('2024-13-15')).toBe(false); // Invalid month
      expect(isValidDateString('2024-01-32')).toBe(false); // Invalid day
      expect(isValidDateString('2023-02-29')).toBe(false); // Not a leap year
      expect(isValidDateString('2024-04-31')).toBe(false); // April has only 30 days
    });

    it('should reject non-string inputs gracefully', () => {
      expect(isValidDateString('')).toBe(false);
      expect(isValidDateString('not-a-date')).toBe(false);
    });
  });

  describe('getTodayDateString', () => {
    it('should return today\'s date in YYYY-MM-DD format', () => {
      const result = getTodayDateString();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(isValidDateString(result)).toBe(true);
    });

    it('should return consistent format', () => {
      const today = new Date();
      const expected = today.toISOString().split('T')[0];
      expect(getTodayDateString()).toBe(expected);
    });
  });

  describe('regression tests for date bug', () => {
    it('should never return "Invalid Date" for valid YYYY-MM-DD strings', () => {
      const validDates = [
        '2024-01-01',
        '2024-06-15', 
        '2024-12-31',
        '2023-02-28',
        '2024-02-29', // Leap year
        '2020-01-01',
        '2030-12-25'
      ];

      validDates.forEach(date => {
        expect(formatTripDate(date)).not.toBe('Invalid Date');
        expect(formatTripDateRelative(date)).not.toBe('Invalid Date');
      });
    });

    it('should handle timezone edge cases correctly', () => {
      // Test around timezone boundaries
      const dates = [
        '2024-01-01', // New Year
        '2024-07-04', // Summer date
        '2024-12-31'  // End of year
      ];

      dates.forEach(date => {
        const formatted = formatTripDate(date);
        const relative = formatTripDateRelative(date);
        
        expect(formatted).not.toBe('Invalid Date');
        expect(relative).not.toBe('Invalid Date');
        expect(formatted).toMatch(/\w+ \d+, \d{4}/); // Should match "Jan 1, 2024" pattern
      });
    });

    it('should be consistent regardless of system timezone', () => {
      // Mock different timezones to ensure consistency
      const originalGetTimezoneOffset = Date.prototype.getTimezoneOffset;
      
      try {
        // Test with different timezone offsets
        const timezones = [-480, -300, 0, 120, 480]; // Various UTC offsets
        
        timezones.forEach(offset => {
          Date.prototype.getTimezoneOffset = vi.fn(() => offset);
          
          const testDate = '2024-06-15';
          const result = formatTripDate(testDate);
          
          expect(result).toBe('Jun 15, 2024');
          expect(result).not.toBe('Invalid Date');
        });
      } finally {
        Date.prototype.getTimezoneOffset = originalGetTimezoneOffset;
      }
    });
  });
});