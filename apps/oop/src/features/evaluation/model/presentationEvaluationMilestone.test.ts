import type { StudentMilestoneResponse } from '@aics/core';
import { describe, expect, it } from 'vitest';

import { resolvePresentationEvaluationMilestone } from './presentationEvaluationMilestone';

const now = Date.parse('2026-11-10T15:00:00+09:00');

function milestone(
  id: number,
  weekNumber: number,
  schedule: StudentMilestoneResponse['schedule'],
  overrides: Partial<StudentMilestoneResponse> = {},
): StudentMilestoneResponse {
  return {
    id,
    sectionId: 1,
    title: `발표 ${weekNumber}주차`,
    type: 'PRESENTATION',
    status: 'PUBLISHED',
    weekNumber,
    allowResubmissionBeforeDueAt: true,
    schedule,
    ...overrides,
  };
}

describe('resolvePresentationEvaluationMilestone', () => {
  it('평가 창이 있는 발표를 주차가 빠른 발표보다 우선한다', () => {
    const early = milestone(301, 8, { opensAt: '2026-10-01T09:00:00+09:00' });
    const evaluated = milestone(303, 14, {
      evaluationOpensAt: '2026-11-10T14:00:00+09:00',
      evaluationClosesAt: '2026-11-10T16:00:00+09:00',
    });

    expect(
      resolvePresentationEvaluationMilestone([early, evaluated], now)?.id,
    ).toBe(303);
  });

  it('평가 창이 여럿이면 지금 열린 창을 고른다', () => {
    const past = milestone(301, 8, {
      evaluationOpensAt: '2026-09-01T14:00:00+09:00',
      evaluationClosesAt: '2026-09-01T16:00:00+09:00',
    });
    const open = milestone(303, 14, {
      evaluationOpensAt: '2026-11-10T14:00:00+09:00',
      evaluationClosesAt: '2026-11-10T16:00:00+09:00',
    });
    const future = milestone(305, 15, {
      evaluationOpensAt: '2026-12-01T14:00:00+09:00',
      evaluationClosesAt: '2026-12-01T16:00:00+09:00',
    });

    expect(
      resolvePresentationEvaluationMilestone([past, open, future], now)?.id,
    ).toBe(303);
  });

  it('열린 창이 없으면 다음 평가를 고른다', () => {
    const past = milestone(301, 8, {
      evaluationOpensAt: '2026-09-01T14:00:00+09:00',
      evaluationClosesAt: '2026-09-01T16:00:00+09:00',
    });
    const future = milestone(305, 15, {
      evaluationOpensAt: '2026-12-01T14:00:00+09:00',
      evaluationClosesAt: '2026-12-01T16:00:00+09:00',
    });

    expect(
      resolvePresentationEvaluationMilestone([past, future], now)?.id,
    ).toBe(305);
  });

  it('평가 창이 없으면 주차가 빠른 발표로 물러선다', () => {
    const first = milestone(301, 8, { opensAt: '2026-10-01T09:00:00+09:00' });
    const second = milestone(303, 14, { opensAt: '2026-11-01T09:00:00+09:00' });

    expect(
      resolvePresentationEvaluationMilestone([second, first], now)?.id,
    ).toBe(301);
  });

  it('초안과 다른 종류의 마일스톤은 제외한다', () => {
    const draft = milestone(301, 8, {}, { status: 'DRAFT' });
    const report = milestone(302, 9, {}, { type: 'FINAL_REPORT' });

    expect(
      resolvePresentationEvaluationMilestone([draft, report], now),
    ).toBeNull();
  });
});
