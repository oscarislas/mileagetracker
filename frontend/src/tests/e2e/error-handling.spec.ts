import { test, expect } from '@playwright/test';

test.describe('Error Handling', () => {
  test('should handle network failures gracefully', async ({ page }) => {
    // Mock network failure
    await page.route('**/api/v1/trips**', (route) => {
      route.abort('failed');
    });

    await page.goto('/');
    
    // Should show connection error state
    await expect(page.getByText('Unable to connect to server')).toBeVisible();
    await expect(page.getByText('Check your connection and try again')).toBeVisible();
    
    // Should show retry button
    const retryButton = page.getByRole('button', { name: /retry/i });
    await expect(retryButton).toBeVisible();
  });

  test('should handle API server errors', async ({ page }) => {
    // Mock 500 server error
    await page.route('**/api/v1/trips**', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      });
    });

    await page.goto('/');
    
    // Should show error state
    await expect(page.locator('.text-ctp-red')).toContainText('error');
  });

  test('should handle malformed API responses', async ({ page }) => {
    // Mock malformed response
    await page.route('**/api/v1/trips**', (route) => {
      route.fulfill({
        contentType: 'application/json',
        body: 'invalid json{{'
      });
    });

    await page.goto('/');
    
    // Should handle gracefully without crashing
    await expect(page.locator('body')).toBeVisible();
  });

  test('should show loading states during slow requests', async ({ page }) => {
    // Mock slow response
    await page.route('**/api/v1/trips**', (route) => {
      setTimeout(() => {
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
      }, 2000);
    });

    await page.goto('/');
    
    // Should show loading skeleton
    await expect(page.locator('.animate-pulse')).toBeVisible();
    await expect(page.locator('.bg-ctp-surface1')).toBeVisible();
  });

  test('should handle form submission failures', async ({ page }) => {
    await page.goto('/trips/simple');
    
    // Mock form submission failure
    await page.route('**/api/v1/trips', (route) => {
      if (route.request().method() === 'POST') {
        route.fulfill({
          status: 422,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Validation failed' })
        });
      } else {
        route.continue();
      }
    });

    // Fill and submit form
    await page.fill('input[id="client_name"]', 'Test Client');
    await page.fill('input[id="miles"]', '10');
    await page.click('button[type="submit"]');
    
    // Should show error and not clear form
    await expect(page.locator('.text-ctp-red')).toContainText('Validation failed');
    await expect(page.locator('input[id="client_name"]')).toHaveValue('Test Client');
  });

  test('should handle settings update failures', async ({ page }) => {
    await page.goto('/settings');
    
    // Wait for form to load
    await page.waitForSelector('input[id="mileageRate"]', { timeout: 10000 });
    
    // Mock settings update failure
    await page.route('**/api/v1/settings', (route) => {
      if (route.request().method() === 'PUT') {
        route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Invalid rate value' })
        });
      } else {
        route.continue();
      }
    });

    // Try to update settings
    await page.fill('input[id="mileageRate"]', '0.80');
    await page.click('button[type="submit"]');
    
    // Should show error message
    await expect(page.locator('.text-ctp-red')).toContainText('Invalid rate value');
  });

  test('should handle timeout scenarios', async ({ page }) => {
    // Mock timeout by never resolving
    await page.route('**/api/v1/trips**', (route) => {
      // Don't resolve the route, simulating a timeout
    });

    await page.goto('/');
    
    // Should show loading state initially
    await expect(page.locator('.animate-pulse')).toBeVisible();
    
    // After reasonable time, should show some error state or keep loading
    await page.waitForTimeout(5000);
    
    // App should still be responsive
    await expect(page.locator('body')).toBeVisible();
  });

  test('should handle browser offline state', async ({ page, context }) => {
    await page.goto('/');
    
    // Wait for initial load
    await page.waitForSelector('h1:has-text("Mileage Tracker")', { timeout: 10000 });
    
    // Simulate going offline
    await context.setOffline(true);
    
    // Try to add a trip (should fail)
    await page.goto('/trips/simple');
    await page.fill('input[id="client_name"]', 'Test Client');
    await page.fill('input[id="miles"]', '10');
    await page.click('button[type="submit"]');
    
    // Should show network error
    await expect(page.locator('.text-ctp-red')).toBeVisible();
    
    // Go back online
    await context.setOffline(false);
  });

  test('should handle empty API responses', async ({ page }) => {
    // Mock empty but valid response
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

    await page.goto('/');
    
    // Should show empty state
    await expect(page.getByText('No trips recorded yet')).toBeVisible();
    await expect(page.getByText('Start tracking your business mileage')).toBeVisible();
  });

  test('should handle missing data fields in API response', async ({ page }) => {
    // Mock response with missing fields
    await page.route('**/api/v1/trips**', (route) => {
      route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          trips: [
            {
              id: 1,
              client_name: 'Test Client',
              // Missing trip_date, miles, etc.
            }
          ],
          total: 1
          // Missing other pagination fields
        })
      });
    });

    await page.goto('/');
    
    // Should handle gracefully without crashing
    await expect(page.locator('body')).toBeVisible();
    await expect(page.getByText('Test Client')).toBeVisible();
  });

  test('should handle concurrent API requests', async ({ page }) => {
    let requestCount = 0;
    
    // Track multiple concurrent requests
    await page.route('**/api/v1/**', (route) => {
      requestCount++;
      setTimeout(() => {
        route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify({ message: 'success', count: requestCount })
        });
      }, 100);
    });

    await page.goto('/');
    
    // Navigate quickly between pages to trigger concurrent requests
    await page.click('a[href="/settings"]');
    await page.click('a[href="/"]');
    
    // App should remain stable
    await expect(page.locator('body')).toBeVisible();
    expect(requestCount).toBeGreaterThan(1);
  });
});