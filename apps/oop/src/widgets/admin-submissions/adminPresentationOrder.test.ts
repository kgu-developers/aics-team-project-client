import { expect, it } from 'vitest';

import {
  getPresentationEvaluationSetupStatus,
  validatePresentationOrders,
} from './adminPresentationOrder';

const teams = [{ teamId: 7 }, { teamId: 9 }];
it.each([
  {},
  { 7: null, 9: 2 },
  { 7: 1, 9: 1 },
  { 7: 0, 9: 2 },
  { 7: 3, 9: 2 },
  { 7: 1.5, 9: 2 },
])('rejects incomplete or invalid orders: %j', orders => {
  expect(validatePresentationOrders(teams, orders).ok).toBe(false);
});
it('returns exactly the validated selection, without a fallback order', () => {
  expect(validatePresentationOrders(teams, { 7: 2, 9: 1 })).toEqual({
    ok: true,
    teamOrders: [
      { teamId: 7, order: 2 },
      { teamId: 9, order: 1 },
    ],
  });
});

it('marks setup complete only with criteria and a unique order for every team', () => {
  expect(
    getPresentationEvaluationSetupStatus({
      criteriaCount: 1,
      evaluationStartsAt: '2026-09-24T09:00:00+09:00',
      now: Date.parse('2026-09-22T09:00:00+09:00'),
      teams: [
        { teamId: 7, presentationOrder: 2 },
        { teamId: 9, presentationOrder: 1 },
      ],
    }),
  ).toMatchObject({ isComplete: true, issues: [], urgency: 'upcoming' });
});

it('reports missing criteria and incomplete or duplicate presentation orders', () => {
  const incomplete = getPresentationEvaluationSetupStatus({
    criteriaCount: 0,
    evaluationStartsAt: '2026-09-23T08:59:59+09:00',
    now: Date.parse('2026-09-22T09:00:00+09:00'),
    teams: [
      { teamId: 7, presentationOrder: 1 },
      { teamId: 9, presentationOrder: 1 },
    ],
  });

  expect(incomplete).toMatchObject({
    isComplete: false,
    urgency: 'imminent',
  });
  expect(incomplete.issues).toEqual([
    '평가 항목을 1개 이상 추가해 주세요.',
    '발표 순서는 중복될 수 없습니다.',
  ]);
});

it('reports a started evaluation separately when setup is incomplete', () => {
  expect(
    getPresentationEvaluationSetupStatus({
      criteriaCount: 0,
      evaluationStartsAt: '2026-09-22T09:00:00+09:00',
      now: Date.parse('2026-09-22T09:00:00+09:00'),
      teams: [],
    }),
  ).toMatchObject({ isComplete: false, urgency: 'started' });
});
