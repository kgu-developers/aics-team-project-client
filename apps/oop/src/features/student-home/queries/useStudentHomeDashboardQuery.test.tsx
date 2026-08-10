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

import { useStudentHomeDashboardQuery } from './useStudentHomeDashboardQuery';

import { studentHomeDashboardFixture } from '~/mocks/data/studentHome';


const dashboardRequest = vi.fn();
const server = setupServer(
  http.get(
    'http://localhost:8080/sections/:sectionId/dashboard/student',
    () => {
      dashboardRequest();
      return HttpResponse.json(studentHomeDashboardFixture);
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

describe('useStudentHomeDashboardQuery', () => {
  it('분반 ID가 없으면 API를 호출하지 않는다', () => {
    const { result } = renderHook(() => useStudentHomeDashboardQuery(''), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(dashboardRequest).not.toHaveBeenCalled();
  });

  it('분반 ID가 있으면 해당 분반 대시보드를 요청한다', async () => {
    const { result } = renderHook(
      () => useStudentHomeDashboardQuery('oop-2026-2-01'),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(dashboardRequest).toHaveBeenCalledOnce();
    expect(result.current.data).toEqual(studentHomeDashboardFixture);
  });
});
