import type { Locator, Page } from '@playwright/test';

/** Sidebar menu item selector — Vben uses its own menu component */
const SIDEBAR_ITEM = 'nav a, aside a';

export class DashboardPage {
  readonly page: Page;
  readonly sidebar: Locator;
  readonly heading: Locator;
  readonly sidebarItems: Locator;

  constructor(page: Page) {
    this.page = page;
    this.sidebar = page.locator('aside').first();
    this.heading = page.getByText('Default Dashboard');
    this.sidebarItems = page.locator(SIDEBAR_ITEM);
  }

  async goto() {
    await this.page.goto('/#/dashboard');
    await this.page.waitForLoadState('domcontentloaded');
    // Wait for dashboard content to render
    await this.heading.waitFor({ state: 'visible', timeout: 15_000 });
  }

  async getSidebarMenuItems(): Promise<string[]> {
    return this.sidebarItems.allTextContents();
  }

  async navigateToModule(menuText: string) {
    await this.page.getByRole('menuitem', { name: menuText }).click();
    await this.page.waitForLoadState('domcontentloaded');
  }
}
