import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import type { PropsWithChildren } from 'react';
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { useAdminMeetingRecordQuery } from './useAdminMeetingRecordQuery';

const meetingRecordRequest = vi.fn();
const server = setupServer(
  http.get(
    `${API_BASE_URL}${ENDPOINTS.ADMIN.MEETING_RECORD(':meetingId')}`,
    () => {
      meetingRecordRequest();
      return HttpResponse.json({});
    },
  ),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  meetingRecordRequest.mockClear();
  server.resetHandlers();
});
afterAll(() => server.close());

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, retryDelay: 0 } },
  });

  return function Wrapper({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe('useAdminMeetingRecordQuery', () => {
  it('담당하지 않은 분반의 상세 회의록은 요청하지 않는다', () => {
    const { result } = renderHook(
      () =>
        useAdminMeetingRecordQuery(
          'admin-meeting-1',
          'not-assigned-section',
          false,
        ),
      { wrapper: createWrapper() },
    );

    expect(result.current.fetchStatus).toBe('idle');
    expect(meetingRecordRequest).not.toHaveBeenCalled();
  });

  it('존재하지 않는 회의록 ID의 404 응답을 오류 상태로 전달한다', async () => {
    server.use(
      http.get(
        `${API_BASE_URL}${ENDPOINTS.ADMIN.MEETING_RECORD(':meetingId')}`,
        () =>
          HttpResponse.json(
            {
              code: 'MEETING_NOT_FOUND',
              message: '회의록을 찾을 수 없습니다.',
            },
            { status: 404 },
          ),
      ),
    );

    const { result } = renderHook(
      () =>
        useAdminMeetingRecordQuery('not-found-meeting', 'oop-2026-2-01', true),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(meetingRecordRequest).not.toHaveBeenCalled();
  });
});
