import type { AdminTeamDashboardView } from '~/features/admin-team-dashboard/model';

import { getAdminTeamMembersFixture } from './adminStudentTeams';

const adminTeamRoles = {
  'student-1151-1': { isLeader: true, projectRole: 'ENGINE' as const },
  'student-1151-2': { isLeader: false, projectRole: 'GUI' as const },
  'student-1151-3': { isLeader: true, projectRole: 'ENGINE' as const },
  'student-1151-4': { isLeader: false, projectRole: 'GUI' as const },
};

const getDashboardMembers = (teamId: string) =>
  getAdminTeamMembersFixture(teamId).map(member => ({
    id: member.id,
    name: member.name,
    studentNumber: member.studentNumber,
    major: member.major,
    ...adminTeamRoles[member.id as keyof typeof adminTeamRoles],
  }));

export const adminTeamDashboardFixture: AdminTeamDashboardView = {
  id: 'team-1151-1',
  section: {
    id: 'oop-2026-2-01',
    code: 'OOP-01',
  },
  name: '1팀',
  projectTopic: 'AI 기반 팀 프로젝트 관리 서비스',
  members: getDashboardMembers('team-1151-1'),
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
      submissionId: 'submission-oop-01-1-presentation-submit',
      status: { kind: 'submitted', submittedDateLabel: '2026-11-12' },
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
      deadlineLabel: '2026-12-07',
      submissionId: 'submission-oop-01-1-final-report',
      downloadFiles: [
        {
          downloadUrl: 'data:application/pdf;base64,JVBERi0xLjQKJQ==',
          fileName: 'oop-01-1-final-report.pdf',
          label: '보고서(pdf)',
        },
        {
          downloadUrl:
            'data:application/zip;base64,UEsFBgAAAAAAAAAAAAAAAAAAAAAAAA==',
          fileName: 'oop-01-1-final-report.zip',
          label: '전체 파일(zip)',
        },
      ],
      status: { kind: 'submitted', submittedDateLabel: '2026-12-07' },
    },
    {
      id: 'peer-review',
      title: '상호 평가',
      deadlineLabel: '2026-08-30',
      submissionId: 'submission-oop-01-1-peer-review',
      status: { kind: 'submitted', submittedDateLabel: '2026-12-14' },
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
    members: getDashboardMembers('team-1151-2'),
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
        submissionId: 'submission-oop-01-2-presentation-submit',
        status: { kind: 'submitted', submittedDateLabel: '2026-11-13' },
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
        deadlineLabel: '2026-12-07',
        submissionId: 'submission-oop-01-2-final-report',
        downloadFiles: [
          {
            downloadUrl: 'data:application/pdf;base64,JVBERi0xLjQKJQ==',
            fileName: 'oop-01-2-final-report.pdf',
            label: '보고서(pdf)',
          },
          {
            downloadUrl:
              'data:application/zip;base64,UEsFBgAAAAAAAAAAAAAAAAAAAAAAAA==',
            fileName: 'oop-01-2-final-report.zip',
            label: '전체 파일(zip)',
          },
        ],
        status: { kind: 'submitted', submittedDateLabel: '2026-12-08' },
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
