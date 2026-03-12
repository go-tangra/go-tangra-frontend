import { type Locator, type Page, expect } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly rememberMeCheckbox: Locator;
  readonly registerLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.usernameInput = page.locator('input').first();
    this.passwordInput = page.locator('input[type="password"]');
    this.loginButton = page.locator('button[aria-label="login"]');
    this.rememberMeCheckbox = page.locator('button[role="checkbox"]');
    this.registerLink = page.locator('text=Create an account');
  }

  async goto() {
    await this.page.goto('/#/auth/login');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async login(username: string, password: string) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async waitForLoginSuccess() {
    // Wait until URL no longer contains auth/login (hash routing)
    await expect(this.page).not.toHaveURL(/auth\/login/, { timeout: 15_000 });
    await this.page.waitForLoadState('domcontentloaded');
  }

  async waitForLoginError() {
    // Ant Design Vue 4.x notification — look for the notice wrapper containing error text
    await this.page.locator('.ant-notification-notice').waitFor({
      state: 'visible',
      timeout: 10_000,
    });
  }

  async logout() {
    // Open user dropdown in the header
    const avatarButton = this.page.locator(
      'header button[aria-haspopup="menu"], [role="banner"] button[aria-haspopup="menu"]',
    ).last();
    await avatarButton.click();

    // Click logout menu item
    const logoutItem = this.page.getByRole('menuitem', { name: /Logout/ });
    await logoutItem.waitFor({ state: 'visible', timeout: 5_000 });
    await logoutItem.click();

    // Confirm the logout dialog
    const confirmButton = this.page.getByRole('button', { name: 'Confirm' });
    await confirmButton.waitFor({ state: 'visible', timeout: 5_000 });
    await confirmButton.click();

    // Wait for redirect to login page
    await expect(this.page).toHaveURL(/auth\/login/, { timeout: 10_000 });
  }
}
