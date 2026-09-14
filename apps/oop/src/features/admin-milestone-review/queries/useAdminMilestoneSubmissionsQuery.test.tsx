import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import type { PropsWithChildren } from 'react';
import { afterAll, afterEach, beforeAll, expect, it } from 'vitest';

import { useAdminMilestoneSubmissionsQuery } from './useAdminMilestoneSubmissionsQuery';

import { getAdminMilestoneSubmissionsFixture } from '~/mocks/data/adminMilestoneSubmissions';

const server = setupServer(
  http.get(
    `${API_BASE_URL}${ENDPOINTS.ADMIN.MILESTONE_SUBMISSIONS('101')}`,
    () => HttpResponse.json(getAdminMilestoneSubmissionsFixture('101')),
  ),
);
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterAll(() => server.close());
afterEach(() => server.resetHandlers());

function renderQuery() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const hook = renderHook(
    () => useAdminMilestoneSubmissionsQuery('101', true, undefined, true),
    { wrapper },
  );
  return {
    result: hook.result,
    cleanup: () => {
      hook.unmount();
      client.clear();
    },
  };
}

it('없는 제안서만 미제출로 표시하고 다른 팀의 파일 제출 상태를 유지한다', async () => {
  server.use(
    http.get(`${API_BASE_URL}${ENDPOINTS.PROJECT_PROPOSAL.BY_TEAM('2')}`, () =>
      HttpResponse.json({ code: 'PROJECT_NOT_FOUND' }, { status: 404 }),
    ),
  );
  const { result, cleanup } = renderQuery();
  try {
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.submissions).toEqual([
      expect.objectContaining({
        teamId: '1',
        currentVersion: 2,
        status: 'REVISION_REQUESTED',
      }),
      expect.objectContaining({
        teamId: '2',
        status: 'NOT_SUBMITTED',
        submissionId: null,
      }),
    ]);
  } finally {
    cleanup();
  }
});

it.each([
  [503, 'SERVICE_UNAVAILABLE'],
  [403, 'FORBIDDEN'],
  [404, 'SECTION_NOT_FOUND'],
])(
  '프로젝트 없음 이외의 조회 오류는 미제출로 바꾸지 않고 전달한다 (%s, %s)',
  async (status, code) => {
    server.use(
      http.get(
        `${API_BASE_URL}${ENDPOINTS.PROJECT_PROPOSAL.BY_TEAM('2')}`,
        () => HttpResponse.json({ code }, { status }),
      ),
    );
    const { result, cleanup } = renderQuery();
    try {
      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error).toMatchObject({
        response: { status, data: { code } },
      });
      expect(result.current.data).toBeUndefined();
    } finally {
      cleanup();
    }
  },
);
