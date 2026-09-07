import type {
  MeetingActionResponseDto,
  MeetingRecordDetailResponseDto,
  TeamKickoffResponse,
} from '@aics/core';

export const meetingApiTeam: TeamKickoffResponse = {
  id: 7,
  name: '회의록 테스트 팀',
  members: [
    {
      id: 501,
      studentNumber: '20260001',
      name: 'OOP 데모 학생 A',
      isLeader: true,
    },
    {
      id: 502,
      studentNumber: '20260003',
      name: 'OOP 데모 학생 B',
      isLeader: false,
    },
  ],
};
export const meetingApiRecord: MeetingRecordDetailResponseDto = {
  id: 19,
  teamId: 7,
  title: '진행 점검 회의',
  phase: 'MID_CHECK',
  authorId: '20260001',
  meetingAt: '2026-09-07 09:30',
  location: '301호',
  content:
    '지난 회의의 결정 사항을 확인했습니다.\n이번 주 구현 범위를 정리합니다.',
  participantIds: ['20260001', '20260003'],
  createdAt: '2026-09-07 10:00',
  updatedAt: '2026-09-07 10:00',
};
export const meetingApiAction: MeetingActionResponseDto = {
  id: 41,
  meetingRecordId: 19,
  content: '회의록 상세 화면 검증',
  status: 'TODO',
  assignee: { userId: '20260003', name: 'OOP 데모 학생 B' },
  dueAt: '2026-09-10 18:00',
  createdAt: '2026-09-07 10:00',
  updatedAt: '2026-09-07 10:00',
};
