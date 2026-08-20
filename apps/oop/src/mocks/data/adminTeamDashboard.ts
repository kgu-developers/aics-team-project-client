import type { AdminTeamDashboard } from '@aics/core';

export const adminTeamDashboardFixture: AdminTeamDashboard = {
  id: 'team-1151-1',
  section: {
    id: 'oop-2026-2-01',
    code: 'OOP-01',
  },
  name: '1팀',
  projectTopic: 'AI 기반 팀 프로젝트 관리 서비스',
  members: [
    {
      id: 'student-1151-1',
      name: '김민준',
      studentNumber: '20231234',
      major: '컴퓨터공학과',
      isLeader: true,
      projectRole: 'ENGINE',
    },
    {
      id: 'student-1151-2',
      name: '이서연',
      studentNumber: '20235678',
      major: '소프트웨어학과',
      isLeader: false,
      projectRole: 'GUI',
    },
  ],
};
