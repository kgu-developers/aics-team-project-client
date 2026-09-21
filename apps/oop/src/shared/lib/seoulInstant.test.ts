import { expect, it } from 'vitest';

import { seoulInstant } from './seoulInstant';

it.each([
  ['2026-08-27T15:00:00', '2026-08-27T06:00:00Z'],
  ['2026-08-27 15:00', '2026-08-27T06:00:00Z'],
  [' 2026-08-27T15:00:00.123456 ', '2026-08-27T06:00:00.123Z'],
  ['2026-08-27', '2026-08-26T15:00:00Z'],
  ['2026-08-27T15:00:00Z', '2026-08-27T15:00:00Z'],
  ['2026-08-27T15:00:00z', '2026-08-27T15:00:00Z'],
  ['2026-08-27T15:00:00+09:00', '2026-08-27T06:00:00Z'],
  ['2026-08-27T15:00:00+0900', '2026-08-27T06:00:00Z'],
  ['2026-08-27T15:00:00-04:00', '2026-08-27T19:00:00Z'],
])('parses %s independently of the host timezone', (input, instant) => {
  expect(seoulInstant(input)).toBe(Date.parse(instant));
});

it.each([
  undefined,
  null,
  '',
  ' ',
  'invalid',
  '08/27/2026',
  '2026-13-27',
  '2026-02-30T12:00:00',
  '2026-08-27T99:00',
])('%s is not a server timestamp', value => {
  expect(seoulInstant(value)).toBeNaN();
});
