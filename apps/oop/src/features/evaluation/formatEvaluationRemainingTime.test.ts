import { describe, expect, it } from 'vitest';

import { formatEvaluationRemainingTime } from './formatEvaluationRemainingTime';

describe('formatEvaluationRemainingTime', () => {
  it('하루 이상 남으면 일수와 시각을 함께 표시한다', () => {
    expect(
      formatEvaluationRemainingTime(
        '2026-08-28T10:02:03.000Z',
        Date.parse('2026-08-26T10:00:00.000Z'),
      ),
    ).toBe('2일 00:02:03');
  });

  it('평가 시간이 지나면 0으로 고정한다', () => {
    expect(
      formatEvaluationRemainingTime(
        '2026-08-26T09:00:00.000Z',
        Date.parse('2026-08-26T10:00:00.000Z'),
      ),
    ).toBe('00:00:00');
  });

  it('유효하지 않은 종료 시각은 표시하지 않는다', () => {
    expect(formatEvaluationRemainingTime('not-a-date')).toBeNull();
  });
});
