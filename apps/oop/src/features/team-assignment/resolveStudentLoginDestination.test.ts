import { fetchTeamAssignmentProjection } from '@aics/api-client';
import type { CurrentUser, TeamAssignmentProjection } from '@aics/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { resolveStudentLoginDestination } from './resolveStudentLoginDestination';

vi.mock('@aics/api-client', () => ({
  fetchTeamAssignmentProjection: vi.fn(),
}));

const fetchProjectionMock = vi.mocked(fetchTeamAssignmentProjection);
const student: CurrentUser = {
  email: 'student@example.com',
  globalRole: 'STUDENT',
  id: 'student-a',
  name: '학생',
  sections: [
    {
      code: 'OOP-01',
      id: 'oop-2026-2-01',
      name: '객체지향프로그래밍 01분반',
      role: 'STUDENT',
    },
  ],
  studentNumber: '20260001',
};

beforeEach(() => {
  fetchProjectionMock.mockReset();
});

describe('resolveStudentLoginDestination', () => {
  it('학생은 팀 온보딩 단일 진입점으로 이동한다', async () => {
    fetchProjectionMock.mockResolvedValue({
      phase: 'firstMeeting',
      sectionId: 'oop-2026-2-01',
      window: {},
    } satisfies TeamAssignmentProjection);

    await expect(resolveStudentLoginDestination(student)).resolves.toBe(
      '/onboarding/team',
    );
    expect(fetchProjectionMock).not.toHaveBeenCalled();
  });

  it('로그인 중에는 팀 배정 API를 조회하지 않는다', async () => {
    fetchProjectionMock.mockRejectedValue(new Error('projection unavailable'));

    await expect(resolveStudentLoginDestination(student)).resolves.toBe(
      '/onboarding/team',
    );
    expect(fetchProjectionMock).not.toHaveBeenCalled();
  });

  it('운영자 로그인에는 학생 팀 배정 API를 호출하지 않는다', async () => {
    await expect(
      resolveStudentLoginDestination({ ...student, globalRole: 'ASSISTANT' }),
    ).resolves.toBe('/admin');
    expect(fetchProjectionMock).not.toHaveBeenCalled();
  });
});
