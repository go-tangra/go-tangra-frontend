import { test as setup, expect } from '@playwright/test';

import { AUTH_FILE, credentials } from '../fixtures';

/**
 * Global setup: log in via the UI and save storage state (tokens in localStorage).
 * Runs once before all authenticated test projects.
 */
setup('authenticate', async ({ page }) => {
  // Navigate to login page (hash routing)
  await page.goto('/#/auth/login');

  // Fill in credentials
  // The Vben form uses VbenInput components — target by input role + field name
  const usernameInput = page.locator('input').first();
  const passwordInput = page.locator('input[type="password"]');

  await usernameInput.fill(credentials.username);
  await passwordInput.fill(credentials.password);

  // Click the login button (has aria-label="login")
  await page.locator('button[aria-label="login"]').click();

  // Wait for navigation away from login page — indicates successful auth
  await expect(page).not.toHaveURL(/auth\/login/, { timeout: 15_000 });

  // Wait for the dashboard to be ready
  await page.getByText('Default Dashboard').waitFor({ state: 'visible', timeout: 15_000 });

  // Save storage state (includes localStorage with tokens)
  await page.context().storageState({ path: AUTH_FILE });
});
