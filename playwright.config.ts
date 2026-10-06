import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end tests against a running FlowDesk (frontend + backend). They do not start the
 * servers. See e2e/README.md for the required environment variables and test data.
 */
export default defineConfig({
  testDir: './e2e',
  // Tests share the users created in global setup and run in order
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 30_000,
  expect: { timeout: 10_000 },
  reporter: [['list']],
  globalSetup: './e2e/global-setup.ts',
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      // Uses the installed Chrome unless PW_CHANNEL is set (e.g. "msedge", or "" for bundled Chromium)
      use: { ...devices['Desktop Chrome'], channel: process.env.PW_CHANNEL ?? 'chrome' },
    },
  ],
});
