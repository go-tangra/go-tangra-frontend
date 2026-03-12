import { test as base, expect } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUTH_FILE = path.join(__dirname, '..', '.auth', 'user.json');

/**
 * Credentials for E2E tests.
 * Override via E2E_USERNAME / E2E_PASSWORD env vars.
 */
const credentials = {
  username: process.env.E2E_USERNAME || 'admin',
  password: process.env.E2E_PASSWORD || 'admin123',
};

/**
 * API base URL for direct API calls (admin-service gateway).
 */
const API_URL = process.env.API_URL || 'http://localhost:7788';

export { AUTH_FILE, API_URL, credentials };

/**
 * Extended test fixture with authenticated page helpers.
 */
export const test = base.extend<{ authPage: void }>({
  authPage: [
    // eslint-disable-next-line no-empty-pattern
    async ({}, use) => {
      await use();
    },
    { auto: true },
  ],
});

export { expect };
