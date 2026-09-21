import type { CurrentUser, TeamKickoffResponse } from '@aics/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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

const completedKickoff: TeamKickoffResponse = {
  id: 7,
  name: '7조',
  members: [
    {
      id: 10,
      studentNumber: student.studentNumber,
      isLeader: true,
    },
  ],
};

const fetchKickoff = vi.fn();
const options = { fetchKickoff };

describe('resolveStudentLoginDestination', () => {
  beforeEach(() => {
    fetchKickoff.mockReset();
    fetchKickoff.mockResolvedValue(completedKickoff);
  });

  it('팀 미배정 학생은 /student redirect보다 팀 온보딩을 우선한다', async () => {
    await expect(
      resolveStudentLoginDestination(
        { ...student, teamId: null },
        '/student/meetings',
        options,
      ),
    ).resolves.toBe('/onboarding/team');
    expect(fetchKickoff).not.toHaveBeenCalled();
  });

  it.each(['/student/notices', '/student/notices/17', '/student/messages'])(
    '팀 미배정 학생도 로그인 뒤 분반·사용자 route %s를 유지한다',
    async redirect => {
      await expect(
        resolveStudentLoginDestination(
          { ...student, teamId: null },
          redirect,
          options,
        ),
      ).resolves.toBe(redirect);
      expect(fetchKickoff).not.toHaveBeenCalled();
    },
  );

  it('팀장이 확정된 배정 학생은 기존 학생 목적지를 유지한다', async () => {
    await expect(
      resolveStudentLoginDestination(
        { ...student, teamId: '7' },
        undefined,
        options,
      ),
    ).resolves.toBe('/student');
    await expect(
      resolveStudentLoginDestination(
        { ...student, teamId: '7' },
        '/student/meetings',
        options,
      ),
    ).resolves.toBe('/student/meetings');
    expect(fetchKickoff).toHaveBeenCalledWith('7');
  });

  it('배정됐지만 팀장이 확정되지 않은 학생은 팀 온보딩으로 이동한다', async () => {
    fetchKickoff.mockResolvedValue({
      ...completedKickoff,
      members: completedKickoff.members.map(member => ({
        ...member,
        isLeader: false,
      })),
    });

    await expect(
      resolveStudentLoginDestination(
        { ...student, teamId: '7' },
        '/student/meetings',
        options,
      ),
    ).resolves.toBe('/onboarding/team');
  });

  it('kickoff 조회가 실패하면 성공한 학생 목적지를 표시하지 않고 온보딩으로 복구한다', async () => {
    fetchKickoff.mockRejectedValue(new Error('kickoff unavailable'));

    await expect(
      resolveStudentLoginDestination(
        { ...student, teamId: '7' },
        '/student/meetings',
        options,
      ),
    ).resolves.toBe('/onboarding/team');
  });

  it('다른 팀 kickoff 응답은 온보딩으로 안전하게 복구한다', async () => {
    fetchKickoff.mockResolvedValue({ ...completedKickoff, id: 8 });

    await expect(
      resolveStudentLoginDestination(
        { ...student, teamId: '7' },
        '/student/meetings',
        options,
      ),
    ).resolves.toBe('/onboarding/team');
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
        options,
      ),
    ).resolves.toBe('/onboarding/team');
    expect(fetchKickoff).not.toHaveBeenCalled();
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
          options,
        ),
      ).resolves.toBe(redirect);
      expect(fetchKickoff).not.toHaveBeenCalled();
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
        options,
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
        { ...options, isDemo: true },
      ),
    ).resolves.toBe('/student/meetings');
    expect(fetchKickoff).not.toHaveBeenCalled();
  });

  it('분반이 여러 개인 학생은 scalar teamId를 추측하지 않고 온보딩으로 이동한다', async () => {
    await expect(
      resolveStudentLoginDestination(
        {
          ...student,
          teamId: '7',
          sections: [
            ...student.sections,
            { ...student.sections[0]!, id: '2', name: '02분반' },
          ],
        },
        undefined,
        options,
      ),
    ).resolves.toBe('/onboarding/team');
    expect(fetchKickoff).not.toHaveBeenCalled();
  });

  it.each(['ASSISTANT', 'PROFESSOR'] as const)(
    '%s 운영자는 운영 화면과 운영 redirect를 유지한다',
    async globalRole => {
      const operator = { ...student, globalRole };
      await expect(
        resolveStudentLoginDestination(operator, undefined, options),
      ).resolves.toBe('/admin');
      await expect(
        resolveStudentLoginDestination(operator, '/admin/milestones', options),
      ).resolves.toBe('/admin/milestones');
      expect(fetchKickoff).not.toHaveBeenCalled();
    },
  );

  it('역할과 다른 redirect는 각 역할의 홈으로 제한한다', async () => {
    await expect(
      resolveStudentLoginDestination(
        { ...student, teamId: '7' },
        '/admin/milestones',
        options,
      ),
    ).resolves.toBe('/student');
    await expect(
      resolveStudentLoginDestination(
        { ...student, globalRole: 'ASSISTANT' },
        '/student',
        options,
      ),
    ).resolves.toBe('/admin');
  });
});
