import { resolve } from 'node:path';

import { expect, test, type BrowserContext, type Page } from '@playwright/test';

// Run the actual API client in two independent JS realms. The server below is
// controlled test transport, not evidence of production RTR or CORS behavior.
test.use({ serviceWorkers: 'block' });
const modulePath = `/@fs/${resolve('../../packages/api-client/src/index.ts')}`;

async function openClient(context: BrowserContext) {
  const page = await context.newPage();
  await page.goto('/session-recovery-harness');
  await page.evaluate(async path => {
    // @ts-expect-error Vite serves this TS source as a browser ES module.
    window.testApi = await import(path);
    // @ts-expect-error Test-only browser handle.
    window.testApi.setApiSessionActive(true);
  }, modulePath);
  return page;
}

function request(page: Page) {
  return page.evaluate(async () => {
    // @ts-expect-error Test-only browser handle.
    const result = await window.testApi.apiClient.get('/recovery-resource');
    return result.data;
  });
}

test.beforeEach(async ({ context }) => {
  await context.route('**/session-recovery-harness', route =>
    route.fulfill({
      contentType: 'text/html',
      body: '<!doctype html><title>Session recovery test</title>',
    }),
  );
});

test('두 탭의 동시 401은 실제 Web Lock 아래 한 번 회전하고 쿠키로 재전송한다', async ({
  context,
}) => {
  let refreshes = 0;
  let expiredRequests = 0;
  let release!: () => void;
  const bothExpired = new Promise<void>(resolve => {
    release = resolve;
  });
  await context.route('**/recovery-resource', async route => {
    if (route.request().headers().cookie?.includes('recovery-access=new')) {
      await route.fulfill({ json: { ok: true } });
      return;
    }
    expiredRequests += 1;
    if (expiredRequests === 2) release();
    await bothExpired;
    await route.fulfill({ status: 401 });
  });
  await context.route('**/api/v1/auth/refresh', async route => {
    refreshes += 1;
    await route.fulfill({
      headers: {
        'Set-Cookie': 'recovery-access=new; Path=/; HttpOnly; SameSite=Lax',
      },
      json: { message: 'ok', role: 'STUDENT' },
    });
  });
  const first = await openClient(context);
  const second = await openClient(context);
  expect(await first.evaluate(() => !!navigator.locks)).toBe(true);
  expect(await Promise.all([request(first), request(second)])).toEqual([
    { ok: true },
    { ok: true },
  ]);
  expect(refreshes).toBe(1);
  expect(expiredRequests).toBe(2);
  expect(await first.evaluate(() => document.cookie)).not.toContain(
    'recovery-access',
  );
});

test('한 탭의 불확실한 refresh 실패 뒤 다른 탭은 같은 토큰을 재사용하지 않는다', async ({
  context,
}) => {
  let refreshes = 0;
  await context.route('**/recovery-resource', route =>
    route.fulfill({ status: 401 }),
  );
  await context.route('**/api/v1/auth/refresh', route => {
    refreshes += 1;
    return route.abort('failed');
  });
  const first = await openClient(context);
  const second = await openClient(context);
  await expect(request(first)).rejects.toThrow('세션 갱신');
  await expect(request(second)).rejects.toThrow('세션 갱신');
  expect(refreshes).toBe(1);
});

test('다른 탭의 로그아웃은 진행 중인 회전 이후 쿠키를 삭제한다', async ({
  context,
}) => {
  let release!: () => void;
  let started!: () => void;
  const refreshing = new Promise<void>(resolve => {
    started = resolve;
  });
  const finishRefresh = new Promise<void>(resolve => {
    release = resolve;
  });
  const order: string[] = [];
  await context.route('**/recovery-resource', route =>
    route.fulfill({ status: 401 }),
  );
  await context.route('**/api/v1/auth/refresh', async route => {
    started();
    await finishRefresh;
    order.push('refresh');
    await route.fulfill({
      headers: { 'Set-Cookie': 'recovery-access=new; Path=/; HttpOnly' },
      json: { message: 'ok', role: 'STUDENT' },
    });
  });
  await context.route('**/api/v1/auth/logout', async route => {
    order.push('logout');
    await route.fulfill({
      headers: {
        'Set-Cookie': 'recovery-access=; Path=/; HttpOnly; Max-Age=0',
      },
      json: { message: 'ok' },
    });
  });
  const first = await openClient(context);
  const second = await openClient(context);
  const original = request(first).catch(() => undefined);
  await refreshing;
  const logout = second.evaluate(async () => {
    // @ts-expect-error Test-only browser handle.
    await window.testApi.submitLogout();
  });
  await expect
    .poll(() =>
      first.evaluate(
        async () => (await navigator.locks.query()).pending?.length,
      ),
    )
    .toBe(1);
  release();
  await Promise.all([original, logout]);
  expect(order).toEqual(['refresh', 'logout']);
  expect(
    (await context.cookies()).find(cookie => cookie.name === 'recovery-access'),
  ).toBeUndefined();
});
