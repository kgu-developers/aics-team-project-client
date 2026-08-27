import {
  API_BASE_URL,
  ENDPOINTS,
  type AdminNoticesResponse,
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

import { useAdminNoticesQuery } from './useAdminNoticesQuery';

const noticesRequest = vi.fn();
const noticesResponse: AdminNoticesResponse = {
  notices: [
    {
      date: '2026-08-26',
      id: 'notice-1',
      section: 'OOP-01',
      title: '분반 공지',
      writer: '관리자',
    },
  ],
  pageSize: 3,
  sectionFilters: ['전체', 'OOP-01'],
};
const server = setupServer(
  http.get(`${API_BASE_URL}${ENDPOINTS.ADMIN.NOTICES}`, () => {
    noticesRequest();
    return HttpResponse.json(noticesResponse);
  }),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  noticesRequest.mockClear();
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

describe('useAdminNoticesQuery', () => {
  it('공지사항 목록과 분반 필터를 API Client 응답으로 전달한다', async () => {
    const { result } = renderHook(() => useAdminNoticesQuery(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(noticesRequest).toHaveBeenCalledOnce();
    expect(result.current.data).toEqual(noticesResponse);
  });
});
