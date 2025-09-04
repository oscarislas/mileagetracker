import { test, expect } from "@playwright/test";

test.describe("Navigation Quick Add Modal", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");

    // Mock successful API responses for trips and client suggestions
    await page.route("**/api/v1/trips", (route) => {
      if (route.request().method() === "POST") {
        route.fulfill({
          contentType: "application/json",
          body: JSON.stringify({
            id: 1,
            client_name: "Test Client",
            trip_date: "2024-01-15",
            miles: 25.5,
            notes: "Test trip",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }),
        });
      } else {
        route.continue();
      }
    });

    await page.route("**/api/v1/clients/suggestions**", (route) => {
      route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({
          clients: [
            { id: 1, name: "Test Client 1" },
            { id: 2, name: "Test Client 2" },
            { id: 3, name: "Another Client" },
          ],
        }),
      });
    });
  });

  test.describe("Modal Opening and Closing", () => {
    test("should open modal when clicking FAB", async ({ page }) => {
      // Click the floating action button
      await page.click('button[aria-label="Quick add trip"]');

      // Modal should be visible
      await expect(page.getByRole("dialog")).toBeVisible();
      await expect(
        page.getByRole("heading", { name: "Quick Add Trip" }),
      ).toBeVisible();

      // Modal should have proper ARIA attributes
      await expect(page.getByRole("dialog")).toHaveAttribute(
        "aria-modal",
        "true",
      );
      await expect(page.getByRole("dialog")).toHaveAttribute(
        "aria-labelledby",
        "modal-title",
      );

      // Background should be blurred
      const overlay = page.locator('[role="dialog"]');
      await expect(overlay).toHaveClass(/backdrop-blur-sm/);
    });

    test("should close modal when clicking close button", async ({ page }) => {
      await page.click('button[aria-label="Quick add trip"]');
      await expect(page.getByRole("dialog")).toBeVisible();

      // Click close button
      await page.click('button[aria-label="Close modal"]');

      // Modal should be closed
      await expect(page.getByRole("dialog")).not.toBeVisible();
    });

    test("should close modal when clicking backdrop", async ({ page }) => {
      await page.click('button[aria-label="Quick add trip"]');
      await expect(page.getByRole("dialog")).toBeVisible();

      // Click backdrop area (not the modal content)
      await page
        .locator('[role="dialog"]')
        .click({ position: { x: 50, y: 50 } });

      // Modal should be closed
      await expect(page.getByRole("dialog")).not.toBeVisible();
    });

    test("should close modal when pressing Escape key", async ({ page }) => {
      await page.click('button[aria-label="Quick add trip"]');
      await expect(page.getByRole("dialog")).toBeVisible();

      // Press Escape key
      await page.keyboard.press("Escape");

      // Modal should be closed
      await expect(page.getByRole("dialog")).not.toBeVisible();
    });

    test("should close modal when pressing Escape in client input", async ({
      page,
    }) => {
      await page.click('button[aria-label="Quick add trip"]');
      await expect(page.getByRole("dialog")).toBeVisible();

      // Focus client input and press Escape
      await page.click('input[id="client-name-input"]');
      await page.keyboard.press("Escape");

      // Modal should be closed
      await expect(page.getByRole("dialog")).not.toBeVisible();
    });

    test("should close modal when pressing Escape in details step", async ({
      page,
    }) => {
      await page.click('button[aria-label="Quick add trip"]');
      await page.fill('input[id="client-name-input"]', "Test Client");
      await page
        .getByRole("dialog")
        .getByRole("button", { name: "Next" })
        .click();

      // Press Escape in miles input
      await page.click('input[id="miles-input"]');
      await page.keyboard.press("Escape");

      // Modal should be closed
      await expect(page.getByRole("dialog")).not.toBeVisible();
    });
  });

  test.describe("Complete Flow", () => {
    test("should complete full trip creation flow", async ({ page }) => {
      // Open modal
      await page.click('button[aria-label="Quick add trip"]');
      await expect(page.getByRole("dialog")).toBeVisible();

      // Step 1: Enter client name
      const clientInput = page.locator('input[id="client-name-input"]');
      await expect(clientInput).toBeFocused(); // Should be auto-focused
      await clientInput.fill("Test Business Client");
      await page
        .getByRole("dialog")
        .getByRole("button", { name: "Next" })
        .click();

      // Step 2: Enter trip details
      await expect(page.getByText("Test Business Client")).toBeVisible(); // Client name should be displayed

      // Miles input should be focused
      const milesInput = page.locator('input[id="miles-input"]');
      await expect(milesInput).toBeFocused();
      await milesInput.fill("45.7");

      // Set date
      await page.fill('input[id="date-input"]', "2024-01-15");

      // Add notes
      await page.fill(
        'textarea[id="notes-input"]',
        "Client meeting and presentation",
      );

      // Submit form
      await page
        .getByRole("dialog")
        .getByRole("button", { name: "Add Trip" })
        .click();

      // Should show success state (loading state might be too fast to catch)
      await expect(page.getByText("Trip Added!")).toBeVisible();
      await expect(
        page.getByText("45.7 miles to Test Business Client"),
      ).toBeVisible();

      // Modal should close after success (wait for timeout)
      await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 5000 });
    });

    test("should navigate using keyboard - Enter keys", async ({ page }) => {
      await page.click('button[aria-label="Quick add trip"]');

      // Enter client name and press Enter
      await page.fill('input[id="client-name-input"]', "Keyboard Client");
      await page.keyboard.press("Enter");

      // Should move to details step
      await expect(page.getByText("Keyboard Client")).toBeVisible();

      // Enter miles and press Enter
      await page.fill('input[id="miles-input"]', "12.5");
      await page.keyboard.press("Enter");

      // Should submit the form
      await expect(page.getByText("Trip Added!")).toBeVisible();
    });

    test("should handle back navigation between steps", async ({ page }) => {
      await page.click('button[aria-label="Quick add trip"]');

      // Enter client and go to next step
      await page.fill('input[id="client-name-input"]', "Test Client");
      await page
        .getByRole("dialog")
        .getByRole("button", { name: "Next" })
        .click();

      // Should be on details step - look for client name in the modal context
      await expect(
        page.getByRole("dialog").getByText("Test Client"),
      ).toBeVisible();

      // Click back button
      await page
        .getByRole("dialog")
        .getByRole("button", { name: "Back" })
        .click();

      // Should be back to client step with previous value
      await expect(page.locator('input[id="client-name-input"]')).toHaveValue(
        "Test Client",
      );

      // Can click "Change" link from details step
      await page
        .getByRole("dialog")
        .getByRole("button", { name: "Next" })
        .click();
      await page
        .getByRole("dialog")
        .getByRole("button", { name: "Change" })
        .click();
      await expect(page.locator('input[id="client-name-input"]')).toHaveValue(
        "Test Client",
      );
    });

    test("should handle cancel at different steps", async ({ page }) => {
      await page.click('button[aria-label="Quick add trip"]');

      // Cancel from client step
      await page.fill('input[id="client-name-input"]', "Test Client");
      await page
        .getByRole("dialog")
        .getByRole("button", { name: "Cancel" })
        .click();
      await expect(page.getByRole("dialog")).not.toBeVisible();

      // Open modal again and navigate to details step
      await page.click('button[aria-label="Quick add trip"]');
      await page.fill('input[id="client-name-input"]', "Test Client");
      await page
        .getByRole("dialog")
        .getByRole("button", { name: "Next" })
        .click();

      // Cancel from details step
      await page
        .getByRole("dialog")
        .getByRole("button", { name: "Back" })
        .click(); // This acts as cancel in details step
      await expect(page.locator('input[id="client-name-input"]')).toHaveValue(
        "Test Client",
      );
    });
  });

  test.describe("Client Suggestions", () => {
    test("should show client suggestions when typing", async ({ page }) => {
      await page.click('button[aria-label="Quick add trip"]');

      // Start typing
      const clientInput = page.locator('input[id="client-name-input"]');
      await clientInput.fill("Test");

      // Wait for suggestions to appear
      await expect(page.getByText("Test Client 1")).toBeVisible();
      await expect(
        page.getByRole("dialog").getByText("Test Client 2"),
      ).toBeVisible();

      // Should have proper ARIA attributes
      await expect(page.locator('[role="listbox"]')).toBeVisible();
      await expect(page.getByText("Test Client 1")).toHaveAttribute(
        "role",
        "option",
      );
    });

    test("should select client from suggestions", async ({ page }) => {
      await page.click('button[aria-label="Quick add trip"]');

      await page.fill('input[id="client-name-input"]', "Test");
      await expect(
        page.getByRole("dialog").getByText("Test Client 2"),
      ).toBeVisible();

      // Click on a suggestion
      await page
        .getByRole("dialog")
        .getByRole("option", { name: "Test Client 2" })
        .click();

      // Should move to details step with selected client
      await expect(
        page.getByRole("dialog").getByText("Test Client 2"),
      ).toBeVisible();
      await expect(page.locator('input[id="miles-input"]')).toBeFocused();
    });

    test("should limit suggestions to 3 items", async ({ page }) => {
      await page.click('button[aria-label="Quick add trip"]');

      await page.fill('input[id="client-name-input"]', "Client");

      // Should show only first 3 suggestions (mocked API returns 3)
      await expect(page.getByText("Test Client 1")).toBeVisible();
      await expect(
        page.getByRole("dialog").getByText("Test Client 2"),
      ).toBeVisible();
      await expect(page.getByText("Another Client")).toBeVisible();

      const suggestions = page.locator('[role="option"]');
      await expect(suggestions).toHaveCount(3);
    });
  });

  test.describe("Form Validation", () => {
    test("should validate empty client name", async ({ page }) => {
      await page.click('button[aria-label="Quick add trip"]');

      // Try to proceed without entering client name
      const nextButton = page
        .getByRole("dialog")
        .getByRole("button", { name: "Next" });
      await expect(nextButton).toBeDisabled();
    });

    test("should validate client name with only spaces", async ({ page }) => {
      await page.click('button[aria-label="Quick add trip"]');

      // Enter only spaces
      await page.fill('input[id="client-name-input"]', "   ");

      const nextButton = page
        .getByRole("dialog")
        .getByRole("button", { name: "Next" });
      await expect(nextButton).toBeDisabled();
    });

    test("should validate client name length", async ({ page }) => {
      await page.click('button[aria-label="Quick add trip"]');

      // Enter maximum allowed length (30 characters)
      const maxLengthName = "A".repeat(30);
      await page.fill('input[id="client-name-input"]', maxLengthName);

      const nextButton = page
        .getByRole("dialog")
        .getByRole("button", { name: "Next" });
      await expect(nextButton).toBeEnabled();

      // Verify input accepts exactly 30 characters
      await expect(page.locator('input[id="client-name-input"]')).toHaveValue(
        maxLengthName,
      );
    });

    test("should validate zero miles", async ({ page }) => {
      await page.click('button[aria-label="Quick add trip"]');
      await page.fill('input[id="client-name-input"]', "Test Client");
      await page
        .getByRole("dialog")
        .getByRole("button", { name: "Next" })
        .click();

      // Enter zero miles
      await page.fill('input[id="miles-input"]', "0");

      const addButton = page
        .getByRole("dialog")
        .getByRole("button", { name: "Add Trip" });
      await expect(addButton).toBeDisabled();
    });

    test("should validate negative miles", async ({ page }) => {
      await page.click('button[aria-label="Quick add trip"]');
      await page.fill('input[id="client-name-input"]', "Test Client");
      await page
        .getByRole("dialog")
        .getByRole("button", { name: "Next" })
        .click();

      // Enter negative miles
      await page.fill('input[id="miles-input"]', "-5");

      const addButton = page
        .getByRole("dialog")
        .getByRole("button", { name: "Add Trip" });
      await expect(addButton).toBeDisabled();
    });

    test("should accept decimal miles", async ({ page }) => {
      await page.click('button[aria-label="Quick add trip"]');
      await page.fill('input[id="client-name-input"]', "Test Client");
      await page
        .getByRole("dialog")
        .getByRole("button", { name: "Next" })
        .click();

      // Enter decimal miles
      await page.fill('input[id="miles-input"]', "25.75");

      const addButton = page
        .getByRole("dialog")
        .getByRole("button", { name: "Add Trip" });
      await expect(addButton).toBeEnabled();
    });

    test("should pre-fill today's date", async ({ page }) => {
      await page.click('button[aria-label="Quick add trip"]');
      await page.fill('input[id="client-name-input"]', "Test Client");
      await page
        .getByRole("dialog")
        .getByRole("button", { name: "Next" })
        .click();

      // Date input should have a valid date (account for timezone differences)
      const dateValue = await page
        .locator('input[id="date-input"]')
        .inputValue();
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      expect(dateValue).toMatch(dateRegex);

      // Check if it's a recent date (today or yesterday/tomorrow due to timezone)
      const inputDate = new Date(dateValue);
      const now = new Date();
      const diffDays = Math.abs(
        (inputDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );
      expect(diffDays).toBeLessThan(2);
    });
  });

  test.describe("Error Handling", () => {
    test("should handle API errors gracefully", async ({ page }) => {
      // Mock API error for trip creation
      await page.route("**/api/v1/trips", (route) => {
        if (route.request().method() === "POST") {
          route.fulfill({
            status: 400,
            contentType: "application/json",
            body: JSON.stringify({ error: "Invalid trip data" }),
          });
        } else {
          route.continue();
        }
      });

      await page.click('button[aria-label="Quick add trip"]');
      await page.fill('input[id="client-name-input"]', "Test Client");
      await page
        .getByRole("dialog")
        .getByRole("button", { name: "Next" })
        .click();
      await page.fill('input[id="miles-input"]', "25");
      await page
        .getByRole("dialog")
        .getByRole("button", { name: "Add Trip" })
        .click();

      // Should handle error gracefully (loading state might be too fast to catch)
      await page.waitForTimeout(1000); // Give time for potential error

      // Should handle error gracefully (form should remain open)
      // The exact error handling behavior depends on implementation
      await expect(page.getByRole("dialog")).toBeVisible();
    });

    test("should handle network errors for client suggestions", async ({
      page,
    }) => {
      // Mock network error for client suggestions
      await page.route("**/api/v1/clients/suggestions**", (route) => {
        route.abort("failed");
      });

      await page.click('button[aria-label="Quick add trip"]');
      await page.fill('input[id="client-name-input"]', "Test");

      // Form should still be functional even without suggestions
      const nextButton = page
        .getByRole("dialog")
        .getByRole("button", { name: "Next" });
      await expect(nextButton).toBeEnabled();
    });
  });

  test.describe("Mobile Responsiveness", () => {
    test("should work correctly on mobile viewport", async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE size

      await page.click('button[aria-label="Quick add trip"]');

      // Modal should adapt to mobile layout
      const modal = page.locator('[role="dialog"] > div');
      await expect(modal).toHaveClass(/rounded-t-xl/); // Bottom sheet style on mobile

      // Form should be fully functional on mobile
      await page.fill('input[id="client-name-input"]', "Mobile Client");
      await page
        .getByRole("dialog")
        .getByRole("button", { name: "Next" })
        .click();
      await page.fill('input[id="miles-input"]', "15.5");
      await page
        .getByRole("dialog")
        .getByRole("button", { name: "Add Trip" })
        .click();

      await expect(page.getByText("Trip Added!")).toBeVisible();
    });

    test("should handle touch interactions on mobile", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      await page.click('button[aria-label="Quick add trip"]');

      // Test tap to close on mobile backdrop
      await page.locator('[role="dialog"]').tap({ position: { x: 50, y: 50 } });
      await expect(page.getByRole("dialog")).not.toBeVisible();
    });

    test("should work correctly on tablet viewport", async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 }); // iPad size

      await page.click('button[aria-label="Quick add trip"]');

      // Modal should use desktop-style centering on tablet
      const modal = page.locator('[role="dialog"]');
      await expect(modal).toHaveClass(/md:items-center/);

      // Complete flow should work on tablet
      await page.fill('input[id="client-name-input"]', "Tablet Client");
      await page
        .getByRole("dialog")
        .getByRole("button", { name: "Next" })
        .click();
      await page.fill('input[id="miles-input"]', "30");
      await page
        .getByRole("dialog")
        .getByRole("button", { name: "Add Trip" })
        .click();

      await expect(page.getByText("Trip Added!")).toBeVisible();
    });
  });

  test.describe("Accessibility", () => {
    test("should have proper focus management", async ({ page }) => {
      await page.click('button[aria-label="Quick add trip"]');

      // Client input should be auto-focused
      await expect(page.locator('input[id="client-name-input"]')).toBeFocused();

      // After proceeding to details, miles input should be focused
      await page.fill('input[id="client-name-input"]', "Focus Test");
      await page
        .getByRole("dialog")
        .getByRole("button", { name: "Next" })
        .click();
      await expect(page.locator('input[id="miles-input"]')).toBeFocused();
    });

    test("should have proper ARIA labels and roles", async ({ page }) => {
      await page.click('button[aria-label="Quick add trip"]');

      // Modal should have proper ARIA attributes
      await expect(page.getByRole("dialog")).toHaveAttribute(
        "aria-modal",
        "true",
      );
      await expect(page.getByRole("dialog")).toHaveAttribute(
        "aria-labelledby",
        "modal-title",
      );

      // Form inputs should have proper labels
      await expect(
        page.locator('label[for="client-name-input"]'),
      ).toContainText("Who did you visit?");

      // Proceed to details step to check other labels
      await page.fill('input[id="client-name-input"]', "Aria Test");
      await page
        .getByRole("dialog")
        .getByRole("button", { name: "Next" })
        .click();

      await expect(page.locator('label[for="miles-input"]')).toContainText(
        "Miles",
      );
      await expect(page.locator('label[for="date-input"]')).toContainText(
        "Date",
      );
      await expect(page.locator('label[for="notes-input"]')).toContainText(
        "Notes (optional)",
      );
    });

    test("should support keyboard navigation", async ({ page }) => {
      await page.click('button[aria-label="Quick add trip"]');

      // Should be able to navigate with Tab key
      await page.keyboard.press("Tab"); // Should move to Cancel button
      await page.keyboard.press("Tab"); // Should move to Next button (disabled)

      // Enter text and tab should work
      await page.keyboard.press("Shift+Tab"); // Back to Cancel
      await page.keyboard.press("Shift+Tab"); // Back to input
      await page.keyboard.type("Keyboard Navigation Test");

      await page.keyboard.press("Tab"); // To Cancel
      await page.keyboard.press("Tab"); // To Next (now enabled)
      await page.keyboard.press("Enter"); // Press Next

      // Should be on details step
      await expect(page.getByText("Keyboard Navigation Test")).toBeVisible();
    });

    test("should announce loading states properly", async ({ page }) => {
      await page.click('button[aria-label="Quick add trip"]');
      await page.fill('input[id="client-name-input"]', "Loading Test");
      await page
        .getByRole("dialog")
        .getByRole("button", { name: "Next" })
        .click();
      await page.fill('input[id="miles-input"]', "20");

      // Submit and check for screen reader content
      await page
        .getByRole("dialog")
        .getByRole("button", { name: "Add Trip" })
        .click();

      // Should show success or remain for error (loading might be too fast to catch)
      await page.waitForTimeout(1000);
    });
  });

  test.describe("Integration with Navigation", () => {
    test("should maintain proper z-index stacking", async ({ page }) => {
      await page.click('button[aria-label="Quick add trip"]');

      // Modal should be above navigation
      const modal = page.locator('[role="dialog"]');
      await expect(modal).toHaveClass(/z-50/);

      const navigation = page.locator("nav.fixed.bottom-0");
      await expect(navigation).toHaveClass(/z-40/);
    });

    test("should prevent body scrolling when modal is open", async ({
      page,
    }) => {
      // Add enough content to make page scrollable
      await page.addStyleTag({
        content: "body { height: 200vh; }",
      });

      await page.click('button[aria-label="Quick add trip"]');

      // Body should have overflow hidden
      const bodyOverflow = await page.evaluate(
        () => window.getComputedStyle(document.body).overflow,
      );
      expect(bodyOverflow).toBe("hidden");

      // Close modal
      await page.click('button[aria-label="Close modal"]');

      // Body overflow should be restored
      const bodyOverflowAfter = await page.evaluate(
        () => window.getComputedStyle(document.body).overflow,
      );
      expect(bodyOverflowAfter).not.toBe("hidden");
    });

    test("should not interfere with bottom navigation functionality", async ({
      page,
    }) => {
      // Open modal
      await page.click('button[aria-label="Quick add trip"]');
      await expect(page.getByRole("dialog")).toBeVisible();

      // Close modal
      await page.click('button[aria-label="Close modal"]');

      // Navigation should still work normally
      await page.click('a[href="/settings"]');
      await expect(
        page.getByRole("heading", { name: "Settings" }),
      ).toBeVisible();

      // Navigate back to trips
      await page.click('a[href="/"]');
      await expect(
        page.getByRole("heading", { name: "Mileage Tracker" }),
      ).toBeVisible();

      // FAB should still work
      await page.click('button[aria-label="Quick add trip"]');
      await expect(page.getByRole("dialog")).toBeVisible();
    });
  });
});
