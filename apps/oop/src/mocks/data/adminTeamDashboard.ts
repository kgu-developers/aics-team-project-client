import type { AdminTeamDashboardView } from '~/features/admin-team-dashboard/model';

import { getAdminMilestoneDeadlineLabel } from './adminMilestoneDeadlines';
import { getAdminPeerEvaluationProgress } from './adminPeerEvaluationProgress';
import { getAdminTeamMembersFixture } from './adminStudentTeams';
import { getAdminSubmissionFiles } from './adminSubmissionFiles';

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

function getMilestoneSummary(teamId: string, milestoneId: string) {
  const files = getAdminSubmissionFiles(teamId);

  if (!files) {
    return undefined;
  }

  if (milestoneId === 'midterm') {
    return { attachmentCount: files.midterm.length };
  }

  if (milestoneId === 'presentation-submit') {
    return { ...files.presentation };
  }

  return undefined;
}

function getFinalReportDownloadFiles(teamId: string) {
  const files = getAdminSubmissionFiles(teamId)?.finalReport;

  if (!files) {
    return [];
  }

  return [
    {
      downloadUrl: files.reportDownloadUrl,
      fileName: files.reportFileName,
      label: '보고서(pdf)',
    },
    {
      downloadUrl: files.sourceArchiveDownloadUrl,
      fileName: files.sourceArchiveFileName,
      label: '전체 파일(zip)',
    },
  ];
}

export const adminTeamDashboardFixture: AdminTeamDashboardView = {
  id: 'team-1151-1',
  section: {
    id: 'oop-2026-2-01',
    code: 'OOP-01',
  },
  name: '1팀',
  projectTopic:
    getAdminSubmissionFiles('team-1151-1')?.proposal.projectTopic ?? null,
  members: getDashboardMembers('team-1151-1'),
  milestones: [
    {
      id: 'proposal',
      title: '제안서',
      deadlineLabel: getAdminMilestoneDeadlineLabel('proposal'),
      submissionId: 'submission-oop-01-1-proposal',
      status: {
        kind: 'submitted',
        submittedDateLabel: '2026-09-05',
      },
    },
    {
      id: 'midterm',
      title: '중간 점검',
      deadlineLabel: getAdminMilestoneDeadlineLabel('midterm'),
      summary: getMilestoneSummary('team-1151-1', 'midterm'),
      submissionId: 'submission-oop-01-1-midterm',
      status: {
        kind: 'submitted',
        submittedDateLabel: '2026-10-12',
      },
    },
    {
      id: 'presentation-submit',
      title: '발표 자료 제출',
      deadlineLabel: getAdminMilestoneDeadlineLabel('presentation-submit'),
      summary: getMilestoneSummary('team-1151-1', 'presentation-submit'),
      submissionId: 'submission-oop-01-1-presentation-submit',
      status: { kind: 'submitted', submittedDateLabel: '2026-11-12' },
    },
    {
      id: 'presentation-evaluate',
      title: '발표 평가',
      deadlineLabel: getAdminMilestoneDeadlineLabel('presentation-evaluate'),
      submissionId: null,
      status: { kind: 'evaluated' },
    },
    {
      id: 'final-report',
      title: '최종 보고서',
      deadlineLabel: getAdminMilestoneDeadlineLabel('final-report'),
      submissionId: 'submission-oop-01-1-final-report',
      downloadFiles: getFinalReportDownloadFiles('team-1151-1'),
      status: { kind: 'submitted', submittedDateLabel: '2026-12-07' },
    },
    {
      id: 'peer-review',
      title: '상호 평가',
      deadlineLabel: getAdminMilestoneDeadlineLabel('peer-review'),
      submissionId: 'submission-oop-01-1-peer-review',
      status: { kind: 'submitted', submittedDateLabel: '2026-12-14' },
      ...getAdminPeerEvaluationProgress('team-1151-1'),
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
    projectTopic:
      getAdminSubmissionFiles('team-1151-2')?.proposal.projectTopic ?? null,
    members: getDashboardMembers('team-1151-2'),
    milestones: [
      {
        id: 'proposal',
        title: '제안서',
        deadlineLabel: getAdminMilestoneDeadlineLabel('proposal'),
        submissionId: 'submission-oop-01-2-proposal',
        status: {
          kind: 'submitted',
          submittedDateLabel: '2026-09-06',
        },
      },
      {
        id: 'midterm',
        title: '중간 점검',
        deadlineLabel: getAdminMilestoneDeadlineLabel('midterm'),
        summary: getMilestoneSummary('team-1151-2', 'midterm'),
        submissionId: 'submission-oop-01-2-midterm',
        status: {
          kind: 'submitted',
          submittedDateLabel: '2026-10-13',
        },
      },
      {
        id: 'presentation-submit',
        title: '발표 자료 제출',
        deadlineLabel: getAdminMilestoneDeadlineLabel('presentation-submit'),
        summary: getMilestoneSummary('team-1151-2', 'presentation-submit'),
        submissionId: 'submission-oop-01-2-presentation-submit',
        status: { kind: 'submitted', submittedDateLabel: '2026-11-13' },
      },
      {
        id: 'presentation-evaluate',
        title: '발표 평가',
        deadlineLabel: getAdminMilestoneDeadlineLabel('presentation-evaluate'),
        submissionId: null,
        status: { kind: 'evaluated' },
      },
      {
        id: 'final-report',
        title: '최종 보고서',
        deadlineLabel: getAdminMilestoneDeadlineLabel('final-report'),
        submissionId: 'submission-oop-01-2-final-report',
        downloadFiles: getFinalReportDownloadFiles('team-1151-2'),
        status: { kind: 'submitted', submittedDateLabel: '2026-12-08' },
      },
      {
        id: 'peer-review',
        title: '상호 평가',
        deadlineLabel: getAdminMilestoneDeadlineLabel('peer-review'),
        submissionId: null,
        status: { kind: 'before-deadline' },
        ...getAdminPeerEvaluationProgress('team-1151-2'),
      },
    ],
  },
];
