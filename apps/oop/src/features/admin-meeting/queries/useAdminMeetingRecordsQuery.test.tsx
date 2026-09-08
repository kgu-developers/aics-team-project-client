import {
  API_BASE_URL,
  ENDPOINTS,
  type AdminMeetingRecordListResponse,
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

import { useAdminMeetingRecordListQuery } from './useAdminMeetingRecordListQuery';

const meetingRecordsRequest = vi.fn();
const response: AdminMeetingRecordListResponse = {
  contents: [
    {
      authorId: '20260001',
      content: '발표 자료 구성 논의',
      id: 2,
      location: '온라인',
      meetingAt: '2026-10-08 19:00',
      participantCount: 4,
      phase: 'MID_CHECK',
      sectionId: 1,
      sectionName: 'OOP-01',
      teamId: 2,
      teamName: '2팀',
    },
  ],
  pageable: {
    isEnd: true,
    page: 0,
    size: 20,
    totalElements: 1,
    totalPages: 1,
  },
};
const server = setupServer(
  http.get(`${API_BASE_URL}${ENDPOINTS.ADMIN.MEETING_RECORDS_LIST}`, () => {
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

describe('useAdminMeetingRecordListQuery', () => {
  it('담당 분반 ID가 없으면 회의록 목록을 요청하지 않는다', () => {
    const { result } = renderHook(() => useAdminMeetingRecordListQuery([]), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(meetingRecordsRequest).not.toHaveBeenCalled();
  });

  it('담당 분반이 있으면 회의록 목록을 조회한다', async () => {
    const { result } = renderHook(
      () => useAdminMeetingRecordListQuery(['oop-01']),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(meetingRecordsRequest).toHaveBeenCalledOnce();
    expect(result.current.data).toEqual(response);
  });

  it('서버가 최신순으로 반환한 회의록 순서를 유지한다', async () => {
    const multipleSectionsResponse: AdminMeetingRecordListResponse = {
      contents: [
        {
          authorId: '20260001',
          content: '가장 최근 회의록',
          id: 2,
          location: null,
          meetingAt: '2026-10-08 19:00',
          participantCount: 4,
          phase: 'MID_CHECK',
          sectionId: 2,
          sectionName: 'OOP-02',
          teamId: 2,
          teamName: '1팀',
        },
        {
          authorId: '20260002',
          content: '이전 회의록',
          id: 1,
          location: null,
          meetingAt: '2026-10-01 10:30',
          participantCount: 3,
          phase: 'PROPOSAL',
          sectionId: 1,
          sectionName: 'OOP-01',
          teamId: 1,
          teamName: '1팀',
        },
      ],
      pageable: {
        isEnd: true,
        page: 0,
        size: 20,
        totalElements: 2,
        totalPages: 1,
      },
    };

    server.use(
      http.get(`${API_BASE_URL}${ENDPOINTS.ADMIN.MEETING_RECORDS_LIST}`, () =>
        HttpResponse.json(multipleSectionsResponse),
      ),
    );

    const { result } = renderHook(
      () => useAdminMeetingRecordListQuery(['oop-01', 'oop-02']),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.contents.map(record => record.id)).toEqual([
      2, 1,
    ]);
  });

  it('분반·팀 필터와 페이지네이션을 API Client 요청으로 전달한다', async () => {
    const receivedUrl = vi.fn();

    server.use(
      http.get(
        `${API_BASE_URL}${ENDPOINTS.ADMIN.MEETING_RECORDS_LIST}`,
        ({ request }) => {
          receivedUrl(request.url);
          return HttpResponse.json(response);
        },
      ),
    );

    const { result } = renderHook(
      () =>
        useAdminMeetingRecordListQuery(['oop-01'], {
          sectionId: 'oop-01',
          teamId: 2,
          page: 2,
          size: 50,
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(receivedUrl).toHaveBeenCalledWith(
      expect.stringContaining('sectionId=oop-01'),
    );
    expect(receivedUrl).toHaveBeenCalledWith(
      expect.stringContaining('teamId=2'),
    );
    expect(receivedUrl).toHaveBeenCalledWith(expect.stringContaining('page=2'));
    expect(receivedUrl).toHaveBeenCalledWith(
      expect.stringContaining('size=50'),
    );
  });
});
