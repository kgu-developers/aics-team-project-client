import {
  API_BASE_URL,
  ENDPOINTS,
  type AdminMeetingRecordsResponse,
} from '@aics/api-client';
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

import { useAdminMeetingRecordsQuery } from './useAdminMeetingRecordsQuery';

const meetingRecordsRequest = vi.fn();
const response: AdminMeetingRecordsResponse = {
  records: [
    {
      createdAt: '2026-10-08T19:00:00+09:00',
      id: 'meeting-2',
      sectionId: 'oop-01',
      sectionLabel: 'OOP-01',
      teamId: 'team-2',
      teamLabel: '2팀',
      title: '발표 자료 구성 논의',
    },
  ],
};
const server = setupServer(
  http.get(`${API_BASE_URL}${ENDPOINTS.ADMIN.MEETING_RECORDS}`, () => {
    meetingRecordsRequest();
    return HttpResponse.json(response);
  }),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  meetingRecordsRequest.mockClear();
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

describe('useAdminMeetingRecordsQuery', () => {
  it('담당 분반 ID가 없으면 회의록 목록을 요청하지 않는다', () => {
    const { result } = renderHook(() => useAdminMeetingRecordsQuery([]), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(meetingRecordsRequest).not.toHaveBeenCalled();
  });

  it('담당 분반이 있으면 회의록 목록을 조회한다', async () => {
    const { result } = renderHook(
      () => useAdminMeetingRecordsQuery(['oop-01']),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(meetingRecordsRequest).toHaveBeenCalledOnce();
    expect(result.current.data).toEqual(response);
  });
});
