import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import type { PropsWithChildren } from 'react';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { useAuthStore } from '~/features/auth/authStore';

import { useMySectionsQuery } from './useMySectionsQuery';

const sectionResponse = {
  id: 1,
  code: 'CS101',
  name: '01',
  classTime: '월123',
  capacity: 40,
  contactVisibleFrom: null,
  contactVisibleUntil: null,
  courseId: 1,
  courseName: '객체지향프로그래밍',
  year: 2026,
  semester: 'SPRING' as const,
  status: 'ACTIVE' as const,
};

let requestCount = 0;
let requestedUrl: URL | undefined;
const server = setupServer(
  http.get(`${API_BASE_URL}${ENDPOINTS.SECTION.MY_SECTIONS}`, ({ request }) => {
    requestCount += 1;
    requestedUrl = new URL(request.url);
    return HttpResponse.json({ contents: [sectionResponse] });
  }),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  requestCount = 0;
  requestedUrl = undefined;
  useAuthStore.getState().clearSession();
});
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

describe('useMySectionsQuery', () => {
  it('인증 세션이 없으면 서버를 호출하지 않는다', () => {
    const queryClient = createQueryClient();
    const { result } = renderHook(() => useMySectionsQuery(), {
      wrapper: createWrapper(queryClient),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(requestCount).toBe(0);
    queryClient.clear();
  });

  it('필터를 query parameter로 전달하고 contents를 Section 배열로 변환한다', async () => {
    useAuthStore.getState().markAuthenticated('STUDENT');
    const queryClient = createQueryClient();
    const { result } = renderHook(
      () =>
        useMySectionsQuery({
          status: 'ACTIVE',
          year: 2026,
          semester: 'SPRING',
        }),
      { wrapper: createWrapper(queryClient) },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual([sectionResponse]);
    expect(requestedUrl?.searchParams.get('status')).toBe('ACTIVE');
    expect(requestedUrl?.searchParams.get('year')).toBe('2026');
    expect(requestedUrl?.searchParams.get('semester')).toBe('SPRING');
    queryClient.clear();
  });
});
