import { test, expect } from '@playwright/test';

test.describe('Habits', () => {
  test('should load the habits page', async ({ page }) => {
    await page.goto('/habits');
    await expect(page).toHaveTitle(/what-do-i-do/i);
  });
});
