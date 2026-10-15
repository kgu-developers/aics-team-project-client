import { describe, expect, it } from 'vitest';

import { compareDateTimeDesc } from './compareDateTimeDesc';

describe('compareDateTimeDesc', () => {
  it('서버의 LocalDateTime과 ISO 값을 실제 시각 기준 최신순으로 정렬한다', () => {
    const values = [
      '2026-10-14 10:00',
      '2026-10-14T02:00:00Z',
      '2026-10-14T10:30:00+09:00',
    ];

    expect(values.sort(compareDateTimeDesc)).toEqual([
      '2026-10-14T02:00:00Z',
      '2026-10-14T10:30:00+09:00',
      '2026-10-14 10:00',
    ]);
  });

  it('해석할 수 없는 값은 유효한 값 뒤에서 문자열 최신순으로 정렬한다', () => {
    expect(
      ['unknown-a', '2026-10-14 10:00', 'unknown-b'].sort(compareDateTimeDesc),
    ).toEqual(['2026-10-14 10:00', 'unknown-b', 'unknown-a']);
  });
});
