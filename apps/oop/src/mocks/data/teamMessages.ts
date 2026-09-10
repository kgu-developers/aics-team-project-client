import type { TeamMessage, TeamThread } from '@aics/core';

export const teamMessageProfessorId = 'professor-oop-demo';

export const teamMessageSenderNames: Record<string, string> = {
  [teamMessageProfessorId]: '검수 교수',
  '20260001': '검수 학생',
  '20260003': '검수 팀원',
  '20260004': '검수 팀원 2',
  'other-section-professor': '다른 분반 교수',
};

const teams = [
  {
    id: 7,
    memberIds: ['20260001', '20260003', '20260004'],
    professorId: teamMessageProfessorId,
  },
  { id: 8, memberIds: [], professorId: teamMessageProfessorId },
  { id: 9, memberIds: [], professorId: 'other-section-professor' },
];

const threads: TeamThread[] = [
  { threadId: 70, teamId: 7, createdAt: '2026-09-01 09:00' },
];

const messages: TeamMessage[] = [
  {
    id: 701,
    threadId: 70,
    senderId: teamMessageProfessorId,
    relatedType: 'PROPOSAL',
    message: '제안서의 핵심 기능과 구현 범위를 구체적으로 정리해 주세요.',
    important: false,
    read: false,
    createdAt: '2026-09-01 10:00',
  },
  {
    id: 702,
    threadId: 70,
    senderId: '20260001',
    relatedType: 'PROPOSAL',
    message: '핵심 기능의 구현 범위를 확인했습니다.',
    important: false,
    read: false,
    createdAt: '2026-09-01 10:10',
  },
  {
    id: 703,
    threadId: 70,
    senderId: teamMessageProfessorId,
    relatedType: 'GENERAL',
    message: '다음 상담은 수업 후에 진행합니다.',
    important: false,
    read: false,
    createdAt: '2026-09-02 10:00',
  },
  {
    id: 704,
    threadId: 70,
    senderId: teamMessageProfessorId,
    relatedType: 'PROPOSAL',
    message: '기능별 역할 분담도 함께 정리해 주세요.',
    important: true,
    read: false,
    createdAt: '2026-09-03 10:00',
  },
  {
    id: 705,
    threadId: 70,
    senderId: teamMessageProfessorId,
    relatedType: 'MID_REPORT',
    message: '중간보고서에는 구현 진행 상황을 기록해 주세요.',
    important: false,
    read: false,
    createdAt: '2026-09-04 10:00',
  },
];

export function createTeamMessageData() {
  return {
    teams: structuredClone(teams),
    threads: structuredClone(threads),
    messages: structuredClone(messages).map<TeamMessage>(message => ({
      ...message,
      senderName: teamMessageSenderNames[message.senderId],
    })),
    nextThreadId: 71,
    nextMessageId: 706,
  };
}
