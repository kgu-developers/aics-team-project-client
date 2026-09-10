import { API_BASE_URL } from '@aics/api-client';
import type { LiveEditLockTarget } from '@aics/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import type { PropsWithChildren } from 'react';
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

import { useLiveEditLock } from './useLiveEditLock';

import {
  demoAccessToken,
  demoStudent,
  demoCurrentTeam,
} from '~/mocks/data/users';
import { createLiveEditLockHandlers } from '~/mocks/handlers/liveEditLock';

const target: LiveEditLockTarget = {
  targetType: 'PROJECT',
  targetId: 19,
  sectionKey: 'TEAM_INFO',
};
const server = setupServer();
const clients: QueryClient[] = [];
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => {
  useAuthStore.getState().setAccessToken(demoAccessToken);
  useAuthStore.getState().setCurrentUser(demoStudent);
  server.use(
    ...createLiveEditLockHandlers({
      resources: [19, 20].map(id => ({
        targetType: 'PROJECT' as const,
        id,
        sectionId: demoCurrentTeam.sectionId,
        studentNumbers: ['20260001'],
      })),
    }),
  );
});
afterEach(() => {
  server.resetHandlers();
  clients.splice(0).forEach(client => client.clear());
  useAuthStore.getState().clearSession();
});
afterAll(() => server.close());
function renderLock(initialTarget: LiveEditLockTarget | null = target) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  clients.push(client);
  const Wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return renderHook(({ value }) => useLiveEditLock(value), {
    wrapper: Wrapper,
    initialProps: { value: initialTarget },
  });
}

it('수동 획득·소유 확인·해제를 제공해도 문서 편집은 활성화하지 않는다', async () => {
  const { result } = renderLock();
  await waitFor(() => expect(result.current.state).toBe('unlocked'));
  await act(async () => {
    await result.current.acquire();
  });
  await waitFor(() => expect(result.current.state).toBe('owned-by-account'));
  expect(result.current.canEdit).toBe(false);
  await act(async () => {
    expect((await result.current.confirmOwnership())?.lockedBy).toBe(
      '20260001',
    );
  });
  await act(async () => {
    await result.current.release();
  });
  await waitFor(() => expect(result.current.state).toBe('unlocked'));
  expect(result.current.canEdit).toBe(false);
});

it.each([
  null,
  { ...target, sectionKey: undefined },
  { ...target, sectionKey: ' ' },
  { ...target, targetType: 'PRESENTATION_CONTENT' },
  { ...target, targetId: 0 },
])('누락·미지원 대상%j은 조회와 수동 mutation을 차단한다', async value => {
  const requests = vi.fn();
  server.use(
    http.all(`${API_BASE_URL}/edit-locks`, () => {
      requests();
      return HttpResponse.json({ locked: false });
    }),
  );
  const { result } = renderLock(value as LiveEditLockTarget | null);
  await act(async () => {
    await result.current.acquire();
    await result.current.confirmOwnership();
    await result.current.release();
  });
  expect(requests).not.toHaveBeenCalled();
  expect(result.current.canEdit).toBe(false);
});

it('대상 전환 후 늦은 획득 응답은 새 대상 상태를 바꾸거나 자동 해제하지 않는다', async () => {
  let release!: () => void;
  const pending = new Promise<void>(resolve => {
    release = resolve;
  });
  const started = vi.fn();
  const deletes = vi.fn();
  server.use(
    http.post(`${API_BASE_URL}/edit-locks`, async () => {
      started();
      await pending;
      return HttpResponse.json({
        locked: true,
        lockedBy: '20260001',
        lockedAt: '2026-09-08 10:00',
      });
    }),
    http.delete(`${API_BASE_URL}/edit-locks`, () => {
      deletes();
      return new HttpResponse(null, { status: 204 });
    }),
  );
  const { result, rerender } = renderLock();
  await waitFor(() => expect(result.current.state).toBe('unlocked'));
  let acquire!: ReturnType<typeof result.current.acquire>;
  act(() => {
    acquire = result.current.acquire();
  });
  await waitFor(() => expect(started).toHaveBeenCalledOnce());
  rerender({ value: { ...target, targetId: 20 } });
  await waitFor(() => expect(result.current.state).toBe('unlocked'));
  await act(async () => {
    release();
    expect(await acquire).toBeUndefined();
  });
  expect(result.current.state).toBe('unlocked');
  expect(deletes).not.toHaveBeenCalled();
});

