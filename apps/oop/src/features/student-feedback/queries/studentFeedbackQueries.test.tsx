import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import type { PropsWithChildren } from 'react';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';

import { useAuthStore } from '~/features/auth/authStore';
import { studentHomeKeys } from '~/features/student-home/queries';

import { useSubmitMidReportFeedbackMutation } from './useSubmitMidReportFeedbackMutation';
import { useSubmitProposalFeedbackResponseMutation } from './useSubmitProposalFeedbackResponseMutation';

import {
  completeMidReportBlock,
  ensureMidReportFeedbackRevision,
  resetMidReportMockData,
  saveMidReportBlock,
  submitCurrentMidReport,
} from '~/mocks/data/midReport';
import {
  completeProposalBlock,
  ensureProposalFeedbackRevision,
  resetProposalFixture,
  saveProposalBlock,
  submitCurrentProposal,
} from '~/mocks/data/proposal';
import {
  demoMidReportSubmissionId,
  demoProposalReviewId,
  resetStudentFeedbackMockData,
} from '~/mocks/data/studentFeedback';
import { demoAccessToken } from '~/mocks/data/users';
import { studentFeedbackHandlers } from '~/mocks/handlers/studentFeedback';

const sectionId = 'oop-2026-2-01';
const otherSectionId = 'oop-2026-2-02';
const server = setupServer(...studentFeedbackHandlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
function prepareResubmittedProposalRevision() {
  const requested = ensureProposalFeedbackRevision();
  const topic = requested.blocks.find(block => block.key === 'topic');
  if (!topic) throw new Error('proposal topic block is required');
  const saved = saveProposalBlock(
    topic.key,
    requested.version,
    topic.fields.map(field =>
      field.key === 'description'
        ? { ...field, value: `${field.value} 핵심 사용자를 구체화했습니다.` }
        : field,
    ),
    requested.teamLeaderName,
  );
  if (!saved) throw new Error('proposal revision save is required');
  const completed = completeProposalBlock(
    topic.key,
    saved.version,
    requested.teamLeaderName,
  );
  if (!completed) throw new Error('proposal revision completion is required');
  if (!submitCurrentProposal(completed.version, requested.teamLeaderName)) {
    throw new Error('proposal revision resubmission is required');
  }
}

function prepareResubmittedMidReportRevision() {
  const requested = ensureMidReportFeedbackRevision();
  const gui = requested.blocks.find(block => block.key === 'gui-design');
  if (!gui) throw new Error('mid-report GUI block is required');
  const saved = saveMidReportBlock(
    gui.key,
    requested.version,
    gui.fields.map(field =>
      field.key === 'guiScreens'
        ? { ...field, value: field.value.replace('메인 화면', '홈 화면') }
        : field,
    ),
    requested.teamLeaderName,
  );
  if (!saved) throw new Error('mid-report revision save is required');
  const completed = completeMidReportBlock(
    gui.key,
    saved.version,
    requested.teamLeaderName,
  );
  if (!completed) throw new Error('mid-report revision completion is required');
  if (!submitCurrentMidReport(completed.version, requested.teamLeaderName)) {
    throw new Error('mid-report revision resubmission is required');
  }
}

beforeEach(() => {
  useAuthStore.getState().setAccessToken(demoAccessToken);
  resetProposalFixture();
  resetMidReportMockData();
  prepareResubmittedProposalRevision();
  prepareResubmittedMidReportRevision();
});
afterEach(() => {
  resetStudentFeedbackMockData();
  resetProposalFixture();
  resetMidReportMockData();
  server.resetHandlers();
  useAuthStore.getState().clearSession();
});
afterAll(() => server.close());

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

function seedDashboardQueries(queryClient: QueryClient) {
  queryClient.setQueryData(studentHomeKeys.dashboard(sectionId), {
    scope: 'target',
  });
  queryClient.setQueryData(studentHomeKeys.dashboard(otherSectionId), {
    scope: 'other',
  });
}

describe('student feedback mutations', () => {
  it('제안서 답변 제출 뒤 현재 분반 대시보드만 무효화한다', async () => {
    const queryClient = createQueryClient();
    seedDashboardQueries(queryClient);
    const { result } = renderHook(
      () => useSubmitProposalFeedbackResponseMutation(sectionId),
      { wrapper: createWrapper(queryClient) },
    );

    const response = await result.current.mutateAsync({
      reviewId: demoProposalReviewId,
      content: '제안서의 사용자 흐름을 구체화했습니다.',
    });

    expect(response).toMatchObject({
      reviewId: demoProposalReviewId,
      content: '제안서의 사용자 흐름을 구체화했습니다.',
    });
    expect(
      queryClient.getQueryState(studentHomeKeys.dashboard(sectionId))
        ?.isInvalidated,
    ).toBe(true);
    expect(
      queryClient.getQueryState(studentHomeKeys.dashboard(otherSectionId))
        ?.isInvalidated,
    ).toBe(false);
  });

  it('중간보고서 반영 내용 제출 뒤 현재 분반 대시보드만 무효화한다', async () => {
    const queryClient = createQueryClient();
    seedDashboardQueries(queryClient);
    const { result } = renderHook(
      () => useSubmitMidReportFeedbackMutation(sectionId),
      { wrapper: createWrapper(queryClient) },
    );

    const response = await result.current.mutateAsync({
      submissionId: demoMidReportSubmissionId,
      content:
        '검색 흐름을 단순화하라는 피드백을 받아 검색 단계를 두 단계로 줄였습니다.',
    });

    expect(response).toMatchObject({
      submissionId: demoMidReportSubmissionId,
      content:
        '검색 흐름을 단순화하라는 피드백을 받아 검색 단계를 두 단계로 줄였습니다.',
    });
    expect(
      queryClient.getQueryState(studentHomeKeys.dashboard(sectionId))
        ?.isInvalidated,
    ).toBe(true);
    expect(
      queryClient.getQueryState(studentHomeKeys.dashboard(otherSectionId))
        ?.isInvalidated,
    ).toBe(false);
  });

  it('동시 제출 충돌 뒤에도 현재 분반 대시보드를 무효화한다', async () => {
    server.use(
      http.post(
        `${API_BASE_URL}${ENDPOINTS.REVIEW.REVISION_RESPONSE(':reviewId')}`,
        () =>
          HttpResponse.json(
            {
              code: 'PROPOSAL_FEEDBACK_RESPONSE_ALREADY_SUBMITTED',
              message: '이미 답변을 제출했어요.',
            },
            { status: 409 },
          ),
      ),
    );
    const queryClient = createQueryClient();
    seedDashboardQueries(queryClient);
    const { result } = renderHook(
      () => useSubmitProposalFeedbackResponseMutation(sectionId),
      { wrapper: createWrapper(queryClient) },
    );

    await expect(
      result.current.mutateAsync({
        reviewId: demoProposalReviewId,
        content: '제안서의 사용자 흐름을 구체화했습니다.',
      }),
    ).rejects.toMatchObject({ response: { status: 409 } });

    expect(
      queryClient.getQueryState(studentHomeKeys.dashboard(sectionId))
        ?.isInvalidated,
    ).toBe(true);
    expect(
      queryClient.getQueryState(studentHomeKeys.dashboard(otherSectionId))
        ?.isInvalidated,
    ).toBe(false);
  });
});
