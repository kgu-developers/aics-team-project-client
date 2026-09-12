import {
  PROPOSAL_SECTIONS,
  type ProjectProposalResponse,
  type ProposalSectionsResponse,
} from '@aics/core';

import { demoStudent, demoPartnerStudent } from './users';
export function createProjectProposalFixture(): ProjectProposalResponse {
  return {
    id: 19,
    teamId: 19,
    title: '팀 프로젝트',
    description: '도서 대출 서비스',
    goal: '대출과 반납을 쉽게 관리한다',
    dataConfiguration: [
      {
        name: '도서',
        description: '대출 가능한 도서',
        expectedCount: '약 100권',
      },
    ],
    screenConfiguration: [
      { title: '도서 목록', description: '도서를 검색한다', imageFileId: 41 },
    ],
    repositoryUrl: 'https://example.com/repo',
    externalLinks: [{ name: '참고 자료', url: 'https://example.com/docs' }],
    projectSchedule: '9월 구현',
    proposalCompletedAt: null,
    teamOperation: {
      id: 19,
      name: '예시 팀',
      kickoffRule: '매주 회고',
      meetingSchedule: '금요일 18시',
      members: [
        {
          id: 1,
          name: demoStudent.name,
          studentNumber: demoStudent.studentNumber,
          isLeader: true,
          projectRole: '개발',
        },
        {
          id: 2,
          name: demoPartnerStudent.name,
          studentNumber: demoPartnerStudent.studentNumber,
          isLeader: false,
          projectRole: '설계',
        },
      ],
    },
  };
}
export function createProposalSectionsFixture(): ProposalSectionsResponse {
  return {
    allCompleted: false,
    contents: PROPOSAL_SECTIONS.map(section => ({
      section,
      assigneeUserId: null,
      assigneeName: null,
      completed: false,
      completedAt: null,
    })),
  };
}
