import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadEnvFile } from 'node:process';
import { fileURLToPath } from 'node:url';

import { defineConfig, devices } from '@playwright/test';

const appDir = fileURLToPath(new URL('.', import.meta.url));
const envFile =
  process.env.OOP_E2E_INTEGRATED_ENV_FILE ??
  resolve(appDir, '../../.agent-local/e2e/integrated.env');
if (existsSync(envFile)) loadEnvFile(envFile);
if (!process.env.OOP_E2E_ADMIN_NUMBER || !process.env.OOP_E2E_ADMIN_PASSWORD) {
  throw new Error(
    '통합 E2E 관리자 계정 설정이 필요합니다. e2e/docs/integrated.md를 확인하세요.',
  );
}
const remote = process.env.OOP_E2E_BASE_URL;
if (!remote && !process.env.OOP_E2E_API_URL) {
  throw new Error('OOP_E2E_BASE_URL 또는 OOP_E2E_API_URL이 필요합니다.');
}

export default defineConfig({
  testDir: './e2e/integrated',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  workers: 1,
  retries: 0,
  timeout: 600_000,
  expect: { timeout: 15_000 },
  outputDir: '../../.agent-local/playwright/integrated-results',
  reporter: [
    ['list', { printSteps: true }],
    [
      'html',
      {
        outputFolder: '../../.agent-local/playwright/integrated-report',
        open: 'never',
      },
    ],
  ],
  use: {
    ...devices['Desktop Chrome'],
    baseURL: remote ?? 'http://localhost:5173',
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
    serviceWorkers: 'block',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    trace: 'off',
  },
  webServer: remote
    ? undefined
    : {
        command: 'pnpm exec vite --host localhost --port 5173 --strictPort',
        url: 'http://localhost:5173/login',
        reuseExistingServer: false,
        timeout: 120_000,
        env: {
          VITE_ENABLE_MSW: 'false',
          VITE_API_BASE_URL: '',
          VITE_API_PROXY_TARGET: process.env.OOP_E2E_API_URL!,
        },
      },
});
