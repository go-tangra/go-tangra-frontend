import { test, expect, type Page } from '@playwright/test';
import { LoginPage, LeaveRequestPage, AllowancePage, AbsenceTypePage, UsersPage } from '../pages';

const TESTER01 = { username: 'tester01', password: 'tester01' };
const ABSENCE_TYPE_NAME = 'SignedLeave01';
const TARGET_USERS = ['tester02', 'tester03'] as const;
const TEST_USERS = ['tester01', 'tester02', 'tester03'] as const;

test.describe.serial('Teardown: cleanup all test data', () => {
  let page: Page;
  let loginPage: LoginPage;
  let leaveRequestPage: LeaveRequestPage;
  let allowancePage: AllowancePage;
  let absenceTypePage: AbsenceTypePage;
  let usersPage: UsersPage;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    loginPage = new LoginPage(page);
    leaveRequestPage = new LeaveRequestPage(page);
    allowancePage = new AllowancePage(page);
    absenceTypePage = new AbsenceTypePage(page);
    usersPage = new UsersPage(page);

    // Login as tester01 (HR Admin) for HR cleanup
    await loginPage.goto();
    await loginPage.login(TESTER01.username, TESTER01.password);
    await loginPage.waitForLoginSuccess();
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('delete all leave requests for test absence type', async () => {
    await leaveRequestPage.goto();
    await leaveRequestPage.deleteAllRequestsByAbsenceType(ABSENCE_TYPE_NAME);

    // Verify no requests remain for the test absence type
    const count = await leaveRequestPage.countRequestsByAbsenceType(ABSENCE_TYPE_NAME);
    expect(count).toBe(0);
  });

  test('delete all allowances for test users', async () => {
    await allowancePage.goto();

    for (const user of TARGET_USERS) {
      if (await allowancePage.allowanceExists(user, ABSENCE_TYPE_NAME)) {
        await allowancePage.deleteAllowance(user, ABSENCE_TYPE_NAME);
      }
    }

    // Verify allowances are gone
    for (const user of TARGET_USERS) {
      const exists = await allowancePage.allowanceExists(user, ABSENCE_TYPE_NAME);
      expect(exists).toBe(false);
    }
  });

  test('delete test absence type', async () => {
    await absenceTypePage.goto();

    if (await absenceTypePage.absenceTypeExists(ABSENCE_TYPE_NAME)) {
      await absenceTypePage.deleteAbsenceType(ABSENCE_TYPE_NAME);
    }

    const exists = await absenceTypePage.absenceTypeExists(ABSENCE_TYPE_NAME);
    expect(exists).toBe(false);
  });

  test('logout from tester01 and login as admin', async () => {
    await loginPage.logout();
    await loginPage.login('admin', 'admin123');
    await loginPage.waitForLoginSuccess();
  });

  test('delete test users', async () => {
    await usersPage.goto();

    for (const username of TEST_USERS) {
      if (await usersPage.userExists(username)) {
        const status = await usersPage.deleteUser(username);
        expect(status).toBe(200);
      }
    }

    // Verify users are gone
    for (const username of TEST_USERS) {
      const exists = await usersPage.userExists(username);
      expect(exists).toBe(false);
    }
  });
});
