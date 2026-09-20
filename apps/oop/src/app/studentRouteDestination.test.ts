import { describe, expect, it } from 'vitest';

import { getStudentRouteDestination } from './studentRouteDestination';

describe('getStudentRouteDestination', () => {
  const releasedSection = {
    contactVisibleFrom: '2026-09-20T19:00:00+09:00',
    contactVisibleUntil: null,
  };

  it.each([
    '/student',
    '/student/team',
    '/student/team/action-plans',
    '/student/meetings',
    '/student/meetings/17',
    '/student/editor/proposal/topic',
    '/student/peer-review',
    '/student/presentation-evaluation',
  ])('미배정 학생의 팀 의존 route %s를 팀 온보딩으로 보낸다', pathname => {
    expect(getStudentRouteDestination('no-team', false, pathname)).toBe(
      '/onboarding/team',
    );
  });

  it.each([
    '/student/notices',
    '/student/notices/17',
    '/student/notices/',
    '/student/messages',
  ])('미배정 학생도 분반·사용자 route %s 접근을 유지한다', pathname => {
    expect(
      getStudentRouteDestination('no-team', false, pathname),
    ).toBeUndefined();
  });

  it.each(['loading', 'error', 'ambiguous'] as const)(
    '%s 학생 상태에는 온보딩 redirect를 만들지 않는다',
    status => {
      expect(
        getStudentRouteDestination(status, false, '/student'),
      ).toBeUndefined();
    },
  );

  it('연락처 공개 전 배정 학생은 팀 온보딩에 남긴다', () => {
    expect(
      getStudentRouteDestination(
        'ready',
        false,
        '/student',
        {
          contactVisibleFrom: '2026-09-20T21:00:00+09:00',
          contactVisibleUntil: null,
        },
        Date.parse('2026-09-20T20:00:00+09:00'),
      ),
    ).toBe('/onboarding/team');
  });

  it.each(['/student/notices', '/student/notices/17', '/student/messages'])(
    '연락처 공개 전 배정 학생도 분반·사용자 route %s 접근을 유지한다',
    pathname => {
      expect(
        getStudentRouteDestination(
          'ready',
          false,
          pathname,
          {
            contactVisibleFrom: '2026-09-20T21:00:00+09:00',
            contactVisibleUntil: null,
          },
          Date.parse('2026-09-20T20:00:00+09:00'),
        ),
      ).toBeUndefined();
    },
  );

  it('연락처 공개 후 배정 학생은 학생 route를 유지한다', () => {
    expect(
      getStudentRouteDestination(
        'ready',
        false,
        '/student',
        releasedSection,
        Date.parse('2026-09-20T20:00:00+09:00'),
      ),
    ).toBeUndefined();
  });

  it('연락처 공개 일정이 미설정이어도 배정 학생은 학생 route를 유지한다', () => {
    expect(
      getStudentRouteDestination('ready', false, '/student', {
        contactVisibleFrom: null,
        contactVisibleUntil: null,
      }),
    ).toBeUndefined();
  });

  it('MSW 데모 흐름은 기존 학생 화면 routing을 유지한다', () => {
    expect(
      getStudentRouteDestination('ready', true, '/student', {
        contactVisibleFrom: '2099-01-01T00:00:00+09:00',
        contactVisibleUntil: null,
      }),
    ).toBeUndefined();
  });
});
