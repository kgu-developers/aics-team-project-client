import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import type { PropsWithChildren } from 'react';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { useAdminRelatedSubmissionQuery } from './useAdminRelatedSubmissionQuery';

const server = setupServer(
  http.get(`${API_BASE_URL}${ENDPOINTS.ADMIN.SECTION_MILESTONES('1')}`, () =>
    HttpResponse.json({
      content: [
        {
          allowResubmissionBeforeDueAt: true,
          id: 101,
          schedule: {},
          sectionId: 1,
          status: 'PUBLISHED',
          title: '제안서',
          type: 'PROPOSAL',
          weekNumber: 3,
        },
        {
          allowResubmissionBeforeDueAt: true,
          id: 102,
          schedule: {},
          sectionId: 1,
          status: 'PUBLISHED',
          title: '중간점검',
          type: 'MID_REPORT',
          weekNumber: 7,
        },
      ],
    }),
  ),
  http.get(
    `${API_BASE_URL}${ENDPOINTS.ADMIN.MILESTONE_SUBMISSIONS(':milestoneId')}`,
    ({ params, request }) => {
      expect(new URL(request.url).searchParams.get('teamId')).toBe('7');
      const milestoneId = Number(params.milestoneId);
      return HttpResponse.json({
        contents: [
          {
            canSubmitNow: false,
            currentVersion: 1,
            hasPendingReview: false,
            id: milestoneId === 101 ? 1701 : 1702,
            meetingRecordCount: 0,
            milestoneId,
            status: 'NOT_SUBMITTED',
            teamId: 7,
            teamName: '1팀',
          },
        ],
      });
    },
  ),
  http.get(`${API_BASE_URL}${ENDPOINTS.PROJECT_PROPOSAL.BY_TEAM('7')}`, () =>
    HttpResponse.json({
      dataConfiguration: [],
      description: '프로젝트 설명',
      goal: '프로젝트 목표',
      id: 3001,
      proposalCompletedAt: '2026-09-01T10:00:00Z',
      projectSchedule: null,
      repositoryUrl: null,
      screenConfiguration: [],
      teamId: 7,
      teamOperation: {
        id: 7,
        kickoffRule: null,
        meetingSchedule: null,
        members: [],
        name: '1팀',
      },
      title: '프로젝트',
      topicCandidateId: null,
    }),
  ),
  http.get(
    `${API_BASE_URL}${ENDPOINTS.ADMIN.SECTION_TEAM_MID_REPORT('1', '7')}`,
    () => HttpResponse.json({ id: 401, teamId: 7, milestoneId: 102 }),
  ),
);

const clients: QueryClient[] = [];
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  clients.splice(0).forEach(client => client.clear());
  server.resetHandlers();
});
afterAll(() => server.close());

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  clients.push(queryClient);

  return function Wrapper({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe('useAdminRelatedSubmissionQuery', () => {
  it('제안서는 projectId를, 중간점검은 midReportId 계약값을 준비한다', async () => {
    const { result, rerender } = renderHook(
      ({ relatedType }: { relatedType: 'PROPOSAL' | 'MID_REPORT' }) =>
        useAdminRelatedSubmissionQuery('1', '7', relatedType),
      {
        initialProps: { relatedType: 'PROPOSAL' },
        wrapper: createWrapper(),
      },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({
      milestoneId: 101,
      milestoneTitle: '제안서',
      relatedId: 3001,
      submissionId: 1701,
    });

    rerender({ relatedType: 'MID_REPORT' as const });
    await waitFor(() => expect(result.current.data?.submissionId).toBe(1702));
    expect(result.current.data?.milestoneId).toBe(102);
    expect(result.current.data?.relatedId).toBe(401);
  });

  it('중간보고서 조회 실패를 일반 제출물 ID로 대신하지 않는다', async () => {
    server.use(
      http.get(
        `${API_BASE_URL}${ENDPOINTS.ADMIN.SECTION_TEAM_MID_REPORT('1', '7')}`,
        () =>
          HttpResponse.json({ code: 'MID_REPORT_NOT_FOUND' }, { status: 404 }),
      ),
    );
    const { result } = renderHook(
      () => useAdminRelatedSubmissionQuery('1', '7', 'MID_REPORT'),
      { wrapper: createWrapper() },
    );
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.data).toBeUndefined();
  });

  it('다른 팀의 중간보고서는 피드백 대상으로 사용하지 않는다', async () => {
    server.use(
      http.get(
        `${API_BASE_URL}${ENDPOINTS.ADMIN.SECTION_TEAM_MID_REPORT('1', '7')}`,
        () => HttpResponse.json({ id: 401, teamId: 8, milestoneId: 102 }),
      ),
    );
    const { result } = renderHook(
      () => useAdminRelatedSubmissionQuery('1', '7', 'MID_REPORT'),
      { wrapper: createWrapper() },
    );
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.data).toBeUndefined();
  });

  it('일반 메시지에는 마일스톤·제출물 API를 요청하지 않는다', () => {
    const { result } = renderHook(
      () => useAdminRelatedSubmissionQuery('1', '7', undefined),
      { wrapper: createWrapper() },
    );

    expect(result.current.fetchStatus).toBe('idle');
  });
});
