import type { AdminMilestoneSubmissionDetailResponse } from '@aics/api-client';

const proposalSubmissionDetail: AdminMilestoneSubmissionDetailResponse = {
  milestone: {
    id: 'proposal',
    title: '제안서',
  },
  proposal: {
    collaboration: '주 2회 대면 회의, GitHub PR 리뷰 후 병합',
    dataRows: [
      {
        count: 20,
        description: '상영 가능한 영화 기본 정보',
        name: '영화',
      },
      {
        count: 120,
        description: '영화별 상영관과 시간표',
        name: '상영 일정',
      },
      {
        count: 200,
        description: '좌석별 예매 기록',
        name: '예매',
      },
    ],
    introduction: '영화 데이터를 다루는 웹 서비스로 함께 성장하는 팀입니다.',
    members: ['이서연', '김민준'],
    projectDescription:
      '팀 프로젝트의 진행 상황과 제출물을 한곳에서 관리합니다.',
    projectTitle: 'AI 기반 팀 프로젝트 관리 서비스',
    roles: '김민준: ENGINE · 이서연: GUI',
    schedule: '9월 도메인 설계 → 10월 중간보고서 → 11월 발표·최종 제출',
    screenDescription:
      '관리자는 팀과 분반의 프로젝트 진행 현황을 확인하고, 필요한 피드백을 남길 수 있습니다.',
    screens: [
      {
        name: '팀 대시보드',
        description: '팀 진행 현황과 제출 상태를 확인합니다.',
      },
      {
        name: '분반별 제출물',
        description: '마일스톤별 팀 제출물을 확인합니다.',
      },
    ],
    teamLeaderName: '김민준',
    teamName: 'OOP-01 - 1팀',
    wireframeFileNames: ['team-dashboard.png'],
  },
  section: {
    id: 'oop-2026-2-01',
    label: 'OOP-01',
  },
  submittedAt: '2026/09/05',
  submission: {
    id: 'submission-oop-01-1-proposal',
    teamId: 'team-1151-1',
    teamName: 'OOP-01 - 1팀',
  },
};

const secondTeamProposalSubmissionDetail: AdminMilestoneSubmissionDetailResponse =
  {
    ...proposalSubmissionDetail,
    proposal: {
      ...proposalSubmissionDetail.proposal!,
      members: ['박지훈', '최유진'],
      projectTitle: '분반 프로젝트 협업 보드',
      teamLeaderName: '박지훈',
      teamName: 'OOP-01 - 2팀',
    },
    submission: {
      id: 'submission-oop-01-2-proposal',
      teamId: 'team-1151-2',
      teamName: 'OOP-01 - 2팀',
    },
  };

export function getAdminMilestoneSubmissionDetailFixture(
  submissionId: string,
): AdminMilestoneSubmissionDetailResponse | undefined {
  if (submissionId === proposalSubmissionDetail.submission.id) {
    return structuredClone(proposalSubmissionDetail);
  }

  if (submissionId === secondTeamProposalSubmissionDetail.submission.id) {
    return structuredClone(secondTeamProposalSubmissionDetail);
  }

  return undefined;
}
