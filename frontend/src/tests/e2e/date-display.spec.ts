import { expect, test } from '@playwright/test';

test.describe('Date Display Validation', () => {
  test.beforeEach(async ({ page }) => {
    // Mock trips with various date scenarios
    await page.route('**/api/v1/trips**', (route) => {
      route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          trips: [
            {
              id: 1,
              client_name: 'Test Client 1',
              trip_date: '2024-01-15',
              miles: 25.0,
              notes: 'Recent trip',
              created_at: '2024-01-15T10:00:00Z',
              updated_at: '2024-01-15T10:00:00Z'
            },
            {
              id: 2,
              client_name: 'Test Client 2',
              trip_date: '2023-12-01',
              miles: 50.5,
              notes: 'Older trip from different year',
              created_at: '2023-12-01T14:00:00Z',
              updated_at: '2023-12-01T14:00:00Z'
            },
            {
              id: 3,
              client_name: 'Test Client 3',
              trip_date: new Date().toISOString().split('T')[0], // Today
              miles: 15.0,
              notes: 'Today\'s trip',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ],
          total: 3,
          page: 1,
          limit: 10,
          total_pages: 1
        })
      });
    });

    await page.goto('/');
  });

  test('should validate today\'s date is correctly set in forms', async ({ page }) => {
    // Go to the add trip form
    await page.goto('/trips/simple');

    // Check that date input has today's date
    const dateInput = page.locator('input[id="trip_date"]');
    const inputValue = await dateInput.inputValue();

    // Should match YYYY-MM-DD format
    expect(inputValue).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    // Should be today's date
    const today = new Date().toISOString().split('T')[0];
    expect(inputValue).toBe(today);

    // Test quick add form on main page
    await page.goto('/');

    // Expand quick add form
    await page.click('button:has-text("Quick Add Trip")');

    // Go to details step
    await page.fill('input[placeholder="Start typing client name..."]', 'Test Client');
    await page.click('button:has-text("Next")');

    // Check date input in quick form
    const quickDateInput = page.locator('input[type="date"]');
    const quickInputValue = await quickDateInput.inputValue();

    expect(quickInputValue).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(quickInputValue).toBe(today);
  });

  test('should never show "Invalid Date" anywhere in the application', async ({ page }) => {
    // Test all major pages
    const pagesToTest = ['/', '/trips/simple', '/settings'];

    for (const pagePath of pagesToTest) {
      await page.goto(pagePath);

      // Wait for page to load
      await page.waitForLoadState('networkidle');

      // Check entire page content for "Invalid Date"
      const pageContent = await page.content();
      expect(pageContent).not.toContain('Invalid Date');

      // Also check visible text
      const invalidDateElements = page.getByText('Invalid Date');
      await expect(invalidDateElements).not.toBeVisible();
    }
  });

  test('should handle malformed date data gracefully', async ({ page }) => {
    // Mock API to return trips with potentially problematic dates
    await page.route('**/api/v1/trips**', (route) => {
      route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          trips: [
            {
              id: 1,
              client_name: 'Test Client 1',
              trip_date: '2024-13-32', // Invalid date
              miles: 25.0,
              notes: 'Test trip',
              created_at: '2024-01-15T10:00:00Z',
              updated_at: '2024-01-15T10:00:00Z'
            },
            {
              id: 2,
              client_name: 'Test Client 2',
              trip_date: 'invalid-date-string', // Completely invalid
              miles: 30.0,
              notes: 'Another test',
              created_at: '2024-01-16T10:00:00Z',
              updated_at: '2024-01-16T10:00:00Z'
            },
            {
              id: 3,
              client_name: 'Test Client 3',
              trip_date: '', // Empty date
              miles: 15.0,
              notes: 'Empty date test',
              created_at: '2024-01-17T10:00:00Z',
              updated_at: '2024-01-17T10:00:00Z'
            }
          ],
          total: 3,
          page: 1,
          limit: 10,
          total_pages: 1
        })
      });
    });

    await page.goto('/');
    await page.waitForSelector('[data-testid="trips-list"]', { timeout: 10000 });

    // Should show "Invalid Date" for malformed dates (this is expected behavior)
    const invalidDateElements = page.getByText('Invalid Date');
    await expect(invalidDateElements).toBeVisible();

    // But the app should not crash - should still show other trip data
    await expect(page.getByText('Test Client 1')).toBeVisible();
    await expect(page.getByText('Test Client 2')).toBeVisible();
    await expect(page.getByText('Test Client 3')).toBeVisible();

    // Miles should still be displayed correctly
    await expect(page.getByText('25 miles')).toBeVisible();
    await expect(page.getByText('30 miles')).toBeVisible();
    await expect(page.getByText('15 miles')).toBeVisible();
  });

  test('should never display "Invalid Date" for any trip', async ({ page }) => {
    // Wait for trips to load
    await page.waitForSelector('[data-testid="trip-item"]', { timeout: 10000 });

    // Check that no trip shows "Invalid Date"
    const invalidDateText = page.getByText('Invalid Date');
    await expect(invalidDateText).not.toBeVisible();

    // Ensure all trip dates are properly formatted
    const tripItems = page.locator('[data-testid="trip-item"]');
    const count = await tripItems.count();

    for (let i = 0; i < count; i++) {
      const tripItem = tripItems.nth(i);
      const text = await tripItem.textContent();

      // Should not contain "Invalid Date"
      expect(text).not.toContain('Invalid Date');

      // Should contain a properly formatted date (various formats are acceptable)
      expect(text).toMatch(/(\w+ \d+, \d{4}|Today|Yesterday|\w+ \d+)/);
    }
  });

  test('should display "Today" for today\'s trips', async ({ page }) => {
    // Wait for trips to load
    await page.waitForSelector('[data-testid="trip-item"]', { timeout: 10000 });

    // Should show "Today" for today's trip
    await expect(page.getByText('Today')).toBeVisible();
  });

  test('should handle date formatting consistently across components', async ({ page }) => {
    // Test on main page
    await page.waitForSelector('[data-testid="trip-item"]', { timeout: 10000 });

    // Get date text from main page
    const mainPageDateText = await page.locator('[data-testid="trip-item"]').first().textContent();
    expect(mainPageDateText).not.toContain('Invalid Date');

    // Navigate to simple trips page to test different component
    await page.goto('/trips/simple');

    // Wait for trips to load on simple page
    await page.waitForSelector('[data-testid="trip-item"]', { timeout: 10000 });

    // Check dates are formatted correctly here too
    const simplePageDateText = await page.locator('[data-testid="trip-item"]').first().textContent();
    expect(simplePageDateText).not.toContain('Invalid Date');
  });

  test('should handle edge case dates correctly', async ({ page }) => {
    // Mock trips with edge case dates
    await page.route('**/api/v1/trips**', (route) => {
      route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          trips: [
            {
              id: 1,
              client_name: 'Leap Year Client',
              trip_date: '2024-02-29', // Leap year date
              miles: 25.0,
              notes: 'Leap year trip',
              created_at: '2024-02-29T10:00:00Z',
              updated_at: '2024-02-29T10:00:00Z'
            },
            {
              id: 2,
              client_name: 'New Year Client',
              trip_date: '2024-01-01', // New Year
              miles: 50.5,
              notes: 'New Year trip',
              created_at: '2024-01-01T14:00:00Z',
              updated_at: '2024-01-01T14:00:00Z'
            },
            {
              id: 3,
              client_name: 'Year End Client',
              trip_date: '2023-12-31', // Year end
              miles: 15.0,
              notes: 'Year end trip',
              created_at: '2023-12-31T23:00:00Z',
              updated_at: '2023-12-31T23:00:00Z'
            }
          ],
          total: 3,
          page: 1,
          limit: 10,
          total_pages: 1
        })
      });
    });

    await page.reload();
    await page.waitForSelector('[data-testid="trip-item"]', { timeout: 10000 });

    // Check that all edge case dates are handled properly
    await expect(page.getByText('Invalid Date')).not.toBeVisible();

    // Verify specific edge cases are formatted correctly
    await expect(page.getByText(/Feb 29, 2024|Feb 29/)).toBeVisible(); // Leap year
    await expect(page.getByText(/Jan 1, 2024|Jan 1/)).toBeVisible(); // New Year
    await expect(page.getByText(/Dec 31, 2023/)).toBeVisible(); // Different year
  });

  test('should maintain consistent date formatting during interactions', async ({ page }) => {
    // Wait for trips to load
    await page.waitForSelector('[data-testid="trip-item"]', { timeout: 10000 });

    // Get initial date text
    const initialDateText = await page.locator('[data-testid="trip-item"]').first().textContent();
    expect(initialDateText).not.toContain('Invalid Date');

    // Interact with filters
    await page.click('button:has-text("Filters")');
    await page.selectOption('#date-range-select', 'month');
    await page.click('button:has-text("Apply Filters")');

    // Check dates are still formatted correctly after filtering
    await page.waitForSelector('[data-testid="trip-item"]', { timeout: 10000 });
    const filteredDateText = await page.locator('[data-testid="trip-item"]').first().textContent();
    expect(filteredDateText).not.toContain('Invalid Date');

    // Clear filters
    await page.click('button:has-text("Filters")');
    await page.click('button:has-text("Clear All")');

    // Check dates are still correct after clearing filters
    await page.waitForSelector('[data-testid="trip-item"]', { timeout: 10000 });
    const clearedDateText = await page.locator('[data-testid="trip-item"]').first().textContent();
    expect(clearedDateText).not.toContain('Invalid Date');
  });

  test('should handle timezone changes gracefully', async ({ page }) => {
    // Test different timezone scenarios by mocking different system times
    const timezoneTests = [
      { name: 'UTC', offset: 0 },
      { name: 'EST', offset: 300 },
      { name: 'PST', offset: 480 },
      { name: 'JST', offset: -540 }
    ];

    for (const tz of timezoneTests) {
      // Mock timezone
      await page.addInitScript((offset) => {
        // Store original timezone offset method for potential restoration
        Date.prototype.getTimezoneOffset = function () { return offset; };
      }, tz.offset);

      await page.reload();
      await page.waitForSelector('[data-testid="trip-item"]', { timeout: 10000 });

      // Verify no invalid dates regardless of timezone
      await expect(page.getByText('Invalid Date')).not.toBeVisible();

      // Verify dates still follow expected patterns
      const tripItems = page.locator('[data-testid="trip-item"]');
      const count = await tripItems.count();

      for (let i = 0; i < count; i++) {
        const text = await tripItems.nth(i).textContent();
        expect(text).toMatch(/(\w+ \d+, \d{4}|Today|Yesterday|\w+ \d+)/);
      }
    }
  });
});
