import { test, expect } from '@playwright/test';

test.describe('Admin Login', () => {
  test('should display the login page', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/login');
    await expect(page).toHaveTitle(/Admin Login/);
    await page.screenshot({ path: 'playwright-screenshots/admin-login.png' });
  });
});
