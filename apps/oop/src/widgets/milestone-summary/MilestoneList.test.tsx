import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { submitMidReportFeedback, submitProposalFeedbackResponse } = vi.hoisted(
  () => ({
    submitMidReportFeedback: vi.fn(),
    submitProposalFeedbackResponse: vi.fn(),
  }),
);
const {
  feedbackMutationState,
  resetMidMutation,
  resetProposalMutation,
  toast,
} = vi.hoisted(() => ({
  feedbackMutationState: {
    midError: null as unknown,
    proposalError: null as unknown,
  },
  resetMidMutation: vi.fn(),
  resetProposalMutation: vi.fn(),
  toast: vi.fn(),
}));

vi.mock('@aics/design-system', async importOriginal => {
  const actual = await importOriginal<typeof import('@aics/design-system')>();
  return { ...actual, useToast: () => toast };
});

vi.mock('~/features/project-topic/ProjectTopicBoard', () => ({
  default: ({ embedded }: { embedded?: boolean }) => (
    <div data-embedded={String(embedded)}>주제 후보 투표 영역</div>
  ),
}));

vi.mock('~/features/student-feedback/queries', () => ({
  useSubmitMidReportFeedbackMutation: () => ({
    error: feedbackMutationState.midError,
    isError: Boolean(feedbackMutationState.midError),
    isPending: false,
    mutate: submitMidReportFeedback,
    reset: resetMidMutation,
  }),
  useSubmitProposalFeedbackResponseMutation: () => ({
    error: feedbackMutationState.proposalError,
    isError: Boolean(feedbackMutationState.proposalError),
    isPending: false,
    mutate: submitProposalFeedbackResponse,
    reset: resetProposalMutation,
  }),
}));

import { useAuthStore } from '~/features/auth/authStore';

import MilestoneDetails from './MilestoneDetails';
import MilestoneList from './MilestoneList';

import { getCurrentMidReport } from '~/mocks/data/midReport';
import { getCurrentPresentation } from '~/mocks/data/presentation';
import {
  createStudentHomeDashboardPreview,
  createStudentHomeDashboardWithMidReportProgress,
  createStudentHomeDashboardWithPresentationProgress,
  studentHomeDashboardFixture,
} from '~/mocks/data/studentHome';
import { demoStudent } from '~/mocks/data/users';
import { renderWithRouter } from '~/test/renderWithRouter';

const PERSISTENCE_KEY = 'student-a:oop-section-1';

