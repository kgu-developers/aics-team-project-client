import {
  API_BASE_URL,
  ENDPOINTS,
  type AdminMilestoneUpdateInput,
} from '@aics/api-client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import type { PropsWithChildren } from 'react';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { useUpdateAdminSectionMilestoneMutation } from './useUpdateAdminSectionMilestoneMutation';

const input: AdminMilestoneUpdateInput = {
  schedule: { dueAt: '2026-09-10T23:59:00' },
  title: '수정한 제안서',
  type: 'PROPOSAL',
};
const server = setupServer(
  http.put(
    `${API_BASE_URL}${ENDPOINTS.ADMIN.SECTION_MILESTONE('1', '101')}`,
    async ({ request }) => {
      expect(await request.json()).toEqual(input);
      return new HttpResponse(null, { status: 204 });
    },
  ),
  http.patch(
    `${API_BASE_URL}${ENDPOINTS.ADMIN.SECTION_MILESTONE_STATUS('1', '101')}`,
    async ({ request }) => {
      expect(await request.json()).toEqual({ status: 'PUBLISHED' });
      return new HttpResponse(null, { status: 204 });
    },
  ),
  http.put(
    `${API_BASE_URL}${ENDPOINTS.ADMIN.SECTION_MILESTONE_WEEK_NUMBERS('1')}`,
    async ({ request }) => {
      expect(await request.json()).toEqual({
        changes: [{ milestoneId: 101, weekNumber: 4 }],
      });
      return new HttpResponse(null, { status: 204 });
    },
  ),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });

  return function Wrapper({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe('useUpdateAdminSectionMilestoneMutation', () => {
  it('내용을 수정하고 공개 상태가 변경되었을 때만 상태 API를 추가 호출한다', async () => {
    const { result } = renderHook(
      () => useUpdateAdminSectionMilestoneMutation(),
      { wrapper: createWrapper() },
    );

    result.current.mutate({
      currentStatus: 'DRAFT',
      currentWeekNumber: 3,
      input,
      milestoneId: '101',
      sectionId: '1',
      status: 'PUBLISHED',
      weekNumber: 4,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({
      statusUpdated: true,
      weekNumberUpdated: true,
    });
  });

  it('공개 상태 변경이 실패해도 수정 완료 사실을 유지한다', async () => {
    server.use(
      http.patch(
        `${API_BASE_URL}${ENDPOINTS.ADMIN.SECTION_MILESTONE_STATUS('1', '101')}`,
        () =>
          HttpResponse.json(
            { message: '공개할 수 없습니다.' },
            { status: 403 },
          ),
      ),
    );
    const { result } = renderHook(
      () => useUpdateAdminSectionMilestoneMutation(),
      { wrapper: createWrapper() },
    );

    result.current.mutate({
      currentStatus: 'DRAFT',
      currentWeekNumber: 4,
      input,
      milestoneId: '101',
      sectionId: '1',
      status: 'PUBLISHED',
      weekNumber: 4,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({
      statusUpdated: false,
      weekNumberUpdated: true,
    });
  });

  it('주차 변경이 실패해도 내용과 공개 상태 변경 결과를 함께 반환한다', async () => {
    server.use(
      http.put(
        `${API_BASE_URL}${ENDPOINTS.ADMIN.SECTION_MILESTONE_WEEK_NUMBERS('1')}`,
        () =>
          HttpResponse.json(
            { message: '같은 분반의 주차가 이미 사용 중입니다.' },
            { status: 409 },
          ),
      ),
    );
    const { result } = renderHook(
      () => useUpdateAdminSectionMilestoneMutation(),
      { wrapper: createWrapper() },
    );

    result.current.mutate({
      currentStatus: 'PUBLISHED',
      currentWeekNumber: 3,
      input,
      milestoneId: '101',
      sectionId: '1',
      status: 'PUBLISHED',
      weekNumber: 4,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({
      statusUpdated: true,
      weekNumberUpdated: false,
    });
  });
});
