import {
  API_BASE_URL,
  ENDPOINTS,
  fetchLiveEditLock,
  submitLiveEditLock,
  removeLiveEditLock,
} from '@aics/api-client';
import type { LiveEditLockTarget } from '@aics/core';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, beforeEach, expect, it } from 'vitest';

import { useAuthStore } from '~/features/auth/authStore';

import {
  demoAccessToken,
  demoPartnerAccessToken,
  demoOtherSectionAccessToken,
} from '~/mocks/data/users';
import { createLiveEditLockHandlers } from '~/mocks/handlers/liveEditLock';

const target: LiveEditLockTarget = {
  targetType: 'PRESENTATION_CONTENT',
  targetId: 19,
};
const server = setupServer();
let now = Date.parse('2026-09-08T10:00:00Z');
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => {
  now = Date.parse('2026-09-08T10:00:00Z');
  server.use(...createLiveEditLockHandlers({ now: () => now }));
  useAuthStore.getState().setAccessToken(demoAccessToken);
});
afterEach(() => {
  server.resetHandlers();
  useAuthStore.getState().clearSession();
});
afterAll(() => server.close());

it('live GET/POST/DELETE는 숫자 submissionId만 전달하고 lease 필드를 만들지 않는다', async () => {
  const seen: { method: string; input: unknown }[] = [];
  server.use(
    http.get(`${API_BASE_URL}${ENDPOINTS.EDIT_LOCKS.ROOT}`, ({ request }) => {
      seen.push({
        method: 'GET',
        input: Object.fromEntries(new URL(request.url).searchParams),
      });
      return HttpResponse.json({ locked: false });
    }),
    http.post(
      `${API_BASE_URL}${ENDPOINTS.EDIT_LOCKS.ROOT}`,
      async ({ request }) => {
        seen.push({ method: 'POST', input: await request.json() });
        return HttpResponse.json({
          locked: true,
          lockedBy: '20260001',
          lockedAt: '2026-09-08 10:00',
        });
      },
    ),
    http.delete(
      `${API_BASE_URL}${ENDPOINTS.EDIT_LOCKS.ROOT}`,
      ({ request }) => {
        seen.push({
          method: 'DELETE',
          input: Object.fromEntries(new URL(request.url).searchParams),
        });
        return new HttpResponse(null, { status: 204 });
      },
    ),
  );
  expect(await fetchLiveEditLock(target)).toEqual({
    locked: false,
    lockedBy: null,
    lockedAt: null,
  });
  expect(
    await submitLiveEditLock({
      ...target,
      leaseId: 'not-a-server-field',
    } as LiveEditLockTarget),
  ).toEqual({
    locked: true,
    lockedBy: '20260001',
    lockedAt: '2026-09-08 10:00',
  });
  await removeLiveEditLock(target);
  expect(seen).toEqual([
    { method: 'GET', input: { targetType: target.targetType, targetId: '19' } },
    { method: 'POST', input: target },
    {
      method: 'DELETE',
      input: { targetType: target.targetType, targetId: '19' },
    },
  ]);
});

it('동일 계정 갱신과 다른 계정 충돌, TTL 경과 후 인수를 서버 계약대로 구분한다', async () => {
  expect((await submitLiveEditLock(target)).lockedBy).toBe('20260001');
  now += 30_000;
  expect((await submitLiveEditLock(target)).lockedBy).toBe('20260001');
  useAuthStore.getState().setAccessToken(demoPartnerAccessToken);
  await expect(submitLiveEditLock(target)).rejects.toMatchObject({
    response: { status: 409 },
  });
  await removeLiveEditLock(target);
  expect((await fetchLiveEditLock(target)).lockedBy).toBe('20260001');
  now += 120_001;
  expect((await fetchLiveEditLock(target)).locked).toBe(false);
  expect((await submitLiveEditLock(target)).lockedBy).toBe('20260003');
});

it('같은 계정의 오래된 탭도 현재 잠금을 해제할 수 있어 탭 소유권 보장으로 사용하지 않는다', async () => {
  await submitLiveEditLock(target);
  now += 30_000;
  await submitLiveEditLock(target);
  await removeLiveEditLock(target);
  expect((await fetchLiveEditLock(target)).locked).toBe(false);
});

it.each([0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1])(
  '잘못된 targetId %s는 HTTP 요청 전에 거부한다',
  async targetId => {
    await expect(submitLiveEditLock({ ...target, targetId })).rejects.toThrow(
      '잠금 대상',
    );
  },
);

it('PROJECT와 기존 block target은 API 경계에서 차단하고 raw PROJECT 조회는 서버처럼501이다', async () => {
  await expect(
    fetchLiveEditLock({ targetType: 'PROJECT', targetId: 19 }),
  ).rejects.toThrow('잠금 대상');
  await expect(
    fetchLiveEditLock({
      targetType: 'PROJECT_BLOCK',
      targetId: 19,
    } as unknown as LiveEditLockTarget),
  ).rejects.toThrow('잠금 대상');
  const response = await fetch(
    `${API_BASE_URL}/edit-locks?targetType=PROJECT&targetId=19`,
    { headers: { Authorization: `Bearer ${demoAccessToken}` } },
  );
  expect(response.status).toBe(501);
});

it('학생 인증과 제출 접근 권한 오류를 빈 잠금으로 숨기지 않는다', async () => {
  useAuthStore.getState().clearSession();
  await expect(fetchLiveEditLock(target)).rejects.toMatchObject({
    response: { status: 401 },
  });
  useAuthStore.getState().setAccessToken(demoOtherSectionAccessToken);
  await expect(fetchLiveEditLock(target)).rejects.toMatchObject({
    response: { status: 403 },
  });
});

it('잘못된 응답을 잠금 없는 성공으로 취급하지 않는다', async () => {
  server.use(
    http.get(`${API_BASE_URL}/edit-locks`, () =>
      HttpResponse.json({ locked: 'false' }),
    ),
  );
  await expect(fetchLiveEditLock(target)).rejects.toThrow('응답');
});
