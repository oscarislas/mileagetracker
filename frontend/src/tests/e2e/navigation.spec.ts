import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  test("should navigate between pages using bottom navigation", async ({
    page,
  }) => {
    await page.goto("/");

    // Should start on trips page
    await expect(
      page.getByRole("heading", { name: "Mileage Tracker" }),
    ).toBeVisible();

    // Navigate to settings
    await page.click('a[href="/settings"]');
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
    await expect(page.url()).toContain("/settings");

    // Navigate back to trips
    await page.click('a[href="/"]');
    await expect(
      page.getByRole("heading", { name: "Mileage Tracker" }),
    ).toBeVisible();
    await expect(page.url()).not.toContain("/settings");
  });

  test("should show active navigation state", async ({ page }) => {
    await page.goto("/");

    // Trips nav should be active
    const tripsNav = page.locator('a[href="/"]');
    await expect(tripsNav).toHaveClass(/text-ctp-blue/);

    // Navigate to settings
    await page.click('a[href="/settings"]');

    // Settings nav should be active
    const settingsNav = page.locator('a[href="/settings"]');
    await expect(settingsNav).toHaveClass(/text-ctp-mauve/);
  });

  test("should display floating action button", async ({ page }) => {
    await page.goto("/");

    // FAB should be visible
    const fab = page.locator("button").filter({ hasText: "" }).first(); // Plus icon button
    await expect(fab).toBeVisible();
    await expect(fab).toHaveClass(/bg-gradient-to-r/);
  });

  test("should handle direct URL navigation", async ({ page }) => {
    // Direct navigation to settings
    await page.goto("/settings");
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();

    // Direct navigation back to root
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Mileage Tracker" }),
    ).toBeVisible();
  });

  test("should maintain responsive layout on mobile viewport", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE size
    await page.goto("/");

    // Bottom navigation should be visible and properly positioned
    const bottomNav = page.locator("nav.fixed.bottom-0");
    await expect(bottomNav).toBeVisible();

    // Navigation items should be properly arranged
    const navItems = page.locator("nav a");
    await expect(navItems).toHaveCount(3); // Trips, Summary, Settings

    // FAB should be visible on mobile
    const fab = page.locator("button").filter({ hasText: "" }).first();
    await expect(fab).toBeVisible();
  });

  test("should handle browser back/forward buttons", async ({ page }) => {
    await page.goto("/");

    // Navigate to settings
    await page.click('a[href="/settings"]');
    await expect(page.url()).toContain("/settings");

    // Use browser back button
    await page.goBack();
    await expect(page.url()).not.toContain("/settings");
    await expect(
      page.getByRole("heading", { name: "Mileage Tracker" }),
    ).toBeVisible();

    // Use browser forward button
    await page.goForward();
    await expect(page.url()).toContain("/settings");
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
  });
});
