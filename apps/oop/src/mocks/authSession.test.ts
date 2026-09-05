import { afterEach, expect, it, vi } from 'vitest';

import { demoUserAccounts } from './data/users';

afterEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  vi.resetModules();
});

function requestWithCookie(name: string, value: string) {
  return new Request('http://localhost/api', {
    headers: { cookie: `${name}=${value}` },
  });
}

it('새 탭에서도 회전된 세션을 복원하고 기존 탭에 갱신과 폐기를 반영한다', async () => {
  const firstTab = await import('./authSession');
  firstTab.resetMockSessionState();
  const initial = firstTab.issueMockSession(demoUserAccounts[0]);
  const rotated = firstTab.rotateMockSession(
    requestWithCookie('refreshToken', initial.tokens.refreshToken),
  );
  expect(rotated).toBeDefined();
  if (!rotated) throw new Error('fixture session missing');

  sessionStorage.clear();
  vi.resetModules();
  const secondTab = await import('./authSession');
  const restored = secondTab.rotateMockSession(
    requestWithCookie('refreshToken', rotated.tokens.refreshToken),
  );
  expect(restored).toBeDefined();
  if (!restored) throw new Error('restored session missing');
  const authenticated = requestWithCookie(
    'accessToken',
    restored.tokens.accessToken,
  );
  expect(
    firstTab.getMockAuthenticatedAccount(authenticated)?.credentials
      .studentNumber,
  ).toBe(demoUserAccounts[0].credentials.studentNumber);

  const saved = localStorage.getItem('aics:demo-session-generations');
  expect(saved).toContain('generation');
  expect(saved).not.toContain('access-token');
  expect(saved).not.toContain('refresh-token');

  secondTab.revokeMockSession(
    requestWithCookie('refreshToken', restored.tokens.refreshToken),
  );
  expect(firstTab.getMockAuthenticatedAccount(authenticated)).toBeUndefined();
});
