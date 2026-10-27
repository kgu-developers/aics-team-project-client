import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e/msw',
  fullyParallel: true,
  workers: 2,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  outputDir: '../../.agent-local/playwright/msw-results',
  reporter: [['list']],
  use: {
    ...devices['Desktop Chrome'],
    baseURL: 'http://127.0.0.1:4174',
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
    serviceWorkers: 'allow',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'pnpm exec vite --host 127.0.0.1 --port 4174 --strictPort',
    url: 'http://127.0.0.1:4174/login',
    reuseExistingServer: false,
    env: {
      VITE_ENABLE_MSW: 'true',
      VITE_API_BASE_URL: '',
      VITE_API_PROXY_TARGET: '',
    },
  },
});