describe('MilestoneList', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    submitMidReportFeedback.mockReset();
    submitProposalFeedbackResponse.mockReset();
    feedbackMutationState.midError = null;
    feedbackMutationState.proposalError = null;
    resetMidMutation.mockReset();
    resetProposalMutation.mockReset();
    toast.mockReset();
    useAuthStore.setState({ currentUser: demoStudent });
  });

  it('팀 배정이 끝난 학생에게 5개 상위 단계를 순서대로 표시한다', () => {
    renderWithRouter(
      <MilestoneList
        milestones={studentHomeDashboardFixture.milestones}
        persistenceKey={PERSISTENCE_KEY}
      />,
    );

    expect(screen.getByText('제안서')).toBeInTheDocument();
    expect(screen.getByText('중간')).toBeInTheDocument();
    expect(screen.getByText('발표')).toBeInTheDocument();
    expect(screen.getByText('최종')).toBeInTheDocument();
    expect(screen.getByText('상호')).toBeInTheDocument();
    expect(screen.queryByText('팀 배정 전')).not.toBeInTheDocument();
  });

  it('현재 상위 단계의 현재 세부 단계만 상세로 표시한다', () => {
    renderWithRouter(
      <MilestoneList
        milestones={studentHomeDashboardFixture.milestones}
        persistenceKey={PERSISTENCE_KEY}
      />,
    );

    expect(screen.getAllByText('주제 선정').length).toBeGreaterThan(0);
    expect(screen.getByText('주제 후보 투표 영역')).toHaveAttribute(
      'data-embedded',
      'true',
    );
    expect(screen.queryByText('최종 선정 주제')).not.toBeInTheDocument();
    expect(screen.queryByText('교수 피드백')).not.toBeInTheDocument();
  });

  it('제안서 피드백 반영과 조기 활성화된 중간 단계를 함께 상세로 표시한다', () => {
    const dashboard = createStudentHomeDashboardPreview(
      'proposal-feedback-mid-report',
    );

    renderWithRouter(
      <MilestoneList
        milestones={dashboard.milestones}
        persistenceKey={PERSISTENCE_KEY}
      />,
    );

    expect(screen.getAllByText('수정 가능')).toHaveLength(1);
    expect(screen.getByText('피드백 반영 가능')).toBeInTheDocument();
    const writingButtons = screen.getAllByRole('button', { name: '작성하기' });
    expect(writingButtons).toHaveLength(2);
    writingButtons.forEach(button => expect(button).toBeEnabled());
    expect(screen.getByText('중간보고서 작성')).toBeInTheDocument();
    expect(screen.getByText('최종 선정 주제')).toBeInTheDocument();
    expect(screen.getByText('교수 피드백')).toBeInTheDocument();
  });

  it('새로 활성화된 마일스톤은 데이터 갱신 뒤에도 기본으로 상세를 연다', () => {
    const { rerender } = renderWithRouter(
      <MilestoneList
        milestones={studentHomeDashboardFixture.milestones}
        persistenceKey={PERSISTENCE_KEY}
      />,
    );

    rerender(
      <MilestoneList
        milestones={
          createStudentHomeDashboardPreview('proposal-feedback-mid-report')
            .milestones
        }
        persistenceKey={PERSISTENCE_KEY}
      />,
    );

    expect(screen.getByText('교수 피드백')).toBeInTheDocument();
    expect(screen.getByText('최종 선정 주제')).toBeInTheDocument();
  });

  it('사용자가 접은 마일스톤을 홈에 다시 진입해도 접힌 상태로 유지한다', async () => {
    const user = userEvent.setup();
    const firstView = renderWithRouter(
      <MilestoneList
        milestones={studentHomeDashboardFixture.milestones}
        persistenceKey={PERSISTENCE_KEY}
      />,
    );
    const proposalTrigger = screen.getByRole('button', { name: /제안서/ });

    expect(proposalTrigger).toHaveAttribute('aria-expanded', 'true');
    await user.click(proposalTrigger);
    expect(proposalTrigger).toHaveAttribute('aria-expanded', 'false');

    firstView.unmount();
    const secondView = renderWithRouter(
      <MilestoneList
        milestones={studentHomeDashboardFixture.milestones}
        persistenceKey={PERSISTENCE_KEY}
      />,
    );

    expect(screen.getByRole('button', { name: /제안서/ })).toHaveAttribute(
      'aria-expanded',
      'false',
    );

    secondView.unmount();
    renderWithRouter(
      <MilestoneList
        milestones={studentHomeDashboardFixture.milestones}
        persistenceKey='student-b:oop-section-1'
      />,
    );

    expect(screen.getByRole('button', { name: /제안서/ })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });

  it('기존에 접은 상세는 유지하고 새로 활성화된 상세만 기본으로 연다', async () => {
    const user = userEvent.setup();
    const { rerender } = renderWithRouter(
      <MilestoneList
        milestones={studentHomeDashboardFixture.milestones}
        persistenceKey={PERSISTENCE_KEY}
      />,
    );
    await user.click(screen.getByRole('button', { name: /제안서/ }));

    rerender(
      <MilestoneList
        milestones={
          createStudentHomeDashboardPreview('proposal-feedback-mid-report')
            .milestones
        }
        persistenceKey={PERSISTENCE_KEY}
      />,
    );

    expect(screen.getByRole('button', { name: /제안서/ })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    expect(screen.getByRole('button', { name: /중간/ })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });

  it('기간 전 문서 진행률을 표시해도 이동할 수 없는 CTA는 비활성으로 유지한다', () => {
    const dashboard = createStudentHomeDashboardWithPresentationProgress(
      createStudentHomeDashboardWithMidReportProgress(
        studentHomeDashboardFixture,
        getCurrentMidReport(),
      ),
      getCurrentPresentation(),
    );

    renderWithRouter(
      <MilestoneList
        milestones={dashboard.milestones}
        persistenceKey={PERSISTENCE_KEY}
      />,
    );

    const beforePeriodButtons = screen.getAllByRole('button', {
      name: '기간 전',
    });
    expect(beforePeriodButtons).toHaveLength(4);
    beforePeriodButtons.forEach(button =>
      expect(
        button.hasAttribute('disabled') ||
          button.getAttribute('aria-disabled') === 'true',
      ).toBe(true),
    );
  });

  it('마일스톤이 없으면 빈 상태를 표시한다', () => {
    renderWithRouter(
      <MilestoneList milestones={[]} persistenceKey={PERSISTENCE_KEY} />,
    );

    expect(screen.getByText('등록된 마일스톤이 없어요.')).toBeInTheDocument();
  });
});

describe('MilestoneDetails', () => {
  beforeEach(() => {
    submitMidReportFeedback.mockReset();
    submitProposalFeedbackResponse.mockReset();
    submitMidReportFeedback.mockImplementation((_variables, options) =>
      options?.onSuccess?.(),
    );
    submitProposalFeedbackResponse.mockImplementation((_variables, options) =>
      options?.onSuccess?.(),
    );
    feedbackMutationState.midError = null;
    feedbackMutationState.proposalError = null;
    resetMidMutation.mockReset();
    resetProposalMutation.mockReset();
    toast.mockReset();
    useAuthStore.setState({ currentUser: demoStudent });
  });

  it('현재 주제 선정 세부 단계의 후보와 완료 현황을 표시한다', () => {
    const proposal = studentHomeDashboardFixture.milestones.find(
      milestone => milestone.id === 'proposal',
    );
    const body = proposal?.body;
    if (!body || body.kind !== 'topic') throw new Error('topic body 없음');

    renderWithRouter(<MilestoneDetails body={body} />);

    expect(screen.getByText(body.guidance)).toBeInTheDocument();
    expect(screen.getByText('주제 후보 투표 영역')).toHaveAttribute(
      'data-embedded',
      'true',
    );
  });

  it('제안서 교수 피드백을 확인하고 반영 답변을 보낸다', async () => {
    const user = userEvent.setup();
    const proposal = createStudentHomeDashboardPreview(
      'proposal-feedback',
    ).milestones.find(milestone => milestone.id === 'proposal');
    const body = proposal?.body;
    if (!body || body.kind !== 'proposal-feedback') {
      throw new Error('proposal feedback body 없음');
    }

    renderWithRouter(
      <MilestoneDetails
        body={{
          ...body,
          canSubmitResponse: true,
          responseBlockedReason: undefined,
        }}
      />,
    );

    await user.type(
      screen.getByRole('textbox', { name: /피드백 반영 답변/ }),
      '서비스 구독 조건과 해지 흐름을 추가했습니다.',
    );
    await user.click(screen.getByRole('button', { name: '답변 보내기' }));

    expect(submitProposalFeedbackResponse).toHaveBeenCalledWith(
      {
        reviewId: body.reviewId,
        content: '서비스 구독 조건과 해지 흐름을 추가했습니다.',
      },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
    expect(toast).toHaveBeenCalledWith({
      body: '피드백 반영 답변을 제출했어요.',
    });
  });

  it('중간보고서 대면 피드백과 반영 내용을 하나의 기록으로 남긴다', async () => {
    const user = userEvent.setup();
    const midReview = createStudentHomeDashboardPreview(
      'mid-feedback',
    ).milestones.find(milestone => milestone.id === 'mid-review');
    const body = midReview?.body;
    if (!body || body.kind !== 'mid-review-feedback') {
      throw new Error('mid report feedback body 없음');
    }

    renderWithRouter(
      <MilestoneDetails
        body={{
          ...body,
          canSubmitResponse: true,
          responseBlockedReason: undefined,
        }}
      />,
    );

    await user.type(
      screen.getByRole('textbox', { name: /대면 피드백 반영 내용/ }),
      '예외 처리와 시연 흐름을 보완하라는 피드백을 받아 오류 화면과 재시도 동선을 추가했습니다.',
    );
    await user.click(screen.getByRole('button', { name: '반영 기록 남기기' }));

    expect(submitMidReportFeedback).toHaveBeenCalledWith(
      {
        submissionId: body.submissionId,
        content:
          '예외 처리와 시연 흐름을 보완하라는 피드백을 받아 오류 화면과 재시도 동선을 추가했습니다.',
      },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
    expect(toast).toHaveBeenCalledWith({
      body: '대면 피드백 반영 기록을 제출했어요.',
    });
    expect(
      screen.getAllByRole('textbox', { name: /대면 피드백 반영 내용/ }),
    ).toHaveLength(1);
  });

  it('중간보고서 반영 기록이 비어 있으면 단일 입력에 오류를 표시한다', async () => {
    const user = userEvent.setup();
    const midReview = createStudentHomeDashboardPreview(
      'mid-feedback',
    ).milestones.find(milestone => milestone.id === 'mid-review');
    const body = midReview?.body;
    if (!body || body.kind !== 'mid-review-feedback') {
      throw new Error('mid report feedback body 없음');
    }

    renderWithRouter(
      <MilestoneDetails
        body={{
          ...body,
          canSubmitResponse: true,
          responseBlockedReason: undefined,
        }}
      />,
    );

    await user.click(screen.getByRole('button', { name: '반영 기록 남기기' }));

    expect(
      screen.getByRole('textbox', { name: /대면 피드백 반영 내용/ }),
    ).toHaveAttribute('aria-invalid', 'true');
    expect(
      screen.getByText('대면 피드백과 반영 내용을 입력해 주세요.'),
    ).toBeVisible();
  });

  it('중간보고서 반영 기록 제출이 실패하면 입력을 유지하고 오류를 표시한다', async () => {
    const user = userEvent.setup();
    const midReview = createStudentHomeDashboardPreview(
      'mid-feedback',
    ).milestones.find(milestone => milestone.id === 'mid-review');
    const body = midReview?.body;
    if (!body || body.kind !== 'mid-review-feedback') {
      throw new Error('mid report feedback body 없음');
    }
    const readyBody = {
      ...body,
      canSubmitResponse: true,
      responseBlockedReason: undefined,
    };
    const view = renderWithRouter(<MilestoneDetails body={readyBody} />);
    const input = screen.getByRole('textbox', {
      name: /대면 피드백 반영 내용/,
    });

    await user.type(input, '오류 처리 피드백을 반영했습니다.');
    submitMidReportFeedback.mockImplementation(() => {
      feedbackMutationState.midError = new Error('request failed');
    });
    await user.click(screen.getByRole('button', { name: '반영 기록 남기기' }));
    view.rerender(<MilestoneDetails body={readyBody} />);

    expect(submitMidReportFeedback).toHaveBeenCalledWith(
      {
        submissionId: body.submissionId,
        content: '오류 처리 피드백을 반영했습니다.',
      },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
    expect(input).toHaveValue('오류 처리 피드백을 반영했습니다.');
    expect(
      screen.getByText(
        '반영 기록을 남기지 못했습니다. 잠시 후 다시 시도해 주세요.',
      ),
    ).toBeVisible();
  });

  it.each([
    ['proposal-feedback', '제안서를 수정해 다시 제출한 뒤'],
    ['mid-feedback', '중간보고서를 수정해 다시 제출한 뒤'],
  ] as const)(
    '%s 상태는 문서 재제출 전 피드백 입력을 잠근다',
    (scenario, reason) => {
      const body = createStudentHomeDashboardPreview(scenario).milestones.find(
        milestone => milestone.isDetailAvailable,
      )?.body;
      if (
        !body ||
        (body.kind !== 'proposal-feedback' &&
          body.kind !== 'mid-review-feedback')
      ) {
        throw new Error('feedback body 없음');
      }

      renderWithRouter(<MilestoneDetails body={body} />);

      expect(
        screen.getByText(new RegExp(reason), { selector: 'p' }),
      ).toBeVisible();
      const submitButton = screen.getByRole('button', {
        name:
          body.kind === 'proposal-feedback'
            ? '답변 보내기'
            : '반영 기록 남기기',
      });
      expect(
        submitButton.hasAttribute('disabled') ||
          submitButton.getAttribute('aria-disabled') === 'true',
      ).toBe(true);
    },
  );
});
