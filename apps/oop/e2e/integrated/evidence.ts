import type { Buffer } from 'node:buffer';

import type { Page } from '@playwright/test';

function privacyMasks(page: Page, runKey: string) {
  return [
    page.locator('pre, input[type="password"]'),
    page.getByRole('textbox', { name: /^학번/ }),
    // Admin tables can contain other sections; retain only this run's rows.
    ...(new URL(page.url()).pathname.startsWith('/admin')
      ? [page.getByRole('row').filter({ hasNotText: runKey })]
      : []),
  ];
}

export function maskedScreenshot(page: Page, runKey: string) {
  return page.screenshot({
    fullPage: true,
    timeout: 5_000,
    mask: privacyMasks(page, runKey),
  });
}

export async function captureFailurePage({
  page,
  runKey,
  name,
  write,
  describeError,
}: {
  page: Page;
  runKey: string;
  name: string;
  write: (name: string, data: string | Buffer) => Promise<void>;
  describeError: (error: unknown) => string;
}) {
  // Every failed route gets masked evidence, even if dialog capture later fails.
  await write(`${name}-failure.png`, await maskedScreenshot(page, runKey));
  const dialog = page.getByRole('dialog').filter({ hasText: runKey });
  if ((await dialog.count()) === 1 && (await dialog.isVisible())) {
    await write(
      `${name}-dialog.png`,
      await dialog.screenshot({
        timeout: 5_000,
        mask: privacyMasks(page, runKey),
      }),
    );
    await write(`${name}-dialog.txt`, describeError(await dialog.innerText()));
  }
}
