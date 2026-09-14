import { env } from 'node:process';

import { test as base, expect, type Page } from '@playwright/test';

import { login } from '../support/ui';

export function setting(name: string) {
  const value = env[name];
  if (!value)
    throw new Error(
      `${name} 설정이 필요합니다. e2e/README.md의 계정 준비 조건을 확인하세요.`,
    );
  return value;
}

export const account = (kind: 'leader' | 'member' | 'survey' = 'leader') => ({
  studentNumber: setting(
    kind === 'leader'
      ? 'OOP_E2E_STUDENT_NUMBER'
      : `OOP_E2E_${kind.toUpperCase()}_NUMBER`,
  ),
  password: setting(
    kind === 'leader'
      ? 'OOP_E2E_PASSWORD'
      : `OOP_E2E_${kind.toUpperCase()}_PASSWORD`,
  ),
  name: '',
});

export async function signIn(
  page: Page,
  kind: 'leader' | 'member' | 'survey' = 'leader',
) {
  const identity = page.waitForResponse(
    r => r.url().endsWith('/api/v1/oop/users/me') && r.ok(),
  );
  const response = page.waitForResponse(
    r =>
      r.url().endsWith('/api/v1/oop/auth/login') &&
      r.request().method() === 'POST',
  );
  await login(page, account(kind));
  const result = await response;
  expect(result.status(), '실제 로그인 API').toBe(200);
  expect((await result.json()).role).toBe('STUDENT');
  const user = await (await identity).json();
  expect(user.studentNumber).toBe(account(kind).studentNumber);
  expect(
    user.sections.map((section: { id: number }) => String(section.id)),
  ).toContain(setting('OOP_E2E_SECTION_ID'));
  if (kind !== 'survey') {
    expect(String(user.teamId), '설정한 E2E 팀 소속').toBe(
      setting('OOP_E2E_TEAM_ID'),
    );
    await expect(page).toHaveURL(/\/student\/?$/);
    await expect(
      page.getByRole('tablist', { name: '학생 홈 바로가기' }),
    ).toBeVisible();
  }
}

export async function mutate(
  page: Page,
  method: string,
  path: string,
  body?: unknown,
) {
  // Browser-origin fetch preserves the real cookies and CSRF contract.
  return page.evaluate(
    async ({ method, path, body }) => {
      const token = document.cookie
        .split('; ')
        .find(c => c.startsWith('XSRF-TOKEN='))
        ?.slice('XSRF-TOKEN='.length);
      const response = await fetch(path, {
        method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'X-XSRF-TOKEN': decodeURIComponent(token) } : {}),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      return { status: response.status, text: await response.text() };
    },
    { method, path, body },
  );
}

export const test = base.extend<{ runtimeCheck: void }>({
  runtimeCheck: [
    async ({ page }, use) => {
      const errors: string[] = [];
      page.on('pageerror', error => errors.push(error.message));
      await use();
      expect(errors, '브라우저 JavaScript 오류').toEqual([]);
    },
    { auto: true },
  ],
});
export { expect };
