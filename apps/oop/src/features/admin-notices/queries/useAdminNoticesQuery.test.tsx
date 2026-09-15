import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import type { SectionAnnouncementListResponse } from '@aics/core';
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

import { useAdminNoticesQuery } from './useAdminNoticesQuery';

const request = vi.fn();
const response: SectionAnnouncementListResponse = {
  contents: [
    {
      id: 1,
      sectionId: 1,
      title: '분반 공지',
      content: '내용',
      publishedAt: '2026-08-26 10:00',
    },
  ],
};
const server = setupServer(
  http.get(
    `${API_BASE_URL}${ENDPOINTS.ANNOUNCEMENTS.SECTION_LIST(':sectionId')}`,
    () => {
      request();
      return HttpResponse.json(response);
    },
  ),
);
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  request.mockClear();
  server.resetHandlers();
});
afterAll(() => server.close());
function wrapper({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      {children}
    </QueryClientProvider>
  );
}

describe('useAdminNoticesQuery', () => {
  it('분반 ID로 공지 목록 API를 요청한다', async () => {
    const { result } = renderHook(() => useAdminNoticesQuery('1'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(request).toHaveBeenCalledOnce();
    expect(result.current.data).toEqual(response.contents);
  });
  it('분반 ID가 없으면 요청하지 않는다', () => {
    renderHook(() => useAdminNoticesQuery(undefined), { wrapper });
    expect(request).not.toHaveBeenCalled();
  });
});
