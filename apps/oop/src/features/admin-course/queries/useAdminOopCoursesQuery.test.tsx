import {
  API_BASE_URL,
  ENDPOINTS,
  type AdminOopCoursesResponse,
} from '@aics/api-client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import type { PropsWithChildren } from 'react';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { useAdminOopCoursesQuery } from './useAdminOopCoursesQuery';

const response: AdminOopCoursesResponse = {
  contents: [
    {
      id: 1,
      name: '객체지향프로그래밍',
      semester: 'FALL',
      status: 'ACTIVE',
      year: 2026,
    },
  ],
};
const server = setupServer(
  http.get(`${API_BASE_URL}${ENDPOINTS.ADMIN.OOP_COURSES}`, () =>
    HttpResponse.json(response),
  ),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
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

describe('useAdminOopCoursesQuery', () => {
  it('관리자 과목 목록을 조회한다', async () => {
    const { result } = renderHook(() => useAdminOopCoursesQuery(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(response);
  });

  it('서버 오류를 Query 오류 상태로 전달한다', async () => {
    server.use(
      http.get(`${API_BASE_URL}${ENDPOINTS.ADMIN.OOP_COURSES}`, () =>
        HttpResponse.json(
          { message: '과목 목록을 불러오지 못했습니다.' },
          { status: 500 },
        ),
      ),
    );

    const { result } = renderHook(() => useAdminOopCoursesQuery(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
