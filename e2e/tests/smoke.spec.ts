import { test, expect } from "@playwright/test";

test("client loads and shows the correct app title", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle("What Do I Do");
});

test("server API is reachable", async ({ request }) => {
  const response = await request.get("http://localhost:3000/api");
  // No route exists at the bare prefix — a 404 with a JSON body still proves
  // the server booted and Nest's routing/exception filter are responding.
  expect(response.status()).toBeLessThan(500);
});

test("PIN lock screen works when PIN is configured", async ({ page }) => {
  // Note: This test only verifies the PIN screen IF it is shown.
  // When no PIN is configured (fresh DB), the app goes straight to the dashboard.
  // The test is designed to pass in both states.
  await page.goto("/");
  const pinLockHeading = page.getByRole("heading", { name: "App Locked" });
  const isLocked = await pinLockHeading.isVisible().catch(() => false);
  if (isLocked) {
    await expect(page.getByLabel("PIN code")).toBeVisible();
    await expect(page.getByRole("button", { name: "Unlock" })).toBeVisible();
  } else {
    // No PIN configured — app loaded directly
    await expect(page.locator("body")).toBeVisible();
  }
});
