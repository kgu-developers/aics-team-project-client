import type { TeamAssignmentProjection } from '@aics/core';
export const demoTeamAssignmentSectionId = 'oop-2026-2-01';
export const teamAssignmentFixture: TeamAssignmentProjection = {
  sectionId: demoTeamAssignmentSectionId,
  phase: 'survey',
  window: { closesAt: '2026-09-03T23:59:00+09:00' },
  survey: { rolePreferences: [], topicIdea: '', note: '' },
};
export const assignedFixture = (
  phase: 'result' | 'firstMeeting' | 'completed',
): TeamAssignmentProjection => ({
  sectionId: demoTeamAssignmentSectionId,
  phase,
  window: { nextAvailableAt: '2026-09-10T10:00:00+09:00' },
  assignedTeam: {
    id: 'synthetic-team-4',
    groupNumber: 7,
    projectTopic: '학습 회고를 돕는 객체 모델',
    members: [
      {
        id: 'synthetic-1',
        name: '한 가온',
        studentNumber: '20261001',
        department: '컴퓨터공학과',
        role: '프론트엔드',
        ...(phase === 'firstMeeting' ? { phoneNumber: '010-8696-9149' } : {}),
      },
      {
        id: 'synthetic-2',
        name: '윤 새봄',
        studentNumber: '20261002',
        department: '인공지능학과',
        role: '백엔드',
        ...(phase === 'firstMeeting' ? { phoneNumber: '010-1234-1234' } : {}),
      },
    ],
  },
  leaderConfirmation:
    phase === 'completed'
      ? {
          status: 'confirmed',
          isActionAvailable: false,
          unavailableReason: '팀장 확정이 완료되었습니다.',
        }
      : { status: 'not-confirmed', isActionAvailable: true },
});
