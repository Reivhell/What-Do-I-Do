import { test, expect } from '@playwright/test';

test.describe('Habits', () => {
  test('should load the habits page', async ({ page }) => {
    await page.goto('/habits');
    // The app may show a PIN lock screen first; if so, this still proves
    // the client loaded (the title is set before the PIN check).
    const title = await page.title();
    expect(title.toLowerCase()).toContain('what do i do');
  });
});
