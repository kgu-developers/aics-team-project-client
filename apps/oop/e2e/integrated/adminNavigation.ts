import type { Page } from '@playwright/test';

export async function gotoAdminPath(
  page: Pick<Page, 'goto' | 'url'>,
  path: string,
  recover: () => Promise<void>,
) {
  await page.goto(path);
  if (new URL(page.url()).pathname !== '/login') return;

  await recover();
  await page.goto(path);
  if (new URL(page.url()).pathname === '/login')
    throw new Error(`Admin session recovery failed for ${path}`);
}
