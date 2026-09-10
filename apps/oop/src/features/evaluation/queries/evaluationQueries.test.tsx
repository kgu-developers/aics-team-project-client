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

import { useEvaluationContextQuery } from './useEvaluationContextQuery';
import { useMyPresentationEvaluationsQuery } from './useMyPresentationEvaluationsQuery';
import { usePeerEvaluationTargetsQuery } from './usePeerEvaluationTargetsQuery';
import { useTeamEvaluationCriteriaQuery } from './useTeamEvaluationCriteriaQuery';

const contextRequest = vi.fn();
const presentationRequest = vi.fn();
const peerRequest = vi.fn();
const criteriaRequest = vi.fn();

const server = setupServer(
  http.get(
    `${API_BASE_URL}${ENDPOINTS.EVALUATION.CONTEXT(':sectionId')}`,
    () => {
      contextRequest();
      return HttpResponse.json({});
    },
  ),
  http.get(
    `${API_BASE_URL}${ENDPOINTS.EVALUATION.MY_TEAM_EVALUATIONS(':milestoneId')}`,
    () => {
      presentationRequest();
      return HttpResponse.json({});
    },
  ),
  http.get(
    `${API_BASE_URL}${ENDPOINTS.EVALUATION.PEER_TARGETS(':formId')}`,
    () => {
      peerRequest();
      return HttpResponse.json({});
    },
  ),
  http.get(
    `${API_BASE_URL}${ENDPOINTS.EVALUATION.TEAM_CRITERIA(':sectionId')}`,
    () => {
      criteriaRequest();
      return HttpResponse.json([]);
    },
  ),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  contextRequest.mockClear();
  presentationRequest.mockClear();
  peerRequest.mockClear();
  criteriaRequest.mockClear();
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

describe('evaluation queries', () => {
  it.each([null, ''])(
    '팀원 대상 ID가 %s인 응답은 조회 오류로 처리한다',
    async targetUserId => {
      server.use(
        http.get(
          `${API_BASE_URL}${ENDPOINTS.EVALUATION.PEER_TARGETS(':formId')}`,
          () =>
            HttpResponse.json({
              formId: 1,
              title: '상호평가',
              windowState: 'OPEN',
              windowMessage: '',
              targets: [{ userId: '20260003', name: '팀원', role: '개발' }],
              myResponse: {
                id: 1,
                status: 'DRAFT',
                selfContribution: null,
                projectReviewComment: null,
                updatedAt: '2026-09-10T00:00:00',
                submittedAt: null,
                answers: [
                  {
                    kind: 'TEAMMATE_CONTRIBUTION',
                    targetUserId,
                    contributionPercent: null,
                    contributionDetail: null,
                    teammateAssessment: null,
                    comment: null,
                  },
                ],
              },
            }),
        ),
      );
      const { result } = renderHook(
        () => usePeerEvaluationTargetsQuery('section', '20260001', '1'),
        { wrapper: createWrapper() },
      );
      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.data).toBeUndefined();
      expect(result.current.error?.message).toBe(
        '상호평가 응답의 팀원 정보가 올바르지 않아요.',
      );
    },
  );

  it.each([
    ['', '20260001'],
    ['oop-2026-2-01', ''],
  ])(
    '분반 또는 사용자 ID가 없으면 평가 컨텍스트 API를 호출하지 않는다',
    (sectionId, userId) => {
      const { result } = renderHook(
        () => useEvaluationContextQuery(sectionId, userId),
        { wrapper: createWrapper() },
      );

      expect(result.current.fetchStatus).toBe('idle');
      expect(contextRequest).not.toHaveBeenCalled();
    },
  );

  it.each([
    ['', '20260001', 'presentation'],
    ['oop-2026-2-01', '', 'presentation'],
    ['oop-2026-2-01', '20260001', ''],
  ])(
    '분반, 사용자 또는 마일스톤 ID가 없으면 발표 평가 API를 호출하지 않는다',
    (sectionId, userId, milestoneId) => {
      const { result } = renderHook(
        () => useMyPresentationEvaluationsQuery(sectionId, userId, milestoneId),
        { wrapper: createWrapper() },
      );

      expect(result.current.fetchStatus).toBe('idle');
      expect(presentationRequest).not.toHaveBeenCalled();
    },
  );

  it.each([
    ['', '20260001', 'peer-evaluation-2026'],
    ['oop-2026-2-01', '', 'peer-evaluation-2026'],
    ['oop-2026-2-01', '20260001', ''],
  ])(
    '분반, 사용자 또는 폼 ID가 없으면 상호평가 API를 호출하지 않는다',
    (sectionId, userId, formId) => {
      const { result } = renderHook(
        () => usePeerEvaluationTargetsQuery(sectionId, userId, formId),
        { wrapper: createWrapper() },
      );

      expect(result.current.fetchStatus).toBe('idle');
      expect(peerRequest).not.toHaveBeenCalled();
    },
  );

  it('분반 ID가 없으면 평가 기준 API를 호출하지 않는다', () => {
    const { result } = renderHook(() => useTeamEvaluationCriteriaQuery(''), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(criteriaRequest).not.toHaveBeenCalled();
  });
});
