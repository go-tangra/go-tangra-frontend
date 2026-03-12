import { test, expect, type Page } from '@playwright/test';
import { LoginPage, AbsenceTypePage } from '../pages';

const TESTER01 = { username: 'tester01', password: 'tester01' };
const ABSENCE_TYPE_NAME = 'Absence01';
const ABSENCE_TYPE_EDITED_NAME = 'Absence01-edited';

// Tests run in order as a single workflow: cleanup → create → edit → delete
test.describe.serial('HR Absence Type CRUD', () => {
  let page: Page;
  let absenceTypePage: AbsenceTypePage;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();

    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(TESTER01.username, TESTER01.password);
    await loginPage.waitForLoginSuccess();

    absenceTypePage = new AbsenceTypePage(page);
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('cleanup any existing test data', async () => {
    await absenceTypePage.goto();

    for (const name of [ABSENCE_TYPE_NAME, ABSENCE_TYPE_EDITED_NAME]) {
      if (await absenceTypePage.absenceTypeExists(name)) {
        await absenceTypePage.deleteAbsenceType(name);
      }
    }
    expect(await absenceTypePage.absenceTypeExists(ABSENCE_TYPE_NAME)).toBe(false);
    expect(await absenceTypePage.absenceTypeExists(ABSENCE_TYPE_EDITED_NAME)).toBe(false);
  });

  test('should create absence type "Absence01"', async () => {
    await absenceTypePage.createAbsenceType({
      name: ABSENCE_TYPE_NAME,
      description: 'E2E test absence type',
    });

    const exists = await absenceTypePage.absenceTypeExists(ABSENCE_TYPE_NAME);
    expect(exists).toBe(true);
  });

  test('should edit absence type "Absence01"', async () => {
    await absenceTypePage.editAbsenceType(ABSENCE_TYPE_NAME, {
      name: ABSENCE_TYPE_EDITED_NAME,
      description: 'E2E test absence type - edited',
    });

    const editedExists = await absenceTypePage.absenceTypeExists(ABSENCE_TYPE_EDITED_NAME);
    expect(editedExists).toBe(true);
  });

  test('should delete absence type "Absence01-edited"', async () => {
    await absenceTypePage.deleteAbsenceType(ABSENCE_TYPE_EDITED_NAME);

    const stillExists = await absenceTypePage.absenceTypeExists(ABSENCE_TYPE_EDITED_NAME);
    expect(stillExists).toBe(false);
  });
});
