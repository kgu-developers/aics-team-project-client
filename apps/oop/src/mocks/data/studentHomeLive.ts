import type {
  CurrentUser,
  TeamMeetingActionResponseDto,
  MeetingRecordSummaryDto,
  SectionAnnouncementResponse,
  TeamKickoffResponse,
  TeamProjectResponse,
} from '@aics/core';

export const liveHomeUser: CurrentUser = {
  id: 'legacy-ui-identity',
  studentNumber: '202600001',
  name: '홈 확인 학생',
  email: 'student@example.test',
  globalRole: 'STUDENT',
  sections: [{ id: '2', code: 'OOP-2', name: '테스트 분반', role: 'STUDENT' }],
  teamId: '7',
  currentTeam: null,
};

export const liveHomeTeam: TeamKickoffResponse = {
  id: 7,
  name: '테스트 7팀',
  members: [
    {
      id: 1,
      studentNumber: liveHomeUser.studentNumber,
      name: liveHomeUser.name,
      isLeader: true,
    },
    { id: 2, studentNumber: '202600002', name: '다른 팀원', isLeader: false },
  ],
};

export const liveHomeProject: TeamProjectResponse = {
  id: 21,
  teamId: 7,
  title: '팀의 실제 프로젝트',
  description: '서버에 저장된 프로젝트 설명',
};

export const liveHomeAnnouncements: SectionAnnouncementResponse[] = [
  1, 4, 2, 3,
].map(id => ({
  id,
  sectionId: 2,
  title: `공지 ${id}`,
  content: `공지 본문 ${id}`,
  publishedAt: `2026-09-0${id}T09:00:00`,
}));

export const liveHomeRecords: MeetingRecordSummaryDto[] = [1, 4, 2, 3].map(
  id => ({
    id,
    title: `회의 ${id}`,
    phase: 'PROPOSAL',
    meetingAt: `2026-09-0${id} 10:30`,
    authorId: '202600002',
    participantCount: 2,
  }),
);

export const liveHomeActions: TeamMeetingActionResponseDto[] = [
  1, 2, 3, 4, 5, 6,
].map(id => ({
  id,
  meetingRecordId: 4,
  meetingRecord: {
    id: 4,
    title: liveHomeRecords.find(record => record.id === 4)!.title,
  },
  content: `액션 ${id}`,
  status: 'TODO',
  assignee:
    id === 6
      ? { userId: '202600002', name: '다른 팀원' }
      : id === 5
        ? null
        : { userId: liveHomeUser.studentNumber, name: liveHomeUser.name },
  createdAt: `2026-09-0${id} 10:30`,
  updatedAt: `2026-09-0${id} 10:30`,
  dueAt: null,
}));
