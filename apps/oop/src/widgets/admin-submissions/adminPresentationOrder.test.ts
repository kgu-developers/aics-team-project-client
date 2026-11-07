import { expect, it } from 'vitest';

import {
  getPresentationEvaluationStartReadiness,
  getPresentationEvaluationSetupStatus,
  hasConfiguredPresentationOrders,
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

it('requires a unique presentation order for every team', () => {
  expect(
    hasConfiguredPresentationOrders([
      { teamId: 7, presentationOrder: 2 },
      { teamId: 9, presentationOrder: 1 },
    ]),
  ).toBe(true);
  expect(
    hasConfiguredPresentationOrders([
      { teamId: 7, presentationOrder: 1 },
      { teamId: 9, presentationOrder: null },
    ]),
  ).toBe(false);
});

it('requires criteria and orders before starting, but not an evaluation period', () => {
  expect(
    getPresentationEvaluationStartReadiness({
      criteriaCount: 1,
      teams: [
        { teamId: 7, presentationOrder: 2 },
        { teamId: 9, presentationOrder: 1 },
      ],
    }),
  ).toEqual({ isComplete: true, issues: [] });

  expect(
    getPresentationEvaluationStartReadiness({
      criteriaCount: 0,
      teams: [
        { teamId: 7, presentationOrder: 2 },
        { teamId: 9, presentationOrder: 1 },
      ],
    }),
  ).toEqual({
    isComplete: false,
    issues: ['평가 항목을 1개 이상 추가해 주세요.'],
  });
});

it('marks setup complete only with criteria and a unique order for every team', () => {
  expect(
    getPresentationEvaluationSetupStatus({
      criteriaCount: 1,
      evaluationEndsAt: '2026-09-24T10:00:00+09:00',
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
    evaluationEndsAt: '2026-09-23T10:00:00+09:00',
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
      evaluationEndsAt: '2026-09-22T10:00:00+09:00',
      evaluationStartsAt: '2026-09-22T09:00:00+09:00',
      now: Date.parse('2026-09-22T09:00:00+09:00'),
      teams: [],
    }),
  ).toMatchObject({ isComplete: false, urgency: 'started' });
});
