import { API_BASE_URL, fetchLiveEditLock } from '@aics/api-client';
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

import { useDocumentSectionLock } from './useDocumentSectionLock';

import { demoAccessToken, demoStudent } from '~/mocks/data/users';
import { createLiveEditLockHandlers } from '~/mocks/handlers/liveEditLock';

const server = setupServer();
const target: LiveEditLockTarget = {
  targetType: 'PROJECT',
  targetId: 19,
  sectionKey: 'TOPIC',
};
let client: QueryClient;
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  useAuthStore.getState().setAccessToken(demoAccessToken);
  useAuthStore.getState().setCurrentUser(demoStudent);
  server.use(...createLiveEditLockHandlers());
});
afterEach(() => {
  client.clear();
  server.resetHandlers();
  useAuthStore.getState().clearSession();
  vi.restoreAllMocks();
  vi.useRealTimers();
});
afterAll(() => server.close());
function renderLock(pollMs = 10) {
  const Wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  // Fresh target objects mimic an editor rendering again while the user types.
  return renderHook(
    () =>
      useDocumentSectionLock({
        target: { ...target },
        isWritable: true,
        renewMs: 30_000,
        pollMs,
      }),
    { wrapper: Wrapper },
  );
}
it('입력 중 다시 렌더링되어도 갱신을 유지하고 2분 넘게 소유한다', async () => {
  const { result, rerender } = renderLock();
  await waitFor(() => expect(result.current.canEdit).toBe(true));
  for (let i = 0; i < 5; i++) {
    vi.setSystemTime(Date.now() + 30_000);
    rerender();
    const expected = new Date().toISOString();
    await waitFor(async () =>
      expect((await fetchLiveEditLock(target)).lockedAt).toBe(expected),
    );
    expect(result.current.canEdit).toBe(true);
  }
  expect((await fetchLiveEditLock(target)).lockedBy).toBe(
    demoStudent.studentNumber,
  );
});
it('갱신 요청이 진행되는 동안 입력을 막지 않고 실패하면 잠근다', async () => {
  const { result } = renderLock();
  await waitFor(() => expect(result.current.canEdit).toBe(true));
  let finish!: () => void;
  const started = vi.fn();
  server.use(
    http.post(`${API_BASE_URL}/api/v1/edit-locks`, async () => {
      started();
      await new Promise<void>(resolve => {
        finish = resolve;
      });
      return HttpResponse.json({ code: 'ERROR' }, { status: 500 });
    }),
  );
  vi.setSystemTime(Date.now() + 30_000);
  await waitFor(() => expect(started).toHaveBeenCalledOnce());
  expect(result.current.canEdit).toBe(true);
  expect(result.current.pending).toBe(false);
  server.use(
    http.get(`${API_BASE_URL}/api/v1/edit-locks`, () =>
      HttpResponse.json({ code: 'ERROR' }, { status: 500 }),
    ),
  );
  await act(async () => {
    finish();
  });
  await waitFor(() => expect(result.current.isUnavailable).toBe(true));
  expect(result.current.canEdit).toBe(false);
});

it.each([
  ['focus', 'owned'],
  ['online', 'owned'],
  ['visibilitychange', 'owned'],
  ['focus', 'lost'],
  ['online', 'lost'],
  ['visibilitychange', 'lost'],
  ['focus', 'error'],
] as const)(
  '%s 복귀 확인 중 편집을 유지하고 %s 응답을 반영한다',
  async (event, outcome) => {
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
    const { result } = renderLock(60_000);
    await waitFor(() => expect(result.current.canEdit).toBe(true));
    let finish!: () => void;
    const response = new Promise<void>(resolve => {
      finish = resolve;
    });
    const started = vi.fn();
    server.use(
      http.get(`${API_BASE_URL}/api/v1/edit-locks`, async () => {
        started();
        await response;
        return outcome === 'error'
          ? new HttpResponse(null, { status: 503 })
          : HttpResponse.json({
              locked: true,
              lockedBy:
                outcome === 'owned' ? demoStudent.studentNumber : 'other',
              lockedByName: '복귀 확인된 편집자',
            });
      }),
    );
    act(() => {
      (event === 'visibilitychange' ? document : window).dispatchEvent(
        new Event(event),
      );
    });
    try {
      await waitFor(() => expect(started).toHaveBeenCalledOnce());
      expect(result.current.pending).toBe(false);
      expect(result.current.canEdit).toBe(true);
    } finally {
      await act(async () => finish());
    }
    await waitFor(() =>
      expect(result.current).toMatchObject({
        pending: false,
        canEdit: outcome === 'owned',
        lockedByOther: outcome === 'lost',
        isUnavailable: outcome === 'error',
        ownerName: outcome === 'error' ? null : '복귀 확인된 편집자',
      }),
    );
  },
);

it('숨겨진 탭에서는 복귀 이벤트로 소유권을 확인하지 않는다', async () => {
  const { result } = renderLock(60_000);
  await waitFor(() => expect(result.current.canEdit).toBe(true));
  vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
  const requested = vi.fn(() => HttpResponse.json({ locked: false }));
  server.use(http.get(`${API_BASE_URL}/api/v1/edit-locks`, requested));
  await act(async () => {
    window.dispatchEvent(new Event('focus'));
    window.dispatchEvent(new Event('online'));
    document.dispatchEvent(new Event('visibilitychange'));
  });
  expect(requested).not.toHaveBeenCalled();
  expect(result.current.canEdit).toBe(true);
});
