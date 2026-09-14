import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  testIgnore: ['**/live/**', '**/integrated/**'],
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : 4,
  timeout: 30_000,
  expect: { timeout: 8_000 },
  outputDir: '../../.agent-local/playwright/results',
  reporter: [
    ['list'],
    [
      'html',
      { outputFolder: '../../.agent-local/playwright/report', open: 'never' },
    ],
  ],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
    serviceWorkers: 'block',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    {
      name: 'mobile-chromium',
      testMatch: '**/navigation.spec.ts',
      use: { ...devices['Pixel 7'] },
    },
  ],
  webServer: {
    command: 'pnpm exec vite --host 127.0.0.1 --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173/login',
    reuseExistingServer: false,
    timeout: 120_000,
    // Exercise the deployed UI paths; do not start the alternate demo flow.
    env: {
      VITE_ENABLE_MSW: 'false',
      VITE_API_BASE_URL: '',
      VITE_API_PROXY_TARGET: '',
    },
  },
});
