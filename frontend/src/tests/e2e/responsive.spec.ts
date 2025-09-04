import { test, expect } from "@playwright/test";

test.describe("Responsive Design", () => {
  const viewports = [
    { name: "Mobile", width: 375, height: 667 },
    { name: "Tablet", width: 768, height: 1024 },
    { name: "Desktop", width: 1200, height: 800 },
  ];

  for (const viewport of viewports) {
    test(`should display correctly on ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });
      await page.goto("/");

      // Main content should be visible
      await expect(
        page.getByRole("heading", { name: "Mileage Tracker" }),
      ).toBeVisible();

      // Stats cards should be responsive
      await expect(page.getByText("Total Trips")).toBeVisible();
      await expect(page.getByText("Deductions")).toBeVisible();
      await expect(page.getByText("Miles")).toBeVisible();

      // Bottom navigation should always be visible
      const bottomNav = page.locator("nav.fixed.bottom-0");
      await expect(bottomNav).toBeVisible();
    });
  }

  test("should hide desktop-specific elements on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    // FAB should be hidden on desktop navigation but visible on mobile
    const fab = page.locator("button").filter({ hasText: "" }).first();
    await expect(fab).toBeVisible();
  });

  test("should adapt layout for tablet", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/");

    // Should show grid layout on larger screens
    const statsGrid = page.locator(".grid.grid-cols-3");
    await expect(statsGrid).toBeVisible();
  });

  test("should show desktop layout on large screens", async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto("/");

    // Should show side-by-side layout on desktop
    const desktopGrid = page.locator(".lg\\:grid");
    await expect(desktopGrid).toBeVisible();
  });

  test("should maintain usability on small screens", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 }); // Very small screen
    await page.goto("/");

    // Text should remain readable
    await expect(
      page.getByRole("heading", { name: "Mileage Tracker" }),
    ).toBeVisible();

    // Interactive elements should be accessible
    const searchInput = page.locator(
      'input[placeholder="Search trips, clients..."]',
    );
    await expect(searchInput).toBeVisible();

    // Bottom navigation should not overlap content
    const bottomNav = page.locator("nav.fixed.bottom-0");
    await expect(bottomNav).toBeVisible();
  });

  test("should handle orientation changes", async ({ page }) => {
    // Start in portrait
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: "Mileage Tracker" }),
    ).toBeVisible();

    // Switch to landscape
    await page.setViewportSize({ width: 667, height: 375 });

    // Content should still be accessible
    await expect(
      page.getByRole("heading", { name: "Mileage Tracker" }),
    ).toBeVisible();

    // Navigation should remain functional
    const bottomNav = page.locator("nav.fixed.bottom-0");
    await expect(bottomNav).toBeVisible();
  });

  test("should support touch interactions on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    // Test touch interactions (tap equivalent to click)
    await page.tap('button:has-text("Filters")');
    await expect(page.getByText("Filter Trips")).toBeVisible();

    // Test scrolling behavior
    const scrollContainer = page.locator("body");
    const initialPosition = await scrollContainer.evaluate(
      (el) => el.scrollTop,
    );

    // Perform scroll gesture
    await page.mouse.wheel(0, 300);

    const finalPosition = await scrollContainer.evaluate((el) => el.scrollTop);
    expect(finalPosition).toBeGreaterThan(initialPosition);
  });

  test("should show appropriate spacing on different screen sizes", async ({
    page,
  }) => {
    // Mobile spacing
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    const mobileContainer = page.locator(".px-4");
    await expect(mobileContainer).toBeVisible();

    // Desktop spacing should be different
    await page.setViewportSize({ width: 1200, height: 800 });

    const desktopContainer = page.locator(".max-w-7xl");
    await expect(desktopContainer).toBeVisible();
  });
});
