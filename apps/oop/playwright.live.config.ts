import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadEnvFile } from 'node:process';
import { fileURLToPath } from 'node:url';

import { defineConfig, devices } from '@playwright/test';

const appDir = fileURLToPath(new URL('.', import.meta.url));
const envFile =
  process.env.OOP_E2E_ENV_FILE ??
  resolve(appDir, '../../.agent-local/e2e/live.env');
if (existsSync(envFile)) loadEnvFile(envFile);
const remote = process.env.OOP_E2E_BASE_URL;
if (
  !process.env.OOP_E2E_STUDENT_NUMBER ||
  !process.env.OOP_E2E_PASSWORD ||
  (!remote && !process.env.OOP_E2E_API_URL)
) {
  throw new Error(
    '실서버 E2E 접속 설정이 필요합니다. e2e/README.md와 .agent-local/e2e/live.env를 확인하세요.',
  );
}

export default defineConfig({
  testDir: './e2e/live',
  // Permanent submissions are deliberately selected with --grep @submit.
  grepInvert: process.env.OOP_E2E_SUBMIT === '1' ? undefined : /@submit/,
  forbidOnly: Boolean(process.env.CI),
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  expect: { timeout: 12_000 },
  outputDir: '../../.agent-local/playwright/live-results',
  reporter: [['list']],
  use: {
    actionTimeout: 12_000,
    navigationTimeout: 20_000,
    ...devices['Desktop Chrome'],
    baseURL: remote ?? 'http://localhost:5173',
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
    serviceWorkers: 'block',
    trace: process.env.OOP_E2E_TRACE === '1' ? 'retain-on-failure' : 'off',
    screenshot: 'only-on-failure',
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
