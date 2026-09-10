import { describe, expect, it } from 'vitest';

import { formatSeoulDateTime } from './formatSeoulDateTime';

describe('formatSeoulDateTime', () => {
  it('UTC 시간을 Asia/Seoul 시간으로 표시한다', () => {
    expect(formatSeoulDateTime('2026-10-10T09:00:00Z')).toBe(
      '2026.10.10 18:00',
    );
  });

  it('유효하지 않은 값은 원문을 유지한다', () => {
    expect(formatSeoulDateTime('not-a-date')).toBe('not-a-date');
  });
});
