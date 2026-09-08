export const adminStudentTeamKeys = {
  all: ['admin-student-team'] as const,
  enrollments: (sectionId: string) =>
    [...adminStudentTeamKeys.all, 'enrollments', sectionId] as const,
  teams: (sectionId: string) =>
    [...adminStudentTeamKeys.all, 'teams', sectionId] as const,
  team: (teamId: number) =>
    [...adminStudentTeamKeys.all, 'team', teamId] as const,
  user: (studentNumber: string) =>
    [...adminStudentTeamKeys.all, 'user', studentNumber] as const,
};
