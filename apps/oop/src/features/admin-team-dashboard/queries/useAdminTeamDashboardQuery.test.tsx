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

const teamRequest = vi.fn();
const teamResponse = {
  createdAt: '2026-09-08T15:15:06.663Z',
  id: 1,
  kickoffRule: null,
  meetingSchedule: null,
  members: [
    {
      id: 1,
      isLeader: true,
      name: '김민준',
      projectRole: 'BACKEND',
      studentNumber: '20231234',
    },
  ],
  name: '1팀',
  sectionId: 1,
  status: 'FORMING',
};
const server = setupServer(
  http.get(`${API_BASE_URL}${ENDPOINTS.ADMIN.TEAM(':teamId')}`, ({ params }) => {
    teamRequest(params.teamId);
    return HttpResponse.json(teamResponse);
  }),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  teamRequest.mockClear();
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
  it('팀 ID가 없으면 팀 상세 API를 호출하지 않는다', () => {
    const { result } = renderHook(() => useAdminTeamDashboardQuery(''), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(teamRequest).not.toHaveBeenCalled();
  });

  it('팀 상세 API 응답을 대시보드용 팀 정보로 변환한다', async () => {
    const { result } = renderHook(() => useAdminTeamDashboardQuery('1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(teamRequest).toHaveBeenCalledOnce();
    expect(teamRequest).toHaveBeenCalledWith('1');
    expect(result.current.data).toMatchObject({
      id: '1',
      name: '1팀',
      sectionId: '1',
      members: [
        {
          major: null,
          name: '김민준',
          projectRole: 'BACKEND',
          studentNumber: '20231234',
        },
      ],
    });
  });

  it('404 응답은 자동으로 다시 요청하지 않는다', async () => {
    const request = vi.fn();

    server.use(
      http.get(`${API_BASE_URL}${ENDPOINTS.ADMIN.TEAM(':teamId')}`, () => {
        request();
        return HttpResponse.json(
          { code: 'TEAM_NOT_FOUND', message: '팀을 찾을 수 없습니다.' },
          { status: 404 },
        );
      }),
    );

    const { result } = renderHook(() => useAdminTeamDashboardQuery('999'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(request).toHaveBeenCalledOnce();
  });
});
