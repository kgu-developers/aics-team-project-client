import type { CurrentUser } from '@aics/core';

const demoStudentSection = {
  id: 'oop-2026-2-01',
  code: 'OOP-01',
  name: '객체지향프로그래밍 01분반',
  role: 'STUDENT' as const,
};

const demoOtherStudentSection = {
  id: 'oop-2026-2-02',
  code: 'OOP-02',
  name: '객체지향프로그래밍 02분반',
  role: 'STUDENT' as const,
};

export const demoCurrentTeam = {
  id: 'team-07',
  sectionId: demoStudentSection.id,
  name: 'CineFlow (7팀)',
  members: [
    { id: 'student-a', name: 'OOP 데모 학생 A', isLeader: true },
    { id: 'student-b', name: 'OOP 데모 학생 B', isLeader: false },
    { id: 'student-c', name: 'OOP 데모 학생 C', isLeader: false },
    { id: 'student-d', name: 'OOP 데모 학생 D', isLeader: false },
    { id: 'student-e', name: 'OOP 데모 학생 E', isLeader: false },
  ],
};

export const demoStudent: CurrentUser = {
  id: 'student-a',
  studentNumber: '20260001',
  name: 'OOP 데모 학생 A',
  email: 'student-a@example.com',
  globalRole: 'STUDENT',
  sections: [demoStudentSection],
  currentTeam: demoCurrentTeam,
};
export const demoPartnerStudent: CurrentUser = {
  id: 'student-b',
  studentNumber: '20260003',
  name: 'OOP 데모 학생 B',
  email: 'student-b@example.com',
  globalRole: 'STUDENT',
  sections: [demoStudentSection],
  currentTeam: demoCurrentTeam,
};
export const demoCompletedStudent: CurrentUser = {
  id: 'student-c',
  studentNumber: '20260004',
  name: 'OOP 데모 학생 C',
  email: 'student-c@example.com',
  globalRole: 'STUDENT',
  sections: [demoStudentSection],
  currentTeam: demoCurrentTeam,
};
export const demoOtherSectionStudent: CurrentUser = {
  id: 'student-other-section',
  studentNumber: '20260021',
  name: 'OOP 타 분반 학생',
  email: 'student-other-section@example.com',
  globalRole: 'STUDENT',
  sections: [demoOtherStudentSection],
  currentTeam: null,
};
export const demoAdmin: CurrentUser = {
  id: 'assistant-a',
  studentNumber: '20260002',
  name: 'OOP 데모 조교',
  email: 'assistant@example.com',
  globalRole: 'ASSISTANT',
  sections: [{ ...demoStudentSection, role: 'ASSISTANT' }],
  currentTeam: null,
};

export const demoAccessToken = 'msw-oop-demo-student-a-access-token';
export const demoPartnerAccessToken = 'msw-oop-demo-student-b-access-token';
export const demoCompletedAccessToken = 'msw-oop-demo-student-c-access-token';
export const demoOtherSectionAccessToken =
  'msw-oop-demo-other-section-student-access-token';
export const demoAdminAccessToken = 'msw-oop-demo-admin-access-token';
export const demoCredentials = {
  studentNumber: demoStudent.studentNumber,
  password: 'oop-demo-a',
} as const;
export const demoPartnerCredentials = {
  studentNumber: demoPartnerStudent.studentNumber,
  password: 'oop-demo-b',
} as const;
export const demoCompletedCredentials = {
  studentNumber: demoCompletedStudent.studentNumber,
  password: 'oop-demo-c',
} as const;
export const demoOtherSectionCredentials = {
  studentNumber: demoOtherSectionStudent.studentNumber,
  password: 'oop-demo-other-section',
} as const;
export const demoAdminCredentials = {
  studentNumber: demoAdmin.studentNumber,
  password: 'oop-admin',
} as const;
export const demoUserAccounts = [
  {
    accessToken: demoAccessToken,
    credentials: demoCredentials,
    refreshToken: 'msw-oop-demo-student-a-refresh-token',
    user: demoStudent,
  },
  {
    accessToken: demoPartnerAccessToken,
    credentials: demoPartnerCredentials,
    refreshToken: 'msw-oop-demo-student-b-refresh-token',
    user: demoPartnerStudent,
  },
  {
    accessToken: demoCompletedAccessToken,
    credentials: demoCompletedCredentials,
    refreshToken: 'msw-oop-demo-student-c-refresh-token',
    user: demoCompletedStudent,
  },
  {
    accessToken: demoOtherSectionAccessToken,
    credentials: demoOtherSectionCredentials,
    refreshToken: 'msw-oop-demo-other-section-student-refresh-token',
    user: demoOtherSectionStudent,
  },
  {
    accessToken: demoAdminAccessToken,
    credentials: demoAdminCredentials,
    refreshToken: 'msw-oop-demo-admin-refresh-token',
    user: demoAdmin,
  },
] as const;
export function getDemoUserAccount(accessToken: string | null) {
  return demoUserAccounts.find(account => account.accessToken === accessToken);
}
export function getDemoStudentAccount(accessToken: string | null) {
  const account = getDemoUserAccount(accessToken);
  return account?.user.globalRole === 'STUDENT' ? account : undefined;
}
