import { describe, expect, it } from 'vitest';

import {
  formatPresentationEvaluationDateTime,
  presentationEvaluationInstant,
  toPresentationEvaluationPrerequisiteDateTime,
  toPresentationEvaluationSeoulDateTimeInput,
  toPresentationEvaluationServerDateTime,
} from './presentationEvaluationDateTime';

describe('presentation evaluation server-time contract', () => {
  it('round-trips a Seoul admin wall clock through the offsetless server value', () => {
    const serverValue = toPresentationEvaluationServerDateTime(
      '2026-09-21T18:00:00',
    );

    expect(serverValue).toBe('2026-09-21T09:00:00');
    expect(toPresentationEvaluationSeoulDateTimeInput(serverValue)).toBe(
      '2026-09-21T18:00:00',
    );
    expect(formatPresentationEvaluationDateTime(serverValue)).toBe(
      '2026-09-21/18:00',
    );
  });

  it('preserves explicit UTC and offset timestamps as instants', () => {
    expect(presentationEvaluationInstant('2026-09-21T09:00:00Z')).toBe(
      Date.parse('2026-09-21T09:00:00Z'),
    );
    expect(
      toPresentationEvaluationSeoulDateTimeInput('2026-09-21T18:00:00+09:00'),
    ).toBe('2026-09-21T18:00:00');
    expect(toPresentationEvaluationServerDateTime('2026-09-21T09:00:00Z')).toBe(
      '2026-09-21T09:00:00',
    );
    expect(
      toPresentationEvaluationPrerequisiteDateTime('2026-09-21T09:00:00Z'),
    ).toBe('2026-09-21T18:00:00');
  });

  it('fails closed for malformed and impossible date-times', () => {
    expect(presentationEvaluationInstant('2026-09-21')).toBeNaN();
    expect(presentationEvaluationInstant('2026-02-30T18:00:00')).toBeNaN();
    expect(toPresentationEvaluationServerDateTime('invalid')).toBeUndefined();
    expect(
      toPresentationEvaluationSeoulDateTimeInput('invalid'),
    ).toBeUndefined();
    expect(
      toPresentationEvaluationPrerequisiteDateTime('2026-02-30T18:00:00'),
    ).toBeUndefined();
    expect(formatPresentationEvaluationDateTime('invalid')).toBeUndefined();
  });
});
