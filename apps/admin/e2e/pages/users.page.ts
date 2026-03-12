import { type Page, expect } from '@playwright/test';

export interface UserData {
  username: string;
  password: string;
  email: string;
  nickname?: string;
  roles: string[];
}

export class UsersPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('/#/opm/users');
    await this.page.waitForLoadState('domcontentloaded');
    // Wait for the user table to render
    await this.page.getByText('User Management').first().waitFor({ state: 'visible', timeout: 15_000 });
    // Wait for table data to load (look for "Total" records text)
    await this.page.getByText(/Total \d+ records/).waitFor({ state: 'visible', timeout: 15_000 });
  }

  /**
   * Check if a user with the given username exists in the table.
   */
  async userExists(username: string): Promise<boolean> {
    // The search form has a textbox labeled "Username" in the filter bar
    const usernameSearch = this.page.getByRole('textbox', { name: 'Username' });

    // Clear and search
    await usernameSearch.clear();
    await usernameSearch.fill(username);
    await this.page.getByRole('button', { name: 'Search', exact: true }).click();

    // Wait for table to refresh
    await this.page.waitForTimeout(1_500);

    // Check if the username appears in the table results
    const totalText = await this.page.getByText(/Total \d+ records/).textContent();
    const match = totalText?.match(/Total (\d+) records/);
    const count = match ? Number.parseInt(match[1] ?? '0', 10) : 0;

    // Reset the search
    await this.page.getByRole('button', { name: 'Reset' }).click();
    await this.page.waitForTimeout(1_000);

    return count > 0;
  }

  /**
   * Create a new user via the Create User drawer.
   */
  async createUser(data: UserData): Promise<void> {
    // Open the create drawer
    await this.page.getByRole('button', { name: 'Create Account' }).click();

    // Wait for the drawer to appear
    const drawer = this.page.getByRole('dialog', { name: 'Create User' });
    await drawer.waitFor({ state: 'visible', timeout: 10_000 });

    // Fill username
    await drawer.getByRole('textbox', { name: '* Username' }).fill(data.username);

    // Fill password
    await drawer.getByRole('textbox', { name: 'Password' }).fill(data.password);

    // Select roles
    await this.selectRoles(drawer, data.roles);

    // Fill nickname (defaults to username if not provided)
    await drawer.getByRole('textbox', { name: '* Nickname' }).fill(data.nickname ?? data.username);

    // Fill email
    await drawer.getByRole('textbox', { name: '* Email' }).fill(data.email);

    // Status defaults to "Active" — no change needed

    // Click the drawer heading to ensure focus leaves any dropdown
    await drawer.getByRole('heading', { name: 'Create User' }).click();
    await this.page.waitForTimeout(300);

    // Click Confirm using the button inside the dialog
    await drawer.getByRole('button', { name: 'Confirm' }).click();

    // Wait for the drawer to close (indicates success)
    await expect(drawer).toBeHidden({ timeout: 15_000 });

    // Wait for table to refresh with the new user
    await this.page.waitForTimeout(1_000);
  }

  /**
   * Select roles in the ant-tree-select Role dropdown within the drawer.
   * The dropdown is virtualized, so we type each role name to filter,
   * then click the matching tree node.
   */
  private async selectRoles(drawer: ReturnType<Page['getByRole']>, roles: string[]): Promise<void> {
    // The Role field is the first ant-tree-select combobox in the drawer
    const roleInput = drawer.locator('.ant-tree-select .ant-select-selection-search-input').first();

    for (const role of roles) {
      // Click to open/focus the dropdown
      await roleInput.click();

      // Wait for the dropdown to appear
      await this.page.locator('.ant-tree-select-dropdown').first().waitFor({ state: 'visible', timeout: 5_000 });

      // Type the role name to filter the tree
      await roleInput.fill(role);
      await this.page.waitForTimeout(500);

      // Click the matching tree node by its title text
      await this.page.locator(`.ant-select-tree-title:text-is("${role}")`).click();
      await this.page.waitForTimeout(300);
    }

    // Close the dropdown by clicking the drawer heading (Escape would close the drawer)
    await drawer.getByRole('heading', { name: 'Create User' }).click();
    await this.page.waitForTimeout(300);
  }

  /**
   * Reset a user's password via the API.
   * The admin EditUserPassword endpoint accepts plaintext (NeedDecrypt: false).
   */
  async resetUserPassword(username: string, newPassword: string): Promise<number> {
    const token = await this.getAccessToken();
    if (!token) return -1;

    return this.page.evaluate(async (args: { username: string; password: string; token: string }) => {
      // Find user by listing and matching username
      const listRes = await fetch('/admin/admin/v1/users?noPaging=true', {
        headers: { Authorization: `Bearer ${args.token}` },
      });
      const data = await listRes.json();
      const items = data.items || [];
      const user = items.find((u: { username?: string }) => u.username === args.username);
      if (!user?.id) return 404;

      const res = await fetch(`/admin/admin/v1/users/${user.id}/password`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${args.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newPassword: args.password }),
      });
      return res.status;
    }, { username, password: newPassword, token });
  }

  /**
   * Create a user only if they don't already exist.
   * After creation, resets the password via API since the drawer form
   * may not reliably send the password field.
   * Returns true if the user was created, false if they already existed.
   */
  async ensureUserExists(data: UserData): Promise<boolean> {
    const exists = await this.userExists(data.username);
    if (exists) {
      return false;
    }
    await this.createUser(data);

    // Reset password via API — the drawer form sends password="" so the backend
    // sets the default password. We need to set the desired password explicitly.
    await this.resetUserPassword(data.username, data.password);

    return true;
  }

  /**
   * Delete a user by username via the API.
   * Returns the HTTP status code.
   */
  async deleteUser(username: string): Promise<number> {
    const token = await this.getAccessToken();
    if (!token) return -1;

    return this.page.evaluate(async (args: { username: string; token: string }) => {
      // Find user by listing and matching username
      const listRes = await fetch('/admin/admin/v1/users?noPaging=true', {
        headers: { Authorization: `Bearer ${args.token}` },
      });
      const data = await listRes.json();
      const items = data.items || [];
      const user = items.find((u: { username?: string }) => u.username === args.username);
      if (!user?.id) return 404;

      const res = await fetch(`/admin/admin/v1/users/${user.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${args.token}`,
          'Content-Type': 'application/json',
        },
      });
      return res.status;
    }, { username, token });
  }

  /**
   * Extract the current Bearer token from localStorage (Pinia persisted store).
   */
  private async getAccessToken(): Promise<string> {
    return this.page.evaluate(() => {
      for (const key of Object.keys(localStorage)) {
        try {
          const raw = localStorage.getItem(key);
          if (!raw) continue;
          const parsed = JSON.parse(raw);
          if (parsed?.accessToken && typeof parsed.accessToken === 'string') {
            return parsed.accessToken as string;
          }
        } catch {
          // not JSON, skip
        }
      }
      return '';
    });
  }
}
