import {
  API_BASE_URL,
  ENDPOINTS,
  fetchLiveEditLock,
  submitLiveEditLock,
  removeLiveEditLock,
} from '@aics/api-client';
import { liveEditLockTargetTypes, type LiveEditLockTarget } from '@aics/core';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, beforeEach, expect, it } from 'vitest';

import { useAuthStore } from '~/features/auth/authStore';

import { liveEditLockMockResources } from '~/mocks/data/liveEditLock';
import {
  demoAccessToken,
  demoPartnerAccessToken,
  demoOtherSectionAccessToken,
  demoOtherSectionStudent,
  demoStudent,
} from '~/mocks/data/users';
import { createLiveEditLockHandlers } from '~/mocks/handlers/liveEditLock';

const target: LiveEditLockTarget = {
  targetType: 'PROJECT',
  targetId: 19,
  sectionKey: 'TEAM_INFO',
};
const server = setupServer();
let now = Date.parse('2026-09-10T10:00:00Z');
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => {
  now = Date.parse('2026-09-10T10:00:00Z');
  server.use(...createLiveEditLockHandlers({ now: () => now }));
  useAuthStore.getState().setAccessToken(demoAccessToken);
});
afterEach(() => {
  server.resetHandlers();
  useAuthStore.getState().clearSession();
});
afterAll(() => server.close());

it.each(liveEditLockTargetTypes)(
  '%s 조회·획득·해제는 문서 ID와 영역 키를 전달하고 응답의 편집자 이름을 보존한다',
  async targetType => {
    const input = { ...target, targetType };
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
            lockedBy: demoStudent.studentNumber,
            lockedByName: demoStudent.name,
            lockedAt: '2026-09-10 10:00',
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
    expect(await fetchLiveEditLock(input)).toEqual({
      locked: false,
      lockedBy: null,
      lockedByName: null,
      lockedAt: null,
    });
    expect(
      await submitLiveEditLock({
        ...input,
        leaseId: 'not-a-server-field',
      } as LiveEditLockTarget),
    ).toEqual({
      locked: true,
      lockedBy: demoStudent.studentNumber,
      lockedByName: demoStudent.name,
      lockedAt: '2026-09-10 10:00',
    });
    await expect(removeLiveEditLock(input)).resolves.toBeUndefined();
    expect(seen).toEqual([
      { method: 'GET', input: { ...input, targetId: '19' } },
      { method: 'POST', input },
      { method: 'DELETE', input: { ...input, targetId: '19' } },
    ]);
  },
);

it('같은 계정 갱신·다른 계정409·2분 만료 후 인수를 구분한다', async () => {
  expect((await submitLiveEditLock(target)).lockedByName).toBe(
    demoStudent.name,
  );
  now += 30_000;
  expect((await submitLiveEditLock(target)).lockedBy).toBe(
    demoStudent.studentNumber,
  );
  useAuthStore.getState().setAccessToken(demoPartnerAccessToken);
  await expect(submitLiveEditLock(target)).rejects.toMatchObject({
    response: { status: 409, data: { code: 'EDIT_LOCK_CONFLICT' } },
  });
  await removeLiveEditLock(target);
  expect((await fetchLiveEditLock(target)).lockedBy).toBe(
    demoStudent.studentNumber,
  );
  now += 120_000;
  expect((await fetchLiveEditLock(target)).locked).toBe(true);
  now += 1;
  expect((await fetchLiveEditLock(target)).locked).toBe(false);
  expect((await submitLiveEditLock(target)).lockedBy).toBe('20260003');
});

