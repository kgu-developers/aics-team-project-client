import type { CurrentUser } from '@aics/core';
import { describe, expect, it } from 'vitest';

import { resolveStudentLoginDestination } from './resolveStudentLoginDestination';

const student: CurrentUser = {
  email: 'student@example.com',
  globalRole: 'STUDENT',
  id: 'student-a',
  name: '학생',
  sections: [
    {
      code: 'OOP-01',
      id: '1',
      name: '객체지향프로그래밍 01분반',
      role: 'STUDENT',
      contactVisibleFrom: '2020-01-01T00:00:00+09:00',
      contactVisibleUntil: null,
    },
  ],
  studentNumber: '20260001',
};

describe('resolveStudentLoginDestination', () => {
  it('팀 미배정 학생은 /student redirect보다 팀 온보딩을 우선한다', async () => {
    await expect(
      resolveStudentLoginDestination(
        { ...student, teamId: null },
        '/student/meetings',
      ),
    ).resolves.toBe('/onboarding/team');
  });

  it.each(['/student/notices', '/student/notices/17', '/student/messages'])(
    '팀 미배정 학생도 로그인 뒤 분반·사용자 route %s를 유지한다',
    async redirect => {
      await expect(
        resolveStudentLoginDestination({ ...student, teamId: null }, redirect),
      ).resolves.toBe(redirect);
    },
  );

  it.each([
    ['팀장', '7'],
    ['팀원', '8'],
  ])('배정된 %s 학생은 학생 화면으로 이동한다', async (_role, teamId) => {
    await expect(
      resolveStudentLoginDestination({ ...student, teamId }),
    ).resolves.toBe('/student');
    await expect(
      resolveStudentLoginDestination(
        { ...student, teamId },
        '/student/meetings',
      ),
    ).resolves.toBe('/student/meetings');
  });

  it('연락처 공개 전 팀 배정 학생은 /student redirect 대신 온보딩으로 이동한다', async () => {
    await expect(
      resolveStudentLoginDestination(
        {
          ...student,
          teamId: '7',
          sections: [
            {
              ...student.sections[0]!,
              contactVisibleFrom: '2099-01-01T00:00:00+09:00',
            },
          ],
        },
        '/student/meetings',
      ),
    ).resolves.toBe('/onboarding/team');
  });

  it.each(['/student/notices', '/student/notices/17', '/student/messages'])(
    '연락처 공개 전 팀 배정 학생도 로그인 뒤 분반·사용자 route %s를 유지한다',
    async redirect => {
      await expect(
        resolveStudentLoginDestination(
          {
            ...student,
            teamId: '7',
            sections: [
              {
                ...student.sections[0]!,
                contactVisibleFrom: '2099-01-01T00:00:00+09:00',
              },
            ],
          },
          redirect,
        ),
      ).resolves.toBe(redirect);
    },
  );

  it('연락처 공개 일정이 미설정인 배정 학생은 학생 redirect를 유지한다', async () => {
    await expect(
      resolveStudentLoginDestination(
        {
          ...student,
          teamId: '7',
          sections: [
            {
              ...student.sections[0]!,
              contactVisibleFrom: null,
              contactVisibleUntil: null,
            },
          ],
        },
        '/student/meetings',
      ),
    ).resolves.toBe('/student/meetings');
  });

  it('MSW demo에서는 공개 전이어도 기존 학생 목적지를 유지한다', async () => {
    await expect(
      resolveStudentLoginDestination(
        {
          ...student,
          teamId: '7',
          sections: [
            {
              ...student.sections[0]!,
              contactVisibleFrom: '2099-01-01T00:00:00+09:00',
            },
          ],
        },
        '/student/meetings',
        { isDemo: true },
      ),
    ).resolves.toBe('/student/meetings');
  });

  it('분반이 여러 개인 학생은 scalar teamId를 추측하지 않고 온보딩으로 이동한다', async () => {
    await expect(
      resolveStudentLoginDestination({
        ...student,
        teamId: '7',
        sections: [
          ...student.sections,
          { ...student.sections[0]!, id: '2', name: '02분반' },
        ],
      }),
    ).resolves.toBe('/onboarding/team');
  });

  it.each(['ASSISTANT', 'PROFESSOR'] as const)(
    '%s 운영자는 운영 화면과 운영 redirect를 유지한다',
    async globalRole => {
      const operator = { ...student, globalRole };
      await expect(resolveStudentLoginDestination(operator)).resolves.toBe(
        '/admin',
      );
      await expect(
        resolveStudentLoginDestination(operator, '/admin/milestones'),
      ).resolves.toBe('/admin/milestones');
    },
  );

  it('역할과 다른 redirect는 각 역할의 홈으로 제한한다', async () => {
    await expect(
      resolveStudentLoginDestination(
        { ...student, teamId: '7' },
        '/admin/milestones',
      ),
    ).resolves.toBe('/student');
    await expect(
      resolveStudentLoginDestination(
        { ...student, globalRole: 'ASSISTANT' },
        '/student',
      ),
    ).resolves.toBe('/admin');
  });
});
