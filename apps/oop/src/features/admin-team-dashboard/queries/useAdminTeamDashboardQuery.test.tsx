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
    defaultOptions: { queries: { retry: false } },
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
});
