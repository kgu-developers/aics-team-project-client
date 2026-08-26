import type { AdminTeamDashboardView } from '~/features/admin-team-dashboard/model';

export const adminTeamDashboardFixture: AdminTeamDashboardView = {
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
  milestones: [
    {
      id: 'proposal',
      title: '제안서',
      deadlineLabel: '2026-08-24',
      submissionId: 'submission-oop-01-1-proposal',
      status: {
        kind: 'submitted',
        submittedDateLabel: '2026-09-05',
      },
    },
    {
      id: 'midterm',
      title: '중간 점검',
      deadlineLabel: '2026-10-15',
      submissionId: 'submission-oop-01-1-midterm',
      status: {
        kind: 'submitted',
        submittedDateLabel: '2026-10-12',
      },
    },
    {
      id: 'presentation-submit',
      title: '발표 자료 제출',
      deadlineLabel: '2026-11-12',
      submissionId: null,
      status: { kind: 'not-submitted' },
    },
    {
      id: 'presentation-evaluate',
      title: '발표 평가',
      deadlineLabel: '2026-08-20',
      submissionId: null,
      status: { kind: 'evaluated' },
    },
    {
      id: 'final-report',
      title: '최종 보고서',
      deadlineLabel: '2026-08-27',
      submissionId: null,
      status: { kind: 'before-deadline' },
    },
    {
      id: 'peer-review',
      title: '상호 평가',
      deadlineLabel: '2026-08-30',
      submissionId: null,
      status: { kind: 'before-deadline' },
    },
  ],
};

export const adminTeamDashboardFixtures: AdminTeamDashboardView[] = [
  adminTeamDashboardFixture,
  {
    id: 'team-1151-2',
    section: {
      id: 'oop-2026-2-01',
      code: 'OOP-01',
    },
    name: '2팀',
    projectTopic: '캠퍼스 학습 일정 관리 서비스',
    members: [
      {
        id: 'student-1151-3',
        name: '박지훈',
        studentNumber: '20239876',
        major: '컴퓨터공학과',
        isLeader: true,
        projectRole: 'ENGINE',
      },
      {
        id: 'student-1151-4',
        name: '최유진',
        studentNumber: '20234567',
        major: '인공지능학과',
        isLeader: false,
        projectRole: 'GUI',
      },
    ],
    milestones: [
      {
        id: 'proposal',
        title: '제안서',
        deadlineLabel: '2026-08-24',
        submissionId: 'submission-oop-01-2-proposal',
        status: {
          kind: 'submitted',
          submittedDateLabel: '2026-09-06',
        },
      },
      {
        id: 'midterm',
        title: '중간 점검',
        deadlineLabel: '2026-10-15',
        submissionId: 'submission-oop-01-2-midterm',
        status: {
          kind: 'submitted',
          submittedDateLabel: '2026-10-13',
        },
      },
      {
        id: 'presentation-submit',
        title: '발표 자료 제출',
        deadlineLabel: '2026-11-12',
        submissionId: null,
        status: { kind: 'not-submitted' },
      },
      {
        id: 'presentation-evaluate',
        title: '발표 평가',
        deadlineLabel: '2026-08-20',
        submissionId: null,
        status: { kind: 'evaluated' },
      },
      {
        id: 'final-report',
        title: '최종 보고서',
        deadlineLabel: '2026-08-27',
        submissionId: null,
        status: { kind: 'before-deadline' },
      },
      {
        id: 'peer-review',
        title: '상호 평가',
        deadlineLabel: '2026-08-30',
        submissionId: null,
        status: { kind: 'before-deadline' },
      },
    ],
  },
];
