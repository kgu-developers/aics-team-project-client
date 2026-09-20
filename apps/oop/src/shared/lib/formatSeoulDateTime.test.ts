import { describe, expect, it } from 'vitest';

import { formatSeoulDateTime } from './formatSeoulDateTime';

describe('formatSeoulDateTime', () => {
  it.each(['2026-08-27T15:00:00', '2026-08-27 15:00'])(
    '%s 오프셋 없는 서버 시각에 서울 오프셋을 적용한다',
    value => {
      expect(formatSeoulDateTime(value)).toBe('2026-08-28/00:00');
    },
  );

  it('날짜만 있으면 서울 자정으로 표시한다', () => {
    expect(formatSeoulDateTime('2026-08-27')).toBe('2026-08-27/00:00');
  });

  it('UTC 시간을 Asia/Seoul 시간으로 표시한다', () => {
    expect(formatSeoulDateTime('2026-10-10T09:00:00Z')).toBe(
      '2026-10-10/18:00',
    );
  });

  it('유효하지 않은 값은 원문을 유지한다', () => {
    expect(formatSeoulDateTime('not-a-date')).toBe('not-a-date');
  });
});
