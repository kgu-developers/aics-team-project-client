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
import { afterAll, afterEach, beforeAll, expect, it, vi } from 'vitest';

import { useAdminActiveMeetingRecordsQuery } from './useAdminActiveMeetingRecordsQuery';

const requestedSectionIds = vi.fn();
const server = setupServer(
  http.get(
    `${API_BASE_URL}${ENDPOINTS.ADMIN.MEETING_RECORDS_LIST}`,
    ({ request }) => {
      const sectionId = new URL(request.url).searchParams.get('sectionId')!;
      requestedSectionIds(sectionId);
      const id = Number(sectionId);
      const response: AdminMeetingRecordListResponse = {
        contents: [
          {
            authorId: '20260001',
            content: `${sectionId}번 분반 회의 내용`,
            id,
            location: null,
            meetingAt:
              sectionId === '1' ? '2026-10-24T10:00:00' : '2026-10-24T11:00:00',
            participantCount: 2,
            phase: 'MID_CHECK',
            sectionId: id,
            sectionName: `OOP-0${sectionId}`,
            teamId: id,
            teamName: `${sectionId}팀`,
            title: `${sectionId}번 분반 회의`,
          },
        ],
        pageable: {
          isEnd: true,
          page: 0,
          size: 3,
          totalElements: 1,
          totalPages: 1,
        },
      };
      return HttpResponse.json(response);
    },
  ),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  requestedSectionIds.mockClear();
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

it('운영 중인 분반별 최신 회의록을 한 번씩 조회하고 전체 최신순으로 합친다', async () => {
  const { result } = renderHook(
    () => useAdminActiveMeetingRecordsQuery(['1', '2', '1']),
    { wrapper: createWrapper() },
  );

  await waitFor(() => expect(result.current.isPending).toBe(false));

  expect(requestedSectionIds.mock.calls.flat()).toEqual(['1', '2']);
  expect(result.current.data.contents.map(record => record.id)).toEqual([2, 1]);
});

it('운영 중인 분반이 없으면 전체 회의록 요청으로 대체하지 않는다', () => {
  const { result } = renderHook(() => useAdminActiveMeetingRecordsQuery([]), {
    wrapper: createWrapper(),
  });

  expect(result.current.isPending).toBe(false);
  expect(result.current.data.contents).toEqual([]);
  expect(requestedSectionIds).not.toHaveBeenCalled();
});
