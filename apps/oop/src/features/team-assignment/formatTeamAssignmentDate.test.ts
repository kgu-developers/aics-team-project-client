import { describe, expect, it } from 'vitest';

import { formatTeamAssignmentDate } from './formatTeamAssignmentDate';

describe('formatTeamAssignmentDate', () => {
  it('온보딩 일시를 학생에게 읽기 쉬운 한국어 날짜로 표시한다', () => {
    expect(formatTeamAssignmentDate('2026-09-03T23:59:00+09:00')).toMatch(
      /2026년 9월 3일/,
    );
  });

  it('일시가 없거나 유효하지 않으면 안내 예정으로 표시한다', () => {
    expect(formatTeamAssignmentDate()).toBe('안내 예정');
    expect(formatTeamAssignmentDate('not-a-date')).toBe('안내 예정');
  });
});
