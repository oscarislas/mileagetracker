import { test, expect } from '@playwright/test';

test.describe('Add Trip Form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/trips/simple'); // Use simple trips page that has the full AddTripForm
  });

  test('should display the add trip form', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Add New Trip' })).toBeVisible();
    await expect(page.getByLabelText('Client Name')).toBeVisible();
    await expect(page.getByLabelText('Trip Date')).toBeVisible();
    await expect(page.getByLabelText('Miles Driven')).toBeVisible();
    await expect(page.getByLabelText('Notes (Optional)')).toBeVisible();
  });

  test('should pre-fill trip date with today', async ({ page }) => {
    const today = new Date().toISOString().split('T')[0];
    const dateInput = page.getByLabelText('Trip Date');
    await expect(dateInput).toHaveValue(today);
  });

  test('should show connection status indicator', async ({ page }) => {
    const connectionStatus = page.locator('text=Connected, text=Disconnected').first();
    await expect(connectionStatus).toBeVisible();
  });

  test('should validate required fields on submit', async ({ page }) => {
    // Submit without filling required fields
    await page.click('button[type="submit"]');
    
    await expect(page.getByText('Client name is required')).toBeVisible();
    await expect(page.getByText('Miles must be greater than 0')).toBeVisible();
  });

  test('should validate client name length', async ({ page }) => {
    // Enter client name longer than 30 characters
    const longName = 'A'.repeat(31);
    await page.fill('input[id="client_name"]', longName);
    await page.click('button[type="submit"]');
    
    await expect(page.getByText('Client name must be 30 characters or less')).toBeVisible();
  });

  test('should validate miles input', async ({ page }) => {
    await page.fill('input[id="client_name"]', 'Test Client');
    
    // Test negative miles
    await page.fill('input[id="miles"]', '-5');
    await page.click('button[type="submit"]');
    await expect(page.getByText('Miles must be greater than 0')).toBeVisible();
    
    // Test zero miles
    await page.fill('input[id="miles"]', '0');
    await page.click('button[type="submit"]');
    await expect(page.getByText('Miles must be greater than 0')).toBeVisible();
  });

  test('should successfully submit a valid trip', async ({ page }) => {
    // Mock successful API response
    await page.route('**/api/v1/trips', (route) => {
      if (route.request().method() === 'POST') {
        route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify({
            id: 1,
            client_name: 'Test Client',
            trip_date: '2024-01-15',
            miles: 25.5,
            notes: 'Test trip',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
        });
      } else {
        route.continue();
      }
    });

    // Fill out form
    await page.fill('input[id="client_name"]', 'Test Client');
    await page.fill('input[id="trip_date"]', '2024-01-15');
    await page.fill('input[id="miles"]', '25.5');
    await page.fill('textarea[id="notes"]', 'Test trip notes');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Should show loading state
    await expect(page.getByText('Adding Trip...')).toBeVisible();
    
    // Form should be cleared on success and collapsed
    await expect(page.getByText('Add New Trip')).toBeVisible();
    await expect(page.locator('input[id="client_name"]')).toHaveValue('');
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API error
    await page.route('**/api/v1/trips', (route) => {
      if (route.request().method() === 'POST') {
        route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Invalid trip data' })
        });
      } else {
        route.continue();
      }
    });

    // Fill and submit form
    await page.fill('input[id="client_name"]', 'Test Client');
    await page.fill('input[id="miles"]', '10');
    await page.click('button[type="submit"]');
    
    // Should show error message
    await expect(page.locator('.text-ctp-red')).toContainText('Invalid trip data');
  });

  test('should show client suggestions when typing', async ({ page }) => {
    // Mock client suggestions API
    await page.route('**/api/v1/clients/suggestions**', (route) => {
      route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          clients: [
            { id: 1, name: 'Test Client 1' },
            { id: 2, name: 'Test Client 2' }
          ]
        })
      });
    });

    const clientInput = page.locator('input[id="client_name"]');
    
    // Start typing
    await clientInput.fill('Test');
    await clientInput.focus();
    
    // Suggestions should appear
    await expect(page.getByText('Test Client 1')).toBeVisible();
    await expect(page.getByText('Test Client 2')).toBeVisible();
  });

  test('should select client from suggestions', async ({ page }) => {
    // Mock client suggestions API
    await page.route('**/api/v1/clients/suggestions**', (route) => {
      route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          clients: [
            { id: 1, name: 'Test Client 1' },
            { id: 2, name: 'Test Client 2' }
          ]
        })
      });
    });

    const clientInput = page.locator('input[id="client_name"]');
    
    // Start typing and select suggestion
    await clientInput.fill('Test');
    await clientInput.focus();
    
    await page.click('text=Test Client 1');
    
    // Input should be filled with selected client
    await expect(clientInput).toHaveValue('Test Client 1');
    
    // Suggestions should be hidden
    await expect(page.getByText('Test Client 2')).not.toBeVisible();
  });

  test('should hide suggestions when clicking outside', async ({ page }) => {
    // Mock client suggestions API
    await page.route('**/api/v1/clients/suggestions**', (route) => {
      route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          clients: [{ id: 1, name: 'Test Client 1' }]
        })
      });
    });

    const clientInput = page.locator('input[id="client_name"]');
    
    // Show suggestions
    await clientInput.fill('Test');
    await clientInput.focus();
    await expect(page.getByText('Test Client 1')).toBeVisible();
    
    // Click outside
    await page.click('h2:has-text("Add New Trip")');
    
    // Suggestions should be hidden
    await expect(page.getByText('Test Client 1')).not.toBeVisible();
  });

  test('should support decimal miles input', async ({ page }) => {
    await page.fill('input[id="client_name"]', 'Test Client');
    await page.fill('input[id="miles"]', '25.75');
    
    await expect(page.locator('input[id="miles"]')).toHaveValue('25.75');
    
    // Should not show validation error
    await page.click('button[type="submit"]');
    await expect(page.getByText('Miles must be greater than 0')).not.toBeVisible();
  });

  test('should collapse and expand form', async ({ page }) => {
    // Form should be expanded initially
    await expect(page.getByRole('heading', { name: 'Add New Trip' })).toBeVisible();
    await expect(page.getByLabelText('Client Name')).toBeVisible();
    
    // Click collapse button
    await page.click('button[aria-label="Collapse form"]');
    
    // Form should be collapsed, only showing expand button
    await expect(page.getByText('Add New Trip')).toBeVisible();
    await expect(page.getByLabelText('Client Name')).not.toBeVisible();
    
    // Click to expand
    await page.click('button:has-text("Add New Trip")');
    
    // Form should be expanded again
    await expect(page.getByRole('heading', { name: 'Add New Trip' })).toBeVisible();
    await expect(page.getByLabelText('Client Name')).toBeVisible();
  });
});