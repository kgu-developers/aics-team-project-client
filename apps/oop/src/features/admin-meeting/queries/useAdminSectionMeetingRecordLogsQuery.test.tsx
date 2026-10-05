import { API_BASE_URL, ENDPOINTS, setApiAccessToken } from '@aics/api-client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import type { PropsWithChildren } from 'react';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { useAdminSectionMeetingRecordLogsQuery } from './useAdminSectionMeetingRecordLogsQuery';

import { demoAdminAccessToken } from '~/mocks/data/users';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  setApiAccessToken(null);
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

describe('useAdminSectionMeetingRecordLogsQuery', () => {
  it('분반 ID가 없으면 수정 이력 API를 요청하지 않는다', async () => {
    let requestCount = 0;
    server.use(
      http.get(
        `${API_BASE_URL}${ENDPOINTS.ADMIN.SECTION_MEETING_RECORD_LOGS(':sectionId')}`,
        () => {
          requestCount += 1;
          return HttpResponse.json({ contents: [], pageable: {} });
        },
      ),
    );

    renderHook(() => useAdminSectionMeetingRecordLogsQuery([], undefined), {
      wrapper: createWrapper(),
    });

    await Promise.resolve();
    expect(requestCount).toBe(0);
  });

  it('담당하지 않는 분반의 수정 이력 API를 요청하지 않는다', async () => {
    let requestCount = 0;
    server.use(
      http.get(
        `${API_BASE_URL}${ENDPOINTS.ADMIN.SECTION_MEETING_RECORD_LOGS(':sectionId')}`,
        () => {
          requestCount += 1;
          return HttpResponse.json({ contents: [], pageable: {} });
        },
      ),
    );

    renderHook(() => useAdminSectionMeetingRecordLogsQuery(['1'], '2'), {
      wrapper: createWrapper(),
    });

    await Promise.resolve();
    expect(requestCount).toBe(0);
  });

  it('선택한 분반과 팀·회의록 필터를 서버 쿼리로 전달한다', async () => {
    const requestUrls: URL[] = [];
    server.use(
      http.get(
        `${API_BASE_URL}${ENDPOINTS.ADMIN.SECTION_MEETING_RECORD_LOGS(':sectionId')}`,
        ({ params, request }) => {
          expect(params.sectionId).toBe('1');
          requestUrls.push(new URL(request.url));
          return HttpResponse.json({
            contents: [],
            pageable: {
              isEnd: true,
              page: 1,
              size: 20,
              totalElements: 0,
              totalPages: 0,
            },
          });
        },
      ),
    );
    setApiAccessToken(demoAdminAccessToken);

    const { result } = renderHook(
      () =>
        useAdminSectionMeetingRecordLogsQuery(['1'], '1', {
          meetingRecordId: 7,
          page: 1,
          size: 20,
          teamId: 2,
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(requestUrls).toHaveLength(1);
    const requestUrl = requestUrls[0];
    expect(requestUrl?.searchParams.get('meetingRecordId')).toBe('7');
    expect(requestUrl?.searchParams.get('page')).toBe('1');
    expect(requestUrl?.searchParams.get('size')).toBe('20');
    expect(requestUrl?.searchParams.get('teamId')).toBe('2');
  });
});
