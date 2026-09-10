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

import {
  liveEditLockKeys,
  useAcquireLiveEditLockMutation,
  useLiveEditLockQuery,
  useReleaseLiveEditLockMutation,
} from './index';

import { demoAccessToken, demoStudent } from '~/mocks/data/users';
import { createLiveEditLockHandlers } from '~/mocks/handlers/liveEditLock';

const target: LiveEditLockTarget = {
  targetType: 'PROJECT',
  targetId: 19,
  sectionKey: 'TEAM_INFO',
};
const otherArea = { ...target, sectionKey: 'PROJECT_INFO' };
const server = setupServer();
const clients: QueryClient[] = [];
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => {
  useAuthStore.getState().setAccessToken(demoAccessToken);
  useAuthStore.getState().setCurrentUser(demoStudent);
  server.use(...createLiveEditLockHandlers());
});
afterEach(() => {
  server.resetHandlers();
  clients.splice(0).forEach(client => client.clear());
  useAuthStore.getState().clearSession();
});
afterAll(() => server.close());

function renderQueries(value: LiveEditLockTarget | null = target) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  clients.push(client);
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return {
    client,
    ...renderHook(
      ({ value }) => ({
        query: useLiveEditLockQuery(value),
        other: useLiveEditLockQuery(otherArea),
        acquire: useAcquireLiveEditLockMutation(),
        release: useReleaseLiveEditLockMutation(),
      }),
      { wrapper, initialProps: { value } },
    ),
  };
}

it.each(['PROJECT', 'MID_REPORT_BLOCK', 'MEETING_RECORD'] as const)(
  '%s에서 독립 훅으로 획득·갱신·해제하면 같은 조회 캐시가 갱신된다',
  async targetType => {
    const input = { ...target, targetType };
    const { result } = renderQueries(input);
    await waitFor(() => expect(result.current.query.data?.locked).toBe(false));
    await act(async () => {
      const status = await result.current.acquire.mutateAsync(input);
      expect(status.lockedByName).toBe(demoStudent.name);
    });
    await waitFor(() => expect(result.current.query.data?.locked).toBe(true));
    await act(async () => {
      await result.current.acquire.mutateAsync(input);
    });
    expect(result.current.query.data?.lockedBy).toBe(demoStudent.studentNumber);
    await act(async () => {
      await expect(
        result.current.release.mutateAsync(input),
      ).resolves.toBeUndefined();
    });
    await waitFor(() => expect(result.current.query.data?.locked).toBe(false));
    expect(result.current.other.data?.locked).toBe(false);
  },
);

it('획득·해제는 다른 영역의 캐시나 조회 요청을 건드리지 않는다', async () => {
  const { result, client } = renderQueries();
  await waitFor(() => expect(result.current.other.isSuccess).toBe(true));
  await waitFor(() => expect(result.current.query.isSuccess).toBe(true));
  const otherKey = liveEditLockKeys.detail(useAuthStore.getState(), otherArea);
  const previous = client.getQueryState(otherKey);
  const otherReads = vi.fn();
  server.events.on('request:start', ({ request }) => {
    if (
      request.method === 'GET' &&
      new URL(request.url).searchParams.get('sectionKey') ===
        otherArea.sectionKey
    )
      otherReads();
  });
  try {
    await act(async () => {
      await result.current.acquire.mutateAsync(target);
      await result.current.release.mutateAsync(target);
    });
    expect(client.getQueryState(otherKey)).toBe(previous);
    expect(otherReads).not.toHaveBeenCalled();
  } finally {
    server.events.removeAllListeners();
  }
});

it('409는 획득 성공으로 바꾸지 않고 소유자 조회 캐시만 새로 읽는다', async () => {
  const { result } = renderQueries();
  await waitFor(() => expect(result.current.query.isSuccess).toBe(true));
  server.use(
    http.post(`${API_BASE_URL}/edit-locks`, () =>
      HttpResponse.json({ code: 'EDIT_LOCK_CONFLICT' }, { status: 409 }),
    ),
    http.get(`${API_BASE_URL}/edit-locks`, () =>
      HttpResponse.json({
        locked: true,
        lockedBy: '20260003',
        lockedByName: '다른 편집자',
      }),
    ),
  );
  await act(async () => {
    await expect(
      result.current.acquire.mutateAsync(target),
    ).rejects.toMatchObject({ response: { status: 409 } });
  });
  await waitFor(() => expect(result.current.acquire.isError).toBe(true));
  expect(result.current.query.data?.lockedByName).toBe('다른 편집자');
});