it('문서 종류와 영역 키가 다르면 잠금과 해제를 독립적으로 처리한다', async () => {
  const otherArea = { ...target, sectionKey: 'PROJECT_INFO' };
  const meeting: LiveEditLockTarget = {
    ...target,
    targetType: 'MEETING_RECORD',
  };
  await submitLiveEditLock(target);
  expect((await fetchLiveEditLock(otherArea)).locked).toBe(false);
  expect((await fetchLiveEditLock(meeting)).locked).toBe(false);
  useAuthStore.getState().setAccessToken(demoPartnerAccessToken);
  await submitLiveEditLock(otherArea);
  await submitLiveEditLock(meeting);
  await removeLiveEditLock(otherArea);
  expect((await fetchLiveEditLock(otherArea)).locked).toBe(false);
  expect((await fetchLiveEditLock(meeting)).lockedBy).toBe('20260003');
  expect((await fetchLiveEditLock(target)).lockedBy).toBe(
    demoStudent.studentNumber,
  );
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

it.each([undefined, null, '', '  ', 'x'.repeat(51)])(
  '유효한 영역 키가 없으면 조회·획득·해제를 차단한다: %s',
  async sectionKey => {
    const invalid = { ...target, sectionKey } as LiveEditLockTarget;
    await expect(fetchLiveEditLock(invalid)).rejects.toThrow('잠금 대상');
    await expect(submitLiveEditLock(invalid)).rejects.toThrow('잠금 대상');
    await expect(removeLiveEditLock(invalid)).rejects.toThrow('잠금 대상');
  },
);

it.each(['PROJECT_BLOCK', 'PRESENTATION_CONTENT'])(
  '서버가 지원하지 않는 %s를 다른 문서로 매핑하지 않는다',
  async targetType => {
    await expect(
      fetchLiveEditLock({ ...target, targetType } as LiveEditLockTarget),
    ).rejects.toThrow('잠금 대상');
  },
);

it('MSW도 필수 영역 키가 빠진 요청을 거절한다', async () => {
  const response = await fetch(`${API_BASE_URL}/edit-locks`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${demoAccessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      targetType: target.targetType,
      targetId: target.targetId,
    }),
  });
  expect(response.status).toBe(400);
  expect(await response.json()).toEqual({ code: 'INVALID_INPUT' });
});

it('인증·팀 접근·없는 대상 오류를 빈 잠금으로 숨기지 않는다', async () => {
  useAuthStore.getState().clearSession();
  await expect(fetchLiveEditLock(target)).rejects.toMatchObject({
    response: { status: 401 },
  });
  useAuthStore.getState().setAccessToken(demoOtherSectionAccessToken);
  await expect(fetchLiveEditLock(target)).rejects.toMatchObject({
    response: { status: 403 },
  });
  useAuthStore.getState().setAccessToken(demoAccessToken);
  await expect(
    fetchLiveEditLock({ ...target, targetId: 999 }),
  ).rejects.toMatchObject({
    response: { status: 404 },
  });
});

it('팀원 목록에 있어도 해당 분반의 학생이 아니면 거절한다', async () => {
  server.use(
    ...createLiveEditLockHandlers({
      resources: liveEditLockMockResources.map(resource => ({
        ...resource,
        studentNumbers: [
          ...resource.studentNumbers,
          demoOtherSectionStudent.studentNumber,
        ],
      })),
    }),
  );
  useAuthStore.getState().setAccessToken(demoOtherSectionAccessToken);
  await expect(submitLiveEditLock(target)).rejects.toMatchObject({
    response: { status: 403 },
  });
});

it.each([{ locked: 'false' }, { locked: true, lockedByName: 42 }])(
  '잘못된 상태 또는 편집자 이름을 정상 응답으로 취급하지 않는다',
  async body => {
    server.use(
      http.get(`${API_BASE_URL}/edit-locks`, () => HttpResponse.json(body)),
    );
    await expect(fetchLiveEditLock(target)).rejects.toThrow();
  },
);

it('편집자 이름이 null이면 계정 식별자와 잠금 상태를 보존한다', async () => {
  server.use(
    http.get(`${API_BASE_URL}/edit-locks`, () =>
      HttpResponse.json({
        locked: true,
        lockedBy: demoStudent.studentNumber,
        lockedByName: null,
      }),
    ),
  );
  expect(await fetchLiveEditLock(target)).toMatchObject({
    locked: true,
    lockedBy: demoStudent.studentNumber,
    lockedByName: null,
  });
});

it('중간보고서의 두 서버 targetType을 같은 잠금으로 임의 변환하지 않는다', async () => {
  const report: LiveEditLockTarget = { ...target, targetType: 'MID_REPORT' };
  const block: LiveEditLockTarget = {
    ...target,
    targetType: 'MID_REPORT_BLOCK',
  };
  await submitLiveEditLock(report);
  expect((await fetchLiveEditLock(block)).locked).toBe(false);
  await submitLiveEditLock(block);
  await removeLiveEditLock(block);
  expect((await fetchLiveEditLock(block)).locked).toBe(false);
  expect((await fetchLiveEditLock(report)).locked).toBe(true);
});
