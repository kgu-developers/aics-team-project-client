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

import { useAdminMeetingRecordDetailQuery } from './useAdminMeetingRecordDetailQuery';

const requestSpy = vi.fn();
const server = setupServer(
  http.get(
    `${API_BASE_URL}${ENDPOINTS.ADMIN.MEETING_RECORD_DETAIL(':meetingId')}`,
    () => {
      requestSpy();
      return HttpResponse.json({ id: 1, title: '3주차 정기 회의' });
    },
  ),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  requestSpy.mockClear();
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

describe('useAdminMeetingRecordDetailQuery', () => {
  it('숫자가 아닌 회의록 ID로는 상세 API를 요청하지 않는다', () => {
    const { result } = renderHook(
      () => useAdminMeetingRecordDetailQuery('admin-meeting-1'),
      { wrapper: createWrapper() },
    );

    expect(result.current.fetchStatus).toBe('idle');
    expect(requestSpy).not.toHaveBeenCalled();
  });

  it('숫자 회의록 ID로 관리자 상세 API를 조회한다', async () => {
    const { result } = renderHook(() => useAdminMeetingRecordDetailQuery('1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(requestSpy).toHaveBeenCalledOnce();
    expect(result.current.data).toMatchObject({
      id: 1,
      title: '3주차 정기 회의',
    });
  });
});
