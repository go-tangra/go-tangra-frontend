import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages';

const TEST_USERS = [
  { username: 'tester01', password: 'tester01' },
  { username: 'tester02', password: 'tester02' },
];

test.describe('Test User Login & Logout', () => {
  for (const user of TEST_USERS) {
    test(`should login as ${user.username} and logout`, async ({ page }) => {
      // Login
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login(user.username, user.password);
      await loginPage.waitForLoginSuccess();

      await expect(page).not.toHaveURL(/auth\/login/);

      // Open user dropdown — the avatar button is in the banner/header area
      // It has haspopup="menu" and contains an avatar image
      const avatarButton = page.locator('header button[aria-haspopup="menu"], [role="banner"] button[aria-haspopup="menu"]').last();
      await avatarButton.click();

      // Wait for the dropdown menu and click logout
      const logoutItem = page.getByRole('menuitem', { name: /Logout/ });
      await logoutItem.waitFor({ state: 'visible', timeout: 5_000 });
      await logoutItem.click();

      // Confirm the "Do you want to logout?" dialog
      const confirmButton = page.getByRole('button', { name: 'Confirm' });
      await confirmButton.waitFor({ state: 'visible', timeout: 5_000 });
      await confirmButton.click();

      // Should redirect back to login
      await expect(page).toHaveURL(/auth\/login/, { timeout: 10_000 });
    });
  }
});
