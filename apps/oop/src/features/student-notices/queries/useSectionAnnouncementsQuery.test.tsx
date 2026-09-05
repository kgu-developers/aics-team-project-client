import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import type {
  SectionAnnouncementListResponse,
  SectionAnnouncementResponse,
} from '@aics/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import type { PropsWithChildren } from 'react';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';

import { useSectionAnnouncementsQuery } from './useSectionAnnouncementsQuery';

const announcement: SectionAnnouncementResponse = {
  id: 1,
  sectionId: 1,
  title: '전체 접수 공지',
  content: '분반별 제출 일정을 확인해 주세요.',
  publishedAt: '2026-08-27 15:00',
};

let requestCount = 0;
let requestedSectionId: string | undefined;
const server = setupServer(
  http.get(
    `${API_BASE_URL}${ENDPOINTS.ANNOUNCEMENTS.SECTION_LIST(':sectionId')}`,
    ({ params }) => {
      requestCount += 1;
      requestedSectionId = String(params.sectionId);

      return HttpResponse.json<SectionAnnouncementListResponse>({
        contents: [announcement],
      });
    },
  ),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => {
  requestCount = 0;
  requestedSectionId = undefined;
});
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function createQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
}

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe('useSectionAnnouncementsQuery', () => {
  it.each([undefined, 0])(
    '유효한 분반 ID가 없으면 서버를 호출하지 않는다: %s',
    sectionId => {
      const queryClient = createQueryClient();
      const { result } = renderHook(
        () => useSectionAnnouncementsQuery(sectionId),
        { wrapper: createWrapper(queryClient) },
      );

      expect(result.current.fetchStatus).toBe('idle');
      expect(requestCount).toBe(0);
      queryClient.clear();
    },
  );

  it('numeric 분반 ID로 요청하고 contents를 공지 배열로 변환한다', async () => {
    const queryClient = createQueryClient();
    const { result } = renderHook(() => useSectionAnnouncementsQuery(1), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(requestCount).toBe(1);
    expect(requestedSectionId).toBe('1');
    expect(result.current.data).toEqual([announcement]);
    queryClient.clear();
  });
});