it('해제204가 다른 계정 잠금에 대한 no-op이면 unlocked를 만들어 넣지 않는다', async () => {
  server.use(
    http.get(`${API_BASE_URL}/edit-locks`, () =>
      HttpResponse.json({ locked: true, lockedBy: '20260003' }),
    ),
  );
  const { result } = renderQueries();
  await waitFor(() => expect(result.current.query.data?.locked).toBe(true));
  await act(async () => {
    await result.current.release.mutateAsync(target);
  });
  expect(result.current.query.data).toMatchObject({
    locked: true,
    lockedBy: '20260003',
  });
});

it.each([null, { ...target, targetId: 0 }, { ...target, sectionKey: '' }])(
  '필수 대상이 없으면 조회와 두 mutation 모두 HTTP 요청을 하지 않는다: %j',
  async value => {
    const requests = vi.fn();
    server.use(
      http.all(`${API_BASE_URL}/edit-locks`, () => {
        requests();
        return HttpResponse.json({ locked: false });
      }),
    );
    const { result } = renderQueries(value);
    // The valid second-area query is unrelated to the missing prerequisite.
    await waitFor(() => expect(result.current.other.isSuccess).toBe(true));
    requests.mockClear();
    await act(async () => {
      await expect(
        result.current.acquire.mutateAsync(value as LiveEditLockTarget),
      ).rejects.toThrow('잠금 대상');
      await expect(
        result.current.release.mutateAsync(value as LiveEditLockTarget),
      ).rejects.toThrow('잠금 대상');
      await result.current.query.refetch();
    });
    expect(requests).not.toHaveBeenCalled();
  },
);

it('미인증 상태에서는 유효한 대상이어도 조회와 mutation을 보내지 않는다', async () => {
  useAuthStore.getState().clearSession();
  const requests = vi.fn();
  server.use(
    http.all(`${API_BASE_URL}/edit-locks`, () => {
      requests();
      return HttpResponse.json({ locked: false });
    }),
  );
  const { result } = renderQueries();
  await act(async () => {
    await expect(result.current.acquire.mutateAsync(target)).rejects.toThrow(
      '로그인',
    );
    await expect(result.current.release.mutateAsync(target)).rejects.toThrow(
      '로그인',
    );
  });
  expect(requests).not.toHaveBeenCalled();
});

it.each([403, 404, 500])(
  '획득 HTTP %s는 성공 상태로 변환하거나 자동 재시도하지 않는다',
  async status => {
    const attempts = vi.fn();
    server.use(
      http.post(`${API_BASE_URL}/edit-locks`, () => {
        attempts();
        return HttpResponse.json({ code: 'ERROR' }, { status });
      }),
    );
    const { result } = renderQueries();
    await waitFor(() => expect(result.current.query.isSuccess).toBe(true));
    await act(async () => {
      await expect(
        result.current.acquire.mutateAsync(target),
      ).rejects.toMatchObject({ response: { status } });
    });
    expect(attempts).toHaveBeenCalledOnce();
    expect(result.current.query.data?.locked).toBe(false);
  },
);

it('같은 계정의 새 세션으로 바뀌면 이전 획득 응답은 새 조회 캐시를 덮어쓰지 않는다', async () => {
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
  const { result, client } = renderQueries();
  await waitFor(() => expect(result.current.query.isSuccess).toBe(true));
  const oldKey = liveEditLockKeys.detail(useAuthStore.getState(), target);
  let acquire!: Promise<unknown>;
  act(() => {
    acquire = result.current.acquire.mutateAsync(target).catch(error => error);
  });
  await waitFor(() => expect(started).toHaveBeenCalledOnce());
  act(() => {
    useAuthStore.getState().clearSession();
    client.clear();
    useAuthStore.getState().setAccessToken(demoAccessToken);
    useAuthStore.getState().setCurrentUser(demoStudent);
  });
  await waitFor(() => expect(result.current.query.data?.locked).toBe(false));
  await act(async () => {
    finish();
    expect(await acquire).toMatchObject({
      message: '잠금 요청 중 로그인 세션이 변경됐습니다.',
    });
  });
  expect(result.current.query.data?.locked).toBe(false);
  expect(client.getQueryData(oldKey)).toBeUndefined();
});
