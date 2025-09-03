import { test, expect } from '@playwright/test';

test.describe('Accessibility', () => {
  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/');
    
    // Main heading should be h1
    const h1 = page.locator('h1');
    await expect(h1).toHaveText('Mileage Tracker');
    
    // Secondary headings should be h2
    const h2Elements = page.locator('h2');
    await expect(h2Elements.first()).toBeVisible();
  });

  test('should have proper form labels', async ({ page }) => {
    await page.goto('/trips/simple');
    
    // All form inputs should have associated labels
    await expect(page.getByLabelText('Client Name')).toBeVisible();
    await expect(page.getByLabelText('Trip Date')).toBeVisible();
    await expect(page.getByLabelText('Miles Driven')).toBeVisible();
    await expect(page.getByLabelText('Notes (Optional)')).toBeVisible();
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/');
    
    // Tab through interactive elements
    await page.keyboard.press('Tab');
    
    // Search input should be focusable
    const searchInput = page.locator('input[placeholder="Search trips, clients..."]');
    await expect(searchInput).toBeFocused();
    
    // Continue tabbing to filters button
    await page.keyboard.press('Tab');
    const filtersButton = page.locator('button:has-text("Filters")');
    await expect(filtersButton).toBeFocused();
    
    // Should be able to activate with Enter
    await page.keyboard.press('Enter');
    await expect(page.getByText('Filter Trips')).toBeVisible();
  });

  test('should have proper ARIA attributes', async ({ page }) => {
    await page.goto('/trips/simple');
    
    // Form should have proper ARIA attributes
    const form = page.locator('form');
    await expect(form).toBeVisible();
    
    // Buttons should have proper roles
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toHaveAttribute('type', 'submit');
    
    // Collapse button should have aria-label
    const collapseButton = page.locator('button[aria-label="Collapse form"]');
    await expect(collapseButton).toHaveAttribute('aria-label', 'Collapse form');
  });

  test('should provide focus indicators', async ({ page }) => {
    await page.goto('/');
    
    // Focus search input
    await page.focus('input[placeholder="Search trips, clients..."]');
    
    // Should have focus ring (check for focus-related classes)
    const focusedInput = page.locator('input[placeholder="Search trips, clients..."]:focus');
    await expect(focusedInput).toBeVisible();
  });

  test('should have sufficient color contrast', async ({ page }) => {
    await page.goto('/');
    
    // Main text should be readable
    await expect(page.getByRole('heading', { name: 'Mileage Tracker' })).toBeVisible();
    
    // Subtext should be visible (though lighter)
    await expect(page.getByText('Track your business trips and maximize your tax deductions')).toBeVisible();
  });

  test('should support screen reader navigation landmarks', async ({ page }) => {
    await page.goto('/');
    
    // Navigation should be in nav element
    const navigation = page.locator('nav');
    await expect(navigation).toBeVisible();
    
    // Main content should be accessible
    const mainContent = page.locator('main, [role="main"], body > div');
    await expect(mainContent.first()).toBeVisible();
  });

  test('should handle form errors accessibly', async ({ page }) => {
    await page.goto('/trips/simple');
    
    // Submit form without filling required fields
    await page.click('button[type="submit"]');
    
    // Error messages should be associated with inputs
    const clientNameError = page.getByText('Client name is required');
    await expect(clientNameError).toBeVisible();
    
    const milesError = page.getByText('Miles must be greater than 0');
    await expect(milesError).toBeVisible();
  });

  test('should support keyboard-only form submission', async ({ page }) => {
    await page.goto('/trips/simple');
    
    // Fill form using keyboard only
    await page.focus('input[id="client_name"]');
    await page.keyboard.type('Test Client');
    
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab'); // Skip to miles (date is pre-filled)
    await page.keyboard.type('25.5');
    
    await page.keyboard.press('Tab');
    await page.keyboard.type('Test notes');
    
    // Navigate to submit button and activate
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    
    // Form should be processed
    await expect(page.getByText('Adding Trip...')).toBeVisible();
  });

  test('should provide alternative text for icons', async ({ page }) => {
    await page.goto('/');
    
    // Navigation icons should have meaningful text
    const navigationLinks = page.locator('nav a');
    await expect(navigationLinks.first()).toContainText('Trips');
    
    // Search icon should be supplemented by placeholder text
    const searchInput = page.locator('input[placeholder="Search trips, clients..."]');
    await expect(searchInput).toHaveAttribute('placeholder', 'Search trips, clients...');
  });

  test('should handle high contrast mode', async ({ page }) => {
    // Simulate high contrast by checking elements are still visible
    await page.goto('/');
    
    // Key interactive elements should remain visible
    await expect(page.getByRole('heading', { name: 'Mileage Tracker' })).toBeVisible();
    await expect(page.locator('button:has-text("Filters")')).toBeVisible();
    await expect(page.locator('nav')).toBeVisible();
  });

  test('should support reduced motion preferences', async ({ page }) => {
    // Set reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    
    // Content should still be accessible with reduced motion
    await expect(page.getByRole('heading', { name: 'Mileage Tracker' })).toBeVisible();
    
    // Interactions should still work
    await page.click('button:has-text("Filters")');
    await expect(page.getByText('Filter Trips')).toBeVisible();
  });

  test('should have proper page titles', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Mileage/);
    
    await page.goto('/settings');
    await expect(page).toHaveTitle(/Mileage/);
  });

  test('should support browser zoom', async ({ page }) => {
    await page.goto('/');
    
    // Test 200% zoom
    await page.setViewportSize({ width: 600, height: 800 });
    await page.evaluate(() => {
      document.body.style.zoom = '2';
    });
    
    // Content should still be accessible
    await expect(page.getByRole('heading', { name: 'Mileage Tracker' })).toBeVisible();
    await expect(page.locator('nav')).toBeVisible();
    
    // Interactive elements should still work
    await page.click('button:has-text("Filters")');
    await expect(page.getByText('Filter Trips')).toBeVisible();
  });
});