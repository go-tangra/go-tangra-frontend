import { test, expect } from '@playwright/test';

import { LoginPage } from '../pages';

test.describe('Login Page', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test('should display login form', async () => {
    await expect(loginPage.usernameInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.loginButton).toBeVisible();
  });

  test('should show validation on empty submit', async () => {
    await loginPage.usernameInput.clear();
    await loginPage.passwordInput.clear();
    await loginPage.loginButton.click();

    // Vben form validation messages appear as error text
    const errorMessages = loginPage.page.locator('[class*="error"], [role="alert"]');
    await expect(errorMessages.first()).toBeVisible({ timeout: 5_000 });
  });

  test('should show error on invalid credentials', async ({ page }) => {
    await loginPage.login('invaliduser', 'wrongpassword');
    await loginPage.waitForLoginError();

    // Should remain on login page
    expect(page.url()).toContain('auth/login');
  });

  test('should login with valid credentials', async ({ page }) => {
    const username = process.env.E2E_USERNAME || 'admin';
    const password = process.env.E2E_PASSWORD || 'admin123';

    await loginPage.login(username, password);
    await loginPage.waitForLoginSuccess();

    // Should have navigated away from login
    await expect(page).not.toHaveURL(/auth\/login/);
  });

  test('should redirect unauthenticated users to login', async ({ page }) => {
    await page.goto('/#/dashboard');
    await page.waitForLoadState('networkidle');

    // Should redirect to login since there's no auth token
    await expect(page).toHaveURL(/auth\/login/, { timeout: 10_000 });
  });
});
