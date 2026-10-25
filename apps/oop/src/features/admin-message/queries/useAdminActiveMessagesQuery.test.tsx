import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import type { PropsWithChildren } from 'react';
import { afterAll, afterEach, beforeAll, expect, it, vi } from 'vitest';

import { useAdminActiveMessagesQuery } from './useAdminActiveMessagesQuery';

const requestedSections = vi.fn();
const server = setupServer(
  http.get(`${API_BASE_URL}${ENDPOINTS.ADMIN_MESSAGE.LIST}`, ({ request }) => {
    const searchParams = new URL(request.url).searchParams;
    const sectionId = searchParams.get('sectionId')!;
    requestedSections({ sectionId, size: searchParams.get('size') });
    const id = Number(sectionId);
    return HttpResponse.json({
      contents: [
        {
          createdAt:
            sectionId === '1' ? '2026-10-24T10:00:00' : '2026-10-24T11:00:00',
          id,
          important: false,
          message: `${sectionId}번 분반 쪽지`,
          read: sectionId === '1',
          relatedType: 'GENERAL',
          sectionId: id,
          sectionName: `OOP-0${sectionId}`,
          senderId: '20260001',
          teamId: id,
          teamName: `${sectionId}팀`,
        },
      ],
      pageable: {
        isEnd: true,
        page: 0,
        size: 10,
        totalElements: 1,
        totalPages: 1,
      },
      unreadCount: sectionId === '1' ? 0 : 2,
    });
  }),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  requestedSections.mockClear();
  server.resetHandlers();
});
afterAll(() => server.close());

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

it('운영 중인 분반만 한 번씩 조회하고 최신순으로 합치며 미확인 수를 더한다', async () => {
  const { result } = renderHook(
    () => useAdminActiveMessagesQuery(['1', '2', '1']),
    { wrapper: createWrapper() },
  );

  await waitFor(() => expect(result.current.isPending).toBe(false));

  expect(requestedSections.mock.calls.map(([request]) => request)).toEqual([
    { sectionId: '1', size: '3' },
    { sectionId: '2', size: '3' },
  ]);
  expect(result.current.data.contents.map(message => message.id)).toEqual([
    2, 1,
  ]);
  expect(result.current.data.unreadCount).toBe(2);
});

it('운영 중인 분반이 없으면 전체 쪽지 요청으로 대체하지 않는다', () => {
  const { result } = renderHook(() => useAdminActiveMessagesQuery([]), {
    wrapper: createWrapper(),
  });

  expect(result.current.isPending).toBe(false);
  expect(result.current.data).toEqual({ contents: [], unreadCount: 0 });
  expect(requestedSections).not.toHaveBeenCalled();
});

it('일부 분반 조회가 실패해도 성공한 쪽지를 유지하고 오류를 알린다', async () => {
  server.use(
    http.get(`${API_BASE_URL}${ENDPOINTS.ADMIN_MESSAGE.LIST}`, ({ request }) =>
      new URL(request.url).searchParams.get('sectionId') === '2'
        ? new HttpResponse(null, { status: 500 })
        : HttpResponse.json({
            contents: [
              {
                createdAt: '2026-10-24T10:00:00',
                id: 1,
                important: false,
                message: '1번 분반 쪽지',
                read: true,
                relatedType: 'GENERAL',
                sectionId: 1,
                sectionName: 'OOP-01',
                senderId: '20260001',
                teamId: 1,
                teamName: '1팀',
              },
            ],
            pageable: {
              isEnd: true,
              page: 0,
              size: 10,
              totalElements: 1,
              totalPages: 1,
            },
            unreadCount: 0,
          }),
    ),
  );
  const { result } = renderHook(() => useAdminActiveMessagesQuery(['1', '2']), {
    wrapper: createWrapper(),
  });

  await waitFor(() => expect(result.current.isPending).toBe(false));

  expect(result.current.isError).toBe(true);
  expect(result.current.data.contents.map(message => message.id)).toEqual([1]);
});
