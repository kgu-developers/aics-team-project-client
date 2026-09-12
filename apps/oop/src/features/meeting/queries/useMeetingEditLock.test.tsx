import { API_BASE_URL, fetchLiveEditLock } from '@aics/api-client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { StrictMode, type PropsWithChildren } from 'react';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  expect,
  it,
  vi,
} from 'vitest';

import { useAuthStore } from '~/features/auth/authStore';

import { useMeetingEditLock } from './useMeetingEditLock';
import { meetingEditLockTarget } from '../model/meetingEditLock';
import { mapStudentMeeting } from '../model/studentMeeting';

import { meetingApiRecord, meetingApiTeam } from '~/mocks/data/meetingApi';
import {
  demoAccessToken,
  demoPartnerAccessToken,
  demoStudent,
} from '~/mocks/data/users';
import { createLiveEditLockHandlers } from '~/mocks/handlers/liveEditLock';

const server = setupServer();
const clients: QueryClient[] = [];
const target = meetingEditLockTarget('19')!;
const record = mapStudentMeeting(
  { ...meetingApiRecord, id: '19', teamId: '7', location: null },
  [],
  meetingApiTeam,
);
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => {
  useAuthStore.getState().setAccessToken(demoAccessToken);
  useAuthStore.getState().setCurrentUser({ ...demoStudent, teamId: '7' });
  server.use(...createLiveEditLockHandlers());
});
afterEach(() => {
  clients.splice(0).forEach(client => client.clear());
  server.resetHandlers();
  server.events.removeAllListeners();
  useAuthStore.getState().clearSession();
  vi.useRealTimers();
});
afterAll(() => server.close());

function setup(reload = vi.fn(async () => record)) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  clients.push(client);
  const wrapper = ({ children }: PropsWithChildren) => (
    <StrictMode>
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </StrictMode>
  );
  return {
    reload,
    ...renderHook(({ id }) => useMeetingEditLock(id, reload), {
      wrapper,
      initialProps: { id: '19' },
    }),
  };
}

it('StrictMode에서 한 번 획득하고 최신 회의록을 읽은 뒤 편집을 허용한다', async () => {
  const bodies: unknown[] = [];
  server.use(
    http.post(`${API_BASE_URL}/edit-locks`, async ({ request }) => {
      bodies.push(await request.clone().json());
      return undefined;
    }),
  );
  const { result, reload } = setup();
  expect(result.current.canEdit).toBe(false);
  await waitFor(() => expect(result.current.canEdit).toBe(true));
  expect(bodies).toEqual([target]);
  expect(reload).toHaveBeenCalledOnce();
  expect(result.current.record).toEqual(record);
  await act(() => result.current.finish());
  expect(await fetchLiveEditLock(target)).toMatchObject({ locked: false });
});

