import {
  API_BASE_URL,
  ENDPOINTS,
  type AdminSectionMilestonesResponse,
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

import { useAdminSectionMilestonesQuery } from './useAdminSectionMilestonesQuery';

const request = vi.fn();
const response: AdminSectionMilestonesResponse = {
  content: [
    {
      id: 101,
      schedule: { dueAt: '2026-10-15T14:59:00Z' },
      sectionId: 1,
      status: 'PUBLISHED',
      title: '제안서',
      type: 'PROPOSAL',
      weekNumber: 3,
    },
  ],
};
const server = setupServer(
  http.get(`${API_BASE_URL}${ENDPOINTS.ADMIN.SECTION_MILESTONES('1')}`, () => {
    request();
    return HttpResponse.json(response);
  }),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  request.mockClear();
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

describe('useAdminSectionMilestonesQuery', () => {
  it('분반 ID가 없으면 목록을 요청하지 않는다', () => {
    const { result } = renderHook(
      () => useAdminSectionMilestonesQuery(undefined),
      { wrapper: createWrapper() },
    );

    expect(result.current.fetchStatus).toBe('idle');
    expect(request).not.toHaveBeenCalled();
  });

  it('분반별 실제 목록 경로에서 마일스톤을 조회한다', async () => {
    const { result } = renderHook(() => useAdminSectionMilestonesQuery('1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(request).toHaveBeenCalledOnce();
    expect(result.current.data).toEqual(response);
  });
});
