import { test, expect } from "@playwright/test";

test.describe("User Interactions", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should handle complete trip management workflow", async ({ page }) => {
    // Mock successful API responses
    await page.route("**/api/v1/trips", (route) => {
      if (route.request().method() === "POST") {
        route.fulfill({
          contentType: "application/json",
          body: JSON.stringify({
            id: Date.now(),
            client_name: "Acme Corp",
            trip_date: "2024-01-15",
            miles: 45.2,
            notes: "Client meeting downtown",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }),
        });
      } else {
        route.continue();
      }
    });

    // Step 1: Add a new trip using the quick add form
    await page.fill('input[placeholder="Client name"]', "Acme Corp");
    await page.fill('input[placeholder="Miles"]', "45.2");
    await page.fill(
      'textarea[placeholder="Trip purpose (optional)"]',
      "Client meeting downtown",
    );

    await page.click('button[type="submit"]');

    // Should show success message
    await expect(page.getByText("Trip added successfully!")).toBeVisible();

    // Step 2: Search for the newly added trip
    await page.fill('input[placeholder="Search trips, clients..."]', "Acme");

    // Wait for search debounce
    await page.waitForTimeout(500);

    // Should show filtered results
    await expect(page.getByText("Acme Corp")).toBeVisible();

    // Step 3: Clear search and verify trip appears in list
    await page.fill('input[placeholder="Search trips, clients..."]', "");
    await page.waitForTimeout(500);

    await expect(page.getByText("Recent Trips")).toBeVisible();
  });

  test("should handle filter interactions", async ({ page }) => {
    // Mock trips data with various clients and dates
    await page.route("**/api/v1/trips**", (route) => {
      const url = new URL(route.request().url());
      const clientFilter = url.searchParams.get("client");

      let filteredTrips = [
        {
          id: 1,
          client_name: "Client A",
          trip_date: "2024-01-15",
          miles: 25.0,
          notes: "Morning meeting",
          created_at: "2024-01-15T10:00:00Z",
          updated_at: "2024-01-15T10:00:00Z",
        },
        {
          id: 2,
          client_name: "Client B",
          trip_date: "2024-01-10",
          miles: 50.5,
          notes: "Site visit",
          created_at: "2024-01-10T14:00:00Z",
          updated_at: "2024-01-10T14:00:00Z",
        },
      ];

      // Apply filters
      if (clientFilter) {
        filteredTrips = filteredTrips.filter(
          (trip) => trip.client_name === clientFilter,
        );
      }

      route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({
          trips: filteredTrips,
          total: filteredTrips.length,
          page: 1,
          limit: 10,
          total_pages: 1,
        }),
      });
    });

    // Mock clients list
    await page.route("**/api/v1/clients", (route) => {
      route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({
          clients: [
            { id: 1, name: "Client A" },
            { id: 2, name: "Client B" },
          ],
        }),
      });
    });

    // Open filters panel
    await page.click('button:has-text("Filters")');
    await expect(page.getByText("Filter Trips")).toBeVisible();

    // Select client filter
    await page.selectOption("#client-select", "Client A");

    // Apply filters
    await page.click('button:has-text("Apply Filters")');

    // Should show filtered results
    await expect(page.getByText("Filtered Trips")).toBeVisible();
    await expect(page.getByText("1 results")).toBeVisible();

    // Clear filters
    await page.click('button:has-text("Filters")');
    await page.click('button:has-text("Clear All")');

    // Should return to unfiltered view
    await expect(page.getByText("Recent Trips")).toBeVisible();
  });

  test("should handle settings update workflow", async ({ page }) => {
    // Navigate to settings
    await page.click('a[href="/settings"]');
    await expect(page.url()).toContain("/settings");

    // Mock settings API
    await page.route("**/api/v1/settings", (route) => {
      if (route.request().method() === "GET") {
        route.fulfill({
          contentType: "application/json",
          body: JSON.stringify({ mileage_rate: 0.67 }),
        });
      } else if (route.request().method() === "PUT") {
        const body = route.request().postDataJSON();
        route.fulfill({
          contentType: "application/json",
          body: JSON.stringify({ mileage_rate: body.mileage_rate }),
        });
      }
    });

    // Wait for form to load
    await page.waitForSelector('input[id="mileageRate"]', { timeout: 10000 });

    // Update mileage rate
    await page.fill('input[id="mileageRate"]', "0.75");

    // Submit changes
    await page.click('button[type="submit"]');

    // Should show saving state temporarily
    await expect(page.getByText("Saving...")).toBeVisible();

    // Should return to saved state
    await expect(page.getByText("Save Settings")).toBeVisible();

    // Rate should be updated
    await expect(page.locator('input[id="mileageRate"]')).toHaveValue("0.75");
  });

  test("should handle pagination interactions", async ({ page }) => {
    // Mock paginated data
    await page.route("**/api/v1/trips**", (route) => {
      const url = new URL(route.request().url());
      const page_num = parseInt(url.searchParams.get("page") || "1");

      const allTrips = Array.from({ length: 25 }, (_, i) => ({
        id: i + 1,
        client_name: `Client ${i + 1}`,
        trip_date: "2024-01-15",
        miles: 10 + i,
        notes: `Trip ${i + 1}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      const startIndex = (page_num - 1) * 10;
      const endIndex = startIndex + 10;
      const trips = allTrips.slice(startIndex, endIndex);

      route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({
          trips,
          total: 25,
          page: page_num,
          limit: 10,
          total_pages: 3,
        }),
      });
    });

    // Wait for trips to load
    await page.waitForSelector('[data-testid="trips-list"]', {
      timeout: 10000,
    });

    // Should show pagination controls
    await expect(page.getByText("Next")).toBeVisible();
    await expect(page.getByText("Previous")).toBeVisible();

    // Click next page
    await page.click('button:has-text("Next")');

    // Should show different trips
    await expect(page.getByText("Client 11")).toBeVisible();

    // Click previous page
    await page.click('button:has-text("Previous")');

    // Should return to first page
    await expect(page.getByText("Client 1")).toBeVisible();
  });

  test("should handle mobile touch interactions", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // Test swipe/scroll interactions
    // Simulate touch scroll down
    await page.mouse.move(200, 300);
    await page.mouse.down();
    await page.mouse.move(200, 100);
    await page.mouse.up();

    // Content should still be accessible
    await expect(
      page.getByRole("heading", { name: "Mileage Tracker" }),
    ).toBeVisible();

    // Test touch interactions with form elements
    await page.tap('input[placeholder="Client name"]');
    await page.type('input[placeholder="Client name"]', "Mobile Test");

    await expect(page.locator('input[placeholder="Client name"]')).toHaveValue(
      "Mobile Test",
    );
  });

  test("should handle client suggestions interaction", async ({ page }) => {
    // Mock client suggestions
    await page.route("**/api/v1/clients/suggestions**", (route) => {
      const url = new URL(route.request().url());
      const query = url.searchParams.get("q") || "";

      const clients = [
        { id: 1, name: "Apple Inc" },
        { id: 2, name: "Amazon Web Services" },
        { id: 3, name: "Microsoft Corporation" },
      ].filter((client) =>
        client.name.toLowerCase().includes(query.toLowerCase()),
      );

      route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({ clients }),
      });
    });

    // Go to form page with suggestions
    await page.goto("/trips/simple");

    // Type in client field to trigger suggestions
    const clientInput = page.locator('input[id="client_name"]');
    await clientInput.fill("App");

    // Should show suggestions
    await expect(page.getByText("Apple Inc")).toBeVisible();

    // Click suggestion
    await page.click("text=Apple Inc");

    // Input should be filled
    await expect(clientInput).toHaveValue("Apple Inc");

    // Suggestions should be hidden
    await expect(page.getByText("Amazon Web Services")).not.toBeVisible();
  });

  test("should handle keyboard shortcuts and navigation", async ({ page }) => {
    // Test Tab navigation through form
    await page.goto("/trips/simple");

    // Tab through form elements
    await page.keyboard.press("Tab");
    await expect(page.locator('input[id="client_name"]')).toBeFocused();

    await page.keyboard.press("Tab");
    await expect(page.locator('input[id="trip_date"]')).toBeFocused();

    await page.keyboard.press("Tab");
    await expect(page.locator('input[id="miles"]')).toBeFocused();

    // Test Enter key on buttons
    await page.focus('button[type="submit"]');
    await page.keyboard.press("Enter");

    // Should trigger form validation
    await expect(page.getByText("Client name is required")).toBeVisible();
  });

  test("should handle real-time form validation", async ({ page }) => {
    await page.goto("/trips/simple");

    // Test client name length validation
    const longName = "A".repeat(31);
    await page.fill('input[id="client_name"]', longName);
    await page.click("body"); // Trigger blur validation if implemented

    // Test miles validation
    await page.fill('input[id="miles"]', "-5");
    await page.click('button[type="submit"]');

    // Should show validation errors
    await expect(
      page.getByText("Client name must be 30 characters or less"),
    ).toBeVisible();
    await expect(page.getByText("Miles must be greater than 0")).toBeVisible();

    // Fix validation errors
    await page.fill('input[id="client_name"]', "Valid Client");
    await page.fill('input[id="miles"]', "25");

    // Errors should clear (if real-time validation is implemented)
    await page.click('button[type="submit"]');

    // Should not show previous errors
    await expect(
      page.getByText("Client name must be 30 characters or less"),
    ).not.toBeVisible();
    await expect(
      page.getByText("Miles must be greater than 0"),
    ).not.toBeVisible();
  });
});
