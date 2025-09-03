import { test, expect } from '@playwright/test';

test.describe('Settings Management', () => {
  test('should show proper error state when backend is unavailable', async ({ page }) => {
    // Mock all API requests to fail (simulating no backend)
    await page.route('**/api/v1/settings', (route) => {
      route.abort('connectionrefused');
    });

    await page.goto('/settings');
    
    // Should show error state instead of infinite loading
    await expect(page.getByText('Unable to load settings')).toBeVisible();
    await expect(page.getByText('Failed to connect to the server')).toBeVisible();
    
    // Should show default settings information
    await expect(page.getByText('💡 Default Settings:')).toBeVisible();
    await expect(page.getByText('$0.67 per mile')).toBeVisible();
    
    // Should have try again button
    await expect(page.getByRole('button', { name: 'Try Again' })).toBeVisible();
    
    // Should not show loading spinner indefinitely
    await expect(page.locator('.animate-spin')).not.toBeVisible();
  });

  test.beforeEach(async ({ page }) => {
    // Mock successful settings API for other tests
    await page.route('**/api/v1/settings', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify({ mileage_rate: 0.67 })
        });
      } else {
        route.continue();
      }
    });
    
    await page.goto('/settings');
  });

  test('should display the settings page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
    await expect(page.getByText('Configure your mileage tracking preferences')).toBeVisible();
  });

  test('should load current mileage rate', async ({ page }) => {
    // Wait for settings to load
    await page.waitForSelector('input[id="mileageRate"]', { timeout: 10000 });
    
    const mileageRateInput = page.locator('input[id="mileageRate"]');
    await expect(mileageRateInput).toBeVisible();
    
    // Should have a default value loaded
    const value = await mileageRateInput.inputValue();
    expect(parseFloat(value)).toBeGreaterThan(0);
  });

  test('should update mileage rate successfully', async ({ page }) => {
    // Wait for form to load
    await page.waitForSelector('input[id="mileageRate"]', { timeout: 10000 });
    
    // Clear and enter new rate
    await page.fill('input[id="mileageRate"]', '0.75');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for success (button text changes back from "Saving...")
    await expect(page.getByRole('button', { name: 'Save Settings' })).toBeVisible();
    
    // Rate should be updated
    await expect(page.locator('input[id="mileageRate"]')).toHaveValue('0.75');
  });

  test('should validate mileage rate input', async ({ page }) => {
    // Wait for form to load
    await page.waitForSelector('input[id="mileageRate"]', { timeout: 10000 });
    
    // Enter invalid rate (negative)
    await page.fill('input[id="mileageRate"]', '-0.5');
    await page.click('button[type="submit"]');
    
    // Should show error
    await expect(page.getByText('Please enter a valid mileage rate')).toBeVisible();
    
    // Clear field and try empty
    await page.fill('input[id="mileageRate"]', '');
    await page.click('button[type="submit"]');
    
    // Should show error for empty/invalid
    await expect(page.getByText('Please enter a valid mileage rate')).toBeVisible();
  });

  test('should show loading state', async ({ page }) => {
    // Intercept the settings request to delay it
    await page.route('**/api/v1/settings', (route) => {
      setTimeout(() => {
        route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify({ mileage_rate: 0.67 })
        });
      }, 1000);
    });
    
    await page.reload();
    
    // Should show loading spinner
    await expect(page.locator('.animate-spin')).toBeVisible();
  });

  test('should display IRS rate hint', async ({ page }) => {
    await expect(page.getByText('Current IRS standard mileage rate is $0.67 per mile (2024)')).toBeVisible();
  });

  test('should show saving state when submitting', async ({ page }) => {
    // Wait for form to load
    await page.waitForSelector('input[id="mileageRate"]', { timeout: 10000 });
    
    // Intercept PUT request to delay response
    await page.route('**/api/v1/settings', (route) => {
      if (route.request().method() === 'PUT') {
        setTimeout(() => {
          route.fulfill({
            contentType: 'application/json',
            body: JSON.stringify({ mileage_rate: 0.75 })
          });
        }, 1000);
      } else {
        route.continue();
      }
    });
    
    // Update rate and submit
    await page.fill('input[id="mileageRate"]', '0.75');
    await page.click('button[type="submit"]');
    
    // Should show saving state
    await expect(page.getByRole('button', { name: 'Saving...' })).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeDisabled();
    
    // Should return to normal state
    await expect(page.getByRole('button', { name: 'Save Settings' })).toBeVisible();
  });

  test('should handle server errors gracefully', async ({ page }) => {
    // Wait for form to load
    await page.waitForSelector('input[id="mileageRate"]', { timeout: 10000 });
    
    // Mock server error
    await page.route('**/api/v1/settings', (route) => {
      if (route.request().method() === 'PUT') {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal server error' })
        });
      } else {
        route.continue();
      }
    });
    
    // Try to update rate
    await page.fill('input[id="mileageRate"]', '0.80');
    await page.click('button[type="submit"]');
    
    // Should show error message
    await expect(page.locator('.text-ctp-red')).toContainText('error');
  });
});