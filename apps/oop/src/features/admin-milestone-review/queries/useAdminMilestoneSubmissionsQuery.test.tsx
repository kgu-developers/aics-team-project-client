import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import type { PropsWithChildren } from 'react';
import { afterAll, afterEach, beforeAll, expect, it } from 'vitest';

import { useAdminMilestoneSubmissionsQuery } from './useAdminMilestoneSubmissionsQuery';

import { getAdminMilestoneSubmissionsFixture } from '~/mocks/data/adminMilestoneSubmissions';
import { createProjectProposalFixture } from '~/mocks/data/projectProposal';

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

it('수정 요청된 제안서는 제출 버전이 0이어도 상세 조회를 유지한다', async () => {
  const fixture = getAdminMilestoneSubmissionsFixture('101');
  if (!fixture) throw new Error('마일스톤 101 제출물 픽스처가 필요합니다.');

  const submissions = structuredClone(fixture);
  const initialSubmission = submissions.contents[1];
  if (!initialSubmission)
    throw new Error('두 번째 제출물 픽스처가 필요합니다.');

  submissions.contents[1] = {
    ...initialSubmission,
    id: 11,
    teamId: 42,
    teamName: '델타',
  };
  const proposal = createProjectProposalFixture();

  server.use(
    http.get(
      `${API_BASE_URL}${ENDPOINTS.ADMIN.MILESTONE_SUBMISSIONS('101')}`,
      () => HttpResponse.json(submissions),
    ),
    http.get(`${API_BASE_URL}${ENDPOINTS.PROJECT_PROPOSAL.BY_TEAM('42')}`, () =>
      HttpResponse.json({
        ...proposal,
        id: 29,
        teamId: 42,
        title: '수정 중인 제안서',
        approvalStatus: 'REVISION_REQUESTED',
        teamOperation: { ...proposal.teamOperation, id: 42, name: '델타' },
      }),
    ),
  );

  const { result, cleanup } = renderQuery();
  try {
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.submissions[1]).toMatchObject({
      teamId: '42',
      status: 'REVISION_REQUESTED',
      statusLabel: '수정 요청',
      submissionId: '11',
    });
  } finally {
    cleanup();
  }
});

it.each([
  'DRAFT',
  'PENDING',
  'REVISION_REQUESTED',
  'APPROVED',
  'REJECTED',
] as const)(
  '서버 제안서 승인 상태 %s를 받아도 전체 목록을 유지한다',
  async approvalStatus => {
    const proposal = createProjectProposalFixture();
    server.use(
      http.get(
        `${API_BASE_URL}${ENDPOINTS.PROJECT_PROPOSAL.BY_TEAM('2')}`,
        () =>
          HttpResponse.json({
            ...proposal,
            id: 20,
            teamId: 2,
            approvalStatus,
            proposalCompletedAt:
              approvalStatus === 'DRAFT' ? null : '2026-11-04T02:00:00Z',
            teamOperation: { ...proposal.teamOperation, id: 2 },
          }),
      ),
    );

    const { result, cleanup } = renderQuery();
    try {
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.submissions).toHaveLength(2);
      expect(result.current.data?.submissions[1]).toMatchObject({
        teamId: '2',
        projectId: '20',
        submissionId: approvalStatus === 'DRAFT' ? null : '1002',
        status:
          approvalStatus === 'DRAFT'
            ? 'NOT_SUBMITTED'
            : approvalStatus === 'REVISION_REQUESTED'
              ? 'REVISION_REQUESTED'
              : 'SUBMITTED',
        statusLabel:
          approvalStatus === 'DRAFT'
            ? '미제출'
            : approvalStatus === 'REVISION_REQUESTED'
              ? '수정 요청'
              : '제출 완료',
      });
    } finally {
      cleanup();
    }
  },
);

it('제출 근거가 있는 이전 응답의 프로젝트 조회가 실패하면 확인 실패를 표시한다', async () => {
  const fixture = getAdminMilestoneSubmissionsFixture('101');
  if (!fixture) throw new Error('마일스톤 101 제출물 픽스처가 필요합니다.');

  const submissions = structuredClone(fixture);
  const submitted = submissions.contents[1];
  if (!submitted) throw new Error('두 번째 제출물 픽스처가 필요합니다.');

  submissions.contents[1] = {
    ...submitted,
    currentVersion: 0,
    feedbackRequested: true,
    projectId: undefined,
  };

  server.use(
    http.get(
      `${API_BASE_URL}${ENDPOINTS.ADMIN.MILESTONE_SUBMISSIONS('101')}`,
      () => HttpResponse.json(submissions),
    ),
    http.get(
      `${API_BASE_URL}${ENDPOINTS.PROJECT_PROPOSAL.BY_TEAM(String(submitted.teamId))}`,
      () => HttpResponse.json({ code: 'SERVICE_UNAVAILABLE' }, { status: 503 }),
    ),
  );

  const { result, cleanup } = renderQuery();
  try {
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.submissions[1]).toMatchObject({
      statusLabel: '제안서 확인 실패',
      submissionId: String(submitted.id),
      teamId: String(submitted.teamId),
    });
  } finally {
    cleanup();
  }
});

it.each([
  [503, 'SERVICE_UNAVAILABLE'],
  [403, 'FORBIDDEN'],
  [404, 'SECTION_NOT_FOUND'],
])(
  '한 팀의 프로젝트 조회가 실패해도 다른 팀의 제출 목록을 유지한다 (%s, %s)',
  async (status, code) => {
    server.use(
      http.get(
        `${API_BASE_URL}${ENDPOINTS.PROJECT_PROPOSAL.BY_TEAM('2')}`,
        () => HttpResponse.json({ code }, { status }),
      ),
    );
    const { result, cleanup } = renderQuery();
    try {
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.submissions).toHaveLength(2);
      expect(result.current.data?.submissions[1]).toMatchObject({
        submissionId: null,
        status: 'NOT_SUBMITTED',
        statusLabel: '제안서 확인 실패',
        teamId: '2',
      });
    } finally {
      cleanup();
    }
  },
);
