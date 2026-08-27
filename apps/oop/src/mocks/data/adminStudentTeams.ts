export type AdminStudentFixture = {
  id: string;
  name: string;
  studentNumber: string;
  major: string;
  sectionId: string;
  teamId: string | null;
};

export type AdminTeamFixture = {
  id: string;
  name: string;
  sectionId: string;
  memberIds: string[];
};

const adminStudentTeamDemoSectionId = 'oop-2026-2-01';

export const adminStudentsFixture: AdminStudentFixture[] = [
  {
    id: 'student-1151-1',
    name: '김민준',
    studentNumber: '20231234',
    major: '컴퓨터공학과',
    sectionId: adminStudentTeamDemoSectionId,
    teamId: 'team-1151-1',
  },
  {
    id: 'student-1151-2',
    name: '이서연',
    studentNumber: '20235678',
    major: '소프트웨어학과',
    sectionId: adminStudentTeamDemoSectionId,
    teamId: 'team-1151-1',
  },
  {
    id: 'student-1151-3',
    name: '박지훈',
    studentNumber: '20239876',
    major: '컴퓨터공학과',
    sectionId: adminStudentTeamDemoSectionId,
    teamId: 'team-1151-2',
  },
  {
    id: 'student-1151-4',
    name: '최유진',
    studentNumber: '20234567',
    major: '인공지능학과',
    sectionId: adminStudentTeamDemoSectionId,
    teamId: 'team-1151-2',
  },
];

export const adminTeamsFixture: AdminTeamFixture[] = [
  {
    id: 'team-1151-1',
    name: '1팀',
    sectionId: adminStudentTeamDemoSectionId,
    memberIds: ['student-1151-1', 'student-1151-2'],
  },
  {
    id: 'team-1151-2',
    name: '2팀',
    sectionId: adminStudentTeamDemoSectionId,
    memberIds: ['student-1151-3', 'student-1151-4'],
  },
];

export function getAdminTeamMembersFixture(teamId: string) {
  const team = adminTeamsFixture.find(item => item.id === teamId);
  if (!team) return [];

  return team.memberIds
    .map(memberId =>
      adminStudentsFixture.find(student => student.id === memberId),
    )
    .filter((student): student is AdminStudentFixture => student !== undefined);
}
