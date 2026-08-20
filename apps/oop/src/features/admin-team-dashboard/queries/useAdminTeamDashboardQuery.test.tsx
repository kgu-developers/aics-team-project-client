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

import { useAdminTeamDashboardQuery } from './useAdminTeamDashboardQuery';

import { adminTeamDashboardFixture } from '~/mocks/data/adminTeamDashboard';

const dashboardRequest = vi.fn();
const server = setupServer(
  http.get(
    `${API_BASE_URL}${ENDPOINTS.ADMIN.TEAM_DASHBOARD(':teamId')}`,
    ({ params }) => {
      dashboardRequest(params.teamId);
      return HttpResponse.json(adminTeamDashboardFixture);
    },
  ),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  dashboardRequest.mockClear();
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

describe('useAdminTeamDashboardQuery', () => {
  it('팀 ID가 없으면 팀 대시보드 API를 호출하지 않는다', () => {
    const { result } = renderHook(() => useAdminTeamDashboardQuery(''), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(dashboardRequest).not.toHaveBeenCalled();
  });

  it('팀 ID가 있으면 해당 팀 대시보드를 요청한다', async () => {
    const { result } = renderHook(
      () => useAdminTeamDashboardQuery('team-1151-1'),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(dashboardRequest).toHaveBeenCalledOnce();
    expect(dashboardRequest).toHaveBeenCalledWith('team-1151-1');
    expect(result.current.data).toEqual(adminTeamDashboardFixture);
  });

  it('404 응답은 자동으로 다시 요청하지 않는다', async () => {
    const request = vi.fn();

    server.use(
      http.get(
        `${API_BASE_URL}${ENDPOINTS.ADMIN.TEAM_DASHBOARD(':teamId')}`,
        () => {
          request();
          return HttpResponse.json(
            { code: 'TEAM_NOT_FOUND', message: '팀을 찾을 수 없습니다.' },
            { status: 404 },
          );
        },
      ),
    );

    const { result } = renderHook(
      () => useAdminTeamDashboardQuery('not-found'),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(request).toHaveBeenCalledOnce();
  });

  it('서버 오류는 한 번 자동으로 다시 요청한다', async () => {
    const request = vi.fn();

    server.use(
      http.get(
        `${API_BASE_URL}${ENDPOINTS.ADMIN.TEAM_DASHBOARD(':teamId')}`,
        () => {
          request();

          return request.mock.calls.length === 1
            ? HttpResponse.json(
                { code: 'INTERNAL_SERVER_ERROR', message: '서버 오류' },
                { status: 500 },
              )
            : HttpResponse.json(adminTeamDashboardFixture);
        },
      ),
    );

    const { result } = renderHook(
      () => useAdminTeamDashboardQuery('team-1151-1'),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(request).toHaveBeenCalledTimes(2);
  });
});