it('다른 팀원이 편집 중이면 이름을 보여주고 원본 편집을 시작하지 않는다', async () => {
  await fetch(`${API_BASE_URL}/edit-locks`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${demoPartnerAccessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(target),
  });
  const { result, reload } = setup();
  await waitFor(() => expect(result.current.pending).toBe(false));
  expect(result.current.canEdit).toBe(false);
  expect(result.current.message).toContain('OOP 데모 학생 B');
  expect(reload).not.toHaveBeenCalled();
  await fetch(
    `${API_BASE_URL}/edit-locks?targetType=MEETING_RECORD&targetId=19&sectionKey=MEETING_RECORD`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${demoPartnerAccessToken}` },
    },
  );
  await act(() => result.current.retry());
  expect(result.current.canEdit).toBe(true);
});

it('45초마다 소유 상태를 확인한 후 같은 계정의 잠금을 갱신한다', async () => {
  vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
  const writes = vi.fn();
  server.use(
    http.post(`${API_BASE_URL}/edit-locks`, () => {
      writes();
      return undefined;
    }),
  );
  const { result } = setup();
  await vi.waitFor(() => expect(result.current.canEdit).toBe(true));
  await act(async () => {
    await vi.advanceTimersByTimeAsync(45_000);
  });
  await vi.waitFor(() => expect(writes).toHaveBeenCalledTimes(2));
  await vi.waitFor(() => expect(result.current.canEdit).toBe(true));
});

it('잠금 상실 시 초안을 유지하고 자동 재획득·해제를 보내지 않는다', async () => {
  const { result } = setup();
  await waitFor(() => expect(result.current.canEdit).toBe(true));
  const write = vi.fn();
  server.use(
    http.get(`${API_BASE_URL}/edit-locks`, () =>
      HttpResponse.json({
        locked: true,
        lockedBy: '20260003',
        lockedByName: '다른 팀원',
        lockedAt: null,
      }),
    ),
    http.post(`${API_BASE_URL}/edit-locks`, () => {
      write();
      return HttpResponse.error();
    }),
    http.delete(`${API_BASE_URL}/edit-locks`, () => {
      write();
      return HttpResponse.error();
    }),
  );
  await act(() => result.current.confirmOwnership());
  expect(result.current.canEdit).toBe(false);
  expect(result.current.record).toEqual(record);
  expect(result.current.lost).toBe(true);
  await act(() => result.current.finish());
  expect(write).not.toHaveBeenCalled();
});

it('백그라운드에서 확인 유효 시간이 지나면 포커스 복귀 시 저장을 막는다', async () => {
  vi.useFakeTimers({ toFake: ['Date'] });
  const { result } = setup();
  await waitFor(() => expect(result.current.canEdit).toBe(true));
  vi.setSystemTime(Date.now() + 120_000);
  await act(async () => {
    window.dispatchEvent(new Event('focus'));
  });
  await waitFor(() => expect(result.current.lost).toBe(true));
});

it('잠금 조회 실패 뒤 초안은 남고 저장은 차단된다', async () => {
  const { result } = setup();
  await waitFor(() => expect(result.current.canEdit).toBe(true));
  server.use(
    http.get(`${API_BASE_URL}/edit-locks`, () => HttpResponse.error()),
  );
  await act(() => result.current.confirmOwnership());
  expect(result.current.lost).toBe(true);
  expect(result.current.record).toEqual(record);
});

it('소유 확인 응답을 기다리는 동안 유효 시간이 지나면 다시 획득하지 않는다', async () => {
  vi.useFakeTimers({ toFake: ['Date'] });
  const { result } = setup();
  await waitFor(() => expect(result.current.canEdit).toBe(true));
  const renew = vi.fn();
  server.use(
    http.get(`${API_BASE_URL}/edit-locks`, () => {
      vi.setSystemTime(Date.now() + 120_000);
      return HttpResponse.json({
        locked: true,
        lockedBy: '20260001',
        lockedByName: 'A',
        lockedAt: null,
      });
    }),
    http.post(`${API_BASE_URL}/edit-locks`, () => {
      renew();
      return HttpResponse.error();
    }),
  );
  await act(() => result.current.confirmOwnership());
  expect(result.current.lost).toBe(true);
  expect(result.current.record).toEqual(record);
  expect(renew).not.toHaveBeenCalled();
});

it('해제 실패는 편집을 종료하며 다시 저장 가능한 상태로 돌아가지 않는다', async () => {
  const { result } = setup();
  await waitFor(() => expect(result.current.canEdit).toBe(true));
  server.use(
    http.delete(`${API_BASE_URL}/edit-locks`, () => HttpResponse.error()),
  );
  await act(async () => expect(await result.current.finish()).toBe(false));
  expect(result.current.canEdit).toBe(false);
});

it('이탈 뒤 늦게 도착한 획득 응답으로 원본을 읽거나 계정 잠금을 해제하지 않는다', async () => {
  let respond!: () => void;
  const started = vi.fn();
  const release = vi.fn();
  server.use(
    http.post(`${API_BASE_URL}/edit-locks`, async () => {
      started();
      await new Promise<void>(resolve => {
        respond = resolve;
      });
      return HttpResponse.json({
        locked: true,
        lockedBy: '20260001',
        lockedByName: 'A',
        lockedAt: null,
      });
    }),
    http.delete(`${API_BASE_URL}/edit-locks`, () => {
      release();
      return new HttpResponse(null, { status: 204 });
    }),
  );
  const { unmount, reload } = setup();
  await waitFor(() => expect(started).toHaveBeenCalledOnce());
  unmount();
  await act(async () => {
    respond();
    await waitFor(() => expect(clients[0]?.isMutating()).toBe(0));
  });
  expect(reload).not.toHaveBeenCalled();
  expect(release).not.toHaveBeenCalled();
});

it('세션이 종료되면 이전 편집 권한으로 저장하거나 해제하지 않는다', async () => {
  const { result } = setup();
  await waitFor(() => expect(result.current.canEdit).toBe(true));
  const previous = result.current;
  await act(async () => useAuthStore.getState().clearSession());
  expect(result.current.canEdit).toBe(false);
  await act(async () => expect(await previous.confirmOwnership()).toBe(false));
});
