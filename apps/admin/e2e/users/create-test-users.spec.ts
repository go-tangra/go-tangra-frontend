import { test, expect } from '../fixtures';
import { type UserData, UsersPage } from '../pages';

const TEST_USERS: UserData[] = [
  {
    username: 'tester01',
    password: 'tester01',
    email: 'tester01@example.com',
    roles: [
      'Module User',
      'Paperless Administrator',
      'HR Administrator',
      'Bookmark Administrator',
      'Asset Administrator',
    ],
  },
  {
    username: 'tester02',
    password: 'tester02',
    email: 'tester02@example.com',
    roles: ['Module User', 'HR Employee','HR Viewer'],
  },
   {
    username: 'tester03',
    password: 'tester03',
    email: 'tester03@example.com',
    roles: ['Module User', 'HR Employee','HR Viewer'],
  },
];

test.describe('Create Test Users', () => {
  // Run sequentially — user creation depends on table state
  test.describe.configure({ mode: 'serial' });

  let usersPage: UsersPage;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext({
      storageState: 'apps/admin/e2e/.auth/user.json',
    });
    const page = await context.newPage();
    usersPage = new UsersPage(page);
    await usersPage.goto();
  });

  test.afterAll(async () => {
    await usersPage.page.context().close();
  });

  for (const userData of TEST_USERS) {
    test(`should ensure user "${userData.username}" exists`, async () => {
      const created = await usersPage.ensureUserExists(userData);

      if (created) {
        // Verify the user now appears in the table
        const exists = await usersPage.userExists(userData.username);
        expect(exists).toBe(true);
      }
    });
  }
});
