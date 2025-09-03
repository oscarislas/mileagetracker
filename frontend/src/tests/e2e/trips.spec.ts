import { test, expect } from '@playwright/test';

test.describe('Trips Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display the main trips page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Mileage Tracker' })).toBeVisible();
    await expect(page.getByText('Track your business trips and maximize your tax deductions')).toBeVisible();
  });

  test('should show stats overview cards', async ({ page }) => {
    await expect(page.getByText('Total Trips')).toBeVisible();
    await expect(page.getByText('Deductions')).toBeVisible();
    await expect(page.getByText('Miles')).toBeVisible();
  });

  test('should add a new trip successfully', async ({ page }) => {
    // Fill out the quick add form
    await page.fill('input[placeholder="Client name"]', 'Test Client');
    await page.fill('input[placeholder="Miles"]', '25.5');
    await page.fill('textarea[placeholder="Trip purpose (optional)"]', 'Meeting with client');
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Wait for success feedback
    await expect(page.getByText('Trip added successfully!')).toBeVisible();
    
    // Check that form was cleared
    await expect(page.locator('input[placeholder="Client name"]')).toHaveValue('');
    await expect(page.locator('input[placeholder="Miles"]')).toHaveValue('');
  });

  test('should validate required fields', async ({ page }) => {
    // Try to submit without filling required fields
    await page.click('button[type="submit"]');
    
    // Should show validation errors
    await expect(page.getByText('Client name is required')).toBeVisible();
    await expect(page.getByText('Miles must be greater than 0')).toBeVisible();
  });

  test('should filter trips by search query', async ({ page }) => {
    // Wait for trips to load
    await page.waitForSelector('[data-testid="trips-list"]', { timeout: 10000 });
    
    // Search for a specific client
    await page.fill('input[placeholder="Search trips, clients..."]', 'Test Client');
    
    // Wait for search to be applied (debounced)
    await page.waitForTimeout(500);
    
    // Results should be filtered
    const tripItems = page.locator('[data-testid="trip-item"]');
    await expect(tripItems.first()).toContainText('Test Client');
  });

  test('should open and close filters panel', async ({ page }) => {
    // Open filters
    await page.click('button:has-text("Filters")');
    await expect(page.getByText('Filter Trips')).toBeVisible();
    await expect(page.getByText('Date Range')).toBeVisible();
    await expect(page.getByText('Client')).toBeVisible();
    
    // Close filters by clicking elsewhere
    await page.click('h1:has-text("Mileage Tracker")');
    await expect(page.getByText('Filter Trips')).not.toBeVisible();
  });

  test('should apply date range filter', async ({ page }) => {
    // Open filters
    await page.click('button:has-text("Filters")');
    
    // Select date range
    await page.selectOption('select[aria-label="Date Range"]', 'month');
    
    // Apply filters
    await page.click('button:has-text("Apply Filters")');
    
    // Should show filtered results
    await expect(page.getByText('Filtered Trips')).toBeVisible();
  });

  test('should clear all filters', async ({ page }) => {
    // Open filters and set some filters
    await page.click('button:has-text("Filters")');
    await page.selectOption('select[aria-label="Date Range"]', 'week');
    await page.click('button:has-text("Apply Filters")');
    
    // Open filters again and clear
    await page.click('button:has-text("Filters")');
    await page.click('button:has-text("Clear All")');
    
    // Filters should be reset
    await expect(page.locator('select[aria-label="Date Range"]')).toHaveValue('');
    await expect(page.getByText('Recent Trips')).toBeVisible();
  });

  test('should display empty state when no trips exist', async ({ page }) => {
    // This test assumes we can mock an empty state
    await page.route('**/api/v1/trips**', (route) => {
      route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          trips: [],
          total: 0,
          page: 1,
          limit: 10,
          total_pages: 0
        })
      });
    });
    
    await page.reload();
    
    await expect(page.getByText('No trips recorded yet')).toBeVisible();
    await expect(page.getByText('Start tracking your business mileage')).toBeVisible();
    await expect(page.getByText('💡 Tip:')).toBeVisible();
  });
});