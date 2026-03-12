import { test, expect } from '../fixtures';
import { DashboardPage } from '../pages';

test.describe('Dashboard', () => {
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    dashboardPage = new DashboardPage(page);
    await dashboardPage.goto();
  });

  test('should load dashboard after auth', async ({ page }) => {
    await expect(page).not.toHaveURL(/auth\/login/);
    await expect(dashboardPage.heading).toBeVisible();
  });

  test('should display sidebar navigation', async () => {
    await expect(dashboardPage.sidebar).toBeVisible();

    const menuItems = await dashboardPage.getSidebarMenuItems();
    expect(menuItems.length).toBeGreaterThan(0);
  });

  test('should navigate between modules via sidebar', async ({ page }) => {
    // "Analytics" is a menuitem under the expanded Dashboard menu
    await page.getByRole('menuitem', { name: 'Analytics' }).click();

    // URL should change from /dashboard/overview to /dashboard/analytics
    await expect(page).toHaveURL(/dashboard\/analytics/, { timeout: 10_000 });
  });
});
