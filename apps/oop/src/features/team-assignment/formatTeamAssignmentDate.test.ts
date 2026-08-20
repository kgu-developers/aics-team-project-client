import { describe, expect, it } from 'vitest';

import { formatTeamAssignmentDate } from './formatTeamAssignmentDate';

describe('formatTeamAssignmentDate', () => {
  it('온보딩 일시를 한국 표준시 기준으로 표시한다', () => {
    const formattedDate = formatTeamAssignmentDate('2026-09-03T14:59:00Z');

    expect(formattedDate).toMatch(/2026년 9월 3일/);
    expect(formattedDate).toMatch(/11:59/);
  });

  it('일시가 없거나 유효하지 않으면 안내 예정으로 표시한다', () => {
    expect(formatTeamAssignmentDate()).toBe('안내 예정');
    expect(formatTeamAssignmentDate('not-a-date')).toBe('안내 예정');
  });
});
