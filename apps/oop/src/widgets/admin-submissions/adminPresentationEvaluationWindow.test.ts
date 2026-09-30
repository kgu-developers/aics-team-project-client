import { describe, expect, it } from 'vitest';

import {
  MAX_EVALUATION_DURATION_MINUTES,
  isValidEvaluationDurationMinutes,
  normalizeEvaluationOpensAt,
} from './adminPresentationEvaluationWindow';

describe('presentation evaluation window', () => {
  it.each([
    [1, true],
    [MAX_EVALUATION_DURATION_MINUTES, true],
    [0, false],
    [MAX_EVALUATION_DURATION_MINUTES + 1, false],
    [1.5, false],
    [null, false],
  ])('accepts only a realistic integer duration: %s', (value, expected) => {
    expect(isValidEvaluationDurationMinutes(value)).toBe(expected);
  });

  it.each([
    ['2026-09-15T09:00:00', '2026-09-15T09:00:00'],
    ['2026-09-15T09:00:00+09:00', '2026-09-15T09:00:00'],
    ['2026-09-15T00:00:00Z', '2026-09-15T09:00:00'],
  ])('normalizes %s to the Seoul LocalDateTime contract', (input, output) => {
    expect(normalizeEvaluationOpensAt(input)).toBe(output);
  });

  it('rejects an invalid existing opening time', () => {
    expect(normalizeEvaluationOpensAt('invalid')).toBeNull();
  });
});
