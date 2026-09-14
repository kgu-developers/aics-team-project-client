import { expect, it } from 'vitest';

import { validatePresentationOrders } from './adminPresentationOrder';

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
