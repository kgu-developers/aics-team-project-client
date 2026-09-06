import {
  API_BASE_URL,
  ENDPOINTS,
  type AdminMilestoneCreateInput,
} from '@aics/api-client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import type { PropsWithChildren } from 'react';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { useSubmitAdminSectionMilestonesMutation } from './useSubmitAdminSectionMilestonesMutation';

const input: AdminMilestoneCreateInput = {
  schedule: { dueAt: '2026-09-10T23:59:00' },
  title: '제안서',
  type: 'PROPOSAL',
  weekNumber: 2,
};
const server = setupServer(
  http.post(
    `${API_BASE_URL}${ENDPOINTS.ADMIN.SECTION_MILESTONES('1')}`,
    async ({ request }) => {
      expect(await request.json()).toEqual(input);
      return HttpResponse.json({ id: 101 }, { status: 201 });
    },
  ),
  http.post(`${API_BASE_URL}${ENDPOINTS.ADMIN.SECTION_MILESTONES('2')}`, () =>
    HttpResponse.json({ message: '생성할 수 없습니다.' }, { status: 409 }),
  ),
  http.patch(
    `${API_BASE_URL}${ENDPOINTS.ADMIN.SECTION_MILESTONE_STATUS('1', '101')}`,
    async ({ request }) => {
      expect(await request.json()).toEqual({ status: 'PUBLISHED' });
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

describe('useSubmitAdminSectionMilestonesMutation', () => {
  it('분반별 생성 요청의 성공과 실패를 독립적으로 반환한다', async () => {
    const { result } = renderHook(
      () => useSubmitAdminSectionMilestonesMutation(),
      { wrapper: createWrapper() },
    );

    result.current.mutate({
      sections: [
        { input, publish: true, sectionId: '1' },
        { input, publish: false, sectionId: '2' },
      ],
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([
      { milestoneId: 101, sectionId: '1', status: 'published' },
      { sectionId: '2', status: 'create-failed' },
    ]);
  });

  it('공개 상태 변경만 실패하면 생성 완료 결과를 보존한다', async () => {
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
      () => useSubmitAdminSectionMilestonesMutation(),
      { wrapper: createWrapper() },
    );

    result.current.mutate({
      sections: [{ input, publish: true, sectionId: '1' }],
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([
      { milestoneId: 101, sectionId: '1', status: 'publish-failed' },
    ]);
  });
});
