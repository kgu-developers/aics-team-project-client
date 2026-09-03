import {
  API_BASE_URL,
  ENDPOINTS,
  type AdminOopSectionsResponse,
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

import { useAdminOopSectionsQuery } from './useAdminOopSectionsQuery';

const sectionsRequest = vi.fn();
const response: AdminOopSectionsResponse = {
  contents: [
    {
      capacity: 40,
      classTime: '월 10:30-12:00',
      code: 'OOP-01',
      course: {
        id: 1,
        name: '객체지향프로그래밍',
        semester: 'FALL',
        status: 'ACTIVE',
        year: 2026,
      },
      id: 101,
      name: '객체지향프로그래밍 01분반',
      professor: {
        email: 'assistant@example.com',
        globalRole: 'ADMIN',
        name: 'OOP 데모 조교',
        phone: '010-0000-0000',
        studentNumber: '20260002',
      },
    },
  ],
};
const server = setupServer(
  http.get(`${API_BASE_URL}${ENDPOINTS.ADMIN.OOP_SECTIONS}`, ({ request }) => {
    sectionsRequest(request.url);
    return HttpResponse.json(response);
  }),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  sectionsRequest.mockClear();
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

describe('useAdminOopSectionsQuery', () => {
  it('과목 또는 담당 교수 정보가 없으면 분반 목록 API를 호출하지 않는다', () => {
    const { result } = renderHook(
      () => useAdminOopSectionsQuery({ courseId: 1 }),
      { wrapper: createWrapper() },
    );

    expect(result.current.fetchStatus).toBe('idle');
    expect(sectionsRequest).not.toHaveBeenCalled();
  });

  it('필수 정보와 선택 필터를 전달해 분반 목록을 조회한다', async () => {
    const { result } = renderHook(
      () =>
        useAdminOopSectionsQuery({
          courseId: 1,
          professorId: '20260002',
          semester: 'FALL',
          status: 'ACTIVE',
          year: 2026,
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(response);
    expect(sectionsRequest).toHaveBeenCalledWith(
      expect.stringContaining('courseId=1'),
    );
    expect(sectionsRequest).toHaveBeenCalledWith(
      expect.stringContaining('professorId=20260002'),
    );
    expect(sectionsRequest).toHaveBeenCalledWith(
      expect.stringContaining('semester=FALL'),
    );
    expect(sectionsRequest).toHaveBeenCalledWith(
      expect.stringContaining('status=ACTIVE'),
    );
    expect(sectionsRequest).toHaveBeenCalledWith(
      expect.stringContaining('year=2026'),
    );
  });
});
