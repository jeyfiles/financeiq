import { defineConfig, devices } from '@playwright/test';

// BASE_URL runs the same tests against another server, for example the live site:
// BASE_URL=https://jeyinsights.com npx playwright test
const BASE_URL = process.env.BASE_URL;

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  reporter: [['list']],
  use: {
    baseURL: BASE_URL ?? 'http://localhost:4331',
    trace: 'retain-on-failure',
    // CHROMIUM_PATH lets the tests use a Chromium that is already installed.
    launchOptions: process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
  },
  webServer: BASE_URL ? undefined : {
    command: 'npx astro preview --port 4331',
    url: 'http://localhost:4331/financeiq/',
    reuseExistingServer: true,
    timeout: 60_000,
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 900 } } },
    { name: 'phone', use: { ...devices['Pixel 7'] } },
  ],
});