it('현재 계정 소유가 아니면 release는 DELETE하지 않는다', async () => {
  const deletes = vi.fn();
  server.use(
    http.get(`${API_BASE_URL}/edit-locks`, () =>
      HttpResponse.json({
        locked: true,
        lockedBy: '20260003',
        lockedAt: '2026-09-08 10:00',
      }),
    ),
    http.delete(`${API_BASE_URL}/edit-locks`, () => {
      deletes();
      return new HttpResponse(null, { status: 204 });
    }),
  );
  const { result } = renderLock();
  await waitFor(() => expect(result.current.state).toBe('locked'));
  await act(async () => {
    await result.current.release();
  });
  expect(deletes).not.toHaveBeenCalled();
});

it('획득 실패는 편집 권한으로 바꾸지 않고 상태 재조회로 회복한다', async () => {
  server.use(
    http.post(
      `${API_BASE_URL}/edit-locks`,
      () => new HttpResponse(null, { status: 503 }),
    ),
  );
  const { result } = renderLock();
  await waitFor(() => expect(result.current.state).toBe('unlocked'));
  await act(async () => {
    await result.current.acquire();
  });
  await waitFor(() => expect(result.current.state).toBe('error'));
  expect(result.current.canEdit).toBe(false);
  await act(async () => {
    await result.current.refetch();
  });
  await waitFor(() => expect(result.current.state).toBe('unlocked'));
});

it('이탈 후 늦은 응답은 현재 잠금을 자동 해제하지 않는다', async () => {
  let release!: () => void;
  const pending = new Promise<void>(resolve => {
    release = resolve;
  });
  const started = vi.fn();
  const deletes = vi.fn();
  server.use(
    http.post(`${API_BASE_URL}/edit-locks`, async () => {
      started();
      await pending;
      return HttpResponse.json({ locked: true, lockedBy: '20260001' });
    }),
    http.delete(`${API_BASE_URL}/edit-locks`, () => {
      deletes();
      return new HttpResponse(null, { status: 204 });
    }),
  );
  const { result, unmount } = renderLock();
  await waitFor(() => expect(result.current.state).toBe('unlocked'));
  let acquire!: ReturnType<typeof result.current.acquire>;
  act(() => {
    acquire = result.current.acquire();
  });
  await waitFor(() => expect(started).toHaveBeenCalledOnce());
  unmount();
  await act(async () => {
    release();
    expect(await acquire).toBeUndefined();
  });
  expect(deletes).not.toHaveBeenCalled();
});

it('로그아웃 후 보관한 callback으로 획득하거나 해제하지 않는다', async () => {
  const requests = vi.fn();
  const { result } = renderLock();
  await waitFor(() => expect(result.current.state).toBe('unlocked'));
  const oldAcquire = result.current.acquire;
  const oldRelease = result.current.release;
  server.use(
    http.all(`${API_BASE_URL}/edit-locks`, () => {
      requests();
      return HttpResponse.json({ locked: false });
    }),
  );
  act(() => useAuthStore.getState().clearSession());
  await act(async () => {
    await oldAcquire();
    await oldRelease();
  });
  expect(requests).not.toHaveBeenCalled();
  expect(result.current.state).toBe('unauthenticated');
});

it('같은 대상으로 돌아와도 이전 세대의 획득 응답은 현재 상태를 덮어쓰지 않는다', async () => {
  let release!: () => void;
  const pending = new Promise<void>(resolve => {
    release = resolve;
  });
  const started = vi.fn();
  server.use(
    http.post(`${API_BASE_URL}/edit-locks`, async () => {
      started();
      await pending;
      return HttpResponse.json({ locked: true, lockedBy: '20260001' });
    }),
  );
  const { result, rerender } = renderLock();
  await waitFor(() => expect(result.current.state).toBe('unlocked'));
  let acquire!: ReturnType<typeof result.current.acquire>;
  act(() => {
    acquire = result.current.acquire();
  });
  await waitFor(() => expect(started).toHaveBeenCalledOnce());
  rerender({ value: { ...target, targetId: 20 } });
  await waitFor(() => expect(result.current.state).toBe('unlocked'));
  rerender({ value: target });
  await waitFor(() => expect(result.current.state).toBe('unlocked'));
  await act(async () => {
    release();
    expect(await acquire).toBeUndefined();
  });
  expect(result.current.state).toBe('unlocked');
});

