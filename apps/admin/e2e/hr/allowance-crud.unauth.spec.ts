import { test, expect, type Page } from '@playwright/test';
import { LoginPage, AbsenceTypePage, AllowancePage, LeaveRequestPage } from '../pages';

const TESTER01 = { username: 'tester01', password: 'tester01' };
const TESTER02 = { username: 'tester02', password: 'tester02' };
const TESTER03 = { username: 'tester03', password: 'tester03' };
const ABSENCE_TYPE_NAME = 'SignedLeave01';
const TARGET_USERS = ['tester02', 'tester03'] as const;
const TOTAL_DAYS = 30;

// Full workflow: tester01 sets up data → tester02 creates leave request →
// tester03 creates leave request
test.describe.serial('HR Allowance & Leave Request workflow', () => {
  let page: Page;
  let loginPage: LoginPage;
  let absenceTypePage: AbsenceTypePage;
  let allowancePage: AllowancePage;
  let leaveRequestPage: LeaveRequestPage;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    loginPage = new LoginPage(page);
    absenceTypePage = new AbsenceTypePage(page);
    allowancePage = new AllowancePage(page);
    leaveRequestPage = new LeaveRequestPage(page);

    // Login as tester01
    await loginPage.goto();
    await loginPage.login(TESTER01.username, TESTER01.password);
    await loginPage.waitForLoginSuccess();
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('cleanup any existing test data', async () => {
    // Delete leave requests first (they reference allowances/absence types)
    await leaveRequestPage.goto();
    await leaveRequestPage.deleteAllRequestsByAbsenceType(ABSENCE_TYPE_NAME);

    // Delete allowances
    await allowancePage.goto();
    for (const user of TARGET_USERS) {
      if (await allowancePage.allowanceExists(user, ABSENCE_TYPE_NAME)) {
        await allowancePage.deleteAllowance(user, ABSENCE_TYPE_NAME);
      }
    }

    // Delete absence type
    await absenceTypePage.goto();
    if (await absenceTypePage.absenceTypeExists(ABSENCE_TYPE_NAME)) {
      await absenceTypePage.deleteAbsenceType(ABSENCE_TYPE_NAME);
    }
  });

  test('tester01: create absence type with signing required', async () => {
    await absenceTypePage.goto();

    await absenceTypePage.createAbsenceType({
      name: ABSENCE_TYPE_NAME,
      description: 'E2E test - signing required absence type',
      signingRequired: true,
    });

    const exists = await absenceTypePage.absenceTypeExists(ABSENCE_TYPE_NAME);
    expect(exists).toBe(true);
  });

  test('tester01: create allowance of 30 days for tester02', async () => {
    await allowancePage.goto();

    await allowancePage.createAllowance({
      userName: 'tester02',
      absenceTypeName: ABSENCE_TYPE_NAME,
      totalDays: TOTAL_DAYS,
      notes: 'E2E test allowance - 30 days for tester02',
    });

    const exists = await allowancePage.allowanceExists('tester02', ABSENCE_TYPE_NAME);
    expect(exists).toBe(true);
  });

  test('tester01: create allowance of 30 days for tester03', async () => {
    await allowancePage.createAllowance({
      userName: 'tester03',
      absenceTypeName: ABSENCE_TYPE_NAME,
      totalDays: TOTAL_DAYS,
      notes: 'E2E test allowance - 30 days for tester03',
    });

    const exists = await allowancePage.allowanceExists('tester03', ABSENCE_TYPE_NAME);
    expect(exists).toBe(true);
  });

  test('logout from tester01 and login as tester02', async () => {
    await loginPage.logout();

    await loginPage.login(TESTER02.username, TESTER02.password);
    await loginPage.waitForLoginSuccess();
  });

  test('tester02: create leave request', async () => {
    await leaveRequestPage.goto();

    const start = new Date();
    start.setDate(start.getDate() + 7);
    const end = new Date();
    end.setDate(end.getDate() + 9);

    const startDate = start.toISOString().split('T')[0]!;
    const endDate = end.toISOString().split('T')[0]!;

    await leaveRequestPage.createLeaveRequest({
      absenceTypeName: ABSENCE_TYPE_NAME,
      startDate,
      endDate,
      reason: 'E2E test leave request - tester02',
    });

    const exists = await leaveRequestPage.requestExists(ABSENCE_TYPE_NAME);
    expect(exists).toBe(true);
  });

  test('logout from tester02 and login as tester03', async () => {
    await loginPage.logout();

    await loginPage.login(TESTER03.username, TESTER03.password);
    await loginPage.waitForLoginSuccess();
  });

  test('tester03: create leave request', async () => {
    await leaveRequestPage.goto();

    const start = new Date();
    start.setDate(start.getDate() + 10);
    const end = new Date();
    end.setDate(end.getDate() + 12);

    const startDate = start.toISOString().split('T')[0]!;
    const endDate = end.toISOString().split('T')[0]!;

    await leaveRequestPage.createLeaveRequest({
      absenceTypeName: ABSENCE_TYPE_NAME,
      startDate,
      endDate,
      reason: 'E2E test leave request - tester03',
    });

    const exists = await leaveRequestPage.requestExists(ABSENCE_TYPE_NAME);
    expect(exists).toBe(true);
  });

  // --- Permission checks: employees should NOT be able to delete requests ---

  test('tester03: cannot delete leave requests (403)', async () => {
    const status = await leaveRequestPage.tryDeleteFirstRequest(ABSENCE_TYPE_NAME);
    expect(status).toBe(403);
  });

  test('logout from tester03 and login as tester02 for delete check', async () => {
    await loginPage.logout();

    await loginPage.login(TESTER02.username, TESTER02.password);
    await loginPage.waitForLoginSuccess();
  });

  test('tester02: cannot delete leave requests (403)', async () => {
    await leaveRequestPage.goto();
    const status = await leaveRequestPage.tryDeleteFirstRequest(ABSENCE_TYPE_NAME);
    expect(status).toBe(403);
  });

  test('logout from tester02 and login as tester01 for delete check', async () => {
    await loginPage.logout();

    await loginPage.login(TESTER01.username, TESTER01.password);
    await loginPage.waitForLoginSuccess();
  });

  test('tester01 (admin): can delete leave requests (200)', async () => {
    await leaveRequestPage.goto();
    const status = await leaveRequestPage.tryDeleteFirstRequest(ABSENCE_TYPE_NAME);
    expect(status).toBe(200);
  });
});
