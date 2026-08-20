import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('~/features/project-topic/ProjectTopicBoard', () => ({
  default: () => <div>주제 후보 투표 영역</div>,
}));

import MilestoneDetails from './MilestoneDetails';
import MilestoneList from './MilestoneList';

import {
  createStudentHomeDashboardPreview,
  studentHomeDashboardFixture,
} from '~/mocks/data/studentHome';
import { renderWithRouter } from '~/test/renderWithRouter';

describe('MilestoneList', () => {
  it('팀 배정이 끝난 학생에게 5개 상위 단계를 순서대로 표시한다', () => {
    renderWithRouter(
      <MilestoneList milestones={studentHomeDashboardFixture.milestones} />,
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
      <MilestoneList milestones={studentHomeDashboardFixture.milestones} />,
    );

    expect(screen.getAllByText('주제 선정').length).toBeGreaterThan(0);
    expect(screen.getByText('주제 후보 투표 영역')).toBeInTheDocument();
    expect(screen.queryByText('최종 선정 주제')).not.toBeInTheDocument();
    expect(screen.queryByText('교수 피드백')).not.toBeInTheDocument();
  });

  it('제안서 피드백 반영과 조기 활성화된 중간 단계를 함께 상세로 표시한다', () => {
    const dashboard = createStudentHomeDashboardPreview(
      'proposal-feedback-mid-report',
    );

    renderWithRouter(<MilestoneList milestones={dashboard.milestones} />);

    expect(screen.getAllByText('수정 가능')).toHaveLength(2);
    expect(screen.getByText('피드백 반영 가능')).toBeInTheDocument();
    expect(screen.getByText('중간보고서 작성')).toBeInTheDocument();
    expect(screen.getByText('최종 선정 주제')).toBeInTheDocument();
    expect(screen.getByText('교수 피드백')).toBeInTheDocument();
  });

  it('새로 활성화된 마일스톤은 데이터 갱신 뒤에도 기본으로 상세를 연다', () => {
    const { rerender } = renderWithRouter(
      <MilestoneList milestones={studentHomeDashboardFixture.milestones} />,
    );

    rerender(
      <MilestoneList
        milestones={
          createStudentHomeDashboardPreview('proposal-feedback-mid-report')
            .milestones
        }
      />,
    );

    expect(screen.getByText('교수 피드백')).toBeInTheDocument();
    expect(screen.getByText('최종 선정 주제')).toBeInTheDocument();
  });

  it('마일스톤이 없으면 빈 상태를 표시한다', () => {
    renderWithRouter(<MilestoneList milestones={[]} />);

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
    expect(screen.getByText('주제 후보 투표 영역')).toBeInTheDocument();
  });
});
