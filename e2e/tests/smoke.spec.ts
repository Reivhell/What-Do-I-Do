import { test, expect } from "@playwright/test";

test("client loads and shows the PIN lock screen", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle("What Do I Do");
  await expect(page.getByRole("heading", { name: "App Locked" })).toBeVisible();
  await expect(page.getByLabel("PIN code")).toBeVisible();
});

test("server API is reachable", async ({ request }) => {
  const response = await request.get("http://localhost:3000/api");
  // No route exists at the bare prefix — a 404 with a JSON body still proves
  // the server booted and Nest's routing/exception filter are responding.
  expect(response.status()).toBeLessThan(500);
});
