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

import { useMyTeamSubmissionQuery } from './useMyTeamSubmissionQuery';

import { getSubmissionByMilestone } from '~/mocks/data/submission';

const submissionRequest = vi.fn();
const server = setupServer(
  http.get(
    `${API_BASE_URL}${ENDPOINTS.SUBMISSION.MY_TEAM_BY_MILESTONE(':milestoneId')}`,
    ({ params }) => {
      submissionRequest();
      return HttpResponse.json(
        getSubmissionByMilestone(String(params.milestoneId)),
      );
    },
  ),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  submissionRequest.mockClear();
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

describe('useMyTeamSubmissionQuery', () => {
  it.each([
    ['', '20260001', 'final-report'],
    ['oop-2026-2-01', '', 'final-report'],
    ['oop-2026-2-01', '20260001', ''],
  ])(
    '필수 식별자가 없으면 제출 API를 호출하지 않는다',
    (sectionId, userId, milestoneId) => {
      const { result } = renderHook(
        () => useMyTeamSubmissionQuery(sectionId, userId, milestoneId),
        { wrapper: createWrapper() },
      );

      expect(result.current.fetchStatus).toBe('idle');
      expect(submissionRequest).not.toHaveBeenCalled();
    },
  );

  it('같은 분반에서도 사용자가 바뀌면 내 팀 제출물을 다시 조회한다', async () => {
    const wrapper = createWrapper();
    const { result, rerender } = renderHook(
      ({ userId }) =>
        useMyTeamSubmissionQuery('oop-2026-2-01', userId, 'final-report'),
      { initialProps: { userId: '20260001' }, wrapper },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    rerender({ userId: '20260003' });
    await waitFor(() => expect(submissionRequest).toHaveBeenCalledTimes(2));
  });
});
