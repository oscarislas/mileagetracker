import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  formatTripDate,
  formatTripDateRelative,
  getTimeAgo,
  isValidDateString,
  getTodayDateString,
} from "../dateUtils";

describe("dateUtils", () => {
  beforeEach(() => {
    // Reset any mocks before each test
    vi.restoreAllMocks();
  });

  describe("formatTripDate", () => {
    it("should format valid date strings correctly", () => {
      expect(formatTripDate("2024-01-15")).toBe("Jan 15, 2024");
      expect(formatTripDate("2024-12-25")).toBe("Dec 25, 2024");
      expect(formatTripDate("2023-06-01")).toBe("Jun 1, 2023");
    });

    it("should handle invalid date strings gracefully", () => {
      expect(formatTripDate("invalid-date")).toBe("Invalid Date");
      expect(formatTripDate("")).toBe("Invalid Date");
      expect(formatTripDate("2024-13-45")).toBe("Invalid Date");
      expect(formatTripDate("24-01-15")).toBe("Invalid Date");
    });

    it("should handle edge cases", () => {
      expect(formatTripDate("2024-02-29")).toBe("Feb 29, 2024"); // Leap year
      expect(formatTripDate("2023-02-29")).toBe("Invalid Date"); // Not a leap year
    });
  });

  describe("formatTripDateRelative", () => {
    it('should return "Today" for today\'s date', () => {
      const todayString = getTodayDateString(); // Use the local date function
      expect(formatTripDateRelative(todayString)).toBe("Today");
    });

    it('should handle various date strings that could cause "Today" bug', () => {
      // Test dates that should NOT be "Today"
      const nonTodayDates = [
        "2024-01-01",
        "2024-06-15",
        "2024-12-31",
        "2025-01-01",
        "2025-03-15",
      ];

      nonTodayDates.forEach((dateString) => {
        const result = formatTripDateRelative(dateString);

        // Unless today happens to be one of these exact dates,
        // the result should not be "Today"
        const todayString = getTodayDateString();
        if (dateString !== todayString) {
          expect(result).not.toBe("Today");
          expect(result).not.toBe("Invalid Date");
        }
      });
    });

    it('should return "Yesterday" for yesterday\'s date', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayYear = yesterday.getFullYear();
      const yesterdayMonth = String(yesterday.getMonth() + 1).padStart(2, "0");
      const yesterdayDay = String(yesterday.getDate()).padStart(2, "0");
      const yesterdayString = `${yesterdayYear}-${yesterdayMonth}-${yesterdayDay}`;
      expect(formatTripDateRelative(yesterdayString)).toBe("Yesterday");
    });

    it("should return formatted date for other dates", () => {
      const oldDate = "2024-01-15";
      const result = formatTripDateRelative(oldDate);
      // Should not be Today or Yesterday
      expect(result).not.toBe("Today");
      expect(result).not.toBe("Yesterday");
      expect(result).toMatch(/\w+ \d+/); // Should match "Jan 15" pattern
    });

    it("should handle same year dates without year", () => {
      const currentYear = new Date().getFullYear();
      const sameYearDate = `${currentYear}-06-15`;
      const result = formatTripDateRelative(sameYearDate);

      if (result !== "Today" && result !== "Yesterday") {
        expect(result).not.toMatch(/\d{4}/); // Should not include year
      }
    });

    it("should include year for different year dates", () => {
      const differentYearDate = "2022-06-15";
      const result = formatTripDateRelative(differentYearDate);
      expect(result).toMatch(/2022/); // Should include year
    });

    it("should handle invalid dates gracefully", () => {
      expect(formatTripDateRelative("invalid")).toBe("Invalid Date");
    });

    it("should properly compare dates ignoring time components", () => {
      // Test that time part of ISO dates doesn't affect date comparison
      const todayDateString = getTodayDateString(); // Use local date

      // Create ISO timestamps for same day with different times
      const morningIso = `${todayDateString}T08:00:00Z`;
      const eveningIso = `${todayDateString}T20:00:00Z`;

      // Both should resolve to "Today" regardless of time
      expect(formatTripDateRelative(morningIso)).toBe("Today");
      expect(formatTripDateRelative(eveningIso)).toBe("Today");

      // Also test that plain date string works
      expect(formatTripDateRelative(todayDateString)).toBe("Today");
    });
  });

  describe("getTimeAgo", () => {
    it('should return "today" for today\'s timestamp', () => {
      const today = new Date().toISOString();
      expect(getTimeAgo(today)).toBe("today");
    });

    it('should return "yesterday" for yesterday\'s timestamp', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(getTimeAgo(yesterday.toISOString())).toBe("yesterday");
    });

    it("should return days for recent dates", () => {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      expect(getTimeAgo(threeDaysAgo.toISOString())).toBe("3 days ago");
    });

    it("should return weeks for dates within a month", () => {
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      expect(getTimeAgo(twoWeeksAgo.toISOString())).toBe("2 weeks ago");
    });

    it("should return months for older dates", () => {
      const twoMonthsAgo = new Date();
      twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
      expect(getTimeAgo(twoMonthsAgo.toISOString())).toBe("2 months ago");
    });

    it("should handle invalid timestamps gracefully", () => {
      expect(getTimeAgo("invalid")).toBe("unknown time");
    });
  });

  describe("isValidDateString", () => {
    it("should validate correct YYYY-MM-DD format", () => {
      expect(isValidDateString("2024-01-15")).toBe(true);
      expect(isValidDateString("2024-12-31")).toBe(true);
      expect(isValidDateString("2023-02-28")).toBe(true);
      expect(isValidDateString("2024-02-29")).toBe(true); // Leap year
    });

    it("should reject invalid formats", () => {
      expect(isValidDateString("24-01-15")).toBe(false);
      expect(isValidDateString("2024/01/15")).toBe(false);
      expect(isValidDateString("15-01-2024")).toBe(false);
      expect(isValidDateString("2024-1-15")).toBe(false); // Single digit month
      expect(isValidDateString("2024-01-5")).toBe(false); // Single digit day
    });

    it("should reject invalid dates", () => {
      expect(isValidDateString("2024-13-15")).toBe(false); // Invalid month
      expect(isValidDateString("2024-01-32")).toBe(false); // Invalid day
      expect(isValidDateString("2023-02-29")).toBe(false); // Not a leap year
      expect(isValidDateString("2024-04-31")).toBe(false); // April has only 30 days
    });

    it("should reject non-string inputs gracefully", () => {
      expect(isValidDateString("")).toBe(false);
      expect(isValidDateString("not-a-date")).toBe(false);
    });
  });

  describe("getTodayDateString", () => {
    it("should return today's date in YYYY-MM-DD format", () => {
      const result = getTodayDateString();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(isValidDateString(result)).toBe(true);
    });

    it("should return local date, not UTC date", () => {
      const today = new Date();
      const expectedYear = today.getFullYear();
      const expectedMonth = String(today.getMonth() + 1).padStart(2, "0");
      const expectedDay = String(today.getDate()).padStart(2, "0");
      const expected = `${expectedYear}-${expectedMonth}-${expectedDay}`;

      expect(getTodayDateString()).toBe(expected);
    });

    it("should be consistent across multiple calls", () => {
      const first = getTodayDateString();
      const second = getTodayDateString();
      expect(first).toBe(second);
    });

    it("should handle different timezones correctly", () => {
      // This test ensures the function returns the local date regardless of timezone
      const result = getTodayDateString();
      const today = new Date();

      // Verify year, month, day match local time (not UTC)
      expect(result.split("-")[0]).toBe(String(today.getFullYear()));
      expect(result.split("-")[1]).toBe(
        String(today.getMonth() + 1).padStart(2, "0"),
      );
      expect(result.split("-")[2]).toBe(
        String(today.getDate()).padStart(2, "0"),
      );
    });

    it("should format single digit months and days with leading zeros", () => {
      // Mock a date with single digit month and day
      const mockDate = new Date(2024, 0, 5); // January 5, 2024 (month is 0-indexed)
      
      // Use vi.spyOn to mock Date constructor
      const dateSpy = vi.spyOn(global, 'Date').mockImplementation(() => mockDate);

      try {
        const result = getTodayDateString();
        expect(result).toBe("2024-01-05");
      } finally {
        dateSpy.mockRestore();
      }
    });

    it("should handle edge cases around timezone boundaries", () => {
      // Test that we get consistent results even when UTC and local dates might differ
      const result = getTodayDateString();
      const localDate = new Date();

      // The result should match the local date components exactly
      const parts = result.split("-");
      expect(parts).toHaveLength(3);
      expect(parseInt(parts[0])).toBe(localDate.getFullYear());
      expect(parseInt(parts[1])).toBe(localDate.getMonth() + 1);
      expect(parseInt(parts[2])).toBe(localDate.getDate());
    });

    it("should never return UTC date when local date differs", () => {
      // Create a scenario where UTC and local dates might differ
      const result = getTodayDateString();
      const utcDate = new Date().toISOString().split("T")[0];
      const localDate = new Date();
      const expectedLocalDate = `${localDate.getFullYear()}-${String(localDate.getMonth() + 1).padStart(2, "0")}-${String(localDate.getDate()).padStart(2, "0")}`;

      // Result should match local date calculation
      expect(result).toBe(expectedLocalDate);

      // If UTC and local dates differ, result should NOT match UTC
      if (utcDate !== expectedLocalDate) {
        expect(result).not.toBe(utcDate);
      }
    });
  });

  describe("regression tests for date bug", () => {
    it('should never return "Invalid Date" for valid YYYY-MM-DD strings', () => {
      const validDates = [
        "2024-01-01",
        "2024-06-15",
        "2024-12-31",
        "2023-02-28",
        "2024-02-29", // Leap year
        "2020-01-01",
        "2030-12-25",
      ];

      validDates.forEach((date) => {
        expect(formatTripDate(date)).not.toBe("Invalid Date");
        expect(formatTripDateRelative(date)).not.toBe("Invalid Date");
      });
    });

    it("should handle timezone edge cases correctly", () => {
      // Test around timezone boundaries
      const dates = [
        "2024-01-01", // New Year
        "2024-07-04", // Summer date
        "2024-12-31", // End of year
      ];

      dates.forEach((date) => {
        const formatted = formatTripDate(date);
        const relative = formatTripDateRelative(date);

        expect(formatted).not.toBe("Invalid Date");
        expect(relative).not.toBe("Invalid Date");
        expect(formatted).toMatch(/\w+ \d+, \d{4}/); // Should match "Jan 1, 2024" pattern
      });
    });

    it("should be consistent regardless of system timezone", () => {
      // Mock different timezones to ensure consistency
      const originalGetTimezoneOffset = Date.prototype.getTimezoneOffset;

      try {
        // Test with different timezone offsets
        const timezones = [-480, -300, 0, 120, 480]; // Various UTC offsets

        timezones.forEach((offset) => {
          Date.prototype.getTimezoneOffset = vi.fn(() => offset);

          const testDate = "2024-06-15";
          const result = formatTripDate(testDate);

          expect(result).toBe("Jun 15, 2024");
          expect(result).not.toBe("Invalid Date");
        });
      } finally {
        Date.prototype.getTimezoneOffset = originalGetTimezoneOffset;
      }
    });

    it("should handle ISO timestamp formats correctly", () => {
      const isoTimestamps = [
        "2024-06-15T10:00:00Z",
        "2024-06-15T10:00:00.000Z",
        "2024-06-15T23:59:59Z",
        "2024-06-15T00:00:00Z",
      ];

      isoTimestamps.forEach((timestamp) => {
        const formatted = formatTripDate(timestamp);
        const relative = formatTripDateRelative(timestamp);

        expect(formatted).toBe("Jun 15, 2024");
        expect(formatted).not.toBe("Invalid Date");
        expect(relative).not.toBe("Invalid Date");

        // Should not show as Today if it's not today
        if (!timestamp.startsWith(getTodayDateString())) {
          expect(relative).not.toBe("Today");
        }
      });
    });

    it('should specifically test for the reported bug: no dates should always show "Today"', () => {
      // Test a variety of dates that were definitely NOT today
      const differentDates = [
        "2024-01-15", // Past date from different year
        "2025-01-15", // Past date from current year
        "2023-12-25", // Christmas past year
        "2025-12-25", // Future date (Christmas this year)
      ];

      const results = differentDates.map((date) =>
        formatTripDateRelative(date),
      );

      // At most ONE of these should be "Today" (and only if today is Christmas 2025)
      const todayCount = results.filter((result) => result === "Today").length;
      expect(todayCount).toBeLessThanOrEqual(1);

      // Ensure we're getting proper formatting for non-today dates
      results.forEach((result) => {
        if (result !== "Today" && result !== "Yesterday") {
          expect(result).toMatch(/\w+ \d+/); // Should match "Jan 15" or "Jan 15, 2024" pattern
          expect(result).not.toBe("Invalid Date");
        }
      });
    });
  });
});
