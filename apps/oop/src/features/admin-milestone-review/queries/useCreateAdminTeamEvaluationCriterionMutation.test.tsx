import { API_BASE_URL, ENDPOINTS, setApiAccessToken } from '@aics/api-client';
import {
  QueryClient,
  QueryClientProvider,
  useQueries,
} from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, expect, it, vi } from 'vitest';

import { adminEvaluationKeys } from '~/features/admin-evaluation/queries/adminEvaluationKeys';

import { adminPresentationEvaluationKeys } from './adminPresentationEvaluationKeys';
import { adminTeamEvaluationCriteriaKeys } from './adminTeamEvaluationCriteriaKeys';
import { useCreateAdminTeamEvaluationCriterionMutation } from './useCreateAdminTeamEvaluationCriterionMutation';

const server = setupServer(
  http.post(
    `${API_BASE_URL}${ENDPOINTS.ADMIN.OOP_TEAM_EVALUATION_CRITERIA('1')}`,
    () => HttpResponse.json({ id: 9 }),
  ),
);
const client = new QueryClient({
  defaultOptions: { queries: { retry: false, staleTime: Infinity } },
});
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  client.clear();
  setApiAccessToken(null);
});
afterAll(() => server.close());
it('refreshes all presentation milestones in this section and preserves another section', async () => {
  setApiAccessToken('test-token');
  const keys = [
    adminEvaluationKeys.presentationEvaluation.list('1', 10),
    adminEvaluationKeys.presentationEvaluation.list('1', 20),
    adminEvaluationKeys.presentationEvaluation.list('2', 10),
    adminPresentationEvaluationKeys.list('1'),
    adminTeamEvaluationCriteriaKeys.list('1'),
  ];
  const reads = keys.map(() => vi.fn(async () => ({})));
  const { result } = renderHook(
    () => {
      useQueries({
        queries: keys.map((queryKey, index) => ({
          queryKey,
          queryFn: reads[index]!,
        })),
      });
      return useCreateAdminTeamEvaluationCriterionMutation();
    },
    {
      wrapper: ({ children }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      ),
    },
  );
  await waitFor(() =>
    reads.forEach(read => expect(read).toHaveBeenCalledTimes(1)),
  );
  await act(async () => {
    await result.current.mutateAsync({
      sectionId: '1',
      input: { title: '설계', maxScore: 5, displayOrder: 0 },
    });
  });
  expect(reads.map(read => read.mock.calls.length)).toEqual([2, 2, 1, 2, 2]);
});
