import type { MeetingPhase, MeetingRecord } from '@aics/core';

import {
  adminTeamsFixture,
  getAdminTeamMembersFixture,
} from './adminStudentTeams';

export type AdminMeetingFixture = MeetingRecord & {
  apiSectionId: number;
  apiTeamId: number;
  milestoneIds: number[];
  phase: MeetingPhase;
  sectionId: string;
  sectionLabel: string;
  teamLabel: string;
};

export type AdminMeetingEditLogFixture = {
  createdAt: string;
  editorId: string;
  editorName: string;
  id: number;
  meetingId: string;
  reason: string;
};

const sectionId = 'oop-2026-2-01';
const sectionLabel = 'OOP-01';

function getTeamParticipants(teamId: string) {
  return getAdminTeamMembersFixture(teamId).map(student => ({
    name: student.name,
    userId: student.id,
  }));
}

function getTeamMember(teamId: string, studentId: string) {
  const student = getAdminTeamMembersFixture(teamId).find(
    member => member.id === studentId,
  );

  if (!student) {
    throw new Error(
      `어드민 회의록 fixture에서 팀원 ${studentId}를 찾을 수 없습니다.`,
    );
  }

  return { name: student.name, userId: student.id };
}

const records: AdminMeetingFixture[] = [
  {
    actions: [
      {
        assignee: getTeamMember('team-1151-1', 'student-1151-1'),
        content: '도메인 모델 초안 작성',
        createdAt: '2026-10-01T10:30:00+09:00',
        dueDate: '2026-10-05T23:59:00+09:00',
        id: 'admin-meeting-action-1',
        meetingId: 'admin-meeting-1',
        status: 'TODO',
        updatedAt: '2026-10-01T10:30:00+09:00',
      },
    ],
    apiSectionId: 1,
    apiTeamId: 1,
    content: {
      content: [
        {
          content: [{ text: '이번 회의 결정', type: 'text' }],
          type: 'heading',
        },
        {
          content: [
            {
              content: [
                {
                  text: 'MVP 범위는 회의록과 액션 플랜까지로 고정한다.',
                  type: 'text',
                },
              ],
              type: 'listItem',
            },
            {
              content: [
                {
                  text: '다음 주까지 도메인 모델 초안을 공유한다.',
                  type: 'text',
                },
              ],
              type: 'listItem',
            },
          ],
          type: 'bulletList',
        },
      ],
      type: 'doc',
    },
    createdAt: '2026-10-01T10:30:00+09:00',
    createdBy: getTeamMember('team-1151-1', 'student-1151-1'),
    heldAt: '2026-10-01T00:00:00+09:00',
    id: 'admin-meeting-1',
    location: '공학관 301호',
    milestoneIds: [101],
    phase: 'PROPOSAL',
    participants: getTeamParticipants('team-1151-1'),
    sectionId,
    sectionLabel,
    teamId: 'team-1151-1',
    teamLabel: '1팀',
    title: '프로젝트 킥오프',
    updatedAt: '2026-10-01T10:30:00+09:00',
  },
  {
    actions: [
      {
        assignee: getTeamMember('team-1151-1', 'student-1151-2'),
        content: '중간 점검 피드백 반영 사항 정리',
        createdAt: '2026-10-10T19:10:00+09:00',
        dueDate: null,
        id: 'admin-meeting-action-3',
        meetingId: 'admin-meeting-3',
        status: 'DONE',
        updatedAt: '2026-10-11T10:00:00+09:00',
      },
    ],
    apiSectionId: 1,
    apiTeamId: 1,
    content: {
      content: [
        {
          content: [
            {
              text: '구현 진행 상황과 남은 작업을 점검했다.',
              type: 'text',
            },
          ],
          type: 'paragraph',
        },
      ],
      type: 'doc',
    },
    createdAt: '2026-10-10T19:00:00+09:00',
    createdBy: getTeamMember('team-1151-1', 'student-1151-1'),
    heldAt: '2026-10-10T18:00:00+09:00',
    id: 'admin-meeting-3',
    location: '공학관 301호',
    milestoneIds: [102],
    phase: 'MID_CHECK',
    participants: getTeamParticipants('team-1151-1'),
    sectionId,
    sectionLabel,
    teamId: 'team-1151-1',
    teamLabel: '1팀',
    title: '중간 점검 회의',
    updatedAt: '2026-10-10T19:00:00+09:00',
  },
  {
    actions: [
      {
        assignee: getTeamMember('team-1151-2', 'student-1151-3'),
        content: '발표 자료 역할별 초안 작성',
        createdAt: '2026-10-08T19:10:00+09:00',
        dueDate: '2026-10-13T18:00:00+09:00',
        id: 'admin-meeting-action-2',
        meetingId: 'admin-meeting-2',
        status: 'IN_PROGRESS',
        updatedAt: '2026-10-09T09:30:00+09:00',
      },
    ],
    apiSectionId: 1,
    apiTeamId: 2,
    content: {
      content: [
        {
          content: [{ text: '이번 회의 결정', type: 'text' }],
          type: 'heading',
        },
        {
          content: [
            {
              content: [
                {
                  text: '발표 자료의 핵심 흐름과 역할을 확정한다.',
                  type: 'text',
                },
              ],
              type: 'listItem',
            },
          ],
          type: 'bulletList',
        },
      ],
      type: 'doc',
    },
    createdAt: '2026-10-08T19:00:00+09:00',
    createdBy: getTeamMember('team-1151-2', 'student-1151-3'),
    heldAt: '2026-10-08T00:00:00+09:00',
    id: 'admin-meeting-2',
    location: '온라인',
    milestoneIds: [106],
    phase: 'FINAL',
    participants: getTeamParticipants('team-1151-2'),
    sectionId,
    sectionLabel,
    teamId: 'team-1151-2',
    teamLabel: '2팀',
    title: '발표 자료 구성 논의',
    updatedAt: '2026-10-08T19:00:00+09:00',
  },
];

const teamIds = new Set(adminTeamsFixture.map(team => team.id));

export const adminMeetingRecordsFixture = records.filter(record =>
  teamIds.has(record.teamId),
);

export const adminMeetingEditLogsFixture: AdminMeetingEditLogFixture[] = [
  {
    createdAt: '2026-10-10T19:10:00+09:00',
    editorId: '20261234',
    editorName: '김민준',
    id: 3,
    meetingId: 'admin-meeting-3',
    reason:
      '중간 점검 피드백 반영 담당자가 실제 논의 내용과 달라 역할 분담을 바로잡았습니다.',
  },
  {
    createdAt: '2026-10-09T18:20:00+09:00',
    editorId: '20261235',
    editorName: '이서연',
    id: 2,
    meetingId: 'admin-meeting-2',
    reason:
      '발표 자료의 구성 순서가 회의에서 합의한 흐름과 달라 결정 사항에 맞게 수정했습니다.',
  },
  {
    createdAt: '2026-10-02T09:15:00+09:00',
    editorId: '20261234',
    editorName: '김민준',
    id: 1,
    meetingId: 'admin-meeting-1',
    reason:
      '프로젝트 역할 분담 내용 중 누락된 담당 업무를 회의 결과에 맞게 추가했습니다.',
  },
];

export function countAdminMeetingRecords(teamId: number, milestoneId: number) {
  return adminMeetingRecordsFixture.filter(
    record =>
      record.apiTeamId === teamId && record.milestoneIds.includes(milestoneId),
  ).length;
}

export function countAllAdminMeetingRecords(teamId: number) {
  return adminMeetingRecordsFixture.filter(
    record => record.apiTeamId === teamId,
  ).length;
}
