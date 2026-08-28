import type { MeetingRecord } from '@aics/core';

import {
  adminTeamsFixture,
  getAdminTeamMembersFixture,
} from './adminStudentTeams';

export type AdminMeetingFixture = MeetingRecord & {
  sectionId: string;
  sectionLabel: string;
  teamLabel: string;
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
        dueDate: '2026-10-05',
        id: 'admin-meeting-action-1',
        meetingId: 'admin-meeting-1',
        status: 'TODO',
        updatedAt: '2026-10-01T10:30:00+09:00',
      },
    ],
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
    participants: getTeamParticipants('team-1151-1'),
    sectionId,
    sectionLabel,
    teamId: 'team-1151-1',
    teamLabel: '1팀',
    title: '프로젝트 킥오프',
    updatedAt: '2026-10-01T10:30:00+09:00',
  },
  {
    actions: [],
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
