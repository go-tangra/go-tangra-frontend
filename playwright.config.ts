import { defineConfig, devices } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:8080';

export default defineConfig({
  testDir: './apps/admin/e2e',
  outputDir: './playwright-results',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'playwright-results/results.json' }],
  ],
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
    launchOptions: {
      args: [
        '--disable-features=PasswordCheck,PasswordLeakDetection,PasswordManagerOnboarding,PasswordGeneration,PasswordSuggestions',
        '--disable-save-password-bubble',
        '--disable-translate',
        '--no-default-browser-check',
      ],
    },
  },
  projects: [
    // Setup project: authenticates and saves storage state
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    // Seed project: creates test users (must run before other tests)
    {
      name: 'seed',
      testMatch: /create-test-users\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
    // Authenticated tests (exclude *.unauth.spec.ts, *.setup.ts, and seed tests)
    {
      name: 'chromium',
      testIgnore:
        /.*\.(unauth\.spec|setup|teardown\.spec)\.ts|create-test-users\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'apps/admin/e2e/.auth/user.json',
      },
      dependencies: ['seed'],
    },
    // Unauthenticated tests (login page, public pages)
    {
      name: 'unauthenticated',
      testMatch: /.*\.unauth\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['seed'],
    },
    // Teardown project: cleanup all test data (runs after all tests)
    {
      name: 'teardown',
      testMatch: /.*\.teardown\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['chromium', 'unauthenticated'],
    },
  ],
  webServer: process.env.CI
    ? {
        command: 'pnpm dev:antd',
        url: BASE_URL,
        reuseExistingServer: false,
        timeout: 120_000,
      }
    : undefined,
});