it('동일 문서의 다른 영역으로 이동하면 이전 영역의 잠금 상태를 재사용하지 않는다', async () => {
  const { result, rerender } = renderLock();
  await waitFor(() => expect(result.current.state).toBe('unlocked'));
  await act(async () => {
    await result.current.acquire();
  });
  await waitFor(() => expect(result.current.state).toBe('owned-by-account'));
  rerender({ value: { ...target, sectionKey: 'PROJECT_INFO' } });
  await waitFor(() => expect(result.current.state).toBe('unlocked'));
  expect(result.current.canRelease).toBe(false);
  rerender({ value: target });
  await waitFor(() => expect(result.current.state).toBe('owned-by-account'));
});

it('영역 전환 후 이전 영역의 늦은 획득 응답을 무시한다', async () => {
  let finish!: () => void;
  const pending = new Promise<void>(resolve => {
    finish = resolve;
  });
  const started = vi.fn();
  server.use(
    http.post(`${API_BASE_URL}/edit-locks`, async () => {
      started();
      await pending;
      return HttpResponse.json({
        locked: true,
        lockedBy: demoStudent.studentNumber,
      });
    }),
  );
  const { result, rerender } = renderLock();
  await waitFor(() => expect(result.current.state).toBe('unlocked'));
  let acquire!: ReturnType<typeof result.current.acquire>;
  act(() => {
    acquire = result.current.acquire();
  });
  await waitFor(() => expect(started).toHaveBeenCalledOnce());
  rerender({ value: { ...target, sectionKey: 'PROJECT_INFO' } });
  await waitFor(() => expect(result.current.state).toBe('unlocked'));
  await act(async () => {
    finish();
    expect(await acquire).toBeUndefined();
  });
  expect(result.current.state).toBe('unlocked');
  expect(result.current.canRelease).toBe(false);
});

it('획득409의 코드 응답 뒤 상태를 재조회해 다른 편집자를 표시한다', async () => {
  const { result } = renderLock();
  await waitFor(() => expect(result.current.state).toBe('unlocked'));
  server.use(
    http.post(`${API_BASE_URL}/edit-locks`, () =>
      HttpResponse.json({ code: 'EDIT_LOCK_CONFLICT' }, { status: 409 }),
    ),
    http.get(`${API_BASE_URL}/edit-locks`, () =>
      HttpResponse.json({
        locked: true,
        lockedBy: '20260003',
        lockedByName: '다른 편집자',
        lockedAt: '2026-09-10 10:00',
      }),
    ),
  );
  await act(async () => {
    await result.current.acquire();
  });
  await waitFor(() => expect(result.current.state).toBe('locked'));
  expect(result.current.status?.lockedByName).toBe('다른 편집자');
  expect(result.current.canRelease).toBe(false);
  expect(result.current.canEdit).toBe(false);
});

it('같은 계정으로 다시 로그인해도 이전 세션의 callback으로 요청하지 않는다', async () => {
  const requests = vi.fn();
  const { result } = renderLock();
  await waitFor(() => expect(result.current.state).toBe('unlocked'));
  const oldAcquire = result.current.acquire;
  const oldRelease = result.current.release;
  act(() => {
    useAuthStore.getState().clearSession();
    useAuthStore.getState().setAccessToken(demoAccessToken);
    useAuthStore.getState().setCurrentUser(demoStudent);
  });
  await waitFor(() => expect(result.current.state).toBe('unlocked'));
  server.use(
    http.all(`${API_BASE_URL}/edit-locks`, () => {
      requests();
      return HttpResponse.json({ locked: false });
    }),
  );
  await act(async () => {
    await oldAcquire();
    await oldRelease();
  });
  expect(requests).not.toHaveBeenCalled();
});
