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

import { useTeamsQuery } from './useTeamsQuery';

const teamFixture = [
  {
    id: 'team-1151-1',
    members: [],
    name: '1팀',
    sectionId: '1151',
  },
];

const teamRequest = vi.fn();
const server = setupServer(
  http.get(`${API_BASE_URL}${ENDPOINTS.TEAM.ROOT}`, ({ request }) => {
    const sectionId = new URL(request.url).searchParams.get('sectionId');

    teamRequest(sectionId);
    return HttpResponse.json(teamFixture);
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
    defaultOptions: { queries: { retry: false } },
  });

  return function Wrapper({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe('useTeamsQuery', () => {
  it('분반 ID가 없으면 팀 API를 호출하지 않는다', () => {
    const { result } = renderHook(() => useTeamsQuery(''), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(teamRequest).not.toHaveBeenCalled();
  });

  it('분반 ID가 있으면 해당 분반의 팀 목록을 요청한다', async () => {
    const { result } = renderHook(() => useTeamsQuery('1151'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(teamRequest).toHaveBeenCalledOnce();
    expect(teamRequest).toHaveBeenCalledWith('1151');
    expect(result.current.data).toEqual(teamFixture);
  });
});
