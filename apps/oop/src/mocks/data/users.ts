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

export const demoAccessToken = 'msw-oop-demo-access-token';

export const demoCredentials = {
  studentNumber: '20260001',
  password: 'oop-demo',
} as const;

export const demoUserAccounts = [
  {
    user: demoStudent,
    credentials: demoCredentials,
    accessToken: demoAccessToken,
  },
] as const;
