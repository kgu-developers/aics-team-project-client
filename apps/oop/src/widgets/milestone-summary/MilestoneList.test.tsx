import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('~/features/project-topic/ProjectTopicBoard', () => ({
  default: ({ embedded }: { embedded?: boolean }) => (
    <div data-embedded={String(embedded)}>주제 후보 투표 영역</div>
  ),
}));

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
import { renderWithRouter } from '~/test/renderWithRouter';

const PERSISTENCE_KEY = 'student-a:oop-section-1';

describe('MilestoneList', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
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
});
