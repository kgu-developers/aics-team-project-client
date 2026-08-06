import type { CurrentUser } from '@aics/core';

export const demoStudent: CurrentUser = {
  studentNumber: '20260001',
  name: 'OOP 데모 학생',
  email: 'student@example.com',
  globalRole: 'STUDENT',
  sections: [
    {
      id: 'oop-2026-2-01',
      code: 'OOP-01',
      name: '객체지향프로그래밍 01분반',
      role: 'STUDENT',
    },
  ],
};

export const demoAdmin: CurrentUser = {
  studentNumber: '20260002',
  name: 'OOP 데모 조교',
  email: 'assistant@example.com',
  globalRole: 'ASSISTANT',
  sections: [
    {
      id: 'oop-2026-2-01',
      code: 'OOP-01',
      name: '객체지향프로그래밍 01분반',
      role: 'ASSISTANT',
    },
  ],
};

export const demoAccessToken = 'msw-oop-demo-access-token';
export const demoAdminAccessToken = 'msw-oop-demo-admin-access-token';

export const demoCredentials = {
  studentNumber: demoStudent.studentNumber,
  password: 'oop-demo',
} as const;

export const demoAdminCredentials = {
  studentNumber: demoAdmin.studentNumber,
  password: 'oop-admin',
} as const;

export const demoUserAccounts = [
  {
    user: demoStudent,
    credentials: demoCredentials,
    accessToken: demoAccessToken,
    refreshToken: 'msw-oop-demo-refresh-token',
  },
  {
    user: demoAdmin,
    credentials: demoAdminCredentials,
    accessToken: demoAdminAccessToken,
    refreshToken: 'msw-oop-demo-admin-refresh-token',
  },
] as const;
